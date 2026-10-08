import React, { useState } from 'react';
import {
  X,
  Download,
  FileText,
  File,
  Eye,
  CheckCircle2,
  Clock,
  Printer,
  MessageCircle,
  Edit2,
  Save,
  Trash2,
  ExternalLink,
  HardDrive,
  Cloud,
} from 'lucide-react';
import { PrintRequest, StoreSettings, RequestStatus, PaymentStatus } from '../types';
import { formatRupiah } from '../lib/pricing';
import { updateRequestStatus, deleteRequest } from '../lib/db';
import { PrintTicketModal } from './PrintTicketModal';

interface RequestDetailModalProps {
  request: PrintRequest;
  settings: StoreSettings;
  onClose: () => void;
  onUpdated: () => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  settings,
  onClose,
  onUpdated,
}) => {
  const [currentStatus, setCurrentStatus] = useState<RequestStatus>(request.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(request.paymentStatus || 'unpaid');
  const [actualPrice, setActualPrice] = useState<number>(request.actualPrice || request.estimatedPrice || 0);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>('');
  const [showJobSlip, setShowJobSlip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Status transitions
  const handleStatusChange = async (newStatus: RequestStatus) => {
    setCurrentStatus(newStatus);
    await updateRequestStatus(request.id, newStatus, actualPrice, paymentStatus);
    onUpdated();
  };

  const handlePaymentStatusChange = async (newPayStatus: PaymentStatus) => {
    setPaymentStatus(newPayStatus);
    await updateRequestStatus(request.id, currentStatus, actualPrice, newPayStatus);
    onUpdated();
  };

  const handleSavePrice = async () => {
    setIsSaving(true);
    await updateRequestStatus(request.id, currentStatus, actualPrice, paymentStatus);
    setIsEditingPrice(false);
    setIsSaving(false);
    onUpdated();
  };

  const handleDelete = async () => {
    if (confirm(`Yakin ingin menghapus permintaan cetak ${request.id} (${request.customerName})?`)) {
      await deleteRequest(request.id);
      onUpdated();
      onClose();
    }
  };

  // WhatsApp quick notification
  const handleSendWhatsappReady = () => {
    if (!request.customerPhone) {
      alert(`Pesanan atas nama ${request.customerName} tidak mencantumkan nomor WhatsApp.`);
      return;
    }
    const cleanPhone = request.customerPhone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
    const priceStr = formatRupiah(actualPrice);
    const text = encodeURIComponent(
      `Halo Kak *${request.customerName}*,\n\n` +
      `Pesanan cetak Anda di *AFTER PROJECT PHOTOCOPY* dengan:\n` +
      `• *Request ID:* ${request.id}\n` +
      `• *Status:* SIAP DIAMBIL DI KASIR ✅\n` +
      `• *Total Biaya:* ${priceStr} (${paymentStatus === 'paid' ? 'LUNAS' : 'Belum Bayar'})\n\n` +
      `Silakan datang ke konter After Project Photocopy dan sebutkan Request ID Anda. Terima kasih!`
    );
    window.open(`https://wa.me/${intlPhone}?text=${text}`, '_blank');
  };

  // Download a file
  const handleDownloadFile = (fileItem: { name: string; dataUrl?: string }) => {
    if (fileItem.dataUrl) {
      const a = document.createElement('a');
      a.href = fileItem.dataUrl;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Mock generated fallback download for seeded demo items
      const blob = new Blob([`AFTER PROJECT PHOTOCOPY - File Placeholder: ${fileItem.name}`], {
        type: 'text/plain',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileItem.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xl font-black text-neutral-900">
                  {request.id}
                </span>
                <span className="text-xs text-neutral-400">·</span>
                <span className="text-xs text-neutral-500">
                  {new Date(request.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 mt-0.5">
                {request.customerName} · <span className="font-mono text-neutral-600">{request.customerPhone}</span>
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJobSlip(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Slip</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            {/* Status & Action Pipeline */}
            <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Update Status Pengerjaan:
                </span>
                <span className="text-xs text-neutral-500 font-mono">
                  Current: {currentStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'pending', label: '1. Menunggu', color: 'hover:border-amber-400' },
                  { id: 'processing', label: '2. Cetak', color: 'hover:border-sky-400' },
                  { id: 'ready', label: '3. Siap Ambil', color: 'hover:border-emerald-400' },
                  { id: 'completed', label: '4. Selesai', color: 'hover:border-neutral-400' },
                ].map((s) => {
                  const isActive = currentStatus === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleStatusChange(s.id as RequestStatus)}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all border text-center ${
                        isActive
                          ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                          : `bg-white text-neutral-700 border-neutral-200 ${s.color}`
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Ready Notification Trigger */}
              <div className="mt-3 pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={handleSendWhatsappReady}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Kirim Notifikasi WhatsApp Siap Ambil</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500">Pembayaran:</span>
                  <button
                    onClick={() =>
                      handlePaymentStatusChange(paymentStatus === 'paid' ? 'unpaid' : 'paid')
                    }
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border ${
                      paymentStatus === 'paid'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {paymentStatus === 'paid' ? '✓ LUNAS' : 'BELUM BAYAR'}
                  </button>
                </div>
              </div>
            </div>

            {/* File List & One-Click Download */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                  File Dokumen Pelanggan ({request.files.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  Klik untuk download langsung ke PC Cetak
                </span>
              </div>

              <div className="space-y-2 border border-blue-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                {request.files.map((file) => (
                  <div
                    key={file.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                        {file.type.includes('pdf') ? (
                          <FileText className="w-5 h-5 text-rose-600" />
                        ) : file.type.includes('image') ? (
                          <File className="w-5 h-5 text-purple-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {file.size > 0 ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : 'Dokumen'} · Estimasi ~{file.pageCount || 1} hal
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.dataUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewFileUrl(file.dataUrl || null);
                            setPreviewFileName(file.name);
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600" />
                          <span>Preview</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDownloadFile(file)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            {request.notes && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <span className="font-bold text-amber-950 block mb-1">💬 Catatan dari Pelanggan:</span>
                <p className="text-amber-900 font-medium text-sm">{request.notes}</p>
              </div>
            )}

            {/* Price Editor (Optional for Operator) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">
                  Total Biaya Cetak (Opsional)
                </span>
                {isEditingPrice ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={actualPrice}
                      onChange={(e) => setActualPrice(Number(e.target.value))}
                      className="w-32 px-2.5 py-1 text-sm font-mono font-bold border border-blue-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                    />
                    <button
                      onClick={handleSavePrice}
                      disabled={isSaving}
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                    >
                      Simpan
                    </button>
                  </div>
                ) : (
                  <div className="text-xl font-black font-mono text-slate-900 mt-0.5">
                    {actualPrice > 0 ? formatRupiah(actualPrice) : 'Dihitung di kasir'}
                  </div>
                )}
              </div>

              {!isEditingPrice && (
                <button
                  onClick={() => setIsEditingPrice(true)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl flex items-center gap-1 shadow-sm"
                >
                  <Edit2 className="w-3 h-3 text-blue-600" />
                  <span>Atur Biaya</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
            <button
              onClick={handleDelete}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Request</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewFileUrl && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <span className="text-sm font-bold truncate">{previewFileName}</span>
              <button
                onClick={() => setPreviewFileUrl(null)}
                className="p-1 text-neutral-500 hover:text-neutral-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-neutral-100">
              {previewFileName.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                <img
                  src={previewFileUrl}
                  alt={previewFileName}
                  className="max-h-[70vh] object-contain rounded-lg shadow"
                />
              ) : (
                <iframe
                  src={previewFileUrl}
                  className="w-full h-[65vh] rounded-lg border border-neutral-300"
                  title="PDF Preview"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Job Ticket Modal */}
      {showJobSlip && (
        <PrintTicketModal
          request={{ ...request, actualPrice, paymentStatus, status: currentStatus }}
          settings={settings}
          onClose={() => setShowJobSlip(false)}
        />
      )}
    </>
  );
};
