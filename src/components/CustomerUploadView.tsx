import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  File,
  CheckCircle2,
  X,
  AlertCircle,
  Sparkles,
  Send,
  User,
  MessageSquare,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PrintRequest, UploadedFileItem, StoreSettings } from '../types';
import { BrandingLockup } from './BrandingLockup';
import { generateRequestId, saveRequest } from '../lib/db';
import { playSuccessBeep } from '../lib/audio';

interface CustomerUploadViewProps {
  settings: StoreSettings;
  onRequestSubmitted: (request: PrintRequest) => void;
  onOpenQRStandee: () => void;
}

export const CustomerUploadView: React.FC<CustomerUploadViewProps> = ({
  settings,
  onRequestSubmitted,
  onOpenQRStandee,
}) => {
  // Form states
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Success state when submitted
  const [submittedRequest, setSubmittedRequest] = useState<PrintRequest | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const processSelectedFiles = (selectedFiles: File[]) => {
    setValidationError(null);

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      const itemId = 'file_' + Math.random().toString(36).substring(2, 9);

      let estimatedPages = 1;
      if (file.type.includes('pdf')) {
        estimatedPages = Math.max(1, Math.min(250, Math.round(file.size / (80 * 1024))));
      } else if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
        estimatedPages = Math.max(1, Math.min(100, Math.round(file.size / (50 * 1024))));
      }

      reader.onload = () => {
        const item: UploadedFileItem = {
          id: itemId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl: reader.result as string,
          pageCount: estimatedPages,
          uploadedAt: new Date().toISOString(),
        };
        setFiles((prev) => [...prev, item]);
      };

      reader.readAsDataURL(file);
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setValidationError('Silakan masukkan Nama Anda agar operator kasir tahu ini pesanan siapa.');
      return;
    }

    if (files.length === 0) {
      setValidationError('Silakan pilih minimal 1 file dokumen yang ingin dicetak.');
      return;
    }

    try {
      setIsSubmitting(true);
      const reqId = generateRequestId();
      const newRequest: PrintRequest = {
        id: reqId,
        createdAt: new Date().toISOString(),
        customerName: customerName.trim(),
        files,
        notes: notes.trim() || undefined,
        status: 'pending',
      };

      await saveRequest(newRequest);
      playSuccessBeep();

      try {
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#2563EB', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
        });
      } catch {
        // ignore
      }

      setSubmittedRequest(newRequest);
      onRequestSubmitted(newRequest);
    } catch (err) {
      console.error('Error saving request:', err);
      setValidationError('Gagal mengirim file. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewUpload = () => {
    setSubmittedRequest(null);
    setFiles([]);
    setNotes('');
    setValidationError(null);
  };

  // SUCCESS SCREEN: Shown right after submission
  if (submittedRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-slate-50 to-indigo-50/40 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl p-7 sm:p-10 border border-blue-100 shadow-2xl shadow-blue-500/10 text-center animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 mb-5 animate-bounce">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
            File Terkirim ke Kasir
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
            Berhasil Terkirim!
          </h2>

          <p className="text-sm text-slate-600 mt-1">
            File Anda sudah masuk ke komputer operator toko.
          </p>

          {/* Callout box to tell the operator */}
          <div className="my-6 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200/80 text-left">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Langkah Selanjutnya:
            </span>
            <div className="text-base sm:text-lg font-black text-slate-900 mt-1">
              Bilang ke operator kasir:
            </div>
            <div className="mt-2 p-3 bg-white rounded-xl border border-blue-200 font-bold text-blue-900 text-sm sm:text-base flex items-center gap-2 shadow-sm">
              <span className="text-xl">🗣️</span>
              <span>
                "Mas, file atas nama <span className="text-blue-700 underline underline-offset-2">{submittedRequest.customerName}</span> sudah dikirim."
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-blue-100">
              <span>Kode Pengiriman:</span>
              <span className="font-mono font-black text-blue-700 text-sm">
                {submittedRequest.id}
              </span>
            </div>
          </div>

          {/* Files Summary */}
          <div className="text-xs text-slate-500 mb-6 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left">
            <span className="font-bold text-slate-700 block mb-1">
              File yang Anda kirim ({submittedRequest.files.length}):
            </span>
            <ul className="space-y-1">
              {submittedRequest.files.map((f) => (
                <li key={f.id} className="flex justify-between truncate text-slate-600">
                  <span className="truncate max-w-[240px] font-medium">📄 {f.name}</span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {formatFileSize(f.size)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={handleResetForNewUpload}
            className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-blue-500/25 active:scale-95 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Kirim File Lainnya</span>
          </button>
        </div>
      </div>
    );
  }

  // MAIN UPLOAD VIEW (Simple 1-Page Experience)
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 via-slate-50 to-indigo-50/30 pb-20">
      {/* Brand Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-blue-100 pt-7 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <BrandingLockup size="xl" align="center" showTagline={false} />

          <div className="mt-4">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kirim File untuk Dicetak
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              Cukup isi nama, pilih file dokumen, lalu klik kirim. Operator langsung mendownload file di kasir!
            </p>
          </div>
        </div>
      </div>

      {/* Main Single-Step Form Container */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {validationError && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-start gap-3 shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 font-semibold">{validationError}</div>
            <button
              onClick={() => setValidationError(null)}
              className="text-rose-700 hover:text-rose-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 1. NAMA PELANGGAN */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-200/80 shadow-md shadow-blue-500/5">
            <label className="block text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Nama Anda *</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Masukkan nama agar operator kasir tahu ini file milik Anda.
            </p>
            <input
              type="text"
              required
              autoFocus
              value={customerName}
              onChange={(e) => {
                setCustomerName(e.target.value);
                setValidationError(null);
              }}
              placeholder="Contoh: Budi, Siti, Ressa..."
              className="w-full px-4 py-3 text-base bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
            />
          </div>

          {/* 2. UPLOAD FILE DOKUMEN */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-200/80 shadow-md shadow-blue-500/5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="block text-sm font-black text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>File Dokumen yang Mau Dicetak *</span>
                </label>
                <p className="text-xs text-slate-500">
                  Mendukung PDF, Word (.docx), Excel, PowerPoint, Foto/Gambar (JPG/PNG).
                </p>
              </div>

              {files.length > 0 && (
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200 tabular-nums">
                  {files.length} file dipilih
                </span>
              )}
            </div>

            {/* Dropzone Container */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mt-3 border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-50/80 scale-[0.99] ring-4 ring-blue-100'
                  : 'border-blue-300 hover:border-blue-500 bg-gradient-to-b from-blue-50/40 via-white to-indigo-50/20 hover:bg-blue-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="text-sm sm:text-base font-extrabold text-slate-900">
                Klik untuk Pilih File dari HP / Laptop
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bisa pilih banyak file sekaligus (PDF, Foto, Dokumen)
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>PILIH DOKUMEN</span>
              </button>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-bold text-slate-700">
                  Daftar Dokumen Anda:
                </div>
                <div className="divide-y divide-slate-100 border border-blue-100 rounded-2xl overflow-hidden bg-slate-50/50">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {file.type.includes('pdf')
                            ? 'PDF'
                            : file.type.includes('image')
                            ? 'IMG'
                            : 'DOC'}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Hapus file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. CATATAN OPSIONAL */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-blue-200/80 shadow-md shadow-blue-500/5">
            <label className="block text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <span>Catatan untuk Operator (Opsional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Misal: "Tolong print 2 rangkap", "Cover warna isi hitam putih", atau boleh dikosongkan.
            </p>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Print warna, 2 rangkap, jilid lakban..."
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* 4. TOMBOL KIRIM BESAR */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || files.length === 0 || !customerName.trim()}
              className="w-full py-4 sm:py-5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base sm:text-lg rounded-3xl shadow-xl shadow-blue-500/25 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Mengirimkan ke Kasir...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 text-emerald-300" />
                  <span>KIRIM FILE KE KASIR SEKARANG</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-2xl bg-white border border-blue-100 text-center text-xs text-slate-500">
          <span>✨ </span>
          <span className="font-semibold text-slate-700">
            Tanpa perlu nomor WhatsApp toko. File langsung masuk ke layar kasir After Project Photocopy.
          </span>
        </div>
      </div>
    </div>
  );
};
