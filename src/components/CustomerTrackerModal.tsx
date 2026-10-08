import React, { useState } from 'react';
import { Search, X, AlertCircle, ArrowRight } from 'lucide-react';
import { PrintRequest } from '../types';
import { getRequestById, getAllRequests } from '../lib/db';
import { BrandingLockup } from './BrandingLockup';
import { formatRupiah } from '../lib/pricing';

interface CustomerTrackerModalProps {
  onClose: () => void;
  onSelectRequest: (request: PrintRequest) => void;
}

export const CustomerTrackerModal: React.FC<CustomerTrackerModalProps> = ({
  onClose,
  onSelectRequest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [foundRequest, setFoundRequest] = useState<PrintRequest | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setFoundRequest(null);

    try {
      const q = searchQuery.trim().toUpperCase();
      let result = await getRequestById(q);

      if (!result) {
        const all = await getAllRequests();
        result =
          all.find(
            (r) =>
              r.id.toUpperCase() === q ||
              (r.customerPhone && r.customerPhone.replace(/[^0-9]/g, '').includes(searchQuery.replace(/[^0-9]/g, ''))) ||
              r.customerName.toLowerCase().includes(searchQuery.toLowerCase())
          ) || null;
      }

      if (result) {
        setFoundRequest(result);
      } else {
        setSearchError('Pesanan tidak ditemukan. Periksa kembali Request ID atau Nomor WhatsApp Anda.');
      }
    } catch {
      setSearchError('Terjadi kesalahan saat mencari pesanan.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-7">
          <BrandingLockup size="md" align="center" showTagline={false} />
          <h3 className="text-base font-extrabold text-slate-900 text-center mt-3">
            Lacak Status Cetak Dokumen
          </h3>
          <p className="text-xs text-slate-500 text-center mt-1">
            Masukkan Request ID (misal: AP-412) atau Nomor WhatsApp pemesan.
          </p>

          <form onSubmit={handleSearch} className="mt-5">
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: AP-412 atau 0812..."
                className="w-full pl-10 pr-24 py-3 text-sm bg-blue-50/50 border border-blue-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
              <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-3.5" />
              <button
                type="submit"
                disabled={isSearching}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                {isSearching ? 'Cari...' : 'Cari'}
              </button>
            </div>
          </form>

          {searchError && (
            <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {foundRequest && (
            <div className="mt-5 p-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-black text-blue-900">
                  {foundRequest.id}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-700 text-white uppercase shadow-sm">
                  {foundRequest.status}
                </span>
              </div>

              <div className="text-xs text-slate-700 space-y-1">
                <div>
                  <span className="text-slate-400">Pemesan:</span>{' '}
                  <span className="font-bold text-slate-900">{foundRequest.customerName}</span>
                </div>
                <div>
                  <span className="text-slate-400">File:</span>{' '}
                  <span className="font-semibold text-blue-700">{foundRequest.files.length} dokumen</span>
                </div>
                {foundRequest.notes && (
                  <div>
                    <span className="text-slate-400">Catatan:</span>{' '}
                    <span className="italic">"{foundRequest.notes}"</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Total Biaya:</span>{' '}
                  <span className="font-mono font-black text-slate-900">
                    {foundRequest.actualPrice ? formatRupiah(foundRequest.actualPrice) : 'Dihitung di kasir'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectRequest(foundRequest);
                  onClose();
                }}
                className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                <span>Buka Bukti Tanda Terima</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
