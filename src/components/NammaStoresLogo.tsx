import React from 'react';

interface LogoProps {
  variant?: 'full' | 'compact' | 'icon-only';
  className?: string;
}

export const NammaStoresLogo: React.FC<LogoProps> = ({
  variant = 'compact',
  className = '',
}) => {
  // Standalone Icon
  const renderIcon = (sizeClass: string = 'w-9 h-9') => (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 transition-transform duration-300 group-hover:scale-105`}
      aria-hidden="true"
    >
      {/* Orange Roof */}
      <path
        d="M50 8L86 35.5C87.8 36.8 87 39 84.8 39H15.2C13 39 12.2 36.8 14 35.5L50 8Z"
        fill="#FF6A00"
      />
      {/* Green Tote / House Container */}
      <path
        d="M17 41H83L77 88C76.2 92.5 72.4 96 67.8 96H32.2C27.6 96 23.8 92.5 23 88L17 41Z"
        fill="#0A8754"
      />
      {/* Crisp White 'N' */}
      <path
        d="M37 81V52C37 50.8 38 49.8 39.2 49.8H41.5C42.7 49.8 43.8 50.4 44.5 51.4L58.5 74.5V52C58.5 50.8 59.5 49.8 60.7 49.8H63C64.2 49.8 65.2 50.8 65.2 52V81C65.2 82.2 64.2 83.2 63 83.2H60.7C59.5 83.2 58.4 82.6 57.7 81.6L43.7 58.5V81C43.7 82.2 42.7 83.2 41.5 83.2H39.2C38 83.2 37 82.2 37 81Z"
        fill="#FFFFFF"
      />
    </svg>
  );

  if (variant === 'icon-only') {
    return <div className={`inline-flex items-center ${className}`}>{renderIcon()}</div>;
  }

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2.5 group select-none ${className}`}>
        {renderIcon('w-8 h-8 sm:w-9 sm:h-9')}
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline tracking-tight font-display font-extrabold text-[1.2rem] sm:text-[1.35rem]">
            <span className="text-[#0F172A] tracking-[-0.03em]">Namma</span>
            <span className="text-[#FF6A00] ml-1 tracking-[-0.03em]">Stores</span>
          </div>
          <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
            Local <span className="text-[#FF6A00] font-black">•</span> Fresh <span className="text-[#FF6A00] font-black">•</span> Trusted
          </span>
        </div>
      </div>
    );
  }

  // Full Variant
  return (
    <div className={`inline-flex items-center gap-3 group select-none ${className}`}>
      {renderIcon('w-12 h-12 sm:w-14 sm:h-14')}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline tracking-tight font-display font-extrabold text-2xl sm:text-3xl">
          <span className="text-[#0F172A] tracking-[-0.03em]">Namma</span>
          <span className="text-[#FF6A00] ml-1.5 tracking-[-0.03em]">Stores</span>
        </div>
        <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-500 uppercase mt-1">
          Local <span className="text-[#FF6A00] font-black">•</span> Fresh <span className="text-[#FF6A00] font-black">•</span> Trusted
        </span>
      </div>
    </div>
  );
};
