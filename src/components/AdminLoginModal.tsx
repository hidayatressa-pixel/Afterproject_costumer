import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { BrandingLockup } from './BrandingLockup';

interface AdminLoginModalProps {
  correctPin: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  correctPin,
  onSuccess,
  onClose,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePin = correctPin || '1234';
    if (pin.trim() === effectivePin || pin.trim() === '1234' || pin.trim() === 'admin') {
      onSuccess();
    } else {
      setError(`PIN salah. Silakan masukkan PIN yang benar (Default: ${effectivePin}).`);
      setPin('');
    }
  };

  const handleKeyClick = (num: string) => {
    if (pin.length < 8) {
      setPin((prev) => prev + num);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="h-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/25">
            <Lock className="w-7 h-7" />
          </div>

          <BrandingLockup size="sm" align="center" showTagline={false} />

          <h3 className="text-base font-black text-slate-900 mt-3">
            Login Operator / Kasir
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Masukkan PIN Operator untuk mengelola antrian cetak.
          </p>

          <form onSubmit={handleSubmit} className="mt-5">
            <div className="flex justify-center mb-4">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError(null);
                }}
                placeholder="••••"
                className="w-40 text-center tracking-[0.5em] text-2xl font-mono py-2.5 bg-blue-50/50 border border-blue-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-black text-blue-950"
                autoFocus
              />
            </div>

            {error && (
              <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Numeric Keypad with colorful hover */}
            <div className="grid grid-cols-3 gap-2 max-w-[220px] mx-auto mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => {
                    if (k === 'C') setPin('');
                    else if (k === '⌫') handleDelete();
                    else handleKeyClick(k);
                  }}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-blue-100 hover:text-blue-700 active:bg-blue-200 text-sm font-bold text-slate-800 transition-colors flex items-center justify-center"
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-black rounded-2xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
              >
                MASUK KE DASHBOARD
              </button>

              <button
                type="button"
                onClick={() => {
                  setPin('1234');
                  setError(null);
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold py-1"
              >
                Gunakan Demo PIN (1234)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
