import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_BACKGROUNDS, SLSU_EXTENSION_PRESETS, DEFAULT_BG_PHOTO, DEFAULT_SLSU_PHOTO } from '../data/photos';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, SlsuBadge, SlsuSealSvg } from '../components/Seals';
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
  Layers,
  Pencil,
  Save,
  AlertTriangle,
  Undo2,
  Building,
  FileSpreadsheet,
  Monitor,
  Maximize2
} from 'lucide-react';

interface PhotosViewProps {
  onNavigateToSettings?: () => void;
}

export const PhotosView: React.FC<PhotosViewProps> = () => {
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
    daLogoUrl,
    setDaLogoUrl,
    silagoLogoUrl,
    setSilagoLogoUrl,
    bagOngSilagoLogoUrl,
    setBagOngSilagoLogoUrl,
    portalBannerUrl,
    setPortalBannerUrl,
    resetLogos,
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
    resetSlsuDetails,
    resetAllDefaults
  } = useApp();

  // Tab Filter
  const [activeMediaTab, setActiveMediaTab] = useState<'all' | 'background' | 'slsu' | 'seals'>('all');

  // STAGED DRAFT STATE FOR "SAVE BEFORE SHOW" WORKFLOW
  const [draftBgUrl, setDraftBgUrl] = useState(bgPhotoUrl);
  const [draftBgOpacity, setDraftBgOpacity] = useState(bgOpacity);
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

  // Sync draft state when external props change if not currently dirty
  useEffect(() => {
    setDraftBgUrl(bgPhotoUrl);
    setDraftBgOpacity(bgOpacity);
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
    slsuMotto
  ]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return (
      draftBgUrl !== bgPhotoUrl ||
      draftBgOpacity !== bgOpacity ||
      draftBgBlur !== bgBlur ||
      draftBgActive !== bgActive ||
      draftDaLogoUrl !== daLogoUrl ||
      draftSilagoLogoUrl !== silagoLogoUrl ||
      draftBagOngLogoUrl !== bagOngSilagoLogoUrl ||
      draftSlsuUrl !== slsuPhotoUrl ||
      draftSlsuTitle !== slsuCenterTitle ||
      draftSlsuSubtitle !== slsuCenterSubtitle ||
      draftSlsuCaption !== slsuCaption ||
      draftSlsuMotto !== slsuMotto
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
    slsuMotto
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

  // Apply All Draft Changes to Global System
  const handleSaveAndApply = () => {
    setBgPhotoUrl(draftBgUrl, 'Custom Agricultural Scenic Background', 'upload');
    setBgOpacity(draftBgOpacity);
    setBgBlur(draftBgBlur);
    setBgActive(draftBgActive);

    setDaLogoUrl(draftDaLogoUrl);
    setSilagoLogoUrl(draftSilagoLogoUrl);
    setBagOngSilagoLogoUrl(draftBagOngLogoUrl);

    setSlsuPhotoUrl(draftSlsuUrl);
    setSlsuCenterTitle(draftSlsuTitle);
    setSlsuCenterSubtitle(draftSlsuSubtitle);
    setSlsuCaption(draftSlsuCaption);
    setSlsuMotto(draftSlsuMotto);

    showToast('All media settings saved & applied to the live system!');
  };

  // Discard Draft Changes
  const handleDiscardChanges = () => {
    setDraftBgUrl(bgPhotoUrl);
    setDraftBgOpacity(bgOpacity);
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
      <div className="bg-[#071728] text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 space-y-5 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                MEDIA &amp; GRAPHIC ASSETS
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-white mt-1">
                Photo &amp; Media Studio Settings
              </h2>
              <p className="text-xs text-slate-400">
                Manage high-resolution agricultural wallpapers, official municipal seals, and SLSU institutional branding.
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all media settings back to official system defaults?')) {
                  resetAllDefaults();
                  showToast('Reset all media assets to official DA-MAO defaults');
                }
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset Defaults</span>
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

        {/* Media Category Filters */}
        <div className="flex items-center gap-2 border-t border-slate-800 pt-4 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveMediaTab('all')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeMediaTab === 'all'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Media Assets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMediaTab('background')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeMediaTab === 'background'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Portal Background Wallpapers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMediaTab('slsu')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeMediaTab === 'slsu'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>SLSU Extension Center</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMediaTab('seals')}
            className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeMediaTab === 'seals'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Official 3-Seal Logos</span>
          </button>
        </div>
      </div>

      {/* 3. STRUCTURED 16:9 MEDIA PRESET GRID WITH DRAFT STAGING */}
      {(activeMediaTab === 'all' || activeMediaTab === 'background') && (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-emerald-700" />
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  PORTAL WALLPAPERS
                </span>
              </div>
              <h3 className="font-serif font-black text-lg text-slate-900 mt-1">
                Scenic Agricultural Backgrounds (16:9 Aspect Ratio)
              </h3>
              <p className="text-xs text-slate-500">
                Select a preset photo or upload your own high-resolution image to stage it for the portal background.
              </p>
            </div>

            {/* Upload or URL custom image */}
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={bgFileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleGenericFileUpload(e, (dataUrl) => {
                    setDraftBgUrl(dataUrl);
                    setDraftBgActive(true);
                  })
                }
              />
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload 16:9 Image</span>
              </button>
            </div>
          </div>

          {/* Adjusters: Opacity & Blur Sliders */}
          <div className="bg-slate-50/90 border border-slate-200 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
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

          {/* Structured 16:9 Thumbnails Grid */}
          {PRESET_BACKGROUNDS.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_BACKGROUNDS.map((preset) => {
                const isSelected = draftBgUrl === preset.url;

                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setDraftBgUrl(preset.url);
                      setDraftBgActive(true);
                    }}
                    className={`group relative aspect-video rounded-2xl overflow-hidden border-2 transition-all cursor-pointer shadow-xs hover:shadow-md ${
                      isSelected
                        ? 'border-emerald-600 ring-4 ring-emerald-500/20 scale-[1.02]'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-white bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded border border-white/20">
                          16:9 PRESET
                        </span>
                        {isSelected && (
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-serif font-bold text-xs text-white leading-tight">
                          {preset.name}
                        </h4>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          {preset.source === 'preset' ? 'Official Municipal Photography' : 'Custom Upload'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
              <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">No preset background photos coded in system</p>
              <p className="text-[11px] text-slate-500 mt-1">Upload an image using the button above to set the portal background</p>
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

          {/* Official 3-Seal Logos */}
          {(activeMediaTab === 'all' || activeMediaTab === 'seals') && (
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-700" />
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Official 3-Seal Government Logos
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDraftDaLogoUrl('');
                    setDraftSilagoLogoUrl('');
                    setDraftBagOngLogoUrl('');
                    showToast('Reset seals to official vector seals');
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-lg transition flex items-center gap-1 cursor-pointer border border-slate-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Seals</span>
                </button>
              </div>

              <div className="space-y-3">
                {/* 1. DA Logo */}
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

                {/* 2. Silago LGU Seal */}
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

                {/* 3. Bag-Ong Silago Logo */}
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
