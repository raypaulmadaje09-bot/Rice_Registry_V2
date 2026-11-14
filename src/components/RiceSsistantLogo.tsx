import React from 'react';

interface RiceSsistantLogoProps {
  className?: string;
  size?: number;
}

export const RiceSsistantLogo: React.FC<RiceSsistantLogoProps> = ({
  className = '',
  size = 36
}) => {
  return (
    <div
      className={`w-9 h-9 rounded-full bg-white border border-emerald-500/30 p-0.5 object-contain shadow-sm overflow-hidden flex items-center justify-center shrink-0 relative select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
      title="RiceSsistant • Intelligent GIS Guide"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Subtle gradient circular background */}
        <circle cx="20" cy="20" r="18.5" fill="url(#riceLogoGrad)" stroke="#10b981" strokeWidth="1.2" strokeOpacity="0.4" />
        
        {/* Soft radial glow */}
        <circle cx="20" cy="20" r="14" fill="#047857" fillOpacity="0.12" />

        {/* GIS Lat/Lng Ring Accents */}
        <circle cx="20" cy="20" r="16.5" stroke="#34d399" strokeWidth="0.6" strokeDasharray="2 3" opacity="0.6" />

        {/* Central Golden Rice Stalk & Green Seedling Sprout */}
        <g transform="translate(20, 22) scale(0.92) translate(-20, -22)">
          {/* Main Stem */}
          <path
            d="M20 31 C20 22 20 12 18 8"
            stroke="#15803d"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Golden Rice Grains (Palay Sheaf) */}
          {/* Left Grain 1 */}
          <path
            d="M17.5 12 C15 11 13 13 14.5 15.5 C16 17 18 15 17.5 12 Z"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="0.75"
          />
          {/* Right Grain 1 */}
          <path
            d="M19.5 10 C22 9 24 11 22.5 13.5 C21 15 19 13 19.5 10 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="0.75"
          />
          {/* Left Grain 2 */}
          <path
            d="M18 16 C15.5 15.5 14 18 15.5 20 C17 21.5 19 19 18 16 Z"
            fill="#fbbf24"
            stroke="#d97706"
            strokeWidth="0.75"
          />
          {/* Right Grain 2 */}
          <path
            d="M20 15 C22.5 14.5 24.5 16.5 23 19 C21.5 20.5 19.5 18 20 15 Z"
            fill="#f59e0b"
            stroke="#d97706"
            strokeWidth="0.75"
          />
          {/* Top Grain */}
          <path
            d="M18 8 C17.5 5.5 19.5 4.5 20.5 6.5 C21.5 8 19.5 9.5 18 8 Z"
            fill="#fef08a"
            stroke="#d97706"
            strokeWidth="0.75"
          />

          {/* Lower Fresh Green Leaf Sprout */}
          <path
            d="M20 26 C24 25 27 20 25.5 18 C23 20 21 23 20 26 Z"
            fill="#22c55e"
            stroke="#15803d"
            strokeWidth="0.75"
          />
          <path
            d="M19.5 28 C15.5 27 13 23 14 21 C16.5 23 18.5 25.5 19.5 28 Z"
            fill="#4ade80"
            stroke="#15803d"
            strokeWidth="0.75"
          />

          {/* GIS Georeference Base Pin */}
          <circle cx="20" cy="31.5" r="2" fill="#059669" stroke="#ffffff" strokeWidth="0.8" />
        </g>

        <defs>
          <linearGradient id="riceLogoGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ecfdf5" />
            <stop offset="60%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d1fae5" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};
