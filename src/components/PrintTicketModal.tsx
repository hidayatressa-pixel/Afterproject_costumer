import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, X, Download } from 'lucide-react';
import { PrintRequest, StoreSettings } from '../types';
import { BrandingLockup } from './BrandingLockup';
import { formatRupiah } from '../lib/pricing';

interface PrintTicketModalProps {
  request: PrintRequest;
  settings: StoreSettings;
  onClose: () => void;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  request,
  settings,
  onClose,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(request.id, {
      width: 140,
      margin: 1,
    }).then(setQrUrl);
  }, [request.id]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition-colors no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Physical slip printable container */}
        <div className="p-6 text-neutral-900 bg-white font-mono text-xs">
          {/* Slip Header */}
          <div className="text-center pb-4 border-b border-dashed border-neutral-400">
            <div className="font-black text-base tracking-tight font-sans">
              AFTER PROJECT
            </div>
            <div className="text-[10px] tracking-widest uppercase font-sans font-bold">
              PHOTOCOPY & DIGITAL PRINT
            </div>
            <div className="text-[9px] text-neutral-600 mt-0.5">
              {settings.storeAddress}
            </div>
            <div className="text-[9px] text-neutral-600">
              WA: {settings.storeWhatsapp}
            </div>
          </div>

          {/* Job ID Section */}
          <div className="py-3 text-center border-b border-dashed border-neutral-400">
            <div className="text-[10px] text-neutral-500 uppercase">JOB TICKET ID</div>
            <div className="text-3xl font-black font-mono tracking-tight my-1">
              {request.id}
            </div>
            <div className="text-[10px] text-neutral-500">
              {new Date(request.createdAt).toLocaleString('id-ID')}
            </div>
          </div>

          {/* Customer info */}
          <div className="py-3 space-y-1 border-b border-dashed border-neutral-400 text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-500">Pelanggan:</span>
              <span className="font-bold">{request.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">No. Kontak:</span>
              <span>{request.customerPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Jumlah File:</span>
              <span className="font-bold">{request.files.length} Dokumen</span>
            </div>
          </div>

          {/* Specs breakdown */}
          <div className="py-3 space-y-1.5 border-b border-dashed border-neutral-400 text-[11px]">
            <div className="font-bold text-neutral-800 uppercase text-[10px]">
              Spesifikasi Mesin:
            </div>
            <div className="flex justify-between">
              <span>Kertas:</span>
              <span>{request.paperSize} ({request.paperType})</span>
            </div>
            <div className="flex justify-between">
              <span>Warna:</span>
              <span className="font-bold uppercase">{request.colorMode}</span>
            </div>
            <div className="flex justify-between">
              <span>Sisi:</span>
              <span>{request.duplex ? 'Bolak-Balik' : '1 Sisi'}</span>
            </div>
            <div className="flex justify-between">
              <span>Rangkap:</span>
              <span>{request.copies} Rangkap</span>
            </div>
            <div className="flex justify-between">
              <span>Jilid:</span>
              <span>{request.binding}</span>
            </div>
            {request.specificPages && (
              <div className="text-[10px] text-neutral-700 bg-neutral-100 p-1.5 rounded">
                Hal: {request.specificPages}
              </div>
            )}
            {request.notes && (
              <div className="text-[10px] text-neutral-700 italic bg-neutral-100 p-1.5 rounded">
                Catatan: {request.notes}
              </div>
            )}
          </div>

          {/* Total & Payment */}
          <div className="py-3 space-y-1 border-b border-dashed border-neutral-400 text-xs">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL BIAYA:</span>
              <span>{formatRupiah(request.actualPrice || request.estimatedPrice || 0)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-600">
              <span>STATUS BAYAR:</span>
              <span className="uppercase font-bold">
                {request.paymentStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
              </span>
            </div>
          </div>

          {/* QR Code on Slip */}
          <div className="pt-3 flex flex-col items-center text-center">
            {qrUrl && (
              <img src={qrUrl} alt="Slip QR" className="w-24 h-24 mx-auto" />
            )}
            <div className="text-[9px] text-neutral-500 mt-1 uppercase">
              Tempelkan slip ini pada hasil cetak
            </div>
          </div>
        </div>

        {/* Buttons (No Print) */}
        <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex gap-2 no-print">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Slip (Printer Struk)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-xl hover:bg-neutral-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
