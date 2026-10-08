import {
  StoreSettings,
  PrintRequest,
  ColorMode,
  PaperSize,
  PaperType,
  BindingType,
} from '../types';

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'AFTER PROJECT',
  storeSubbrand: 'PHOTOCOPY',
  tagline: 'Kirim File. Cetak Lebih Mudah.',
  storeAddress: 'Jl. Kampus No. 42 (Depan Gerbang Utama), Jawa Barat',
  storeWhatsapp: '081234567890',
  operatingHours: 'Setiap Hari: 07.30 - 21.00 WIB',
  operatorPin: '1234',
  soundAlertsEnabled: true,
  pricing: {
    bwPerPage: 500, // Rp 500 / lembar
    colorPerPage: 1500, // Rp 1.500 / lembar
    fullColorPerPage: 3000, // Rp 3.000 / lembar foto
    paperTypeAddons: {
      hvs_70: 0,
      hvs_80: 100, // +Rp 100
      art_paper_150: 1000,
      concorde: 1500,
      buffalo: 500,
    },
    paperSizeMultiplier: {
      A4: 1,
      F4: 1.1, // Folio slightly more
      A3: 2.0,
      A5: 0.8,
      Letter: 1,
    },
    bindingPrices: {
      none: 0,
      staple: 500,
      mika_tape: 4000,
      spiral: 12000,
      soft_cover: 25000,
      hard_cover: 45000,
    },
  },
};

export function calculateEstimatedPrice(
  item: {
    files: Array<{ pageCount?: number }>;
    colorMode?: ColorMode;
    paperSize?: PaperSize;
    paperType?: PaperType;
    duplex?: boolean;
    copies?: number;
    binding?: BindingType;
  },
  settings: StoreSettings = DEFAULT_STORE_SETTINGS
): {
  basePagePrice: number;
  estimatedPages: number;
  printCost: number;
  bindingCost: number;
  totalCost: number;
} {
  const pType = item.paperType || 'hvs_70';
  const pSize = item.paperSize || 'A4';
  const pBinding = item.binding || 'none';
  const cMode = item.colorMode || 'bw';
  const nCopies = item.copies || 1;

  // Estimate total pages from files or default to 5 pages per file if unknown
  const estimatedPages = item.files.reduce((acc, f) => acc + (f.pageCount || 5), 0);
  
  // Base rate per page
  let rate = settings.pricing.bwPerPage;
  if (cMode === 'color') {
    rate = settings.pricing.colorPerPage;
  } else if (cMode === 'full_color') {
    rate = settings.pricing.fullColorPerPage;
  }

  // Paper type addon
  const paperAddon = settings.pricing.paperTypeAddons[pType] || 0;
  rate += paperAddon;

  // Paper size multiplier
  const multiplier = settings.pricing.paperSizeMultiplier[pSize] || 1;
  const pagePrice = Math.round(rate * multiplier);

  // If duplex, physical sheets is roughly half
  const effectivePages = item.duplex ? Math.round(estimatedPages * 0.9) : estimatedPages;

  const printCost = effectivePages * pagePrice * nCopies;
  const bindingCost = (settings.pricing.bindingPrices[pBinding] || 0) * nCopies;
  const totalCost = printCost + bindingCost;

  return {
    basePagePrice: pagePrice,
    estimatedPages: estimatedPages * nCopies,
    printCost,
    bindingCost,
    totalCost,
  };
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
