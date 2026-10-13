/// <reference path="../_shared/deno.d.ts" />
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cleanup-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const BUCKET = "customer-files";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const tokenSecret = Deno.env.get("ADMIN_TOKEN_SECRET")!;
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function b64url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function encodeJson(value: unknown) {
  return b64url(new TextEncoder().encode(JSON.stringify(value)));
}
async function signToken(payload: Record<string, unknown>) {
  if (!tokenSecret || tokenSecret.length < 32) throw new Error("ADMIN_TOKEN_SECRET must be at least 32 characters.");
  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const body = encodeJson(payload);
  const data = new TextEncoder().encode(header + "." + body);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(tokenSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
  return header + "." + body + "." + b64url(sig);
}
async function verifyToken(token: string, expectedRole: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const data = new TextEncoder().encode(parts[0] + "." + parts[1]);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(tokenSecret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const signature = Uint8Array.from(atob(parts[2].replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - parts[2].length % 4) % 4)), c => c.charCodeAt(0));
    if (!await crypto.subtle.verify("HMAC", key, signature, data)) return null;
    const payloadPart = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(payloadPart + "=".repeat((4 - payloadPart.length % 4) % 4)));
    if (payload.role !== expectedRole || payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload as Record<string, unknown>;
  } catch { return null; }
}
function safeRequest(row: any, files: any[] = []) {
  const data = row.request_data ?? {};
  return {
    id: row.id,
    createdAt: row.created_at,
    customerName: row.customer_name,
    customerPhone: row.customer_phone ?? undefined,
    status: row.status,
    ...data,
    files: files.map((f) => ({
      id: f.id,
      name: f.original_name,
      size: f.size_bytes,
      type: f.mime_type,
      uploadedAt: f.uploaded_at,
      expiresAt: f.expires_at,
      expired: Boolean(f.deleted_at) || Date.parse(f.expires_at) <= Date.now(),
      storagePath: undefined,
    })),
  };
}
async function getFiles(requestId: string) {
  const { data, error } = await supabase.from("request_files").select("*").eq("request_id", requestId).order("uploaded_at");
  if (error) throw error;
  return data ?? [];
}
function randomId() {
  return "AP-" + crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}
function cleanText(v: unknown, max = 200) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json();
    const action = cleanText(body.action, 40);

    if (action === "admin_login") {
      const configuredPin = Deno.env.get("OPERATOR_PIN");
      if (!configuredPin) return response({ error: "OPERATOR_PIN belum diatur di Edge Function secrets." }, 503);
      if (cleanText(body.pin, 32) !== configuredPin) return response({ error: "PIN operator salah." }, 401);
      const token = await signToken({ role: "admin", exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60 });
      return response({ token, expiresIn: 43200 });
    }

    if (action === "create_request") {
      const customerName = cleanText(body.customerName, 120);
      if (!customerName) return response({ error: "Nama pelanggan wajib diisi." }, 400);
      const requestId = randomId();
      const customerToken = await signToken({ role: "customer", rid: requestId, exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 });
      const requestData = body.requestData && typeof body.requestData === "object" ? body.requestData : {};
      const { data, error } = await supabase.from("print_requests").insert({
        id: requestId,
        customer_name: customerName,
        customer_phone: cleanText(body.customerPhone, 30) || null,
        status: "pending",
        request_data: requestData,
      }).select("*").single();
      if (error) throw error;
      return response({ request: safeRequest(data, []), customerToken, expiresAt: new Date(Date.now() + 86400000).toISOString() }, 201);
    }

    if (action === "create_upload_url") {
      const customer = await verifyToken(cleanText(body.customerToken, 4000), "customer");
      const requestId = cleanText(body.requestId, 40);
      if (!customer || customer.rid !== requestId) return response({ error: "Token upload tidak valid atau sudah kedaluwarsa." }, 401);
      const name = cleanText(body.name, 180);
      const mimeType = cleanText(body.mimeType, 120) || "application/octet-stream";
      const size = Number(body.size);
      if (!name || !Number.isFinite(size) || size < 1 || size > 30 * 1024 * 1024) return response({ error: "File tidak valid. Maksimal 30 MB per file." }, 400);
      const safeName = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
      const path = requestId + "/" + crypto.randomUUID() + "-" + safeName;
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: false });
      if (error) throw error;
      return response({ path, token: data.token, signedUrl: data.signedUrl, mimeType, size, originalName: name });
    }

    if (action === "finalize_upload") {
      const customer = await verifyToken(cleanText(body.customerToken, 4000), "customer");
      const requestId = cleanText(body.requestId, 40);
      const path = cleanText(body.path, 500);
      const name = cleanText(body.name, 180);
      const mimeType = cleanText(body.mimeType, 120) || "application/octet-stream";
      const size = Number(body.size);
      if (!customer || customer.rid !== requestId || !path.startsWith(requestId + "/")) return response({ error: "Token atau path file tidak valid." }, 401);
      if (!Number.isFinite(size) || size < 1 || size > 30 * 1024 * 1024) return response({ error: "Ukuran file tidak valid." }, 400);
      const { data: existing } = await supabase.from("request_files").select("id").eq("storage_path", path).maybeSingle();
      if (existing) return response({ error: "File sudah didaftarkan." }, 409);
      const { data: objectList, error: listError } = await supabase.storage.from(BUCKET).list(requestId, { search: path.split("/").pop(), limit: 10 });
      if (listError) throw listError;
      if (!objectList?.length) return response({ error: "File belum ditemukan di storage." }, 400);
      const uploadedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 86400000).toISOString();
      const { data, error } = await supabase.from("request_files").insert({
        request_id: requestId,
        original_name: name,
        storage_path: path,
        mime_type: mimeType,
        size_bytes: size,
        uploaded_at: uploadedAt,
        expires_at: expiresAt,
      }).select("*").single();
      if (error) throw error;
      return response({ file: safeRequest({ id: requestId, created_at: uploadedAt, customer_name: "", status: "pending" }, [data]).files[0] }, 201);
    }

    if (action === "track_request") {
      const requestId = cleanText(body.requestId, 40).toUpperCase();
      if (!/^AP-[A-Z0-9]{8}$/.test(requestId)) return response({ error: "Request ID tidak valid." }, 400);
      const { data, error } = await supabase.from("print_requests").select("*").eq("id", requestId).maybeSingle();
      if (error) throw error;
      if (!data) return response({ error: "Pesanan tidak ditemukan." }, 404);
      return response({ request: safeRequest(data, await getFiles(requestId)) });
    }

    if (action === "cleanup_expired") {
      const cleanupSecret = Deno.env.get("CLEANUP_SECRET");
      if (!cleanupSecret || req.headers.get("x-cleanup-secret") !== cleanupSecret) return response({ error: "Unauthorized cleanup." }, 401);
      const { data: expired, error } = await supabase.from("request_files").select("id,storage_path").lte("expires_at", new Date().toISOString()).is("deleted_at", null).limit(500);
      if (error) throw error;
      let deleted = 0;
      for (const file of expired ?? []) {
        const { error: removeError } = await supabase.storage.from(BUCKET).remove([file.storage_path]);
        if (removeError) continue;
        const { error: markError } = await supabase.from("request_files").update({ deleted_at: new Date().toISOString() }).eq("id", file.id);
        if (!markError) deleted++;
      }
      return response({ deleted });
    }

    const admin = await verifyToken(cleanText(body.adminToken, 4000), "admin");
    if (!admin) return response({ error: "Sesi operator tidak valid atau sudah kedaluwarsa." }, 401);

    if (action === "admin_list") {
      const { data, error } = await supabase.from("print_requests").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      const requests = await Promise.all((data ?? []).map(async (row) => safeRequest(row, await getFiles(row.id))));
      return response({ requests });
    }

    if (action === "admin_update_status") {
      const requestId = cleanText(body.requestId, 40).toUpperCase();
      const status = cleanText(body.status, 20);
      if (!["pending", "processing", "ready", "completed", "cancelled"].includes(status)) return response({ error: "Status tidak valid." }, 400);
      const { data: row, error: findError } = await supabase.from("print_requests").select("*").eq("id", requestId).maybeSingle();
      if (findError) throw findError;
      if (!row) return response({ error: "Pesanan tidak ditemukan." }, 404);
      const nextData = { ...(row.request_data ?? {}) };
      if (body.actualPrice !== undefined) nextData.actualPrice = Number(body.actualPrice);
      if (body.paymentStatus !== undefined && ["unpaid", "paid"].includes(body.paymentStatus)) nextData.paymentStatus = body.paymentStatus;
      if (status === "completed" && !nextData.completedAt) nextData.completedAt = new Date().toISOString();
      const { data, error } = await supabase.from("print_requests").update({ status, request_data: nextData }).eq("id", requestId).select("*").single();
      if (error) throw error;
      return response({ request: safeRequest(data, await getFiles(requestId)) });
    }

    if (action === "admin_download") {
      const path = cleanText(body.path, 500);
      const { data: file, error } = await supabase.from("request_files").select("*").eq("storage_path", path).maybeSingle();
      if (error) throw error;
      if (!file) return response({ error: "File tidak ditemukan." }, 404);
      const remainingSeconds = Math.floor((Date.parse(file.expires_at) - Date.now()) / 1000);
      if (file.deleted_at || remainingSeconds <= 0) return response({ error: "Masa akses file sudah berakhir." }, 410);
      const { data, error: signError } = await supabase.storage.from(BUCKET).createSignedUrl(path, Math.min(300, remainingSeconds), { download: file.original_name });
      if (signError) throw signError;
      return response({ url: data.signedUrl, expiresIn: Math.min(300, remainingSeconds) });
    }

    return response({ error: "Action tidak dikenal." }, 400);
  } catch (error) {
    console.error("app-api error:", error);
    return response({ error: "Permintaan gagal diproses." }, 500);
  }
});
