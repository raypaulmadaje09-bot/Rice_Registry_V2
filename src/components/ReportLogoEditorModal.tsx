import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Upload,
  RotateCcw,
  Image as ImageIcon,
  Check,
  X,
  Camera,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, SouthernLeyteSeal, BagongPilipinasLogo } from './Seals';

export type ReportLogoType = 'bagongPilipinas' | 'silago' | 'da' | 'southernLeyte' | 'bagOngSilago';

interface ReportLogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoType: ReportLogoType | null;
}

const LOGO_METADATA: Record<ReportLogoType, { title: string; subtitle: string; description: string }> = {
  bagongPilipinas: {
    title: 'Bagong Pilipinas Official Logo',
    subtitle: 'National Administration Program Brand',
    description: 'Header logo displayed across all official national transmittal documents and masterlists.'
  },
  silago: {
    title: 'Municipality of Silago Official Seal',
    subtitle: 'Local Government Unit (LGU) Insignia',
    description: 'The primary official municipal seal of Silago, Southern Leyte for all registry and administrative reports.'
  },
  da: {
    title: 'Department of Agriculture (DA) Seal',
    subtitle: 'National Agricultural Authority Insignia',
    description: 'Official seal of the Department of Agriculture for RSBSA registries and production reports.'
  },
  southernLeyte: {
    title: 'Province of Southern Leyte Seal',
    subtitle: 'Provincial Government Insignia',
    description: 'Official provincial seal of Southern Leyte utilized on formal municipal transmittal letters.'
  },
  bagOngSilago: {
    title: 'Bag-Ong Silago Agriculture Brand',
    subtitle: 'Municipal Rice & GIS Emblem',
    description: 'Local municipal banner insignia for Silago rice production programs and GIS media.'
  }
};

export const ReportLogoEditorModal: React.FC<ReportLogoEditorModalProps> = ({
  isOpen,
  onClose,
  logoType
}) => {
  const {
    daLogoUrl,
    setDaLogoUrl,
    silagoLogoUrl,
    setSilagoLogoUrl,
    bagOngSilagoLogoUrl,
    setBagOngSilagoLogoUrl,
    southernLeyteLogoUrl,
    setSouthernLeyteLogoUrl,
    bagongPilipinasLogoUrl,
    setBagongPilipinasLogoUrl
  } = useApp();

  const [inputUrl, setInputUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync initial state when modal opens
  useEffect(() => {
    if (!logoType || !isOpen) return;
    let curUrl: string | null = null;
    if (logoType === 'da') curUrl = daLogoUrl;
    else if (logoType === 'silago') curUrl = silagoLogoUrl;
    else if (logoType === 'bagOngSilago') curUrl = bagOngSilagoLogoUrl;
    else if (logoType === 'southernLeyte') curUrl = southernLeyteLogoUrl;
    else if (logoType === 'bagongPilipinas') curUrl = bagongPilipinasLogoUrl;

    setInputUrl(curUrl || '');
    setPreviewUrl(curUrl);
  }, [isOpen, logoType, daLogoUrl, silagoLogoUrl, bagOngSilagoLogoUrl, southernLeyteLogoUrl, bagongPilipinasLogoUrl]);

  if (!isOpen || !logoType) return null;

  const meta = LOGO_METADATA[logoType];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setInputUrl(dataUrl);
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyLogo = () => {
    const finalUrl = inputUrl.trim() || null;
    if (logoType === 'da') setDaLogoUrl(finalUrl);
    else if (logoType === 'silago') setSilagoLogoUrl(finalUrl);
    else if (logoType === 'bagOngSilago') setBagOngSilagoLogoUrl(finalUrl);
    else if (logoType === 'southernLeyte') setSouthernLeyteLogoUrl(finalUrl);
    else if (logoType === 'bagongPilipinas') setBagongPilipinasLogoUrl(finalUrl);
    onClose();
  };

  const handleResetToDefault = () => {
    if (logoType === 'da') setDaLogoUrl(null);
    else if (logoType === 'silago') setSilagoLogoUrl(null);
    else if (logoType === 'bagOngSilago') setBagOngSilagoLogoUrl(null);
    else if (logoType === 'southernLeyte') setSouthernLeyteLogoUrl(null);
    else if (logoType === 'bagongPilipinas') setBagongPilipinasLogoUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transition-all">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600/30 text-emerald-400 rounded-xl border border-emerald-500/40">
              <Camera size={18} />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm tracking-wide text-white">
                {meta.title}
              </h3>
              <p className="text-[11px] text-slate-300 font-sans">{meta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">{meta.description}</p>

          {/* Current Live Preview (Guaranteed non-distorted object-contain h-16 w-auto max-w-[80px]) */}
          <div className="flex items-center justify-center py-4 px-6 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="flex flex-col items-center justify-center gap-1.5">
              <div className="h-16 w-auto max-w-[80px] flex items-center justify-center bg-white p-1 rounded-lg border border-slate-200/60 shadow-2xs">
                {logoType === 'bagongPilipinas' && (
                  <BagongPilipinasLogo size={56} showText={false} customUrl={previewUrl || undefined} />
                )}
                {logoType === 'silago' && (
                  <SilagoSeal size={56} customUrl={previewUrl || undefined} />
                )}
                {logoType === 'da' && (
                  <DaLogo size={56} customUrl={previewUrl || undefined} />
                )}
                {logoType === 'southernLeyte' && (
                  <SouthernLeyteSeal size={56} customUrl={previewUrl || undefined} />
                )}
                {logoType === 'bagOngSilago' && (
                  <BagOngSilagoLogo size={56} customUrl={previewUrl || undefined} />
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {previewUrl ? 'Custom Image Active' : 'Default Official Seal Active'}
              </span>
            </div>
          </div>

          {/* Action 1: Upload File from Computer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Option 1: Upload Logo File (PNG, JPG, SVG)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-2xs transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload size={14} />
              <span>Browse Image File from Device</span>
            </button>
          </div>

          {/* Action 2: Direct Image URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Option 2: Or Paste Direct Web URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setPreviewUrl(e.target.value.trim() || null);
                }}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-mono"
              />
              {inputUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setInputUrl('');
                    setPreviewUrl(null);
                  }}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition"
                  title="Clear URL"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Reset to Default Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition font-medium cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset to Official Default Vector Seal</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-100/80 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyLogo}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Check size={14} className="text-emerald-400" />
            <span>Apply to All Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
};

