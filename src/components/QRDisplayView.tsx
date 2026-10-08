import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import {
  Download,
  Copy,
  Check,
  ExternalLink,
  Zap,
  Printer,
  Sparkles,
  QrCode as QrIcon,
  Loader2,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { StoreSettings } from '../types';

interface QRDisplayViewProps {
  settings: StoreSettings;
  onNavigateToUpload: () => void;
}

export const QRDisplayView: React.FC<QRDisplayViewProps> = ({
  settings,
  onNavigateToUpload,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExportingStandee, setIsExportingStandee] = useState<boolean>(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Standee Container Ref for direct rendering & inspection
  const standeeRef = useRef<HTMLDivElement>(null);

  // URL Target Pelanggan (Mode customer langsung)
  const currentOrigin =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?mode=customer`
      : 'https://afterproject.my.id/?mode=customer';

  useEffect(() => {
    // Generate high-resolution QR Code (Ukuran besar, contrast tinggi, margin pas)
    QRCode.toDataURL(currentOrigin, {
      width: 700,
      margin: 2,
      color: {
        dark: '#0f172a', // Slate 900 sangat tajam
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate high-res QR code:', err));
  }, [currentOrigin]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentOrigin);
      setIsCopied(true);
      showToast('URL Halaman Pelanggan berhasil disalin!');
    } catch {
      showToast('Gagal menyalin link.');
    }
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 1. Download HANYA Barcode / QR (Single PNG)
  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'Barcode_QR_Only_After_Project_Photocopy.png';
    link.href = qrDataUrl;
    link.click();
    showToast('Barcode QR saja berhasil didownload!');
  };

  // 2. Download SELURUH GAMBAR STANDEE FULL (100% Utuh, Tajam, Tidak Terpotong)
  // Menggunakan Native HTML5 Canvas Renderer Presisi Tinggi (Lebar 1200px x Tinggi 1650px)
  // Menjamin seluruh desain lengkap: Header, Brand Logo, Tagline, Step 1-2-3, QR Box, Instruksi, Info Toko & Border tidak terpotong.
  const handleDownloadFullStandee = async () => {
    if (!qrDataUrl) return;
    setIsExportingStandee(true);

    try {
      await renderAndDownloadFullStandeeCanvas();
      showToast('Desain Standee Meja Full 100% Utuh berhasil didownload!');
    } catch (err) {
      console.error('Export standee error:', err);
      showToast('Gagal memproses gambar. Silakan coba lagi.');
    } finally {
      setIsExportingStandee(false);
    }
  };

  const renderAndDownloadFullStandeeCanvas = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Ukuran Kanvas Standee Meja Standar A4 / Akrilik Meja (Ratio 1 : 1.41, Resolusi Ultra Tajam)
        const W = 1200;
        const H = 1680;
        canvas.width = W;
        canvas.height = H;

        // 1. Background Putih Bersih
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // Background dekoratif halus di bagian atas & bawah
        const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#f0f7ff');
        bgGrad.addColorStop(0.2, '#ffffff');
        bgGrad.addColorStop(0.85, '#ffffff');
        bgGrad.addColorStop(1, '#f8fafc');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, W, H);

        // 2. Outer Border & Inner Border Frame (Desain Elegan Standee Meja)
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 14;
        roundRect(ctx, 36, 36, W - 72, H - 72, 36);
        ctx.stroke();

        ctx.strokeStyle = '#bfdbfe';
        ctx.lineWidth = 3;
        roundRect(ctx, 54, 54, W - 108, H - 108, 24);
        ctx.stroke();

        // 3. Top Accent Bar (Gradient Biru Modern)
        const topBarGrad = ctx.createLinearGradient(54, 0, W - 54, 0);
        topBarGrad.addColorStop(0, '#1d4ed8');
        topBarGrad.addColorStop(0.5, '#3b82f6');
        topBarGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = topBarGrad;
        roundRectTopOnly(ctx, 54, 54, W - 108, 20, 24);
        ctx.fill();

        // 4. Badge KIOS CETAK DIGITAL
        const badgeY = 120;
        const badgeW = 340;
        const badgeH = 46;
        ctx.fillStyle = '#dbeafe';
        roundRect(ctx, (W - badgeW) / 2, badgeY, badgeW, badgeH, 23);
        ctx.fill();
        ctx.strokeStyle = '#93c5fd';
        ctx.lineWidth = 2;
        roundRect(ctx, (W - badgeW) / 2, badgeY, badgeW, badgeH, 23);
        ctx.stroke();

        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 20px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡ KIOS CETAK DIGITAL MANDIRI', W / 2, badgeY + badgeH / 2);

        // 5. Brand Heading: AFTER PROJECT
        ctx.fillStyle = '#1e3a8a';
        ctx.font = '900 64px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('AFTER PROJECT', W / 2, 230);

        // PHOTOCOPY
        ctx.fillStyle = '#2563eb';
        ctx.font = 'italic 900 44px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.fillText('PHOTOCOPY', W / 2, 285);

        // Garis Pembatas Aksen
        const lineGrad = ctx.createLinearGradient(W / 2 - 140, 0, W / 2 + 140, 0);
        lineGrad.addColorStop(0, '#60a5fa');
        lineGrad.addColorStop(0.5, '#2563eb');
        lineGrad.addColorStop(1, '#60a5fa');
        ctx.fillStyle = lineGrad;
        roundRect(ctx, W / 2 - 120, 310, 240, 6, 3);
        ctx.fill();

        // Tagline Subtitle
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 20px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.fillText('DIGITAL PRINT FILE TRANSFER', W / 2, 345);

        // 6. Section Title: Kirim File untuk Dicetak
        ctx.fillStyle = '#0f172a';
        ctx.font = '900 42px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.fillText('Kirim File Dokumen Anda', W / 2, 420);

        // Tagline instruksi kasir
        ctx.fillStyle = '#334155';
        ctx.font = '600 24px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.fillText('Scan barcode ini, upload file dari HP, lalu sebutkan nama ke kasir.', W / 2, 462);

        // 7. Step-by-Step Pills (1. Scan QR -> 2. Upload Dokumen -> 3. Selesai)
        const stepY = 500;
        const stepW = 860;
        const stepH = 60;
        ctx.fillStyle = '#eff6ff';
        roundRect(ctx, (W - stepW) / 2, stepY, stepW, stepH, 18);
        ctx.fill();
        ctx.strokeStyle = '#bfdbfe';
        ctx.lineWidth = 2;
        roundRect(ctx, (W - stepW) / 2, stepY, stepW, stepH, 18);
        ctx.stroke();

        ctx.font = 'bold 22px "Plus Jakarta Sans", "Segoe UI", sans-serif';
        ctx.textBaseline = 'middle';
        
        ctx.fillStyle = '#1d4ed8';
        ctx.fillText('1. Scan Barcode', W / 2 - 270, stepY + stepH / 2);
        
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('➜', W / 2 - 120, stepY + stepH / 2);

        ctx.fillStyle = '#4338ca';
        ctx.fillText('2. Upload File', W / 2 + 10, stepY + stepH / 2);

        ctx.fillStyle = '#94a3b8';
        ctx.fillText('➜', W / 2 + 140, stepY + stepH / 2);

        ctx.fillStyle = '#059669';
        ctx.fillText('3. Siap Dicetak', W / 2 + 270, stepY + stepH / 2);

        // 8. Load & Draw QR Code Box
        const qrImg = new Image();
        qrImg.onload = () => {
          // Kotak Wadah QR Utama
          const qrBoxSize = 560;
          const qrBoxX = (W - qrBoxSize) / 2;
          const qrBoxY = 595;

          // Shadow / border frame kotak QR
          ctx.fillStyle = '#f8fafc';
          roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 70, 28);
          ctx.fill();

          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 5;
          roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize + 70, 28);
          ctx.stroke();

          // Border dalam putih
          ctx.fillStyle = '#ffffff';
          roundRect(ctx, qrBoxX + 16, qrBoxY + 16, qrBoxSize - 32, qrBoxSize - 32, 20);
          ctx.fill();

          // Gambar QR Image
          const qrImgSize = qrBoxSize - 50;
          ctx.drawImage(qrImg, qrBoxX + 25, qrBoxY + 25, qrImgSize, qrImgSize);

          // Teks di bawah kotak QR
          ctx.fillStyle = '#1e3a8a';
          ctx.font = 'bold 22px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('ARAHKAN KAMERA HP KE BARCODE INI', W / 2, qrBoxY + qrBoxSize + 35);

          // 9. Banner Bawah QR: Petunjuk HP
          const bannerY = 1270;
          const bannerW = 960;
          const bannerH = 100;
          ctx.fillStyle = '#eff6ff';
          roundRect(ctx, (W - bannerW) / 2, bannerY, bannerW, bannerH, 20);
          ctx.fill();
          ctx.strokeStyle = '#93c5fd';
          ctx.lineWidth = 2.5;
          roundRect(ctx, (W - bannerW) / 2, bannerY, bannerW, bannerH, 20);
          ctx.stroke();

          ctx.fillStyle = '#172554';
          ctx.font = '900 24px "Plus Jakarta Sans", "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('📱 Buka Kamera HP Anda & Scan Barcode di Atas', W / 2, bannerY + 42);

          ctx.fillStyle = '#1d4ed8';
          ctx.font = '600 20px "Plus Jakarta Sans", "Segoe UI", sans-serif';
          ctx.fillText('Langsung masuk ke halaman kirim file After Project Photocopy (Tanpa WhatsApp)', W / 2, bannerY + 76);

          // 10. Garis Footer Divider
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(90, 1410);
          ctx.lineTo(W - 90, 1410);
          ctx.stroke();

          // 11. Info Toko & Footer Details
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 26px "Plus Jakarta Sans", "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(settings.storeName || 'AFTER PROJECT PHOTOCOPY', W / 2, 1460);

          ctx.fillStyle = '#475569';
          ctx.font = '500 20px "Plus Jakarta Sans", "Segoe UI", sans-serif';
          ctx.fillText(settings.storeAddress, W / 2, 1500);

          ctx.fillStyle = '#1e40af';
          ctx.font = 'bold 22px "Plus Jakarta Sans", "Segoe UI", sans-serif';
          ctx.fillText(`WhatsApp: ${settings.storeWhatsapp}   ·   Jam Buka: ${settings.operatingHours}`, W / 2, 1545);

          // Watermark / Brand stamp
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 16px "Plus Jakarta Sans", "Segoe UI", sans-serif';
          ctx.fillText('Standee Meja Etalase Resmi · After Project Photocopy Digital System', W / 2, 1595);

          // Trigger Download PNG
          const link = document.createElement('a');
          link.download = 'Standee_Meja_Full_After_Project_Photocopy.png';
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
          resolve();
        };

        qrImg.onerror = (e) => {
          reject(e);
        };

        qrImg.src = qrDataUrl;
      } catch (err) {
        reject(err);
      }
    });
  };

  // Helper untuk membuat rounded rectangle di Canvas
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function roundRectTopOnly(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  const handlePrintStandee = () => {
    try {
      window.print();
    } catch {
      handleDownloadFullStandee();
    }
  };

  const showToast = (msg: string) => {
    setDownloadSuccessMessage(msg);
    setTimeout(() => {
      setDownloadSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-slate-100 to-indigo-50/30 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {downloadSuccessMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl font-bold text-xs sm:text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-200" />
          <span>{downloadSuccessMessage}</span>
        </div>
      )}

      {/* Action Toolbar for Store Owner (Hidden in Print) */}
      <div className="max-w-2xl mx-auto mb-6 no-print space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-blue-700 bg-blue-100/90 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Standee Meja Kasir / Etalase (Full Gambar)</span>
          </span>

          <button
            onClick={onNavigateToUpload}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
          >
            <span>Buka Halaman Pelanggan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Primary Action Buttons Bar */}
        <div className="p-4 bg-white rounded-3xl border border-blue-200 shadow-md space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* TOMBOL UTAMA: DOWNLOAD STANDEE MEJA FULL 100% (PNG) */}
            <button
              onClick={handleDownloadFullStandee}
              disabled={isExportingStandee || !qrDataUrl}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-4 text-sm font-black text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 rounded-2xl transition-all shadow-xl shadow-blue-500/25 active:scale-95 disabled:opacity-60 cursor-pointer"
              title="Download seluruh gambar kartu standee utuh (Lengkap dengan logo toko, petunjuk & QR code) untuk dicetak"
            >
              {isExportingStandee ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses Desain Standee Full 100%...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-blue-200" />
                  <span>DOWNLOAD DESAIN STANDEE FULL (PNG)</span>
                </>
              )}
            </button>

            {/* Opsi Cetak Printer Langsung */}
            <button
              onClick={handlePrintStandee}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors cursor-pointer"
              title="Cetak langsung menggunakan printer (Ctrl+P)"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Cetak Printer</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Opsi Tambahan:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadQR}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                title="Hanya download gambar barcode QR saja tanpa kartu"
              >
                <QrIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>QR Saja</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                title="Salin URL portal upload pelanggan"
              >
                {isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{isCopied ? 'Tersalin' : 'Salin URL'}</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 text-center">
          💡 File hasil unduhan berupa gambar PNG <strong>full portrait utuh 100%</strong> (1200 x 1680 px) lengkap dengan logo, instruksi, dan barcode QR tanpa ada yang terpotong. Siap dicetak langsung pada kertas foto/karton untuk diselipkan ke standee akrilik etalase kasir.
        </p>
      </div>

      {/* Standee Container (Pratinjau Nyata di Layar & Cetak Fisik) */}
      <div
        ref={standeeRef}
        className="max-w-xl mx-auto bg-white rounded-3xl border-4 border-blue-500 shadow-2xl shadow-blue-500/10 overflow-hidden p-6 sm:p-10 text-center relative"
      >
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        {/* Brand Header */}
        <div className="flex flex-col items-center pt-2">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider mb-2.5">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>Kios Cetak Digital Mandiri</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none text-blue-950">
            AFTER PROJECT
          </h1>
          <span className="text-xl sm:text-2xl font-black tracking-[0.25em] text-blue-600 italic uppercase mt-1">
            PHOTOCOPY
          </span>
          <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full my-4" />
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            Digital Print File Transfer
          </p>
        </div>

        {/* Hero Tagline & Heading */}
        <div className="mt-5">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Kirim File Dokumen Anda
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 font-semibold mt-1 max-w-md mx-auto">
            "Scan barcode ini, upload file dari HP, lalu sebutkan nama ke kasir."
          </p>

          <div className="mt-4 inline-flex items-center gap-2 sm:gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-xs sm:text-sm font-black text-slate-800">
            <span className="text-blue-700">1. Scan QR</span>
            <span className="text-blue-300">➜</span>
            <span className="text-indigo-700">2. Upload File</span>
            <span className="text-indigo-300">➜</span>
            <span className="text-emerald-600 font-black">3. Siap Dicetak</span>
          </div>
        </div>

        {/* Big QR Code Display Box with Ring */}
        <div className="mt-7 inline-block p-4 sm:p-6 bg-gradient-to-b from-blue-50/70 to-white border-2 border-blue-600 rounded-3xl shadow-lg shadow-blue-500/10">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code After Project Photocopy"
              className="w-56 h-56 sm:w-64 sm:h-64 object-contain mx-auto rounded-xl bg-white p-2"
            />
          ) : (
            <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center bg-blue-50 text-blue-400 font-mono text-sm">
              Membuat QR Code...
            </div>
          )}
          <div className="mt-3 text-xs font-mono font-black text-blue-800 uppercase tracking-widest">
            Arahkan Kamera HP ke Barcode Ini
          </div>
        </div>

        {/* Scan Helper Banner for Customer */}
        <div className="mt-7 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80">
          <div className="text-xs sm:text-sm font-black text-blue-950 uppercase tracking-wide">
            📱 Buka Kamera HP Anda & Scan Barcode di Atas
          </div>
          <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
            Langsung masuk ke halaman kirim file After Project Photocopy (Tanpa WhatsApp)
          </div>
        </div>

        {/* Footer info for physical print */}
        <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-medium">{settings.storeAddress}</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-blue-700">
            <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>WA: {settings.storeWhatsapp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
