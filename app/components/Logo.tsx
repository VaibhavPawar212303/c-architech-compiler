import React from 'react';

interface LogoProps {
  theme?: 'dark' | 'light';
  showText?: boolean;
  className?: string;
}

// Same mark as the main Thedappled site (app/_components/logo.tsx there).
// The mark uses the foreground colour; the two accent blocks are fixed brand blue.
export default function Logo({ theme = 'light', showText = true, className = '' }: LogoProps) {
  const fg = theme === 'dark' ? 'text-white' : 'text-slate-900';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={fg}
        aria-hidden="true"
      >
        {/* Stem */}
        <rect x="2" y="2" width="8" height="28" rx="2" fill="currentColor" />
        {/* Top bar */}
        <rect x="12" y="2" width="10" height="8" rx="2" fill="currentColor" />
        {/* Bottom bar */}
        <rect x="12" y="22" width="10" height="8" rx="2" fill="currentColor" />
        {/* Accent blocks (brand blue, fixed across themes) */}
        <rect x="24" y="6" width="6" height="8" rx="2" fill="#3987e5" />
        <rect x="24" y="18" width="6" height="8" rx="2" fill="#3987e5" />
      </svg>
      {showText && (
        <span className={`font-bold text-xl tracking-tight ${fg}`}>
          Thedappled
          <sup className="text-xs font-normal ml-0.5">&trade;</sup>
        </span>
      )}
    </div>
  );
}
