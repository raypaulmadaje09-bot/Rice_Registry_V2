import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SLSU_EXTENSION_PRESETS } from '../data/photos';
import { SlsuBadge } from './Seals';
import {
  X,
  Pencil,
  RotateCcw,
  Check,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Eye,
  CheckCircle2,
  FileText,
  Settings
} from 'lucide-react';

interface EditRiceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings?: () => void;
}

export const EditRiceCenterModal: React.FC<EditRiceCenterModalProps> = ({ isOpen, onClose, onNavigateToSettings }) => {
  const {
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
    slsuTopTags,
    setSlsuTopTags,
    slsuPhotoUrl,
    setSlsuPhotoUrl,
    slsuLayoutMode,
    setSlsuLayoutMode,
    resetSlsuDetails
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local draft state
  const [draftBadgeTag, setDraftBadgeTag] = useState(slsuBadgeTag || 'SILAGO RICE DEMONSTRATION COMPLEX');
  const [draftTopTags, setDraftTopTags] = useState(slsuTopTags || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •');
  const [draftTitle, setDraftTitle] = useState(slsuCenterTitle);
  const [draftSubtitle, setDraftSubtitle] = useState(slsuCenterSubtitle);
  const [draftCaption, setDraftCaption] = useState(slsuCaption);
  const [draftMotto, setDraftMotto] = useState(slsuMotto);
  const [draftPhotoUrl, setDraftPhotoUrl] = useState(slsuPhotoUrl);
  const [draftLayoutMode, setDraftLayoutMode] = useState(slsuLayoutMode || 'full');

  const [activeTab, setActiveTab] = useState<'text' | 'media'>('text');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync draft whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setDraftBadgeTag(slsuBadgeTag || 'SILAGO RICE DEMONSTRATION COMPLEX');
      setDraftTopTags(slsuTopTags || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •');
      setDraftTitle(slsuCenterTitle);
      setDraftSubtitle(slsuCenterSubtitle);
      setDraftCaption(slsuCaption);
      setDraftMotto(slsuMotto);
      setDraftPhotoUrl(slsuPhotoUrl);
      setDraftLayoutMode(slsuLayoutMode || 'full');
      setShowSavedToast(false);
    }
  }, [isOpen, slsuCenterTitle, slsuCenterSubtitle, slsuCaption, slsuMotto, slsuBadgeTag, slsuTopTags, slsuPhotoUrl, slsuLayoutMode]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSlsuBadgeTag(draftBadgeTag.trim() || 'SILAGO RICE DEMONSTRATION COMPLEX');
    setSlsuTopTags(draftTopTags.trim() || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •');
    setSlsuCenterTitle(draftTitle.trim() || 'SILAGO RICE PRODUCTION & RESEARCH CENTER');
    setSlsuCenterSubtitle(draftSubtitle.trim() || 'Silago Model Rice Farm & Certified Inbred Seed Complex');
    setSlsuCaption(draftCaption.trim() || 'High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school');
    setSlsuMotto(draftMotto.trim() || '• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •');
    setSlsuPhotoUrl(draftPhotoUrl);
    setSlsuLayoutMode(draftLayoutMode);

    setShowSavedToast(true);
    setTimeout(() => {
      onClose();
    }, 400);
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset the Rice Center details to standard municipal defaults?')) {
      resetSlsuDetails();
      setDraftBadgeTag('SILAGO RICE DEMONSTRATION COMPLEX');
      setDraftTopTags('• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •');
      setDraftTitle('SILAGO RICE PRODUCTION & RESEARCH CENTER');
      setDraftSubtitle('Silago Model Rice Farm & Certified Inbred Seed Complex');
      setDraftCaption('High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school');
      setDraftMotto('• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •');
      setDraftLayoutMode('full');
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert('Photo must be less than 8MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setDraftPhotoUrl(dataUrl);
        setDraftLayoutMode('full');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    setDraftPhotoUrl(customUrlInput.trim());
    setDraftLayoutMode('full');
    setCustomUrlInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-[#0c2340] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-400/30">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Edit Rice Production &amp; Research Center</span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Update the public model farm showcase, headline titles, and demonstration information
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 px-5 bg-slate-50 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Card Text &amp; Badges</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'media'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Photo &amp; Layout Style</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {activeTab === 'text' && (
            <div className="space-y-3.5">
              {/* Field 1: Badge Header */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Badge Header</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Top Pill Header</span>
                </div>
                <input
                  type="text"
                  required
                  value={draftBadgeTag}
                  onChange={(e) => setDraftBadgeTag(e.target.value)}
                  placeholder="e.g. SILAGO RICE DEMONSTRATION COMPLEX"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-bold text-slate-900"
                />
              </div>

              {/* Field 2: Sub-tagline (Top Tags) */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Sub-tagline (Top Tags)</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Top Tags</span>
                </div>
                <input
                  type="text"
                  required
                  value={draftTopTags}
                  onChange={(e) => setDraftTopTags(e.target.value)}
                  placeholder="e.g. • HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs font-mono font-bold text-amber-700"
                />
              </div>

              {/* Field 3: Main Facility Title */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Main Facility Title</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Main Headline</span>
                </div>
                <input
                  type="text"
                  required
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g. SILAGO RICE PRODUCTION & RESEARCH CENTER"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs font-bold font-serif uppercase tracking-wider text-slate-900"
                />
              </div>

              {/* Field 4: Complex Subtitle */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Complex Subtitle</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Subtitle</span>
                </div>
                <input
                  type="text"
                  required
                  value={draftSubtitle}
                  onChange={(e) => setDraftSubtitle(e.target.value)}
                  placeholder="e.g. Silago Model Rice Farm & Certified Inbred Seed Complex"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-bold text-slate-900"
                />
              </div>

              {/* Field 5: Description / Subtitle Details */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Description / Subtitle Details</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Details</span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={draftCaption}
                  onChange={(e) => setDraftCaption(e.target.value)}
                  placeholder="e.g. High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs text-slate-800 font-medium"
                />
              </div>

              {/* Field 6: Bottom Tagline / Highlights */}
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>Bottom Tagline / Highlights</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Highlights</span>
                </div>
                <input
                  type="text"
                  required
                  value={draftMotto}
                  onChange={(e) => setDraftMotto(e.target.value)}
                  placeholder="e.g. • CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs font-mono font-bold text-amber-700"
                />
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              {/* Layout Mode Selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 text-xs block">Card Display Layout Mode</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDraftLayoutMode('full')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      draftLayoutMode === 'full'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Full Photo Overlay</span>
                      {draftLayoutMode === 'full' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Full background photography with translucent text gradient
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftLayoutMode('banner')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      draftLayoutMode === 'banner'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Showcase Banner</span>
                      {draftLayoutMode === 'banner' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Photo header banner with dark container below
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDraftLayoutMode('seal')}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      draftLayoutMode === 'seal'
                        ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>Heraldic Emblem Only</span>
                      {draftLayoutMode === 'seal' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Golden agricultural seal on deep navy canvas
                    </p>
                  </button>
                </div>
              </div>

              {/* Photo Upload & URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <strong className="block font-bold text-slate-800">Upload Photo File</strong>
                  <p className="text-[11px] text-slate-500">
                    Upload an actual photograph of Silago model rice farm, nursery, or field plots.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Browse &amp; Upload Photo</span>
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <strong className="block font-bold text-slate-800">Direct Photo URL</strong>
                  <p className="text-[11px] text-slate-500">
                    Paste an image URL from the web or municipal repository.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={customUrlInput}
                      onChange={(e) => setCustomUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      disabled={!customUrlInput.trim()}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold rounded-lg cursor-pointer transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>

              {/* Presets */}
              <div className="space-y-2 pt-2">
                <label className="font-bold text-slate-800 text-xs block">
                  Quick Select Palay &amp; Terrace Presets
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SLSU_EXTENSION_PRESETS.map((preset) => {
                    const isSelected = draftPhotoUrl === preset.url;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setDraftPhotoUrl(preset.url);
                          setDraftLayoutMode('full');
                        }}
                        className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                          isSelected ? 'border-amber-500 ring-2 ring-amber-400' : 'border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-20 object-cover"
                        />
                        <div className="p-1.5 bg-slate-900/90 text-white">
                          <span className="text-[10px] font-bold block truncate">{preset.name}</span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-amber-500 text-white p-0.5 rounded-full shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Live Preview Section */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span>Live Card Preview</span>
              </span>
              <span className="text-[10px] text-slate-400">Updates as you edit</span>
            </div>

            <div className="p-3 bg-slate-100 rounded-2xl flex justify-center border border-slate-200">
              <div className="w-full max-w-md">
                <SlsuBadge
                  overrideData={{
                    title: draftTitle,
                    subtitle: draftSubtitle,
                    caption: draftCaption,
                    motto: draftMotto,
                    badgeTag: draftBadgeTag,
                    topTags: draftTopTags,
                    photoUrl: draftPhotoUrl,
                    layoutMode: draftLayoutMode
                  }}
                  previewOnly
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              {onNavigateToSettings && (
                <button
                  type="button"
                  onClick={onNavigateToSettings}
                  className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                  title="Switch to Central Admin > System Settings"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open in System Settings</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
