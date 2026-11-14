import React, { useRef, useState } from 'react';
import { LandingPageConfig } from '../types';
import { useApp } from '../context/AppContext';
import { uploadFarmPhoto } from '../utils/supabaseClient';
import { SilagoSeal, BagOngSilagoLogo } from './Seals';
import {
  Image as ImageIcon,
  Upload,
  Palette,
  Sliders,
  Sparkles,
  RotateCcw,
  Trash2,
  Link as LinkIcon,
  Save,
  Shield,
  Sun,
  Moon
} from 'lucide-react';

export const HERO_BG_DEFAULTS = {
  heroBgColor: '#123b2b',
  heroBgImageUrl: '',
  heroBgOpacity: 45,
  heroBgBlur: 0,
  heroBgOverlayOpacity: 50,
  heroCardBgColor: '',
  heroCardBgImageUrl: '',
  heroCardBgOpacity: 75,
  heroCardBgBlur: 0,
  heroCardBgOverlayOpacity: 35,
  heroLogoBackingColor: '#ffffff',
  heroCardTextTheme: 'light' as 'light' | 'dark'
};

const HERO_COLOR_SWATCHES = [
  { label: 'Silago Forest', hex: '#123b2b' },
  { label: 'Deep Pine', hex: '#0d3324' },
  { label: 'Emerald Dark', hex: '#064e3b' },
  { label: 'Civic Navy', hex: '#0c2340' },
  { label: 'Slate Charcoal', hex: '#1e293b' },
  { label: 'Heritage Maroon', hex: '#4c1d24' }
];

const LOGO_BACKING_SWATCHES = [
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Transparent (No Circle Fill)', value: 'transparent' },
  { label: 'Warm Cream', value: '#fefce8' },
  { label: 'Mint Glass', value: '#ecfdf5' },
  { label: 'Forest Dark', value: '#0e3b23' },
  { label: 'Civic Navy', value: '#0c2340' }
];

export type HeroBgPatch = Partial<
  Pick<
    LandingPageConfig,
    | 'heroBgColor'
    | 'heroBgImageUrl'
    | 'heroBgOpacity'
    | 'heroBgBlur'
    | 'heroBgOverlayOpacity'
    | 'heroCardBgColor'
    | 'heroCardBgImageUrl'
    | 'heroCardBgOpacity'
    | 'heroCardBgBlur'
    | 'heroCardBgOverlayOpacity'
    | 'heroLogoBackingColor'
    | 'heroCardTextTheme'
  >
>;

interface HeroBackgroundEditorProps {
  heroBgColor?: string;
  heroBgImageUrl?: string;
  heroBgOpacity?: number;
  heroBgBlur?: number;
  heroBgOverlayOpacity?: number;
  heroCardBgColor?: string;
  heroCardBgImageUrl?: string;
  heroCardBgOpacity?: number;
  heroCardBgBlur?: number;
  heroCardBgOverlayOpacity?: number;
  heroLogoBackingColor?: string;
  heroCardTextTheme?: 'light' | 'dark';
  heroHeadline?: string;
  onChange: (patch: HeroBgPatch) => void;
  onSave?: () => void;
  saveLabel?: string;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

/**
 * Compresses an uploaded image into a lightweight JPEG data URL when cloud
 * storage is unavailable or offline, keeping settings payloads compact.
 */
function compressImageFileToDataUrl(file: File, maxWidth = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const rawUrl = reader.result as string;
      const img = new Image();
      img.onerror = () => resolve(rawUrl);
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  });
}

interface LayerControlsProps {
  sectionTitle: string;
  uploadPrefix: string;
  imageUrl: string;
  color: string;
  allowGlassColor?: boolean;
  opacity: number;
  blur: number;
  overlayOpacity: number;
  onImageChange: (url: string) => void;
  onColorChange: (color: string) => void;
  onOpacityChange: (val: number) => void;
  onBlurChange: (val: number) => void;
  onOverlayChange: (val: number) => void;
  onNotify?: (type: 'success' | 'error', message: string) => void;
}

/**
 * Shared image + color + opacity/blur/contrast controls reused for both
 * the full Hero Banner and the Right-side Municipal Logo Card.
 */
const BackgroundLayerControls: React.FC<LayerControlsProps> = ({
  sectionTitle,
  uploadPrefix,
  imageUrl,
  color,
  allowGlassColor = false,
  opacity,
  blur,
  overlayOpacity,
  onImageChange,
  onColorChange,
  onOpacityChange,
  onBlurChange,
  onOverlayChange,
  onNotify
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onNotify?.('error', 'Please select a valid image file (JPG, PNG, WebP, or SVG).');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      onNotify?.('error', 'Image must be under 15MB.');
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadFarmPhoto(file, uploadPrefix);
      if (publicUrl) {
        onImageChange(publicUrl);
        onNotify?.('success', `${sectionTitle} uploaded. Click Save to publish.`);
        return;
      }
      const compressedUrl = await compressImageFileToDataUrl(file);
      onImageChange(compressedUrl);
      onNotify?.('success', `${sectionTitle} loaded. Click Save to publish.`);
    } catch {
      onNotify?.('error', 'Could not load the selected image. Please try another file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      onNotify?.('error', 'Paste a valid image URL first.');
      return;
    }
    onImageChange(trimmed);
    setUrlInput('');
    onNotify?.('success', `${sectionTitle} image URL applied to preview.`);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* Image Upload & URL (7 cols) */}
        <div className="lg:col-span-7 bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {sectionTitle} Photo (Optional)
            </span>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => onImageChange('')}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl();
                  }
                }}
                placeholder="Or paste background image URL (https://...)"
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyUrl}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer shrink-0"
            >
              Apply URL
            </button>
          </div>
        </div>

        {/* Base Color Picker + Swatches (5 cols) */}
        <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-emerald-700" />
              <span>Base Color</span>
            </span>
            <span className="font-mono text-[11px] font-bold text-slate-600">
              {color || 'Glass (Default)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#123b2b'}
              onChange={(e) => onColorChange(e.target.value)}
              className="h-9 w-12 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
              aria-label={`${sectionTitle} color picker`}
            />
            <input
              type="text"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder={allowGlassColor ? 'Frosted Glass (empty)' : '#123b2b'}
              className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {allowGlassColor && color && (
              <button
                type="button"
                onClick={() => onColorChange('')}
                className="px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer shrink-0"
              >
                Glass
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {HERO_COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                title={swatch.label}
                onClick={() => onColorChange(swatch.hex)}
                className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                  color.toLowerCase() === swatch.hex.toLowerCase()
                    ? 'border-emerald-500 ring-2 ring-emerald-300 scale-110'
                    : 'border-white shadow-xs hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
            {allowGlassColor && (
              <button
                type="button"
                title="Pure White"
                onClick={() => onColorChange('#ffffff')}
                className={`w-6 h-6 rounded-full border-2 transition cursor-pointer bg-white ${
                  color.toLowerCase() === '#ffffff'
                    ? 'border-emerald-500 ring-2 ring-emerald-300 scale-110'
                    : 'border-slate-300 shadow-xs hover:scale-105'
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Opacity, Blur & Overlay Scrim Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-emerald-600" />
              <span>Photo Opacity</span>
            </span>
            <span className="font-mono text-emerald-800">{opacity}%</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Photo Blur</span>
            </span>
            <span className="font-mono text-blue-800">{blur}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={blur}
            onChange={(e) => onBlurChange(Number(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-700">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-slate-600" />
              <span>Contrast Tint</span>
            </span>
            <span className="font-mono text-slate-800">{overlayOpacity}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="90"
            value={overlayOpacity}
            onChange={(e) => onOverlayChange(Number(e.target.value))}
            className="w-full accent-slate-700 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Reusable editor for customizing both the Landing Page Hero Banner background
 * and the Right-side Municipal Registry Logo Card (card background + circle behind logo).
 */
export const HeroBackgroundEditor: React.FC<HeroBackgroundEditorProps> = ({
  heroBgColor = HERO_BG_DEFAULTS.heroBgColor,
  heroBgImageUrl = HERO_BG_DEFAULTS.heroBgImageUrl,
  heroBgOpacity = HERO_BG_DEFAULTS.heroBgOpacity,
  heroBgBlur = HERO_BG_DEFAULTS.heroBgBlur,
  heroBgOverlayOpacity = HERO_BG_DEFAULTS.heroBgOverlayOpacity,
  heroCardBgColor = HERO_BG_DEFAULTS.heroCardBgColor,
  heroCardBgImageUrl = HERO_BG_DEFAULTS.heroCardBgImageUrl,
  heroCardBgOpacity = HERO_BG_DEFAULTS.heroCardBgOpacity,
  heroCardBgBlur = HERO_BG_DEFAULTS.heroCardBgBlur,
  heroCardBgOverlayOpacity = HERO_BG_DEFAULTS.heroCardBgOverlayOpacity,
  heroLogoBackingColor = HERO_BG_DEFAULTS.heroLogoBackingColor,
  heroCardTextTheme = HERO_BG_DEFAULTS.heroCardTextTheme,
  heroHeadline = 'A clearer view of every rice farm in Silago.',
  onChange,
  onSave,
  saveLabel = 'Save Hero Background',
  onNotify
}) => {
  const { municipalBranding } = useApp();
  const [activeLayerTab, setActiveLayerTab] = useState<'banner' | 'logo_card'>('banner');

  const activeColor = heroBgColor || HERO_BG_DEFAULTS.heroBgColor;
  const activeImage = heroBgImageUrl?.trim() || '';
  const activeOpacity = typeof heroBgOpacity === 'number' ? heroBgOpacity : HERO_BG_DEFAULTS.heroBgOpacity;
  const activeBlur = typeof heroBgBlur === 'number' ? heroBgBlur : HERO_BG_DEFAULTS.heroBgBlur;
  const activeOverlay =
    typeof heroBgOverlayOpacity === 'number'
      ? heroBgOverlayOpacity
      : HERO_BG_DEFAULTS.heroBgOverlayOpacity;

  const activeCardColor = heroCardBgColor?.trim() || '';
  const activeCardImage = heroCardBgImageUrl?.trim() || '';
  const activeCardOpacity =
    typeof heroCardBgOpacity === 'number' ? heroCardBgOpacity : HERO_BG_DEFAULTS.heroCardBgOpacity;
  const activeCardBlur =
    typeof heroCardBgBlur === 'number' ? heroCardBgBlur : HERO_BG_DEFAULTS.heroCardBgBlur;
  const activeCardOverlay =
    typeof heroCardBgOverlayOpacity === 'number'
      ? heroCardBgOverlayOpacity
      : HERO_BG_DEFAULTS.heroCardBgOverlayOpacity;
  const activeLogoBacking = heroLogoBackingColor || HERO_BG_DEFAULTS.heroLogoBackingColor;
  const isDarkCardText = heroCardTextTheme === 'dark';

  const handleResetAll = () => {
    onChange({ ...HERO_BG_DEFAULTS });
    onNotify?.('success', 'Hero banner & logo card background reset to defaults.');
  };

  return (
    <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-slate-900 block">
              Hero Showcase &amp; Logo Box Background (Landing Page)
            </span>
            <span className="text-[11px] text-slate-500 block">
              Customize both the main hero banner background and the right-side logo card &amp; seal backing.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetAll}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset BG</span>
          </button>
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Save className="w-3 h-3" />
              <span>{saveLabel}</span>
            </button>
          )}
        </div>
      </div>

      {/* Combined Live Preview: Full Hero Banner + Right Municipal Logo Card */}
      <div
        className="relative isolate overflow-hidden rounded-2xl border border-emerald-950/20 px-5 py-6 text-white shadow-sm transition-colors duration-300"
        style={{ backgroundColor: activeColor }}
      >
        {activeImage && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat transition-all duration-300"
            style={{
              backgroundImage: `url(${activeImage})`,
              opacity: Math.max(0, Math.min(1, activeOpacity / 100)),
              filter: activeBlur > 0 ? `blur(${activeBlur}px)` : undefined
            }}
          />
        )}
        {activeImage && activeOverlay > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(115deg, rgba(6, 24, 17, ${Math.min(0.95, activeOverlay / 100)}) 0%, rgba(10, 35, 24, ${Math.min(0.85, (activeOverlay * 0.72) / 100)}) 55%, rgba(6, 24, 17, ${Math.min(0.9, (activeOverlay * 0.85) / 100)}) 100%)`
            }}
          />
        )}
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-emerald-100/15" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 items-center gap-4">
          <div className="md:col-span-7 min-w-0 space-y-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-100">
              <Shield className="w-2.5 h-2.5 text-lime-300" />
              <span>Live Hero Preview</span>
            </span>
            <p className="font-serif text-base sm:text-lg font-bold leading-snug text-white line-clamp-2">
              {heroHeadline || 'A clearer view of every rice farm in Silago.'}
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="rounded-lg bg-lime-300 px-2.5 py-1 text-[10px] font-bold text-[#123b2b]">
                Primary Button
              </span>
              <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white">
                Secondary Button
              </span>
            </div>
          </div>

          {/* Right Logo Card Live Preview */}
          <div className="md:col-span-5 flex justify-center md:justify-end">
            <div
              className={`relative flex w-full max-w-[230px] flex-col items-center justify-center overflow-hidden rounded-2xl border px-4 py-4 text-center shadow-lg transition-colors duration-300 ${
                activeCardColor
                  ? isDarkCardText
                    ? 'border-slate-900/15'
                    : 'border-white/20'
                  : 'border-white/20 bg-white/[0.08] backdrop-blur-xs'
              }`}
              style={activeCardColor ? { backgroundColor: activeCardColor } : undefined}
            >
              {activeCardImage && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat transition-all duration-300"
                  style={{
                    backgroundImage: `url(${activeCardImage})`,
                    opacity: Math.max(0, Math.min(1, activeCardOpacity / 100)),
                    filter: activeCardBlur > 0 ? `blur(${activeCardBlur}px)` : undefined
                  }}
                />
              )}
              {activeCardImage && activeCardOverlay > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: isDarkCardText
                      ? `linear-gradient(155deg, rgba(255, 255, 255, ${Math.min(0.92, activeCardOverlay / 100)}) 0%, rgba(248, 250, 252, ${Math.min(0.85, (activeCardOverlay * 0.8) / 100)}) 100%)`
                      : `linear-gradient(155deg, rgba(6, 24, 17, ${Math.min(0.95, activeCardOverlay / 100)}) 0%, rgba(10, 35, 24, ${Math.min(0.85, (activeCardOverlay * 0.75) / 100)}) 100%)`
                  }}
                />
              )}
              <div
                className={`relative z-10 flex h-16 w-16 items-center justify-center rounded-full p-1.5 transition-colors duration-300 ${
                  activeLogoBacking === 'transparent' ? 'bg-transparent' : 'shadow-md ring-4 ring-white/15'
                }`}
                style={activeLogoBacking !== 'transparent' ? { backgroundColor: activeLogoBacking } : undefined}
              >
                <SilagoSeal size={48} customUrl={municipalBranding?.silagoSealUrl || undefined} />
              </div>
              <div className="relative z-10 mt-2.5 flex items-center justify-center gap-2">
                <BagOngSilagoLogo size={24} customUrl={municipalBranding?.bagOngSilagoLogoUrl || undefined} />
                <div className="text-left min-w-0">
                  <span
                    className={`block text-[8px] font-bold uppercase tracking-wider truncate ${
                      isDarkCardText ? 'text-emerald-800' : 'text-lime-200'
                    }`}
                  >
                    {municipalBranding?.municipalityName || 'Municipality of Silago'}
                  </span>
                  <span
                    className={`block font-serif text-[11px] font-bold leading-tight truncate ${
                      isDarkCardText ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {municipalBranding?.registryTitle || 'Rice Farm Registry'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector: Hero Banner vs Logo Card Box */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => setActiveLayerTab('banner')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeLayerTab === 'banner'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          1. Full Hero Banner Background
        </button>
        <button
          type="button"
          onClick={() => setActiveLayerTab('logo_card')}
          className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
            activeLayerTab === 'logo_card'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          2. Logo Card &amp; Behind-Logo Background
        </button>
      </div>

      {activeLayerTab === 'banner' ? (
        <BackgroundLayerControls
          sectionTitle="Hero Banner"
          uploadPrefix="landing_hero_bg"
          imageUrl={activeImage}
          color={activeColor}
          opacity={activeOpacity}
          blur={activeBlur}
          overlayOpacity={activeOverlay}
          onImageChange={(url) => onChange({ heroBgImageUrl: url })}
          onColorChange={(c) => onChange({ heroBgColor: c })}
          onOpacityChange={(val) => onChange({ heroBgOpacity: val })}
          onBlurChange={(val) => onChange({ heroBgBlur: val })}
          onOverlayChange={(val) => onChange({ heroBgOverlayOpacity: val })}
          onNotify={onNotify}
        />
      ) : (
        <div className="space-y-3">
          {/* Circle Behind the Seal Logo & Text Contrast Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            <div className="lg:col-span-7 bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Circle Behind Seal Logo (Likod ng Logo)
                </span>
                <span className="font-mono text-[11px] font-bold text-slate-600">
                  {activeLogoBacking === 'transparent' ? 'Transparent' : activeLogoBacking}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(activeLogoBacking) ? activeLogoBacking : '#ffffff'}
                  onChange={(e) => onChange({ heroLogoBackingColor: e.target.value })}
                  className="h-8 w-11 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white shrink-0"
                  aria-label="Logo circle backing color"
                />
                {LOGO_BACKING_SWATCHES.map((swatch) => (
                  <button
                    key={swatch.value}
                    type="button"
                    onClick={() => onChange({ heroLogoBackingColor: swatch.value })}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition cursor-pointer ${
                      activeLogoBacking.toLowerCase() === swatch.value.toLowerCase()
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {swatch.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Logo Card Text Color
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ heroCardTextTheme: 'light' })}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    !isDarkCardText
                      ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Light Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ heroCardTextTheme: 'dark' })}
                  className={`px-3 py-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    isDarkCardText
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Dark Text</span>
                </button>
              </div>
            </div>
          </div>

          <BackgroundLayerControls
            sectionTitle="Logo Card Box"
            uploadPrefix="landing_logo_card_bg"
            imageUrl={activeCardImage}
            color={activeCardColor}
            allowGlassColor
            opacity={activeCardOpacity}
            blur={activeCardBlur}
            overlayOpacity={activeCardOverlay}
            onImageChange={(url) => onChange({ heroCardBgImageUrl: url })}
            onColorChange={(c) => onChange({ heroCardBgColor: c })}
            onOpacityChange={(val) => onChange({ heroCardBgOpacity: val })}
            onBlurChange={(val) => onChange({ heroCardBgBlur: val })}
            onOverlayChange={(val) => onChange({ heroCardBgOverlayOpacity: val })}
            onNotify={onNotify}
          />
        </div>
      )}
    </div>
  );
};
