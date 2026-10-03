import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PRESET_BACKGROUNDS } from '../data/photos';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, SlsuBadge } from './Seals';
import {
  X,
  Sliders,
  RotateCcw,
  Check,
  Building2,
  Image,
  SlidersHorizontal
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    bgPhotoUrl,
    bgOpacity,
    bgBlur,
    bgActive,
    setBgPhotoUrl,
    setBgOpacity,
    setBgBlur,
    setBgActive,
    daLogoUrl,
    setDaLogoUrl,
    silagoLogoUrl,
    setSilagoLogoUrl,
    bagOngSilagoLogoUrl,
    setBagOngSilagoLogoUrl,
    resetLogos,
    slsuUniversityName,
    setSlsuUniversityName,
    slsuCenterTitle,
    slsuCenterSubtitle,
    setSlsuCenterTitle,
    setSlsuCenterSubtitle,
    resetSlsuDetails,
    resetAllDefaults
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'background' | 'logos' | 'slsu'>('background');
  const [customPhotoInput, setCustomPhotoInput] = useState('');

  if (!isOpen) return null;

  const handleApplyCustomPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPhotoInput.trim()) return;
    setBgPhotoUrl(customPhotoInput.trim(), 'Custom Applied Background', 'upload');
    setCustomPhotoInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-slate-900">
                System Display &amp; Branding Settings
              </h3>
              <p className="text-xs text-slate-500">
                Customize agricultural backgrounds, municipal seals, and SLSU parameters
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-white gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('background')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeSubTab === 'background'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Atmospheric Background
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('logos')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeSubTab === 'logos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Official Seals
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('slsu')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeSubTab === 'slsu'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            SLSU Center Details
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeSubTab === 'background' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <strong className="text-xs text-slate-800 block">Enable Backdrop Layer</strong>
                  <span className="text-[11px] text-slate-500">Show subtle agricultural scenery behind content</span>
                </div>
                <input
                  type="checkbox"
                  checked={bgActive}
                  onChange={(e) => setBgActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Opacity</span>
                    <span className="font-mono text-blue-600">{(bgOpacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.30"
                    step="0.01"
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Blur</span>
                    <span className="font-mono text-blue-600">{bgBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={bgBlur}
                    onChange={(e) => setBgBlur(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Presets */}
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Select Preset Scenery
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PRESET_BACKGROUNDS.map((preset) => {
                    const isSelected = bgPhotoUrl === preset.url && bgActive;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => setBgPhotoUrl(preset.url, preset.name, 'preset')}
                        className={`p-1.5 rounded-xl border-2 transition cursor-pointer relative overflow-hidden ${
                          isSelected ? 'border-blue-600 bg-blue-50/40' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="h-16 rounded-lg overflow-hidden relative mb-1 bg-slate-100">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-blue-600 text-white p-0.5 rounded-full">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 truncate block">{preset.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Image Form */}
              <form onSubmit={handleApplyCustomPhoto} className="flex gap-2">
                <input
                  type="url"
                  value={customPhotoInput}
                  onChange={(e) => setCustomPhotoInput(e.target.value)}
                  placeholder="Paste custom image URL..."
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
                >
                  Apply
                </button>
              </form>
            </div>
          )}

          {activeSubTab === 'logos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Official Municipal &amp; DA Seals</span>
                <button
                  type="button"
                  onClick={resetLogos}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 underline"
                >
                  Reset Seals to Default
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-center">
                    <DaLogo size={42} />
                  </div>
                  <strong className="block text-[11px] text-slate-800">DA Logo</strong>
                  <input
                    type="text"
                    value={daLogoUrl || ''}
                    onChange={(e) => setDaLogoUrl(e.target.value.trim() || null)}
                    placeholder="Custom URL"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px]"
                  />
                </div>

                <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-center">
                    <SilagoSeal size={42} />
                  </div>
                  <strong className="block text-[11px] text-slate-800">Silago Seal</strong>
                  <input
                    type="text"
                    value={silagoLogoUrl || ''}
                    onChange={(e) => setSilagoLogoUrl(e.target.value.trim() || null)}
                    placeholder="Custom URL"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px]"
                  />
                </div>

                <div className="p-3 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-center">
                    <BagOngSilagoLogo size={42} />
                  </div>
                  <strong className="block text-[11px] text-slate-800">Bag-ong Silago</strong>
                  <input
                    type="text"
                    value={bagOngSilagoLogoUrl || ''}
                    onChange={(e) => setBagOngSilagoLogoUrl(e.target.value.trim() || null)}
                    placeholder="Custom URL"
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'slsu' && (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">SLSU Extension Demonstration Settings</span>
                <button
                  type="button"
                  onClick={resetSlsuDetails}
                  className="text-blue-600 font-bold hover:underline"
                >
                  Reset Defaults
                </button>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">University Name</label>
                <input
                  type="text"
                  value={slsuUniversityName}
                  onChange={(e) => setSlsuUniversityName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Center Subtitle / Field Name</label>
                <input
                  type="text"
                  value={slsuCenterTitle}
                  onChange={(e) => setSlsuCenterTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2">
                <SlsuBadge />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={resetAllDefaults}
            className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
