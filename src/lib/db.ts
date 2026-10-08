import { PrintRequest, StoreSettings } from '../types';
import { DEFAULT_STORE_SETTINGS } from './pricing';

const DB_NAME = 'after_project_photocopy_db';
const DB_VERSION = 1;
const REQ_STORE = 'requests';
const SETTINGS_STORE = 'settings';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof BroadcastChannel !== 'undefined') {
    broadcastChannel = new BroadcastChannel('after_project_sync_channel');
  }
} catch {
  // broadcast channel not supported in some sandboxes
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(REQ_STORE)) {
        const store = db.createObjectStore(REQ_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Generate a short, collision-resistant human-friendly request ID.
export function generateRequestId(): string {
  const timePart = Date.now().toString(36).slice(-5).toUpperCase();
  const randomPart = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `AP-${timePart}${randomPart}`;
}

export const SEED_REQUESTS: PrintRequest[] = [
  {
    id: 'AP-412',
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    customerName: 'Dimas Prasetyo',
    customerPhone: '081298765432',
    storageDevice: 'direct',
    files: [
      {
        id: 'f-1',
        name: 'Proposal_Skripsi_Dimas_Final.pdf',
        size: 3450000,
        type: 'application/pdf',
        pageCount: 38,
        uploadedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ],
    paperSize: 'A4',
    colorMode: 'bw',
    duplex: false,
    copies: 2,
    paperType: 'hvs_80',
    binding: 'mika_tape',
    specificPages: 'Semua Halaman (Hal 1-38)',
    notes: 'Cover depan mika bening, belakang kertas buffalo biru tua. Tolong dibuat rapi ya mas.',
    status: 'pending',
    estimatedPrice: 46000,
    actualPrice: 46000,
    paymentStatus: 'unpaid',
    paymentMethod: 'qris',
  },
  {
    id: 'AP-398',
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    customerName: 'Siti Sarah Rahmawati',
    customerPhone: '085712349988',
    storageDevice: 'direct',
    files: [
      {
        id: 'f-2',
        name: 'Modul_Praktikum_Biologi_Sel_2026.pdf',
        size: 8900000,
        type: 'application/pdf',
        pageCount: 45,
        uploadedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      },
      {
        id: 'f-3',
        name: 'Lampiran_Diagram_Mikroskop_Warna.jpg',
        size: 2100000,
        type: 'image/jpeg',
        pageCount: 1,
        uploadedAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      },
    ],
    paperSize: 'A4',
    colorMode: 'color',
    duplex: true,
    copies: 1,
    paperType: 'hvs_70',
    binding: 'spiral',
    specificPages: 'Semua Halaman',
    notes: 'Diagram mikroskop tolong cetak warna tajam. Jilid spiral kawat putih.',
    status: 'processing',
    estimatedPrice: 72000,
    actualPrice: 72000,
    paymentStatus: 'paid',
    paymentMethod: 'transfer',
  },
  {
    id: 'AP-385',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    customerName: 'Budi Santoso (PT Indo Mitra)',
    customerPhone: '081377889900',
    storageDevice: 'flashdisk',
    storageNotes: 'Flashdisk Sandisk Merah 32GB di keranjang kasir #2',
    files: [
      {
        id: 'f-4',
        name: 'Laporan_Tahunan_Audit_2025_Folio.pdf',
        size: 14200000,
        type: 'application/pdf',
        pageCount: 64,
        uploadedAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
      },
    ],
    paperSize: 'F4',
    colorMode: 'bw',
    duplex: true,
    copies: 3,
    paperType: 'hvs_70',
    binding: 'soft_cover',
    specificPages: 'Semua',
    notes: 'Kertas F4/Folio. Soft cover laminasi doff warna korporat abu-abu.',
    status: 'ready',
    estimatedPrice: 165000,
    actualPrice: 165000,
    paymentStatus: 'paid',
    paymentMethod: 'cash',
  },
  {
    id: 'AP-350',
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    customerName: 'Anisa Maharani',
    customerPhone: '081900112233',
    storageDevice: 'cloud_drive',
    storageNotes: 'Link Google Drive publik sudah diverifikasi',
    files: [
      {
        id: 'f-5',
        name: 'Sertifikat_Seminar_Nasional.pdf',
        size: 5120000,
        type: 'application/pdf',
        pageCount: 15,
        uploadedAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
      },
    ],
    paperSize: 'A4',
    colorMode: 'full_color',
    duplex: false,
    copies: 1,
    paperType: 'art_paper_150',
    binding: 'none',
    specificPages: '15 lembar peserta',
    notes: 'Pakai kertas Art Paper tebal mengkilap, hasil warna jangan pucat ya.',
    status: 'completed',
    estimatedPrice: 60000,
    actualPrice: 60000,
    paymentStatus: 'paid',
    paymentMethod: 'qris',
    completedAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
  },
];

export async function getAllRequests(): Promise<PrintRequest[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(REQ_STORE, 'readonly');
      const store = tx.objectStore(REQ_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        let results = req.result as PrintRequest[];
        if (!results || results.length === 0) {
          // Seed initial requests
          seedInitialRequests().then(resolve);
          return;
        }
        // Sort descending by creation date
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };

      req.onerror = () => {
        resolve(SEED_REQUESTS);
      };
    });
  } catch (err) {
    console.warn('IDB fallback to seed:', err);
    return SEED_REQUESTS;
  }
}

async function seedInitialRequests(): Promise<PrintRequest[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(REQ_STORE, 'readwrite');
    const store = tx.objectStore(REQ_STORE);
    for (const r of SEED_REQUESTS) {
      store.put(r);
    }
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    return SEED_REQUESTS;
  } catch {
    return SEED_REQUESTS;
  }
}

export async function getRequestById(id: string): Promise<PrintRequest | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(REQ_STORE, 'readonly');
      const store = tx.objectStore(REQ_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return SEED_REQUESTS.find((r) => r.id.toLowerCase() === id.toLowerCase()) || null;
  }
}

export async function saveRequest(request: PrintRequest): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REQ_STORE, 'readwrite');
    const store = tx.objectStore(REQ_STORE);
    store.put(request);

    tx.oncomplete = () => {
      notifySyncEvent({ type: 'NEW_REQUEST', request });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateRequestStatus(
  id: string,
  status: PrintRequest['status'],
  actualPrice?: number,
  paymentStatus?: PrintRequest['paymentStatus']
): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(REQ_STORE, 'readwrite');
  const store = tx.objectStore(REQ_STORE);

  const existingReq = await new Promise<PrintRequest | null>((res) => {
    const getReq = store.get(id);
    getReq.onsuccess = () => res(getReq.result || null);
    getReq.onerror = () => res(null);
  });

  if (!existingReq) return;

  existingReq.status = status;
  if (actualPrice !== undefined) existingReq.actualPrice = actualPrice;
  if (paymentStatus !== undefined) existingReq.paymentStatus = paymentStatus;
  if (status === 'completed' && !existingReq.completedAt) {
    existingReq.completedAt = new Date().toISOString();
  }

  store.put(existingReq);

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => {
      notifySyncEvent({ type: 'STATUS_UPDATED', requestId: id, status });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteRequest(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REQ_STORE, 'readwrite');
    const store = tx.objectStore(REQ_STORE);
    store.delete(id);
    tx.oncomplete = () => {
      notifySyncEvent({ type: 'DELETED_REQUEST', requestId: id });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(SETTINGS_STORE, 'readonly');
      const store = tx.objectStore(SETTINGS_STORE);
      const req = store.get('current');
      req.onsuccess = () => {
        if (req.result && req.result.settings) {
          resolve(req.result.settings);
        } else {
          resolve(DEFAULT_STORE_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_STORE_SETTINGS);
    });
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    const store = tx.objectStore(SETTINGS_STORE);
    store.put({ key: 'current', settings });
    tx.oncomplete = () => {
      notifySyncEvent({ type: 'SETTINGS_UPDATED', settings });
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

type SyncPayload =
  | { type: 'NEW_REQUEST'; request: PrintRequest }
  | { type: 'STATUS_UPDATED'; requestId: string; status: PrintRequest['status'] }
  | { type: 'DELETED_REQUEST'; requestId: string }
  | { type: 'SETTINGS_UPDATED'; settings: StoreSettings };

function notifySyncEvent(payload: SyncPayload) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(payload);
    } catch {
      // ignore
    }
  }
  // Also dispatch window custom event for same window components
  window.dispatchEvent(new CustomEvent('after_project_sync', { detail: payload }));
}

export function subscribeToSync(callback: (payload: SyncPayload) => void): () => void {
  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) callback(detail);
  };

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data) callback(e.data);
  };

  window.addEventListener('after_project_sync', handleCustomEvent);
  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', handleBroadcast);
  }

  return () => {
    window.removeEventListener('after_project_sync', handleCustomEvent);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handleBroadcast);
    }
  };
}
