import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RotateCcw,
  Check,
  Edit3,
  Columns,
  Table as TableIcon
} from 'lucide-react';

export interface CustomTableColumn {
  id: string;
  label: string;
  group?: string;
  width?: string;
  align: 'left' | 'center' | 'right';
  wrapText?: boolean;
}

export interface CustomTableRow {
  id: string;
  cells: Record<string, string>;
}

export interface CustomTableData {
  columns: CustomTableColumn[];
  rows: CustomTableRow[];
}

export interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tableData?: CustomTableData;
  initialData?: CustomTableData;
  onSaveTableData?: (data: CustomTableData) => void;
  onSave?: (data: CustomTableData) => void;
  onResetToDatabase?: () => void;
}

export const TableEditorModal: React.FC<TableEditorModalProps> = ({
  isOpen,
  onClose,
  tableData,
  initialData,
  onSaveTableData,
  onSave,
  onResetToDatabase
}) => {
  const getInitialColumns = (): CustomTableColumn[] => {
    const data = tableData || initialData;
    if (data && Array.isArray(data.columns)) {
      return JSON.parse(JSON.stringify(data.columns));
    }
    return [];
  };

  const getInitialRows = (): CustomTableRow[] => {
    const data = tableData || initialData;
    if (data && Array.isArray(data.rows)) {
      return JSON.parse(JSON.stringify(data.rows));
    }
    return [];
  };

  const [columns, setColumns] = useState<CustomTableColumn[]>(getInitialColumns);
  const [rows, setRows] = useState<CustomTableRow[]>(getInitialRows);

  const [activeTab, setActiveTab] = useState<'cells' | 'columns' | 'rows'>('cells');
  const [newColLabel, setNewColLabel] = useState('');
  const [newColGroup, setNewColGroup] = useState('');
  const [newColAlign, setNewColAlign] = useState<'left' | 'center' | 'right'>('left');

  // Re-sync when opened
  React.useEffect(() => {
    if (isOpen) {
      const data = tableData || initialData;
      if (data) {
        setColumns(JSON.parse(JSON.stringify(Array.isArray(data.columns) ? data.columns : [])));
        setRows(JSON.parse(JSON.stringify(Array.isArray(data.rows) ? data.rows : [])));
      }
    }
  }, [isOpen, tableData, initialData]);

  if (!isOpen) return null;

  // Handle cell edit
  const handleCellChange = (rowIndex: number, colId: string, value: string) => {
    setRows((prev) => {
      const next = [...prev];
      next[rowIndex] = {
        ...next[rowIndex],
        cells: {
          ...next[rowIndex].cells,
          [colId]: value
        }
      };
      return next;
    });
  };

  // Add new blank row
  const handleAddRow = (index?: number) => {
    const newRowId = `custom-row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const blankCells: Record<string, string> = {};
    columns.forEach((col) => {
      blankCells[col.id] = '';
    });

    setRows((prev) => {
      const next = [...prev];
      if (index !== undefined) {
        next.splice(index + 1, 0, { id: newRowId, cells: blankCells });
      } else {
        next.push({ id: newRowId, cells: blankCells });
      }
      return next;
    });
  };

  // Delete row
  const handleDeleteRow = (index: number) => {
    if (rows.length <= 1) {
      alert('Table must have at least one row.');
      return;
    }
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Move row up/down
  const handleMoveRow = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === rows.length - 1)
    ) {
      return;
    }
    setRows((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Add new column
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColLabel.trim()) return;

    const newColId = `col_${Date.now()}`;
    const newCol: CustomTableColumn = {
      id: newColId,
      label: newColLabel.trim(),
      group: newColGroup.trim() || undefined,
      align: newColAlign,
      wrapText: true
    };

    setColumns((prev) => [...prev, newCol]);
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        cells: {
          ...row.cells,
          [newColId]: ''
        }
      }))
    );

    setNewColLabel('');
    setNewColGroup('');
    setNewColAlign('left');
  };

  // Delete column
  const handleDeleteColumn = (colId: string) => {
    if (columns.length <= 1) {
      alert('Table must have at least one column.');
      return;
    }
    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setRows((prev) =>
      prev.map((row) => {
        const copy = { ...row.cells };
        delete copy[colId];
        return { ...row, cells: copy };
      })
    );
  };

  // Update column properties
  const handleUpdateColumn = (
    colId: string,
    updates: Partial<CustomTableColumn>
  ) => {
    setColumns((prev) =>
      prev.map((col) => (col.id === colId ? { ...col, ...updates } : col))
    );
  };

  // Move column left/right
  const handleMoveColumn = (index: number, direction: 'left' | 'right') => {
    if (
      (direction === 'left' && index === 0) ||
      (direction === 'right' && index === columns.length - 1)
    ) {
      return;
    }
    setColumns((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  // Save changes
  const handleSave = () => {
    const payload = { columns, rows };
    if (onSaveTableData) onSaveTableData(payload);
    if (onSave) onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 w-full max-w-6xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-blue-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Official Report Table &amp; Grid Editor
              </h3>
              <p className="text-xs text-slate-600">
                Full customization: edit cells, add/delete rows and columns, rename headers, reorder, adjust widths, and align text.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Reset Action */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('cells')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'cells'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Grid &amp; Cells ({rows.length} rows)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('columns')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'columns'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Columns &amp; Headers ({columns.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rows')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'rows'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Row Management</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    'Reset all table cells, columns, and rows back to live database records?'
                  )
                ) {
                  onResetToDatabase();
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-red-600" />
              <span>Reset to Live Database Data</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Blank Row</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Grid / Cell Editing */}
        {activeTab === 'cells' && (
          <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-blue-900 text-white border-b border-blue-950 font-bold text-[11px]">
                      <th className="py-2.5 px-3 w-12 text-center">#</th>
                      {columns.map((col) => (
                        <th
                          key={col.id}
                          className="py-2.5 px-3 min-w-[130px] border-r border-blue-800/80"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{col.label}</span>
                            <span className="text-[9px] px-1 py-0.2 bg-blue-800 text-blue-100 rounded font-mono uppercase">
                              {col.align[0]}
                            </span>
                          </div>
                          {col.group && (
                            <span className="text-[9px] text-blue-200 block font-normal truncate">
                              ({col.group})
                            </span>
                          )}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 w-20 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rows.map((row, rIndex) => (
                      <tr key={row.id} className="hover:bg-blue-50/40 transition">
                        <td className="py-1.5 px-2.5 text-center font-mono text-slate-500 font-bold bg-slate-50/80 border-r border-slate-200">
                          {rIndex + 1}
                        </td>
                        {columns.map((col) => (
                          <td
                            key={col.id}
                            className="p-1 border-r border-slate-200 min-w-[130px]"
                          >
                            <input
                              type="text"
                              value={row.cells[col.id] ?? ''}
                              onChange={(e) =>
                                handleCellChange(rIndex, col.id, e.target.value)
                              }
                              className={`w-full px-2 py-1 bg-white border border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded text-xs text-slate-900 font-sans transition ${
                                col.align === 'center'
                                  ? 'text-center'
                                  : col.align === 'right'
                                  ? 'text-right'
                                  : 'text-left'
                              }`}
                            />
                          </td>
                        ))}
                        <td className="py-1.5 px-2 text-center whitespace-nowrap bg-slate-50/40">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAddRow(rIndex)}
                              title="Insert row below"
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(rIndex)}
                              title="Delete row"
                              className="p-1 text-red-600 hover:bg-red-100 rounded cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Columns & Headers Management */}
        {activeTab === 'columns' && (
          <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50/50">
            {/* Add New Column Form */}
            <form
              onSubmit={handleAddColumn}
              className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex flex-wrap items-end gap-3"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  NEW COLUMN HEADER LABEL *
                </label>
                <input
                  type="text"
                  required
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  placeholder="e.g. Irrigation Association, RSBSA Status"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-48">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  GROUP HEADER (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={newColGroup}
                  onChange={(e) => setNewColGroup(e.target.value)}
                  placeholder="e.g. NAME, ADDRESS"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="w-36">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ALIGNMENT
                </label>
                <select
                  value={newColAlign}
                  onChange={(e) =>
                    setNewColAlign(e.target.value as 'left' | 'center' | 'right')
                  }
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Column</span>
              </button>
            </form>

            {/* List and Configure Existing Columns */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Existing Columns &amp; Layout Settings
              </h4>

              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 shadow-xs">
                {columns.map((col, cIndex) => (
                  <div
                    key={col.id}
                    className="p-3.5 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50/70 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-[200px] flex-1">
                      <span className="w-6 text-center font-mono text-xs text-slate-400 font-bold">
                        {cIndex + 1}
                      </span>
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={col.label}
                          onChange={(e) =>
                            handleUpdateColumn(col.id, { label: e.target.value })
                          }
                          className="w-full px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900 focus:ring-1 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-500">Group:</span>
                          <input
                            type="text"
                            value={col.group || ''}
                            placeholder="No group"
                            onChange={(e) =>
                              handleUpdateColumn(col.id, {
                                group: e.target.value.trim() || undefined
                              })
                            }
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded text-[10.5px] text-slate-700 max-w-[150px]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Alignment toggles */}
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateColumn(col.id, { align: 'left' })}
                        className={`p-1.5 rounded transition cursor-pointer ${
                          col.align === 'left'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateColumn(col.id, { align: 'center' })}
                        className={`p-1.5 rounded transition cursor-pointer ${
                          col.align === 'center'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateColumn(col.id, { align: 'right' })}
                        className={`p-1.5 rounded transition cursor-pointer ${
                          col.align === 'right'
                            ? 'bg-white text-blue-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Text wrap toggle */}
                    <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={col.wrapText !== false}
                        onChange={(e) =>
                          handleUpdateColumn(col.id, { wrapText: e.target.checked })
                        }
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Wrap text</span>
                    </label>

                    {/* Reorder and Delete controls */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={cIndex === 0}
                        onClick={() => handleMoveColumn(cIndex, 'left')}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                        title="Move column left"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={cIndex === columns.length - 1}
                        onClick={() => handleMoveColumn(cIndex, 'right')}
                        className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                        title="Move column right"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(col.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer ml-1"
                        title="Delete column"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Row Management (Reordering, Insert, Delete) */}
        {activeTab === 'rows' && (
          <div className="flex-1 overflow-auto p-6 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Total Rows: {rows.length}
              </span>
              <button
                type="button"
                onClick={() => handleAddRow(0)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Insert Row at Top</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 shadow-xs max-h-[550px] overflow-y-auto">
              {rows.map((row, rIndex) => {
                const primaryCol = columns[0]?.id || '';
                const secondaryCol = columns[1]?.id || '';
                const titleText = `${row.cells[primaryCol] || 'Row ' + (rIndex + 1)} ${
                  row.cells[secondaryCol] ? '- ' + row.cells[secondaryCol] : ''
                }`;

                return (
                  <div
                    key={row.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 font-mono text-xs font-bold text-slate-400">
                        #{rIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate max-w-md">
                        {titleText}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={rIndex === 0}
                        onClick={() => handleMoveRow(rIndex, 'up')}
                        className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                        title="Move row up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={rIndex === rows.length - 1}
                        onClick={() => handleMoveRow(rIndex, 'down')}
                        className="p-1 text-slate-600 hover:bg-slate-200 rounded disabled:opacity-30 cursor-pointer"
                        title="Move row down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddRow(rIndex)}
                        className="px-2 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Insert</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIndex)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer ml-1"
                        title="Delete row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-white shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Changes apply instantly to the print preview and official printed output.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>Apply &amp; Save Table Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
