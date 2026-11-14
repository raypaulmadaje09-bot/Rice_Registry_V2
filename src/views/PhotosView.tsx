import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_BACKGROUNDS, SLSU_EXTENSION_PRESETS, DEFAULT_BG_PHOTO, DEFAULT_SLSU_PHOTO, SLSU_DEFAULTS } from '../data/photos';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, SlsuBadge, SlsuSealSvg } from '../components/Seals';
import { HeroBackgroundEditor, HERO_BG_DEFAULTS, HeroBgPatch } from '../components/HeroBackgroundEditor';
import {
  Image as ImageIcon,
  Camera,
  Shield,
  Upload,
  Link as LinkIcon,
  Check,
  RotateCcw,
  Eye,
  Trash2,
  Sparkles,
  Sliders,
  CheckCircle2,
  Pencil,
  Save,
  AlertTriangle,
  Undo2,
  Building,
  FileSpreadsheet,
  Monitor,
  Maximize2
} from 'lucide-react';

export const PhotosView: React.FC<{ initialTab?: 'all' | 'background' | 'slsu' | 'seals' }> = ({ initialTab = 'all' }) => {
  const {
    bgPhotoUrl,
    bgOpacity,
    bgBlur,
    bgActive,
    setBgPhotoUrl,
    setBgOpacity,
    setBgBlur,
    setBgActive,
    removeBgPhoto,
    backgroundHistory,
    removeFromBackgroundHistory,
    daLogoUrl,
    setDaLogoUrl,
    silagoLogoUrl,
    setSilagoLogoUrl,
    bagOngSilagoLogoUrl,
    setBagOngSilagoLogoUrl,
    portalBannerUrl,
    setPortalBannerUrl,
    slsuPhotoUrl,
    setSlsuPhotoUrl,
    slsuLayoutMode,
    setSlsuLayoutMode,
    slsuUniversityName,
    slsuCenterTitle,
    setSlsuCenterTitle,
    slsuCenterSubtitle,
    setSlsuCenterSubtitle,
    slsuCaption,
    setSlsuCaption,
    slsuMotto,
    setSlsuMotto,
    slsuBadgeTag,
    setSlsuBadgeTag,
    landingPageConfig,
    updateLandingPageConfig,
  } = useApp();

  // Tab Filter
  const [activeMediaTab, setActiveMediaTab] = useState<'all' | 'background' | 'slsu' | 'seals'>(initialTab);
  useEffect(() => setActiveMediaTab(initialTab), [initialTab]);

  const normalizeOpacityPct = (val: number) => Math.round(val > 1 ? val : val * 100);

  // STAGED DRAFT STATE FOR "SAVE BEFORE SHOW" WORKFLOW
  const [draftBgUrl, setDraftBgUrl] = useState(bgPhotoUrl);
  const [draftBgOpacity, setDraftBgOpacity] = useState(() => normalizeOpacityPct(bgOpacity));
  const [draftBgBlur, setDraftBgBlur] = useState(bgBlur);
  const [draftBgActive, setDraftBgActive] = useState(bgActive);

  const [draftDaLogoUrl, setDraftDaLogoUrl] = useState(daLogoUrl);
  const [draftSilagoLogoUrl, setDraftSilagoLogoUrl] = useState(silagoLogoUrl);
  const [draftBagOngLogoUrl, setDraftBagOngLogoUrl] = useState(bagOngSilagoLogoUrl);

  const [draftSlsuUrl, setDraftSlsuUrl] = useState(slsuPhotoUrl);
  const [draftSlsuTitle, setDraftSlsuTitle] = useState(slsuCenterTitle);
  const [draftSlsuSubtitle, setDraftSlsuSubtitle] = useState(slsuCenterSubtitle);
  const [draftSlsuCaption, setDraftSlsuCaption] = useState(slsuCaption);
  const [draftSlsuMotto, setDraftSlsuMotto] = useState(slsuMotto);

  const extractHeroBgState = (cfg?: typeof landingPageConfig) => ({
    heroBgColor: cfg?.heroBgColor || HERO_BG_DEFAULTS.heroBgColor,
    heroBgImageUrl: cfg?.heroBgImageUrl || HERO_BG_DEFAULTS.heroBgImageUrl,
    heroBgOpacity: cfg?.heroBgOpacity ?? HERO_BG_DEFAULTS.heroBgOpacity,
    heroBgBlur: cfg?.heroBgBlur ?? HERO_BG_DEFAULTS.heroBgBlur,
    heroBgOverlayOpacity: cfg?.heroBgOverlayOpacity ?? HERO_BG_DEFAULTS.heroBgOverlayOpacity,
    heroCardBgColor: cfg?.heroCardBgColor || HERO_BG_DEFAULTS.heroCardBgColor,
    heroCardBgImageUrl: cfg?.heroCardBgImageUrl || HERO_BG_DEFAULTS.heroCardBgImageUrl,
    heroCardBgOpacity: cfg?.heroCardBgOpacity ?? HERO_BG_DEFAULTS.heroCardBgOpacity,
    heroCardBgBlur: cfg?.heroCardBgBlur ?? HERO_BG_DEFAULTS.heroCardBgBlur,
    heroCardBgOverlayOpacity: cfg?.heroCardBgOverlayOpacity ?? HERO_BG_DEFAULTS.heroCardBgOverlayOpacity,
    heroLogoBackingColor: cfg?.heroLogoBackingColor || HERO_BG_DEFAULTS.heroLogoBackingColor,
    heroCardTextTheme: cfg?.heroCardTextTheme || HERO_BG_DEFAULTS.heroCardTextTheme,
  });

  const [draftHeroBg, setDraftHeroBg] = useState(() => extractHeroBgState(landingPageConfig));

  // Sync draft state when external props change if not currently dirty
  useEffect(() => {
    setDraftBgUrl(bgPhotoUrl);
    setDraftBgOpacity(normalizeOpacityPct(bgOpacity));
    setDraftBgBlur(bgBlur);
    setDraftBgActive(bgActive);
    setDraftDaLogoUrl(daLogoUrl);
    setDraftSilagoLogoUrl(silagoLogoUrl);
    setDraftBagOngLogoUrl(bagOngSilagoLogoUrl);
    setDraftSlsuUrl(slsuPhotoUrl);
    setDraftSlsuTitle(slsuCenterTitle);
    setDraftSlsuSubtitle(slsuCenterSubtitle);
    setDraftSlsuCaption(slsuCaption);
    setDraftSlsuMotto(slsuMotto);
    setDraftHeroBg(extractHeroBgState(landingPageConfig));
  }, [
    bgPhotoUrl,
    bgOpacity,
    bgBlur,
    bgActive,
    daLogoUrl,
    silagoLogoUrl,
    bagOngSilagoLogoUrl,
    slsuPhotoUrl,
    slsuCenterTitle,
    slsuCenterSubtitle,
    slsuCaption,
    slsuMotto,
    landingPageConfig
  ]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const savedHero = extractHeroBgState(landingPageConfig);
    const isHeroDirty = (Object.keys(savedHero) as Array<keyof typeof savedHero>).some(
      (k) => draftHeroBg[k] !== savedHero[k]
    );

    return (
      draftBgUrl !== bgPhotoUrl ||
      draftBgOpacity !== normalizeOpacityPct(bgOpacity) ||
      draftBgBlur !== bgBlur ||
      draftBgActive !== bgActive ||
      draftDaLogoUrl !== daLogoUrl ||
      draftSilagoLogoUrl !== silagoLogoUrl ||
      draftBagOngLogoUrl !== bagOngSilagoLogoUrl ||
      draftSlsuUrl !== slsuPhotoUrl ||
      draftSlsuTitle !== slsuCenterTitle ||
      draftSlsuSubtitle !== slsuCenterSubtitle ||
      draftSlsuCaption !== slsuCaption ||
      draftSlsuMotto !== slsuMotto ||
      isHeroDirty
    );
  }, [
    draftBgUrl,
    draftBgOpacity,
    draftBgBlur,
    draftBgActive,
    draftDaLogoUrl,
    draftSilagoLogoUrl,
    draftBagOngLogoUrl,
    draftSlsuUrl,
    draftSlsuTitle,
    draftSlsuSubtitle,
    draftSlsuCaption,
    draftSlsuMotto,
    bgPhotoUrl,
    bgOpacity,
    bgBlur,
    bgActive,
    daLogoUrl,
    silagoLogoUrl,
    bagOngSilagoLogoUrl,
    slsuPhotoUrl,
    slsuCenterTitle,
    slsuCenterSubtitle,
    slsuCaption,
    slsuMotto,
    draftHeroBg,
    landingPageConfig
  ]);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Direct URL inputs
  const [directBgUrl, setDirectBgUrl] = useState('');
  const [directSlsuUrl, setDirectSlsuUrl] = useState('');
  const [directSilagoSealUrl, setDirectSilagoSealUrl] = useState('');
  const [directBagOngUrl, setDirectBagOngUrl] = useState('');
  const [directDaUrl, setDirectDaUrl] = useState('');

  // Hidden file input refs
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const slsuFileInputRef = useRef<HTMLInputElement | null>(null);
  const silagoSealFileRef = useRef<HTMLInputElement | null>(null);
  const bagOngFileRef = useRef<HTMLInputElement | null>(null);
  const daSealFileRef = useRef<HTMLInputElement | null>(null);

  // Merge built-in 16:9 presets with saved user uploads (ignoring empty entries)
  const portalWallpaperOptions = useMemo(() => {
    const presetUrls = new Set(PRESET_BACKGROUNDS.map((p) => p.url));
    const customUploads = (backgroundHistory || []).filter(
      (item) => Boolean(item.url?.trim()) && !presetUrls.has(item.url)
    );
    return [...PRESET_BACKGROUNDS, ...customUploads];
  }, [backgroundHistory]);

  /** Applies portal wallpaper state cleanly without pushing empty URLs to history. */
  const applyPortalWallpaper = (
    nextUrl: string,
    nextOpacityPct: number,
    nextBlur: number,
    nextActive: boolean,
    label = 'Custom Agricultural Scenic Background',
    source: 'preset' | 'upload' = 'upload'
  ) => {
    const trimmed = nextUrl.trim();
    const shouldActivate = Boolean(trimmed) && nextActive;
    if (trimmed && trimmed !== bgPhotoUrl) {
      setBgPhotoUrl(trimmed, label, source);
    }
    setBgOpacity(nextOpacityPct / 100);
    setBgBlur(nextBlur);
    setBgActive(shouldActivate);
  };

  const resolveVisibleOpacity = (currentPct: number) =>
    currentPct < 20 && !bgActive ? 45 : currentPct;

  const handleSelectWallpaperPreset = (preset: { url: string; name: string; source: 'preset' | 'upload' }) => {
    const nextOpacity = resolveVisibleOpacity(draftBgOpacity);
    setDraftBgUrl(preset.url);
    setDraftBgOpacity(nextOpacity);
    setDraftBgActive(true);
    applyPortalWallpaper(preset.url, nextOpacity, draftBgBlur, true, preset.name, preset.source);
    showToast(`Portal wallpaper active: ${preset.name}`);
  };

  const handleApplyDirectWallpaperUrl = () => {
    const trimmed = directBgUrl.trim();
    if (!trimmed) {
      showToast('Please paste an image URL first.');
      return;
    }
    const nextOpacity = resolveVisibleOpacity(draftBgOpacity);
    setDraftBgUrl(trimmed);
    setDraftBgOpacity(nextOpacity);
    setDraftBgActive(true);
    setDirectBgUrl('');
    applyPortalWallpaper(trimmed, nextOpacity, draftBgBlur, true, 'Custom Portal Wallpaper URL', 'upload');
    showToast('Portal wallpaper URL applied!');
  };

  const handleToggleWallpaperActive = () => {
    if (draftBgActive && draftBgUrl.trim()) {
      setDraftBgActive(false);
      removeBgPhoto();
      showToast('Portal wallpaper disabled.');
      return;
    }
    const targetUrl = draftBgUrl.trim() || PRESET_BACKGROUNDS[0]?.url || '';
    const targetName =
      portalWallpaperOptions.find((p) => p.url === targetUrl)?.name || 'Silago Rice Terraces Dawn';
    const nextOpacity = resolveVisibleOpacity(draftBgOpacity);
    setDraftBgUrl(targetUrl);
    setDraftBgOpacity(nextOpacity);
    setDraftBgActive(Boolean(targetUrl));
    applyPortalWallpaper(targetUrl, nextOpacity, draftBgBlur, Boolean(targetUrl), targetName, 'preset');
    showToast(targetUrl ? `Portal wallpaper enabled: ${targetName}` : 'Select or upload a photo first.');
  };

  // Apply All Draft Changes to Global System
  const handleSaveAndApply = () => {
    applyPortalWallpaper(draftBgUrl, draftBgOpacity, draftBgBlur, draftBgActive);

    setDaLogoUrl(draftDaLogoUrl);
    setSilagoLogoUrl(draftSilagoLogoUrl);
    setBagOngSilagoLogoUrl(draftBagOngLogoUrl);

    setSlsuPhotoUrl(draftSlsuUrl);
    setSlsuCenterTitle(draftSlsuTitle);
    setSlsuCenterSubtitle(draftSlsuSubtitle);
    setSlsuCaption(draftSlsuCaption);
    setSlsuMotto(draftSlsuMotto);
    updateLandingPageConfig(draftHeroBg);

    showToast('All media settings saved & applied to the live system!');
  };

  // Discard Draft Changes
  const handleDiscardChanges = () => {
    setDraftBgUrl(bgPhotoUrl);
    setDraftBgOpacity(normalizeOpacityPct(bgOpacity));
    setDraftBgBlur(bgBlur);
    setDraftBgActive(bgActive);
    setDraftDaLogoUrl(daLogoUrl);
    setDraftSilagoLogoUrl(silagoLogoUrl);
    setDraftBagOngLogoUrl(bagOngSilagoLogoUrl);
    setDraftSlsuUrl(slsuPhotoUrl);
    setDraftSlsuTitle(slsuCenterTitle);
    setDraftSlsuSubtitle(slsuCenterSubtitle);
    setDraftSlsuCaption(slsuCaption);
    setDraftSlsuMotto(slsuMotto);
    setDraftHeroBg(extractHeroBgState(landingPageConfig));
    showToast('Discarded pending media draft changes.');
  };

  // Generic file reader
  const handleGenericFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) callback(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Floating Staged Changes Bar / Card (Appears only when media changes are pending) */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-6 py-3 bg-slate-900/90 text-white backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          {/* Left: Mini-Thumbnail & Text */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-8 rounded-lg overflow-hidden border border-white/20 bg-slate-950 shrink-0 relative flex items-center justify-center">
              {draftBgUrl ? (
                <img
                  src={draftBgUrl}
                  alt="Draft Preview"
                  className="w-full h-full object-cover"
                  style={{
                    opacity: draftBgOpacity / 100,
                    filter: `blur(${Math.min(draftBgBlur, 2)}px)`
                  }}
                />
              ) : (
                <Sparkles className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-white block whitespace-nowrap">
                Unsaved media changes pending
              </span>
              <span className="text-[10px] text-slate-400 block font-medium">
                Draft staged &bull; Click save to apply to live portal
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-3">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-98"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Apply Live</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO CARD & TAB NAVIGATION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5 relative">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                MEDIA &amp; GRAPHIC ASSETS
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
                Photo &amp; Media Studio Settings
              </h2>
              <p className="text-xs text-slate-500">
                Manage agricultural wallpapers, official seals, and SLSU branding. Previews update as you edit; Save &amp; Apply publishes changes to the portal.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setDraftBgUrl(DEFAULT_BG_PHOTO);
                setDraftBgOpacity(9);
                setDraftBgBlur(1);
                setDraftBgActive(false);
                setDraftDaLogoUrl('');
                setDraftSilagoLogoUrl('');
                setDraftBagOngLogoUrl('');
                setDraftSlsuUrl(DEFAULT_SLSU_PHOTO);
                setDraftSlsuTitle(SLSU_DEFAULTS.centerTitle);
                setDraftSlsuSubtitle(SLSU_DEFAULTS.centerSubtitle);
                setDraftSlsuCaption(SLSU_DEFAULTS.caption);
                setDraftSlsuMotto(SLSU_DEFAULTS.motto);
                setDraftHeroBg({ ...HERO_BG_DEFAULTS });
                showToast('Default media values staged. Save & Apply to publish them.');
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Draft</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndApply}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Apply</span>
            </button>
          </div>
        </div>

      </div>

      {/* 2B. LANDING PAGE HERO BANNER BACKGROUND */}
      {(activeMediaTab === 'all' || activeMediaTab === 'background') && (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                LANDING PAGE HERO
              </span>
              <h3 className="font-serif font-black text-lg text-slate-900 mt-1">
                Landing Page Hero Showcase Background
              </h3>
              <p className="text-xs text-slate-500">
                Customize the top dark-green hero banner background shown on the public landing page.
              </p>
            </div>
          </div>

          <HeroBackgroundEditor
            heroBgColor={draftHeroBg.heroBgColor}
            heroBgImageUrl={draftHeroBg.heroBgImageUrl}
            heroBgOpacity={draftHeroBg.heroBgOpacity}
            heroBgBlur={draftHeroBg.heroBgBlur}
            heroBgOverlayOpacity={draftHeroBg.heroBgOverlayOpacity}
            heroCardBgColor={draftHeroBg.heroCardBgColor}
            heroCardBgImageUrl={draftHeroBg.heroCardBgImageUrl}
            heroCardBgOpacity={draftHeroBg.heroCardBgOpacity}
            heroCardBgBlur={draftHeroBg.heroCardBgBlur}
            heroCardBgOverlayOpacity={draftHeroBg.heroCardBgOverlayOpacity}
            heroLogoBackingColor={draftHeroBg.heroLogoBackingColor}
            heroCardTextTheme={draftHeroBg.heroCardTextTheme}
            heroHeadline={landingPageConfig?.heroHeadline}
            onChange={(patch: HeroBgPatch) =>
              setDraftHeroBg((prev) => ({ ...prev, ...patch }))
            }
            onSave={() => {
              updateLandingPageConfig(draftHeroBg);
              showToast('Landing page hero background saved & applied!');
            }}
            saveLabel="Apply Hero Background"
            onNotify={(_type, message) => showToast(message)}
          />
        </div>
      )}

      {/* 3. STRUCTURED 16:9 MEDIA PRESET GRID & PORTAL WALLPAPER CONTROLS */}
      {(activeMediaTab === 'all' || activeMediaTab === 'background') && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-700" />
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  PORTAL WALLPAPERS
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    bgActive && bgPhotoUrl
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {bgActive && bgPhotoUrl ? 'Active on Portal' : 'Disabled'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-lg text-slate-900 mt-1">
                Scenic Agricultural Backgrounds (16:9 Aspect Ratio)
              </h3>
              <p className="text-xs text-slate-500">
                Customize the workspace wallpaper shown behind the internal MAO portal views (Dashboard, Registry, Maps, and Settings).
              </p>
            </div>

            {/* Toggle Active, Disable & Upload Controls */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <input
                type="file"
                ref={bgFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleGenericFileUpload(e, (dataUrl) => {
                    const nextOpacity = resolveVisibleOpacity(draftBgOpacity);
                    setDraftBgUrl(dataUrl);
                    setDraftBgOpacity(nextOpacity);
                    setDraftBgActive(true);
                    applyPortalWallpaper(dataUrl, nextOpacity, draftBgBlur, true, 'Uploaded 16:9 Wallpaper', 'upload');
                    showToast('16:9 wallpaper uploaded & applied to portal!');
                  })
                }
              />
              <button
                type="button"
                onClick={handleToggleWallpaperActive}
                className={`px-3 py-1.5 font-bold text-xs rounded-lg border transition flex items-center gap-1.5 cursor-pointer ${
                  draftBgActive && draftBgUrl
                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{draftBgActive && draftBgUrl ? 'Turn Off Wallpaper' : 'Enable Wallpaper'}</span>
              </button>
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload 16:9 Image</span>
              </button>
            </div>
          </div>

          {/* Direct URL Input + Apply/Clear Controls */}
          <div className="flex flex-col md:flex-row gap-2.5 items-stretch md:items-center">
            <div className="relative flex-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={directBgUrl}
                onChange={(e) => setDirectBgUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyDirectWallpaperUrl();
                  }
                }}
                placeholder="Or paste 16:9 background image URL (https://...)"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleApplyDirectWallpaperUrl}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Apply URL
              </button>
              <button
                type="button"
                onClick={() => {
                  applyPortalWallpaper(draftBgUrl, draftBgOpacity, draftBgBlur, draftBgActive);
                  showToast(draftBgActive && draftBgUrl ? 'Portal wallpaper settings applied!' : 'Portal wallpaper updated.');
                }}
                disabled={!draftBgUrl.trim()}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply Changes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraftBgActive(false);
                  removeBgPhoto();
                  showToast('Portal wallpaper turned off.');
                }}
                disabled={!bgActive && !draftBgActive}
                className="px-3 py-2 bg-white hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed text-rose-700 font-bold text-xs rounded-lg border border-slate-200 hover:border-rose-200 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Adjusters: Opacity & Blur Sliders */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Background Wallpaper Opacity</span>
                </span>
                <span className="font-mono text-emerald-800">{draftBgOpacity}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={draftBgOpacity}
                onChange={(e) => setDraftBgOpacity(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Background Blur Level</span>
                </span>
                <span className="font-mono text-blue-800">{draftBgBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={draftBgBlur}
                onChange={(e) => setDraftBgBlur(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Compact Live Portal Wallpaper Preview */}
          <div className="relative h-24 rounded-xl border border-slate-200 overflow-hidden bg-[#f1f4f2] flex items-center justify-between px-4">
            {draftBgUrl && draftBgActive && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `url("${draftBgUrl}")`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  opacity: draftBgOpacity / 100,
                  filter: `blur(${draftBgBlur}px)`
                }}
              />
            )}
            <div className="relative z-10 bg-white/95 border border-slate-200 rounded-lg px-3 py-2 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Portal Workspace Preview
              </span>
              <span className="text-xs font-semibold text-slate-700">
                {draftBgUrl && draftBgActive
                  ? `Showing wallpaper at ${draftBgOpacity}% opacity, ${draftBgBlur}px blur`
                  : 'Default clean office canvas (#f1f4f2) — click a 16:9 preset below to preview'}
              </span>
            </div>
            <div className="relative z-10 hidden sm:flex items-center gap-2">
              <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-xs">
                Office Card Sample
              </div>
            </div>
          </div>

          {/* Structured 16:9 Thumbnails Grid (Presets + Custom Uploads) */}
          {portalWallpaperOptions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {portalWallpaperOptions.map((preset) => {
                const isSelected = draftBgUrl === preset.url && draftBgActive;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectWallpaperPreset(preset)}
                    className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all cursor-pointer shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-500/25'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent p-2.5 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] uppercase font-bold text-white bg-black/55 px-1.5 py-0.5 rounded border border-white/20">
                          {preset.source === 'preset' ? '16:9 PRESET' : 'CUSTOM'}
                        </span>
                        <div className="flex items-center gap-1">
                          {preset.source === 'upload' && (
                            <button
                              type="button"
                              title="Remove saved upload"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromBackgroundHistory(preset.id);
                                if (draftBgUrl === preset.url) {
                                  setDraftBgUrl('');
                                  setDraftBgActive(false);
                                  removeBgPhoto();
                                }
                                showToast('Removed saved wallpaper from gallery.');
                              }}
                              className="w-5 h-5 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-xs text-white leading-tight truncate">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-slate-200/90 mt-0.5 truncate">
                          {preset.source === 'preset' ? 'Click to apply wallpaper' : preset.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">No preset background photos configured</p>
              <p className="text-[11px] text-slate-500 mt-1">Upload an image or paste a URL above to set the portal background</p>
            </div>
          )}
        </div>
      )}

      {/* 4. SLSU EXTENSION CENTER & OFFICIAL SEALS */}
      {(activeMediaTab === 'all' || activeMediaTab === 'slsu' || activeMediaTab === 'seals') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SLSU Extension Partner Header */}
          {(activeMediaTab === 'all' || activeMediaTab === 'slsu') && (
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    SLSU Extension Center Partner Photo
                  </h3>
                </div>

                <input
                  type="file"
                  ref={slsuFileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    handleGenericFileUpload(e, (dataUrl) => setDraftSlsuUrl(dataUrl))
                  }
                />
                <button
                  type="button"
                  onClick={() => slsuFileInputRef.current?.click()}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-300"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </button>
              </div>

              {/* 16:9 Aspect Video Preview */}
              <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-300 shadow-sm bg-slate-900 flex items-center justify-center">
                {draftSlsuUrl ? (
                  <img
                    src={draftSlsuUrl}
                    alt="SLSU Extension"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4">
                    <Building className="w-10 h-10 mb-2 text-slate-500" />
                    <span className="text-xs font-semibold">No photo configured. Upload a photo above.</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end text-white pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-emerald-300">
                    Academic &amp; Research Extension Partner
                  </span>
                  <h4 className="font-serif font-bold text-sm">
                    {draftSlsuTitle}
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {draftSlsuSubtitle}
                  </p>
                </div>
              </div>

              {/* Presets List */}
              <div className="space-y-2">
                <span className="text-[10.5px] uppercase font-bold text-slate-400 block">
                  SELECT SLSU PHOTO PRESET (16:9)
                </span>
                {SLSU_EXTENSION_PRESETS.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {SLSU_EXTENSION_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setDraftSlsuUrl(preset.url)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                          draftSlsuUrl === preset.url
                            ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-300">
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <span className="text-xs truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
                    No preset photos coded. Upload your official photo using the Upload button above.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Official Government Logos (3 Seals) */}
          {(activeMediaTab === 'all' || activeMediaTab === 'seals') && (
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Official Government Seals & Logos
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDraftSilagoLogoUrl('');
                    setDraftDaLogoUrl('');
                    setDraftBagOngLogoUrl('');
                    showToast('Reset seals to official vector seals');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Seals</span>
                </button>
              </div>

              <div className="space-y-3">
                {/* 2. Municipality of Silago Seal */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-2xs">
                      <SilagoSeal size={36} customUrl={draftSilagoLogoUrl} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        Municipality of Silago Official Seal
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Official municipal LGU insignia
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={silagoSealFileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleGenericFileUpload(e, (dataUrl) => setDraftSilagoLogoUrl(dataUrl))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => silagoSealFileRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* 3. DA Logo */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-2xs">
                      <DaLogo size={36} customUrl={draftDaLogoUrl} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        Department of Agriculture (DA)
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        National government agricultural header seal
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={daSealFileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleGenericFileUpload(e, (dataUrl) => setDraftDaLogoUrl(dataUrl))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => daSealFileRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* 5. Bag-Ong Silago Logo */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shadow-2xs">
                      <BagOngSilagoLogo size={36} customUrl={draftBagOngLogoUrl} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        Bag-Ong Silago MAO Agriculture Brand
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Rice production program emblem
                      </p>
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={bagOngFileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleGenericFileUpload(e, (dataUrl) => setDraftBagOngLogoUrl(dataUrl))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => bagOngFileRef.current?.click()}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
