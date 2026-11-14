import React, { useMemo } from 'react';
import {
  X,
  Check,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Columns,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  GripVertical,
  HelpCircle
} from 'lucide-react';
import { FarmParcel } from '../types';

export interface ColumnItem {
  id: string;
  label: string;
  group?: string;
  description?: string;
}

export const OFFICIAL_REGISTRY_COLUMNS: ColumnItem[] = [
  { id: 'rsbsaNo', label: 'RSBSA No.', description: 'Official RSBSA Registration reference code' },
  { id: 'farmerName', label: 'Farmer Name', description: 'Full Farmer Name (Surname, Given Middle Suffix)' },
  { id: 'familyName', label: 'Family Name', group: 'NAME', description: 'Farmer surname / family name' },
  { id: 'givenName', label: 'Given Name', group: 'NAME', description: 'Farmer legal first name' },
  { id: 'middleName', label: 'Middle Name', group: 'NAME', description: 'Farmer middle initial or name' },
  { id: 'barangay', label: 'Barangay', group: 'RESIDENTIAL ADDRESS', description: 'Silago residential barangay' },
  { id: 'municipality', label: 'Municipality', group: 'RESIDENTIAL ADDRESS', description: 'Municipal jurisdiction (SILAGO)' },
  { id: 'province', label: 'Province', group: 'RESIDENTIAL ADDRESS', description: 'Province (SOUTHERN LEYTE)' },
  { id: 'birthday', label: 'Birthday', description: 'Date of birth of registered farmer' },
  { id: 'farmLocation', label: 'Farm Location', description: 'Sitio / Barangay parcel geography' },
  { id: 'latitude', label: 'Latitude', group: 'GPS COORDINATE', description: 'Georeferenced centroid latitude (WGS84)' },
  { id: 'longitude', label: 'Longitude', group: 'GPS COORDINATE', description: 'Georeferenced centroid longitude (WGS84)' },
  { id: 'farmArea', label: 'Farm Area (ha)', description: 'Parcel surface area in hectares' },
  { id: 'commodity', label: 'Commodity Planted', description: 'Primary crop planted (Rice)' }
];

interface SmartColumnDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (colId: string) => void;
  columnOrder: string[];
  onReorderColumn: (startIndex: number, direction: 'up' | 'down') => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onResetToTemplate: () => void;
  parcels: FarmParcel[];
}

export const SmartColumnDrawer: React.FC<SmartColumnDrawerProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onToggleColumn,
  columnOrder,
  onReorderColumn,
  onSelectAll,
  onDeselectAll,
  onResetToTemplate,
  parcels
}) => {
  if (!isOpen) return null;

  // Map of column definition by ID
  const colDefMap = useMemo(() => {
    const map = new Map<string, ColumnItem>();
    OFFICIAL_REGISTRY_COLUMNS.forEach((c) => map.set(c.id, c));
    return map;
  }, []);

  // Ordered list of columns
  const orderedColumns = useMemo(() => {
    const list: ColumnItem[] = [];
    // First push columns in specified order
    columnOrder.forEach((id) => {
      const def = colDefMap.get(id);
      if (def) list.push(def);
    });
    // Add any missing columns from official list
    OFFICIAL_REGISTRY_COLUMNS.forEach((col) => {
      if (!list.some((item) => item.id === col.id)) {
        list.push(col);
      }
    });
    return list;
  }, [columnOrder, colDefMap]);

  // Compute mini data-readiness indicator for each column
  const dataReadiness = useMemo(() => {
    const total = parcels.length || 1;
    const stats: Record<string, { percent: number; alert?: string; filled: number; total: number; warning?: boolean }> = {};

    orderedColumns.forEach((col) => {
      let filled = 0;
      let alertMsg: string | undefined;
      let isWarning = false;

      parcels.forEach((p) => {
        switch (col.id) {
          case 'rsbsaNo': {
            const val = (p.swineNameOrId || '').trim();
            if (val && !val.toUpperCase().includes('NO RSBSA') && val !== '-') {
              filled++;
            }
            break;
          }
          case 'familyName': {
            const hasLast = (p.farmerFamilyName || '').trim() || (p.raiserName || '').trim();
            if (hasLast) filled++;
            break;
          }
          case 'givenName': {
            const hasGiven = (p.farmerGivenName || '').trim() || (p.raiserName || '').trim();
            if (hasGiven) filled++;
            break;
          }
          case 'middleName': {
            // Optional in many civil registrations
            if ((p.farmerMiddleName || '').trim()) filled++;
            else filled += 0.85; // Partial credit for single-name holders
            break;
          }
          case 'barangay': {
            if ((p.barangay || '').trim()) filled++;
            break;
          }
          case 'municipality':
          case 'province': {
            filled++;
            break;
          }
          case 'birthday': {
            if ((p.birthday || '').trim()) filled++;
            break;
          }
          case 'farmLocation': {
            if ((p.farmLocation || p.barangay || '').trim()) filled++;
            break;
          }
          case 'latitude':
          case 'longitude': {
            if (p.lat && p.lng && Math.abs(p.lat) > 0 && Math.abs(p.lng) > 0) {
              filled++;
            }
            break;
          }
          case 'farmArea': {
            if (p.weightKg !== undefined && p.weightKg > 0) filled++;
            break;
          }
          case 'commodity': {
            if ((p.commodity || 'Rice').trim()) filled++;
            break;
          }
          default:
            filled++;
        }
      });

      const percent = Math.min(100, Math.round((filled / total) * 100));
      const missing = total - Math.floor(filled);

      if (col.id === 'rsbsaNo' && missing > 0) {
        alertMsg = `${missing} unverified RSBSA`;
        isWarning = true;
      } else if ((col.id === 'latitude' || col.id === 'longitude') && missing > 0) {
        alertMsg = `${missing} missing GPS point`;
        isWarning = true;
      } else if (col.id === 'birthday' && missing > 0) {
        alertMsg = `${missing} unrecorded`;
      }

      stats[col.id] = {
        percent,
        alert: alertMsg,
        filled: Math.floor(filled),
        total,
        warning: isWarning
      };
    });

    return stats;
  }, [orderedColumns, parcels]);

  const visibleCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  const overallReadiness = useMemo(() => {
    const keys = Object.keys(visibleColumns).filter((k) => visibleColumns[k]);
    if (keys.length === 0) return 0;
    const sum = keys.reduce((acc, k) => acc + (dataReadiness[k]?.percent || 0), 0);
    return Math.round(sum / keys.length);
  }, [visibleColumns, dataReadiness]);

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-[65] transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Slide-out Drawer Container */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Smart Column & Field Customizer"
        className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 z-[70] flex flex-col animate-in slide-in-from-right duration-250"
      >
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-[#0B1E38] to-[#122B4D] text-white p-5 flex items-start justify-between border-b border-slate-700">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Columns className="w-5 h-5" />
              </span>
              <h2 className="text-base font-serif font-black tracking-wide">
                Smart Column &amp; Field Customizer
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Configure masterlist print fields, reorder print sequence, and inspect data quality.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Action Toolbar & Data Quality Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
          {/* Quick Selection Buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onSelectAll}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-900 shadow-2xs flex items-center gap-1 cursor-pointer transition"
              >
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                Select All
              </button>
              <button
                type="button"
                onClick={onDeselectAll}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-slate-900 shadow-2xs flex items-center gap-1 cursor-pointer transition"
              >
                <Square className="w-3.5 h-3.5 text-slate-400" />
                Deselect All
              </button>
            </div>

            <button
              type="button"
              onClick={onResetToTemplate}
              className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 shadow-2xs flex items-center gap-1 cursor-pointer transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-700" />
              Reset to Official Template
            </button>
          </div>

          {/* Data-Readiness Metric Card */}
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">Print Table Data Readiness</span>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                  {visibleCount} of {orderedColumns.length} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Calculated across {parcels.length} parcel records for selected scope
              </p>
            </div>

            <div className="text-right">
              <div className="text-base font-black font-mono text-emerald-700">
                {overallReadiness}%
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                {overallReadiness >= 95 ? 'Audit-Ready' : overallReadiness >= 80 ? 'Good' : 'Needs Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Column Sequence List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-slate-100">
          <div className="flex items-center justify-between pb-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span>FIELD NAME &amp; DOMAIN</span>
            <span>SEQUENCE &amp; READINESS</span>
          </div>

          {orderedColumns.map((col, idx) => {
            const isChecked = Boolean(visibleColumns[col.id]);
            const readiness: { percent: number; warning?: boolean; alert?: string } =
              dataReadiness[col.id] || { percent: 100, warning: false };
            const isFirst = idx === 0;
            const isLast = idx === orderedColumns.length - 1;

            return (
              <div
                key={col.id}
                className={`pt-2 flex items-center justify-between p-2 rounded-xl transition border ${
                  isChecked
                    ? 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-2xs'
                    : 'bg-slate-50/70 border-slate-100 opacity-60'
                }`}
              >
                {/* Left: Checkbox, Label, and Group Pill */}
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <input
                    type="checkbox"
                    id={`smart-col-${col.id}`}
                    checked={isChecked}
                    onChange={() => onToggleColumn(col.id)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />

                  <label
                    htmlFor={`smart-col-${col.id}`}
                    className="cursor-pointer select-none min-w-0 flex-1"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {col.label}
                      </span>
                      {col.group && (
                        <span className="text-[9.5px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {col.group}
                        </span>
                      )}
                    </div>
                    {col.description && (
                      <p className="text-[11px] text-slate-500 truncate max-w-[210px] mt-0.5">
                        {col.description}
                      </p>
                    )}
                  </label>
                </div>

                {/* Right: Readiness Indicator & Up/Down Sequence Arrows */}
                <div className="flex items-center gap-3 shrink-0">
                  {/* Readiness Indicator Badge */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {readiness.warning ? (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      )}
                      <span
                        className={`text-xs font-mono font-bold ${
                          readiness.percent >= 90
                            ? 'text-emerald-700'
                            : readiness.percent >= 70
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {readiness.percent}%
                      </span>
                    </div>

                    {readiness.alert && (
                      <span className="block text-[10px] font-medium text-amber-700 leading-none mt-0.5">
                        {readiness.alert}
                      </span>
                    )}

                    {/* Mini progress bar */}
                    <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden mt-1 ml-auto">
                      <div
                        className={`h-full rounded-full ${
                          readiness.percent >= 90
                            ? 'bg-emerald-600'
                            : readiness.percent >= 70
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${readiness.percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Up / Down Reorder Buttons */}
                  <div className="flex flex-col gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      disabled={isFirst}
                      onClick={() => onReorderColumn(idx, 'up')}
                      className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                      title="Move column earlier in printed sequence"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={isLast}
                      onClick={() => onReorderColumn(idx, 'down')}
                      className="p-1 hover:bg-white rounded text-slate-600 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition"
                      title="Move column later in printed sequence"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Updates print preview &amp; exports instantly</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
          >
            Apply &amp; Close
          </button>
        </div>
      </aside>
    </>
  );
};
