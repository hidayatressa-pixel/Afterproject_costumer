import { requireSupabase } from './supabase';
import type { PrintRequest, RequestStatus, UploadedFileItem } from '../types';

type ApiPayload = Record<string, unknown>;

async function appApi<T>(payload: ApiPayload, adminToken?: string): Promise<T> {
  const supabase = requireSupabase();
  const { data, error } = await supabase.functions.invoke('app-api', {
    body: { ...payload, ...(adminToken ? { adminToken } : {}) },
  });
  if (error) {
    const context = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
    let message = error.message || 'Permintaan ke server gagal.';
    try {
      const body = await context?.json?.();
      if (body?.error) message = body.error;
    } catch {
      // Keep the original Supabase error message when the response is not JSON.
    }
    throw new Error(message);
  }
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export interface CreatedRequestResponse {
  request: PrintRequest;
  customerToken: string;
  expiresAt: string;
}

export async function createCustomerRequest(input: {
  customerName: string;
  customerPhone?: string;
  requestData: ApiPayload;
  files: File[];
}): Promise<PrintRequest> {
  const created = await appApi<CreatedRequestResponse>({
    action: 'create_request',
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    requestData: input.requestData,
  });

  // The customer token grants access only to this request and is never sent to the database.
  sessionStorage.setItem(customerTokenKey(created.request.id), created.customerToken);
  try {
    for (const file of input.files) {
      if (file.size > 30 * 1024 * 1024) {
        throw new Error(`File "${file.name}" melebihi batas 30 MB.`);
      }
      const upload = await appApi<{
        path: string;
        token: string;
        mimeType: string;
      }>({
        action: 'create_upload_url',
        requestId: created.request.id,
        customerToken: created.customerToken,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });

      const supabase = requireSupabase();
      const { error: uploadError } = await supabase.storage
        .from('customer-files')
        .uploadToSignedUrl(upload.path, upload.token, file);
      if (uploadError) throw new Error(`Gagal mengunggah "${file.name}": ${uploadError.message}`);

      await appApi({
        action: 'finalize_upload',
        requestId: created.request.id,
        customerToken: created.customerToken,
        path: upload.path,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      });
    }
  } catch (error) {
    // Keep the token so the customer can still refer to the request if a later file fails.
    throw new Error(`Pesanan ${created.request.id} sudah dibuat, tetapi upload belum lengkap. ${error instanceof Error ? error.message : 'Coba lagi.'}`);
  }

  return {
    ...created.request,
    files: input.files.map((file, index): UploadedFileItem => ({
      id: `pending-${index}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    })),
  };
}

export function customerTokenKey(requestId: string): string {
  return `after_project_customer_token_${requestId}`;
}

export async function trackCustomerRequest(requestId: string): Promise<PrintRequest> {
  const token = sessionStorage.getItem(customerTokenKey(requestId));
  if (!token) throw new Error('Token pelacakan tidak ditemukan di sesi browser ini. Buka pesanan dari perangkat yang dipakai saat mengirim file.');
  const result = await appApi<{ request: PrintRequest }>({
    action: 'track_request',
    requestId,
    customerToken: token,
  });
  return result.request;
}

export async function adminLogin(pin: string): Promise<string> {
  const result = await appApi<{ token: string }>({ action: 'admin_login', pin });
  sessionStorage.setItem('after_project_admin_token', result.token);
  return result.token;
}

export function getAdminToken(): string {
  return sessionStorage.getItem('after_project_admin_token') || '';
}

export async function getAdminRequests(): Promise<PrintRequest[]> {
  const result = await appApi<{ requests: PrintRequest[] }>({ action: 'admin_list' }, getAdminToken());
  return result.requests;
}

export async function setAdminRequestStatus(
  requestId: string,
  status: RequestStatus,
  fields: { actualPrice?: number; paymentStatus?: 'unpaid' | 'paid' } = {},
): Promise<PrintRequest> {
  const result = await appApi<{ request: PrintRequest }>(
    { action: 'admin_update_status', requestId, status, ...fields },
    getAdminToken(),
  );
  return result.request;
}

export async function getAdminDownloadUrl(path: string): Promise<string> {
  const result = await appApi<{ url: string }>({ action: 'admin_download', path }, getAdminToken());
  return result.url;
}

export function clearAdminToken(): void {
  sessionStorage.removeItem('after_project_admin_token');
}
