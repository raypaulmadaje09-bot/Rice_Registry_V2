import React from 'react';
import { X, Check } from 'lucide-react';

export interface ColumnDefinition {
  id: string;
  label: string;
  defaultVisible: boolean;
}

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: ColumnDefinition[];
  visibleColumnIds: string[];
  onToggleColumn: (colId: string) => void;
  onResetColumns: () => void;
}

export const ColumnVisibilityModal: React.FC<ColumnVisibilityModalProps> = ({
  isOpen,
  onClose,
  allColumns,
  visibleColumnIds,
  onToggleColumn,
  onResetColumns
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <div className="bg-[#0B1E38] text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold font-serif">Table Column Visibility</h3>
            <p className="text-[11px] text-slate-300">Choose columns to display in farm database</p>
          </div>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-1.5">
          {allColumns.map((col) => {
            const isChecked = visibleColumnIds.includes(col.id);
            return (
              <label
                key={col.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 border border-slate-100 cursor-pointer text-xs"
              >
                <span className="font-medium text-slate-700">{col.label}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleColumn(col.id)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
              </label>
            );
          })}
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onResetColumns}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            Reset to Default
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
