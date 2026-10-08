import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Copy,
  Printer,
  X,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PrintRequest } from '../types';
import { BrandingLockup } from './BrandingLockup';
import { formatRupiah } from '../lib/pricing';
import { getRequestById } from '../lib/db';

interface CustomerReceiptModalProps {
  request: PrintRequest;
  onClose: () => void;
  onNewOrder: () => void;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  request: initialRequest,
  onClose,
  onNewOrder,
}) => {
  const [currentReq, setCurrentReq] = useState<PrintRequest>(initialRequest);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate QR code for this Request ID
  useEffect(() => {
    QRCode.toDataURL(
      window.location.origin + '?track=' + currentReq.id,
      {
        width: 200,
        margin: 1,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [currentReq.id]);

  // Periodic poll to check if operator changed status
  const refreshStatus = async () => {
    setIsRefreshing(true);
    const updated = await getRequestById(currentReq.id);
    if (updated) {
      setCurrentReq(updated);
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(currentReq.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getStatusBadge = (status: PrintRequest['status']) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Menunggu Antrian Mesin',
          bg: 'bg-amber-100 text-amber-900 border-amber-300',
          dot: 'bg-amber-500',
        };
      case 'processing':
        return {
          label: 'Sedang Dicetak Operator',
          bg: 'bg-sky-100 text-sky-900 border-sky-300',
          dot: 'bg-sky-500 animate-pulse',
        };
      case 'ready':
        return {
          label: 'Siap Diambil di Kasir!',
          bg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dot: 'bg-emerald-500',
        };
      case 'completed':
        return {
          label: 'Selesai & Diserahkan',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-600',
        };
      default:
        return {
          label: status,
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const statusInfo = getStatusBadge(currentReq.status);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Vibrant Color Strip */}
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          {/* Header */}
          <div className="text-center pb-5 border-b border-dashed border-slate-200">
            <BrandingLockup size="md" align="center" showTagline={false} />
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mt-1">
              BUKTI PENERIMAAN DOKUMEN DIGITAL
            </div>

            {/* Request ID Hero Display with Rich Blue Gradient */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white rounded-2xl flex items-center justify-between shadow-lg shadow-blue-500/20">
              <div className="text-left">
                <span className="text-[10px] text-blue-200 uppercase tracking-wider block font-bold">
                  Request ID Anda
                </span>
                <span className="text-2xl font-black tracking-tight font-mono">
                  {currentReq.id}
                </span>
              </div>
              <button
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition-colors border border-white/20"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Status Card */}
          <div className="mt-5 p-4 rounded-2xl border border-blue-100 bg-blue-50/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Status Pesanan:</span>
              <button
                onClick={refreshStatus}
                className="text-[11px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                title="Cek pembaruan status terkini"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${statusInfo.bg}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot}`} />
              <span className="text-xs font-bold">{statusInfo.label}</span>
            </div>

            {/* Step progress timeline with color */}
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {[
                { key: 'pending', label: 'Terkirim' },
                { key: 'processing', label: 'Cetak' },
                { key: 'ready', label: 'Siap' },
                { key: 'completed', label: 'Selesai' },
              ].map((step, idx) => {
                const stepKeys = ['pending', 'processing', 'ready', 'completed'];
                const currentIdx = stepKeys.indexOf(currentReq.status);
                const isPassed = currentIdx >= idx;

                return (
                  <div key={step.key} className="text-center">
                    <div
                      className={`h-1.5 rounded-full mb-1 transition-colors ${
                        isPassed
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          : 'bg-slate-200'
                      }`}
                    />
                    <span className="text-[10px] text-slate-500 font-bold">
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR Code and Instructions */}
          <div className="mt-5 flex flex-col items-center p-4 bg-white rounded-2xl border border-blue-200/80 shadow-sm">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Request"
                className="w-32 h-32 rounded-xl"
              />
            ) : (
              <div className="w-32 h-32 bg-blue-50 rounded-xl flex items-center justify-center text-xs text-blue-400">
                Membuat QR...
              </div>
            )}
            <p className="text-[11px] text-slate-500 text-center mt-2 max-w-xs font-medium">
              Tunjukkan Request ID atau QR ini kepada kasir saat mengambil hasil cetak Anda.
            </p>
          </div>

          {/* Details table */}
          <div className="mt-5 space-y-2 text-xs border-t border-slate-100 pt-4">
            <div className="flex justify-between text-slate-600">
              <span>Nama:</span>
              <span className="font-bold text-slate-900">{currentReq.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>WhatsApp:</span>
              <span className="font-mono text-blue-700 font-bold">{currentReq.customerPhone}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>File Dokumen:</span>
              <span className="font-bold text-slate-900">
                {currentReq.files.length} dokumen
              </span>
            </div>
            {currentReq.notes && (
              <div className="flex justify-between text-slate-600">
                <span>Catatan:</span>
                <span className="font-semibold text-slate-800 italic">"{currentReq.notes}"</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-200">
              <span>Status Bayar:</span>
              <span className="font-mono text-sm text-blue-700">
                {currentReq.actualPrice ? formatRupiah(currentReq.actualPrice) : 'Dihitung di kasir'}
              </span>
            </div>
          </div>

          {/* Actions with color */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => window.print()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 border border-slate-300 text-slate-800 text-xs font-bold rounded-2xl hover:bg-slate-50 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Cetak Bukti</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onNewOrder();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Kirim File Baru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
