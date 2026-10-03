import React from 'react';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Pencil,
  Check,
  Sparkles
} from 'lucide-react';

interface FloatingReportActionDockProps {
  onPrint: () => void;
  onExportWord: () => void;
  onExportExcel: () => void;
  isDirectEditing: boolean;
  onToggleDirectEdit: () => void;
  documentView: 'letter' | 'irrigators_letter' | 'mpcsrs_report' | 'registry_table' | 'complete_package';
  isExportingWord?: boolean;
}

export const FloatingReportActionDock: React.FC<FloatingReportActionDockProps> = ({
  onPrint,
  onExportWord,
  onExportExcel,
  isDirectEditing,
  onToggleDirectEdit,
  documentView,
  isExportingWord = false
}) => {
  const getDocLabel = () => {
    switch (documentView) {
      case 'letter':
        return 'Transmittal Letter';
      case 'irrigators_letter':
        return 'Irrigators Directory';
      case 'mpcsrs_report':
        return 'MPCSRS Palay Report';
      case 'registry_table':
        return 'Masterlist Registry';
      case 'complete_package':
        return 'Complete Package (All 4)';
      default:
        return 'Active Report';
    }
  };

  return (
    <aside
      aria-label="Floating circular quick action dock"
      className="no-print floating-fab-dock fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-center gap-3 select-none"
    >
      {/* 1. Direct Print Circular Button */}
      <div className="relative group flex items-center">
        <button
          type="button"
          onClick={onPrint}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-950/25 backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ring-2 ring-white/40"
          aria-label="Direct Print Document"
          title="Direct Print Document (Ctrl+P)"
        >
          <Printer className="w-5 h-5 text-white transition-transform group-hover:rotate-6" />
        </button>

        {/* Hover Tooltip (Pops out to the left) */}
        <div className="pointer-events-none absolute right-full mr-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl font-bold flex items-center gap-2 border border-slate-700/80">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Quick Print ({getDocLabel()})</span>
            <span className="text-[10px] text-emerald-400 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Ctrl+P</span>
          </div>
        </div>
      </div>

      {/* 2. Export Word (.docx) Circular Button */}
      <div className="relative group flex items-center">
        <button
          type="button"
          onClick={onExportWord}
          disabled={isExportingWord}
          style={{ backgroundColor: '#2b579a' }}
          className="w-12 h-12 rounded-full hover:brightness-110 text-white flex items-center justify-center shadow-xl shadow-blue-950/25 backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ring-2 ring-white/40 disabled:opacity-50"
          aria-label="Export to Word (.docx)"
          title="Export Word Document (.docx)"
        >
          {isExportingWord ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <FileText className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
          )}
        </button>

        {/* Hover Tooltip */}
        <div className="pointer-events-none absolute right-full mr-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl font-bold flex items-center gap-2 border border-slate-700/80">
            <span className="w-2 h-2 rounded-full bg-[#2b579a]"></span>
            <span>Export Word (.docx)</span>
            <span className="text-[10px] text-blue-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Official DOCX</span>
          </div>
        </div>
      </div>

      {/* 3. Export Excel (.xlsx) Circular Button */}
      <div className="relative group flex items-center">
        <button
          type="button"
          onClick={onExportExcel}
          style={{ backgroundColor: '#217346' }}
          className="w-12 h-12 rounded-full hover:brightness-110 text-white flex items-center justify-center shadow-xl shadow-emerald-950/25 backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ring-2 ring-white/40"
          aria-label="Export to Excel (.xlsx)"
          title="Export Spreadsheet (.xlsx)"
        >
          <FileSpreadsheet className="w-5 h-5 text-white transition-transform group-hover:scale-110" />
        </button>

        {/* Hover Tooltip */}
        <div className="pointer-events-none absolute right-full mr-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl font-bold flex items-center gap-2 border border-slate-700/80">
            <span className="w-2 h-2 rounded-full bg-[#217346]"></span>
            <span>Export Excel (.xlsx)</span>
            <span className="text-[10px] text-emerald-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Styled XLSX</span>
          </div>
        </div>
      </div>

      {/* 4. Direct On-Canvas In-line Edit Toggle Button */}
      <div className="relative group flex items-center">
        <button
          type="button"
          onClick={onToggleDirectEdit}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer ring-2 ${
            isDirectEditing
              ? 'bg-amber-500 hover:bg-amber-600 text-white ring-amber-300 animate-pulse shadow-amber-500/30'
              : 'bg-slate-900 hover:bg-amber-600 text-white ring-white/40 shadow-slate-950/30'
          }`}
          aria-label={isDirectEditing ? 'Save Changes & Exit Edit' : 'Toggle Direct Canvas Edit'}
          title={isDirectEditing ? 'Save Changes / Exit In-line Edit Mode' : 'Direct In-line Canvas Edit'}
        >
          {isDirectEditing ? (
            <Check className="w-5 h-5 text-white stroke-[2.5]" />
          ) : (
            <Pencil className="w-5 h-5 text-amber-300 group-hover:text-white transition-transform group-hover:rotate-12" />
          )}
        </button>

        {/* Hover Tooltip */}
        <div className="pointer-events-none absolute right-full mr-3.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0 z-50 whitespace-nowrap">
          <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-xl shadow-2xl font-bold flex items-center gap-2 border border-slate-700/80">
            <span className={`w-2 h-2 rounded-full ${isDirectEditing ? 'bg-amber-400 animate-ping' : 'bg-amber-300'}`}></span>
            <span>{isDirectEditing ? 'Save Changes & Exit Direct Edit' : 'Toggle Direct On-Canvas Edit'}</span>
            <span className="text-[10px] text-amber-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              {isDirectEditing ? 'Active' : 'No Modal'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
