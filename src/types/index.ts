export type PaperSize = 'A4' | 'F4' | 'A3' | 'A5' | 'Letter';

export type ColorMode = 'bw' | 'color' | 'full_color';

export type PaperType = 'hvs_70' | 'hvs_80' | 'art_paper_150' | 'concorde' | 'buffalo';

export type BindingType = 'none' | 'staple' | 'mika_tape' | 'spiral' | 'soft_cover' | 'hard_cover';

export type StorageDevice = 'direct' | 'flashdisk' | 'cloud_drive';

export type RequestStatus = 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid';

export type PaymentMethod = 'cash' | 'qris' | 'transfer';

export interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // Base64 data URL for preview and download
  blobKey?: string; // Key in IndexedDB for large files
  pageCount?: number;
  uploadedAt: string;
}

export interface PrintRequest {
  id: string; // e.g. "AP-842"
  createdAt: string;
  customerName: string;
  customerPhone?: string;
  storageDevice?: string;
  storageNotes?: string;
  files: UploadedFileItem[];
  paperSize?: PaperSize;
  colorMode?: ColorMode;
  duplex?: boolean;
  copies?: number;
  paperType?: PaperType;
  binding?: BindingType;
  specificPages?: string;
  notes?: string;
  status: RequestStatus;
  estimatedPrice?: number;
  actualPrice?: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  processedBy?: string;
  completedAt?: string;
}

export interface StoreSettings {
  storeName: string;
  storeSubbrand: string;
  tagline: string;
  storeAddress: string;
  storeWhatsapp: string;
  operatingHours: string;
  operatorPin: string;
  soundAlertsEnabled: boolean;
  pricing: {
    bwPerPage: number;
    colorPerPage: number;
    fullColorPerPage: number;
    paperTypeAddons: Record<PaperType, number>;
    paperSizeMultiplier: Record<PaperSize, number>;
    bindingPrices: Record<BindingType, number>;
  };
}
