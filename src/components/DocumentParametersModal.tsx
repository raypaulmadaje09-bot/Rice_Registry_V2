import React, { useState } from 'react';
import { OfficialSignatory } from '../types';
import { REGISTRY_COLUMNS } from '../views/ReportsView';
import {
  X,
  Check,
  RotateCcw,
  Sliders,
  UserCheck,
  FileText,
  Layout,
  Columns,
  Sparkles,
  Calendar,
  Layers,
  MapPin,
  Wheat,
  Plus,
  Trash2
} from 'lucide-react';
import { ASSIGNED_10_BARANGAYS, BARANGAYS, matchBarangay } from '../data/barangays';
import { CROPPING_SEASONS } from '../data/seasonalProduction';

interface DocumentParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Signatories
  signatories: OfficialSignatory[];
  onUpdateSignatories: (signatories: OfficialSignatory[]) => void;
  // Metadata
  memoRef: string;
  onChangeMemoRef: (val: string) => void;
  reportDate: string;
  onChangeReportDate: (val: string) => void;
  // Scope
  selectedBarangay: string;
  onChangeSelectedBarangay: (val: string) => void;
  selectedSeason: string;
  onChangeSelectedSeason: (val: string) => void;
  // Paper & Layout
  paperSize: string;
  onChangePaperSize: (val: string) => void;
  orientation: 'landscape' | 'portrait';
  onChangeOrientation: (val: 'landscape' | 'portrait') => void;
  margins: string;
  onChangeMargins: (val: string) => void;
  tableDensity: string;
  onChangeTableDensity: (val: string) => void;
  // Columns
  visibleColumns: Record<string, boolean>;
  onChangeVisibleColumns: (cols: Record<string, boolean>) => void;
  // Active document mode
  documentView: 'letter' | 'irrigators_letter' | 'mpcsrs_report' | 'registry_table' | 'complete_package';
}

export const DocumentParametersModal: React.FC<DocumentParametersModalProps> = ({
  isOpen,
  onClose,
  signatories,
  onUpdateSignatories,
  memoRef,
  onChangeMemoRef,
  reportDate,
  onChangeReportDate,
  selectedBarangay,
  onChangeSelectedBarangay,
  selectedSeason,
  onChangeSelectedSeason,
  paperSize,
  onChangePaperSize,
  orientation,
  onChangeOrientation,
  margins,
  onChangeMargins,
  tableDensity,
  onChangeTableDensity,
  visibleColumns,
  onChangeVisibleColumns,
  documentView
}) => {
  const [activeTab, setActiveTab] = useState<'signatories' | 'metadata' | 'layout' | 'columns'>('signatories');
  const [localSignatories, setLocalSignatories] = useState<OfficialSignatory[]>(signatories);

  React.useEffect(() => {
    setLocalSignatories(signatories);
  }, [signatories]);

  if (!isOpen) return null;

  const handleSignatoryChange = (index: number, field: keyof OfficialSignatory, value: string) => {
    const updated = [...localSignatories];
    updated[index] = { ...updated[index], [field]: value };
    setLocalSignatories(updated);
    onUpdateSignatories(updated);
  };

  const handleAddSignatory = () => {
    const newSig: OfficialSignatory = {
      id: `sig-custom-${Date.now()}`,
      roleLabel: 'Verified by:',
      name: '',
      title: 'Agricultural Technologist / LFT Officer'
    };
    const updated = [...localSignatories, newSig];
    setLocalSignatories(updated);
    onUpdateSignatories(updated);
  };

  const handleRemoveSignatory = (index: number) => {
    if (localSignatories.length <= 1) return;
    const updated = localSignatories.filter((_, i) => i !== index);
    setLocalSignatories(updated);
    onUpdateSignatories(updated);
  };

  const handleQuickPreset = (preset: 'default_silago' | 'da_provincial' | 'joint_lgu') => {
    if (preset === 'default_silago') {
      const def: OfficialSignatory[] = [
        {
          id: 'sig-1',
          roleLabel: 'Prepared by:',
          name: 'WELLA S. BONGON',
          title: 'Rice Technician / Agricultural Technologist'
        },
        {
          id: 'sig-2',
          roleLabel: 'Reviewed by:',
          name: 'JUNIE T. ELMIDO',
          title: 'Municipal / City Agriculturist'
        },
        {
          id: 'sig-3',
          roleLabel: 'Noted / Approved by:',
          name: 'HON. LEMUEL P. HONOR',
          title: 'Municipal Mayor'
        }
      ];
      setLocalSignatories(def);
      onUpdateSignatories(def);
    } else if (preset === 'da_provincial') {
      const prov: OfficialSignatory[] = [
        {
          id: 'sig-1',
          roleLabel: 'Prepared by:',
          name: 'WELLA S. BONGON',
          title: 'Rice Program Focal Person'
        },
        {
          id: 'sig-2',
          roleLabel: 'Endorsed by:',
          name: 'JUNIE T. ELMIDO',
          title: 'Municipal Agriculturist'
        },
        {
          id: 'sig-3',
          roleLabel: 'Approved by:',
          name: 'PROVINCIAL AGRICULTURIST',
          title: 'Office of the Provincial Agriculturist - Southern Leyte'
        }
      ];
      setLocalSignatories(prov);
      onUpdateSignatories(prov);
    } else {
      const joint: OfficialSignatory[] = [
        {
          id: 'sig-1',
          roleLabel: 'Surveyed by:',
          name: 'LOCAL FARMER TECHNICIAN',
          title: 'Barangay Agricultural Focal'
        },
        {
          id: 'sig-2',
          roleLabel: 'Validated by:',
          name: 'WELLA S. BONGON',
          title: 'Agricultural Technologist'
        },
        {
          id: 'sig-3',
          roleLabel: 'Certified Correct:',
          name: 'JUNIE T. ELMIDO',
          title: 'Municipal Agriculturist'
        }
      ];
      setLocalSignatories(joint);
      onUpdateSignatories(joint);
    }
  };

  const visibleColumnsCount = Object.values(visibleColumns).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Document Parameters &amp; Configuration Studio
              </h3>
              <p className="text-xs text-slate-300">
                Customize signatories, official memo headers, page formats, and dataset visibility
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('signatories')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'signatories'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Signatories ({localSignatories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('metadata')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'metadata'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Memo &amp; Metadata</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'layout'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Paper &amp; Layout</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('columns')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'columns'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Registry Columns ({visibleColumnsCount}/13)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: SIGNATORIES */}
          {activeTab === 'signatories' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Official Signatory Blocks</h4>
                  <p className="text-xs text-slate-500">
                    These official names and titles render dynamically on the document footer across Print, Word, and Excel exports.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Signatory</span>
                </button>
              </div>

              {/* Quick Fill Presets */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Quick Fill Signatory Presets:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('default_silago')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    🏛️ Standard Silago LGU (Technician / MAO / Mayor)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('da_provincial')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    🌾 DA Provincial Endorsement
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('joint_lgu')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium cursor-pointer shadow-2xs"
                  >
                    📋 Field Survey / Barangay LFT Joint
                  </button>
                </div>
              </div>

              {/* Signatory Cards */}
              <div className="space-y-3">
                {localSignatories.map((sig, idx) => (
                  <div
                    key={sig.id || `sig-${idx}`}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">
                        Signatory Position #{idx + 1}
                      </span>
                      {localSignatories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSignatory(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                          title="Remove this signatory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Role Label
                        </label>
                        <input
                          type="text"
                          value={sig.roleLabel || ''}
                          onChange={(e) => handleSignatoryChange(idx, 'roleLabel', e.target.value)}
                          placeholder="e.g. Prepared by:"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Full Official Name
                        </label>
                        <input
                          type="text"
                          value={sig.name || ''}
                          onChange={(e) => handleSignatoryChange(idx, 'name', e.target.value)}
                          placeholder="e.g. WELLA S. BONGON"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                          Official Designation / Title
                        </label>
                        <input
                          type="text"
                          value={sig.title || ''}
                          onChange={(e) => handleSignatoryChange(idx, 'title', e.target.value)}
                          placeholder="e.g. Agricultural Technologist"
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: METADATA & MEMO */}
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Document Reference &amp; Header Metadata</h4>
                <p className="text-xs text-slate-500">
                  Control numbers, report dates, and geographical scope identifiers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Official Memo / Control Ref Number
                  </label>
                  <input
                    type="text"
                    value={memoRef}
                    onChange={(e) => onChangeMemoRef(e.target.value)}
                    placeholder="e.g. SLG-MAO-RICE-2024-02B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                  <span className="text-[10px] text-slate-400">
                    Appears in header of Transmittal Letter, MPCSRS, and Masterlist registry.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Report Generation Date
                  </label>
                  <input
                    type="text"
                    value={reportDate}
                    onChange={(e) => onChangeReportDate(e.target.value)}
                    placeholder="e.g. February 21, 2024"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onChangeReportDate(
                          new Date().toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })
                        )
                      }
                      className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      Set Today's Date
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeReportDate('February 21, 2024')}
                      className="text-[10px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Reset to Official Milestone (Feb 21, 2024)
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Barangay Jurisdiction / Scope
                  </label>
                  <select
                    value={selectedBarangay}
                    onChange={(e) => onChangeSelectedBarangay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <optgroup label="🌟 Consolidated Municipal Reports">
                      <option value="ASSIGNED_10">⭐ Consolidated (All 10 Assigned Barangays)</option>
                      <option value="ALL">Consolidated Municipal (All Barangays)</option>
                    </optgroup>
                    <optgroup label="📍 10 Assigned Priority Barangays">
                      {ASSIGNED_10_BARANGAYS.map((b) => (
                        <option key={b} value={b}>
                          Barangay {b}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other Municipal Barangays">
                      {BARANGAYS.filter((b) => !ASSIGNED_10_BARANGAYS.some((ab) => matchBarangay(b.name, ab))).map((b) => (
                        <option key={b.name} value={b.name}>
                          Barangay {b.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Cropping Season Cycle
                  </label>
                  <select
                    value={selectedSeason}
                    onChange={(e) => onChangeSelectedSeason(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    {CROPPING_SEASONS.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAPER & LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Physical Print Canvas &amp; Typography Density</h4>
                <p className="text-xs text-slate-500">
                  Target exact Philippine government paper sizes and optimize layout margins for zero-clip printing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Paper Standard
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => onChangePaperSize(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="folio">Folio / Long (8.5&quot; × 13&quot; / 216 × 330 mm) - Official PH Gov</option>
                    <option value="a4">A4 (8.27&quot; × 11.69&quot; / 210 × 297 mm) - Standard ISO</option>
                    <option value="letter">Letter / Short (8.5&quot; × 11&quot; / 216 × 279 mm)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Page Orientation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onChangeOrientation('portrait')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        orientation === 'portrait'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>Portrait</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeOrientation('landscape')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        orientation === 'landscape'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <span>Landscape</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Margins
                  </label>
                  <select
                    value={margins}
                    onChange={(e) => onChangeMargins(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="standard">Standard (0.5 in / 12.7 mm)</option>
                    <option value="compact">Compact / Narrow (0.35 in / 8.9 mm)</option>
                    <option value="wide">Wide (0.75 in / 19.0 mm)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Table Row Density
                  </label>
                  <select
                    value={tableDensity}
                    onChange={(e) => onChangeTableDensity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 cursor-pointer"
                  >
                    <option value="compact">Compact (Maximum rows per page)</option>
                    <option value="normal">Normal (Balanced readable padding)</option>
                    <option value="relaxed">Relaxed (Spacious presentation)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REGISTRY COLUMNS */}
          {activeTab === 'columns' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">RSBSA Masterlist Columns</h4>
                  <p className="text-xs text-slate-500">
                    Select exactly which columns to display in the Masterlist table ({visibleColumnsCount} of 13 visible).
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const allOn: Record<string, boolean> = {};
                      REGISTRY_COLUMNS.forEach((c) => (allOn[c.id] = true));
                      onChangeVisibleColumns(allOn);
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Select All 13
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChangeVisibleColumns({
                        rsbsaNo: true,
                        familyName: true,
                        givenName: true,
                        middleName: false,
                        barangay: true,
                        municipality: false,
                        province: false,
                        birthday: false,
                        farmLocation: true,
                        latitude: true,
                        longitude: true,
                        farmArea: true,
                        commodity: true
                      });
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    GIS &amp; Land Preset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {REGISTRY_COLUMNS.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center justify-between p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 cursor-pointer transition text-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(visibleColumns[col.id])}
                        onChange={(e) => {
                          onChangeVisibleColumns({
                            ...visibleColumns,
                            [col.id]: e.target.checked
                          });
                        }}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                      />
                      <span className="font-semibold">{col.label}</span>
                    </div>
                    {col.group && (
                      <span className="text-[9px] font-mono text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded font-bold">
                        {col.group}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Active Document: <strong className="text-slate-800 capitalize">{documentView.replace('_', ' ')}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply &amp; Close</span>
          </button>
        </div>
      </div>
    </div>
  );
};
