import React from 'react';

interface BrandingLockupProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  align?: 'left' | 'center';
  showTagline?: boolean;
  className?: string;
}

export const BrandingLockup: React.FC<BrandingLockupProps> = ({
  size = 'md',
  align = 'left',
  showTagline = false,
  className = '',
}) => {
  const alignClass = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  if (size === 'sm') {
    return (
      <div className={`flex flex-col ${alignClass} ${className}`}>
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="font-extrabold tracking-tight bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 bg-clip-text text-transparent text-sm">
            AFTER PROJECT
          </span>
          <span className="text-[11px] font-bold tracking-wider text-blue-600 uppercase italic">
            PHOTOCOPY
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-medium tracking-tight">Digital File & Print Service</span>
      </div>
    );
  }

  if (size === 'xl') {
    return (
      <div className={`flex flex-col ${alignClass} ${className}`}>
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wider uppercase mb-3 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            DIGITAL FILE PORTAL
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 bg-clip-text text-transparent drop-shadow-sm">
            AFTER PROJECT
          </h1>
          <span className="text-2xl md:text-3xl font-extrabold tracking-[0.25em] text-blue-600 italic mt-1.5 uppercase">
            PHOTOCOPY
          </span>
          <span className="text-xs md:text-sm font-bold tracking-widest text-slate-600 uppercase mt-2.5 border-y border-blue-200 bg-blue-50/50 py-1.5 px-6 rounded-md">
            Digital File & Print Service
          </span>
          {showTagline && (
            <p className="text-base md:text-lg text-slate-700 font-semibold mt-3">
              Kirim File. Cetak Lebih Mudah.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className={`flex flex-col ${alignClass} ${className}`}>
        <div className="flex flex-col">
          <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-600 bg-clip-text text-transparent">
            AFTER PROJECT
          </h2>
          <span className="text-base md:text-lg font-bold tracking-widest text-blue-600 italic uppercase mt-0.5">
            PHOTOCOPY
          </span>
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase mt-1">
            Digital File & Print Service
          </span>
          {showTagline && (
            <p className="text-xs text-blue-700 mt-1 font-semibold">
              Kirim File. Cetak Lebih Mudah.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Default 'md'
  return (
    <div className={`flex flex-col ${alignClass} ${className}`}>
      <div className="flex items-baseline gap-2 leading-none">
        <span className="font-black tracking-tight text-lg md:text-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 bg-clip-text text-transparent">
          AFTER PROJECT
        </span>
        <span className="text-xs font-bold tracking-wider text-blue-600 uppercase italic">
          PHOTOCOPY
        </span>
      </div>
      <span className="text-[11px] text-slate-500 font-medium tracking-tight mt-0.5">
        Digital File & Print Service
      </span>
      {showTagline && (
        <span className="text-[11px] text-blue-600 font-medium mt-0.5">
          Kirim File. Cetak Lebih Mudah.
        </span>
      )}
    </div>
  );
};
