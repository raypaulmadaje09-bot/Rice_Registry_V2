import React from 'react';
import { useApp } from '../context/AppContext';
import { Pencil } from 'lucide-react';

interface SealProps {
  className?: string;
  size?: number;
  customUrl?: string;
}

export const DaLogo: React.FC<SealProps> = ({ className = '', size = 40, customUrl }) => {
  const { daLogoUrl } = useApp();
  const url = customUrl !== undefined ? customUrl : daLogoUrl;

  const defaultSizeClass = !className ? 'h-16 w-auto max-w-[80px]' : '';
  const inlineStyle = size && !className ? { width: size, height: size } : undefined;

  return (
    <div
      className={`overflow-hidden flex items-center justify-center shrink-0 ${defaultSizeClass} ${className}`}
      style={inlineStyle}
      title="Department of Agriculture - Philippines"
    >
      <img
        src={url || '/assets/da_logo.svg'}
        alt="Department of Agriculture Seal"
        className="h-full w-auto max-w-[80px] object-contain p-0.5"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.className += ' bg-[#15612D] text-[#FDE047] flex items-center justify-center text-[9px] font-bold text-center';
            parent.innerText = 'DA';
          }
        }}
      />
    </div>
  );
};

export const SilagoSeal: React.FC<SealProps> = ({ className = '', size = 40, customUrl }) => {
  const { silagoLogoUrl } = useApp();
  const url = customUrl !== undefined ? customUrl : silagoLogoUrl;

  const defaultSizeClass = !className ? 'h-16 w-auto max-w-[80px]' : '';
  const inlineStyle = size && !className ? { width: size, height: size } : undefined;

  return (
    <div
      className={`overflow-hidden flex items-center justify-center shrink-0 ${defaultSizeClass} ${className}`}
      style={inlineStyle}
      title="Official Seal of the Municipality of Silago, Southern Leyte"
    >
      <img
        src={url || '/assets/silago_seal.png'}
        alt="Municipality of Silago Seal"
        className="h-full w-auto max-w-[80px] object-contain p-0.5"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.className += ' bg-[#0b2b64] text-white flex items-center justify-center text-[9px] font-bold text-center';
            parent.innerText = 'SILAGO';
          }
        }}
      />
    </div>
  );
};

export const BagOngSilagoLogo: React.FC<SealProps> = ({ className = '', size = 40, customUrl }) => {
  const { bagOngSilagoLogoUrl } = useApp();
  const url = customUrl !== undefined ? customUrl : bagOngSilagoLogoUrl;

  const defaultSizeClass = !className ? 'h-16 w-auto max-w-[80px]' : '';
  const inlineStyle = size && !className ? { width: size, height: size } : undefined;

  return (
    <div
      className={`overflow-hidden flex items-center justify-center shrink-0 ${defaultSizeClass} ${className}`}
      style={inlineStyle}
      title="Aktibo. Pursigido. Bag-ong Silago - Love Peace Hope"
    >
      <img
        src={url || '/assets/bag_ong_silago.svg'}
        alt="Bag-ong Silago Logo"
        className="h-full w-auto max-w-[80px] object-contain p-0.5"
        referrerPolicy="no-referrer"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent) {
            parent.className += ' bg-amber-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold text-center';
            parent.innerText = 'BAG-ONG';
          }
        }}
      />
    </div>
  );
};

export interface OfficialSealsTrioProps {
  className?: string;
  sizeClass?: string;
}

export const OfficialSealsTrio: React.FC<OfficialSealsTrioProps> = ({
  className = '',
  sizeClass = 'w-10 h-10',
}) => {
  const { daLogoUrl, silagoLogoUrl, bagOngSilagoLogoUrl } = useApp();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* 1. DA Logo Badge */}
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-200/20 aspect-square shrink-0`}
        title="Department of Agriculture - Philippines"
      >
        <img
          src={daLogoUrl || '/assets/da_logo.svg'}
          alt="Department of Agriculture Seal"
          className="w-full h-full object-contain p-0.5"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.className = `${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-[#15612D] text-[#FDE047] font-bold text-[9px] shadow-sm border border-slate-200/20 aspect-square shrink-0`;
              parent.innerText = 'DA';
            }
          }}
        />
      </div>

      {/* 2. Silago Seal Badge */}
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-200/20 aspect-square shrink-0`}
        title="Municipality of Silago Official Seal"
      >
        <img
          src={silagoLogoUrl || '/assets/silago_seal.png'}
          alt="Municipality of Silago Seal"
          className="w-full h-full object-contain p-0.5"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.className = `${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-[#0b2b64] text-white font-bold text-[9px] shadow-sm border border-slate-200/20 aspect-square shrink-0`;
              parent.innerText = 'SILAGO';
            }
          }}
        />
      </div>

      {/* 3. Bag-ong Silago Logo Badge */}
      <div
        className={`${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-white shadow-sm border border-slate-200/20 aspect-square shrink-0`}
        title="Aktibo. Pursigido. Bag-ong Silago"
      >
        <img
          src={bagOngSilagoLogoUrl || '/assets/bag_ong_silago.svg'}
          alt="Bag-ong Silago Logo"
          className="w-full h-full object-contain p-0.5"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.className = `${sizeClass} rounded-full overflow-hidden flex items-center justify-center bg-amber-500 text-white font-bold text-[9px] shadow-sm border border-slate-200/20 aspect-square shrink-0`;
              parent.innerText = 'BAG-ONG';
            }
          }}
        />
      </div>
    </div>
  );
};

export const SouthernLeyteSeal: React.FC<SealProps> = ({ className = '', size = 48, customUrl }) => {
  const { southernLeyteLogoUrl } = useApp();
  const url = customUrl !== undefined ? customUrl : southernLeyteLogoUrl;

  const defaultSizeClass = !className ? 'h-16 w-auto max-w-[80px]' : '';
  const inlineStyle = size && !className ? { width: size, height: size } : undefined;

  if (url) {
    return (
      <div
        className={`relative overflow-hidden shrink-0 flex items-center justify-center ${defaultSizeClass} ${className}`}
        style={inlineStyle}
        title="Official Seal of the Province of Southern Leyte"
      >
        <img
          src={url}
          alt="Province of Southern Leyte Seal"
          className="h-full w-auto max-w-[80px] object-contain p-0.5"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 shadow-xs border border-amber-500/60 bg-white flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title="Official Seal of the Province of Southern Leyte (Lalawigan ng Timog Leyte)"
    >
      <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer green border ring */}
        <circle cx="60" cy="60" r="58" fill="#14532D" stroke="#CA8A04" strokeWidth="2.5" />
        <circle cx="60" cy="60" r="52" fill="#FEF08A" stroke="#15803D" strokeWidth="1" />
        
        {/* Text ring simulation */}
        <path id="so-leyte-arc" d="M 18,60 A 42,42 0 1,1 102,60" fill="none" />
        <text fill="#14532D" fontSize="7.5" fontWeight="900" letterSpacing="0.8">
          <textPath href="#so-leyte-arc" startOffset="50%" textAnchor="middle">
            SAGISAG NG TIMOG LEYTE
          </textPath>
        </text>
        <path id="so-leyte-arc-bot" d="M 102,60 A 42,42 0 0,1 18,60" fill="none" />
        <text fill="#14532D" fontSize="6.5" fontWeight="800" letterSpacing="0.6">
          <textPath href="#so-leyte-arc-bot" startOffset="50%" textAnchor="middle">
            • OFFICIAL SEAL •
          </textPath>
        </text>

        {/* Inner golden ring */}
        <circle cx="60" cy="60" r="37" fill="#0284C7" stroke="#CA8A04" strokeWidth="2" />

        {/* Heraldic Shield in center */}
        <path
          d="M 60 28 L 78 35 C 78 54 70 70 60 76 C 50 70 42 54 42 35 Z"
          fill="#15803D"
          stroke="#FEF08A"
          strokeWidth="1.5"
        />

        {/* Sun in center */}
        <circle cx="60" cy="45" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.8" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <line
            key={i}
            x1="60"
            y1="45"
            x2={60 + 10 * Math.cos((deg * Math.PI) / 180)}
            y2={45 + 10 * Math.sin((deg * Math.PI) / 180)}
            stroke="#FACC15"
            strokeWidth="1.2"
          />
        ))}

        {/* Mountain & Rice Land in Lower Shield */}
        <path d="M 45 62 Q 60 54 75 62 L 72 68 Q 60 74 48 68 Z" fill="#CA8A04" />
        <path d="M 46 64 Q 60 58 74 64 L 60 74 Z" fill="#0369A1" />

        {/* Stars */}
        <polygon points="60,25 61,27 63,27 61.5,28.5 62,30.5 60,29 58,30.5 58.5,28.5 57,27 59,27" fill="#FACC15" />
      </svg>
    </div>
  );
};

export const BagongPilipinasLogo: React.FC<{ size?: number; className?: string; showText?: boolean; customUrl?: string }> = ({
  size = 56,
  className = '',
  showText = true,
  customUrl
}) => {
  const { bagongPilipinasLogoUrl } = useApp();
  const url = customUrl !== undefined ? customUrl : bagongPilipinasLogoUrl;

  if (url) {
    return (
      <div className={`flex flex-col items-center justify-center shrink-0 ${className}`}>
        <div style={size && !className ? { height: size } : undefined} className="h-16 w-auto max-w-[80px] relative flex items-center justify-center overflow-hidden">
          <img
            src={url}
            alt="Bagong Pilipinas Logo"
            className="h-full w-auto max-w-[80px] object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        {showText && (
          <span className="text-[8px] font-black tracking-tight text-[#0038A8] uppercase font-sans leading-none mt-0.5 whitespace-nowrap">
            BAGONG PILIPINAS
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center shrink-0 ${className}`}>
      <div style={{ width: size, height: size }} className="relative flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Blue Upper Swoosh */}
          <path
            d="M 22 56 C 24 30, 48 14, 76 16 C 98 18, 108 34, 106 50 C 104 38, 92 26, 74 24 C 52 22, 32 36, 22 56 Z"
            fill="#0038A8"
          />
          {/* Red Lower Swoosh */}
          <path
            d="M 98 64 C 96 90, 72 106, 44 104 C 22 102, 12 86, 14 70 C 16 82, 28 94, 46 96 C 68 98, 88 84, 98 64 Z"
            fill="#CE1126"
          />
          {/* Central Sun */}
          <circle cx="60" cy="60" r="16" fill="#FCD116" />
          {/* 8 Sun Rays */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <g key={i} transform={`rotate(${angle} 60 60)`}>
              <polygon points="60,36 62.5,46 57.5,46" fill="#FCD116" />
            </g>
          ))}
          {/* 3 Stars */}
          <polygon points="60,20 61.5,24 65,24 62,26.5 63,30 60,28 57,30 58,26.5 55,24 58.5,24" fill="#FCD116" />
          <polygon points="25,75 26.5,79 30,79 27,81.5 28,85 25,83 22,85 23,81.5 20,79 23.5,79" fill="#FCD116" />
          <polygon points="95,75 96.5,79 100,79 97,81.5 98,85 95,83 92,85 93,81.5 90,79 93.5,79" fill="#FCD116" />
        </svg>
      </div>
      {showText && (
        <span className="text-[8px] font-black tracking-tight text-[#0038A8] uppercase font-sans leading-none mt-0.5 whitespace-nowrap">
          BAGONG PILIPINAS
        </span>
      )}
    </div>
  );
};

export const CombinedSeals: React.FC<{ size?: number; className?: string }> = ({
  size = 38,
  className = ''
}) => {
  return (
    <div className={`flex items-center gap-2.5 shrink-0 min-w-max ${className}`}>
      <DaLogo size={size} />
      <SilagoSeal size={size} />
      <BagOngSilagoLogo size={size} />
    </div>
  );
};

/**
 * Authentic Southern Leyte State University (SLSU) Golden Crest SVG
 */
export const SlsuSealSvg: React.FC<{ size?: number; className?: string }> = ({
  size = 140,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`shrink-0 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Golden Border with Serrated/Sunburst Edge */}
      <circle cx="100" cy="100" r="96" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
      <circle cx="100" cy="100" r="92" fill="#0B2545" stroke="#FBBF24" strokeWidth="2" />

      {/* Decorative inner circular dots ring */}
      <circle
        cx="100"
        cy="100"
        r="88"
        stroke="#FCD34D"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        fill="none"
      />

      {/* Circular text path guide */}
      <defs>
        <path
          id="rice-top-arc"
          d="M 24,100 A 76,76 0 1,1 176,100"
          fill="none"
        />
        <path
          id="rice-bottom-arc"
          d="M 176,100 A 76,76 0 0,1 24,100"
          fill="none"
        />
      </defs>

      {/* Text on Arc - Pure Rice Agricultural Program */}
      <text fill="#FDE68A" fontSize="10.5" fontWeight="900" letterSpacing="1.8">
        <textPath href="#rice-top-arc" startOffset="50%" textAnchor="middle">
          SILAGO RICE PRODUCTION &amp; RESEARCH
        </textPath>
      </text>

      <text fill="#FDE68A" fontSize="8.5" fontWeight="800" letterSpacing="1.4">
        <textPath href="#rice-bottom-arc" startOffset="50%" textAnchor="middle">
          • HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •
        </textPath>
      </text>

      {/* Inner Golden Circle */}
      <circle cx="100" cy="100" r="60" fill="#0E387A" stroke="#FBBF24" strokeWidth="2" />

      {/* Central Quartered Shield - Featuring Palay / Rice Grain & Fields */}
      <g transform="translate(68, 55)">
        {/* Shield outline */}
        <path
          d="M 32 0 L 60 0 C 60 28 60 48 32 64 C 4 48 4 28 4 0 Z"
          fill="#064E3B"
          stroke="#FBBF24"
          strokeWidth="2.5"
        />

        {/* Rice / Palay Banner */}
        <rect x="16" y="2" width="32" height="9" rx="2" fill="#F59E0B" />
        <text x="32" y="9" fill="#0B2545" fontSize="7" fontWeight="900" textAnchor="middle" letterSpacing="0.5">
          RICE
        </text>

        {/* Quadrant dividing cross */}
        <line x1="32" y1="13" x2="32" y2="58" stroke="#FBBF24" strokeWidth="1.5" />
        <line x1="8" y1="32" x2="56" y2="32" stroke="#FBBF24" strokeWidth="1.5" />

        {/* Top-Left: Golden Sheaf of Rice / Palay Panicles */}
        <rect x="7" y="13" width="24" height="18" fill="#15803D" opacity="0.9" />
        {/* Rice stalk and grains */}
        <path
          d="M 19 29 C 19 21 21 16 26 15"
          stroke="#FDE047"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="21" cy="20" r="1.8" fill="#FBBF24" />
        <circle cx="24" cy="17" r="1.8" fill="#FBBF24" />
        <circle cx="27" cy="15" r="1.8" fill="#FBBF24" />
        <circle cx="17" cy="22" r="1.8" fill="#FDE68A" />

        {/* Top-Right: Sun & Golden Grain Head */}
        <rect x="33" y="13" width="24" height="18" fill="#047857" opacity="0.9" />
        <circle cx="45" cy="18" r="4" fill="#FBBF24" />
        <path d="M 40 28 C 43 23 48 24 51 28 Z" fill="#34D399" />

        {/* Bottom-Left: Irrigation Freshwater Canal */}
        <rect x="7" y="33" width="24" height="24" fill="#0284C7" opacity="0.9" />
        <path
          d="M 10 44 C 15 41 20 46 25 43 C 23 46 18 48 10 44 Z"
          fill="#E0F2FE"
        />
        <path
          d="M 10 51 C 15 48 20 53 25 50 C 23 53 18 55 10 51 Z"
          fill="#BAE6FD"
        />

        {/* Bottom-Right: Terraced Rice Paddies */}
        <rect x="33" y="33" width="24" height="24" fill="#065F46" opacity="0.9" />
        <path d="M 35 50 L 44 38 L 53 50 Z" fill="#34D399" />
        <path d="M 37 53 L 44 44 L 51 53 Z" fill="#A7F3D0" />
      </g>
    </svg>
  );
};

export const RiceSealSvg = SlsuSealSvg;

export interface SlsuBadgeOverrideData {
  title?: string;
  subtitle?: string;
  caption?: string;
  motto?: string;
  badgeTag?: string;
  topTags?: string;
  photoUrl?: string;
  layoutMode?: 'banner' | 'full' | 'seal';
}

export const SlsuBadge: React.FC<{
  className?: string;
  onEdit?: () => void;
  overrideData?: SlsuBadgeOverrideData;
  previewOnly?: boolean;
}> = ({ className = '', onEdit, overrideData, previewOnly = false }) => {
  const {
    slsuPhotoUrl: ctxPhotoUrl,
    slsuLayoutMode: ctxLayoutMode,
    slsuCenterTitle,
    slsuCenterSubtitle,
    slsuCaption,
    slsuMotto,
    slsuBadgeTag,
    slsuTopTags
  } = useApp();

  const title = overrideData?.title ?? slsuCenterTitle ?? 'SILAGO RICE PRODUCTION & RESEARCH CENTER';
  const subtitle = overrideData?.subtitle ?? slsuCenterSubtitle ?? 'Silago Model Rice Farm & Certified Inbred Seed Complex';
  const caption = overrideData?.caption ?? slsuCaption ?? 'High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school';
  const motto = overrideData?.motto ?? slsuMotto ?? '• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •';
  const badgeTag = overrideData?.badgeTag ?? slsuBadgeTag ?? 'SILAGO RICE DEMONSTRATION COMPLEX';
  const topTags = overrideData?.topTags ?? slsuTopTags ?? '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •';
  const photoUrl = overrideData?.photoUrl ?? ctxPhotoUrl;
  const currentMode = overrideData?.layoutMode ?? ctxLayoutMode ?? 'full';

  if (currentMode === 'full' && photoUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl shadow-2xl group border border-slate-700/80 bg-[#0b1b30] min-h-[320px] flex flex-col justify-between ${className}`}
      >
        {/* Background Rice Demonstration Photo */}
        <img
          src={photoUrl}
          alt={title}
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover transition duration-500 group-hover:scale-105"
        />
        {/* Gradient Overlay for high readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061727] via-[#061727]/75 to-[#061727]/30" />

        {/* Top Badges */}
        <div className="relative z-10 p-4 flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1 items-start">
            <div className="flex items-center gap-2 bg-[#061727]/90 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40 text-amber-400 text-[10px] font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{badgeTag}</span>
            </div>
            {topTags && (
              <span className="text-[9.5px] font-mono tracking-wider font-semibold text-amber-300/95 drop-shadow-md bg-[#061727]/75 px-2 py-0.5 rounded-md border border-amber-400/20">
                {topTags}
              </span>
            )}
          </div>

          {!previewOnly && onEdit && (
            <button
              onClick={onEdit}
              type="button"
              className="bg-black/70 hover:bg-black/90 text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer border border-amber-400/40 flex items-center gap-1.5 shadow-sm shrink-0"
              title="Edit Rice Center Information & Badges"
            >
              <Pencil className="w-3 h-3 text-amber-400" />
              <span>Edit</span>
            </button>
          )}
        </div>

        {/* Center/Bottom Overlay Content */}
        <div className="relative z-10 p-5 sm:p-6 text-center space-y-2">
          <div className="mx-auto mb-2 flex justify-center drop-shadow-md">
            <SlsuSealSvg size={58} />
          </div>
          <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400 font-serif drop-shadow-sm">
            {title}
          </h4>
          <p className="text-xs sm:text-sm font-bold text-white leading-tight">
            {subtitle}
          </p>
          <p className="text-[10.5px] text-slate-300 font-medium max-w-xs mx-auto leading-relaxed">
            {caption}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2 text-[9px] text-amber-300/90 font-mono">
            <span>{motto}</span>
          </div>
        </div>
      </div>
    );
  }

  if (currentMode === 'banner' && photoUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl shadow-xl border border-zinc-800 bg-[#161b22] ${className}`}
      >
        <div className="h-36 relative overflow-hidden">
          <img
            src={photoUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent" />
          {/* Badge & Top Tags in Banner */}
          <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
            <div className="flex items-center gap-1.5 bg-[#061727]/90 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-400/40 text-amber-400 text-[9px] font-bold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{badgeTag}</span>
            </div>
            {topTags && (
              <span className="text-[8.5px] font-mono tracking-wider text-amber-300 bg-[#061727]/80 px-1.5 py-0.5 rounded border border-amber-400/20">
                {topTags}
              </span>
            )}
          </div>
          {!previewOnly && onEdit && (
            <div className="absolute top-3 right-3 z-10">
              <button
                onClick={onEdit}
                type="button"
                className="bg-black/70 hover:bg-black/90 text-amber-400 hover:text-amber-300 px-2.5 py-1 rounded-lg text-[10.5px] font-bold transition cursor-pointer border border-amber-400/40 flex items-center gap-1.5 shadow-sm"
              >
                <Pencil className="w-3 h-3 text-amber-400" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
        <div className="p-5 text-center -mt-8 relative z-10 space-y-2">
          <div className="mx-auto flex justify-center mb-1">
            <SlsuSealSvg size={68} />
          </div>
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
            {title}
          </h4>
          <p className="text-xs font-bold text-white">
            {subtitle}
          </p>
          <p className="text-[10.5px] text-slate-300 font-medium max-w-xs mx-auto">
            {caption}
          </p>
          <div className="pt-1 text-[9px] text-amber-300 font-mono">
            <span>{motto}</span>
          </div>
        </div>
      </div>
    );
  }

  // Fallback / Heraldic Seal Only Mode
  return (
    <div
      className={`relative bg-[#1a1b1e] p-7 sm:p-8 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center group border border-zinc-800/80 ${className}`}
    >
      {!previewOnly && onEdit && (
        <button
          onClick={onEdit}
          type="button"
          className="absolute top-3 right-3 bg-zinc-800/80 hover:bg-zinc-700 text-amber-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
          title="Edit Rice Demonstration Details"
        >
          <Pencil className="w-3 h-3 text-amber-400" />
          <span>Edit</span>
        </button>
      )}

      {/* Golden Rice Seal */}
      <div className="mb-4">
        <SlsuSealSvg size={140} />
      </div>

      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#eab308] font-sans">
        {title}
      </h4>

      <p className="text-[11px] sm:text-xs text-zinc-300 font-semibold mt-1">
        {subtitle}
      </p>

      <p className="text-[10.5px] text-zinc-400 font-medium max-w-xs mx-auto mt-2">
        {caption}
      </p>

      <div className="pt-2 text-[9px] text-amber-400 font-mono">
        <span>{motto}</span>
      </div>
    </div>
  );
};

export const RiceBadge = SlsuBadge;
