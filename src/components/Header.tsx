import React from 'react';
import { Search } from 'lucide-react';
import { BrandingLockup } from './BrandingLockup';

interface HeaderProps {
  onOpenTracker: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenTracker }) => {
  return (
    <header className="relative bg-white/75 backdrop-blur-xl border-b border-white/70 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center text-left">
          <BrandingLockup size="md" />
        </div>

        {/* Action: Lacak Status Dokumen */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTracker}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white/70 hover:bg-white hover:text-indigo-700 border border-white/80 hover:border-indigo-200 rounded-xl transition-all whitespace-nowrap shadow-sm active:scale-95"
          >
            <Search className="w-3.5 h-3.5 text-indigo-600" />
            <span>Lacak Pesanan</span>
          </button>
        </div>
      </div>
    </header>
  );
};
