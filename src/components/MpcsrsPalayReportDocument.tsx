import React, { useState } from 'react';
import {
  MpcsrsReportData,
  MpcsrsGroup,
  MpcsrsBarangayRow,
  saveMpcsrsReportData
} from '../data/mpcsrsData';
import { OfficialSignatory } from '../types';
import { Edit3, CheckCircle2, Plus, Trash2, RotateCcw } from 'lucide-react';

interface MpcsrsPalayReportDocumentProps {
  data: MpcsrsReportData;
  onUpdateData?: (updated: MpcsrsReportData) => void;
  isEditable?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export const MpcsrsPalayReportDocument: React.FC<MpcsrsPalayReportDocumentProps> = ({
  data,
  onUpdateData,
  isEditable = true,
  orientation = 'landscape'
}) => {
  const [justSaved, setJustSaved] = useState(false);

  const handleFieldChange = <K extends keyof MpcsrsReportData>(
    field: K,
    val: MpcsrsReportData[K]
  ) => {
    const updated = { ...data, [field]: val };
    if (onUpdateData) {
      onUpdateData(updated);
    } else {
      saveMpcsrsReportData(updated);
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const currentSignatories: OfficialSignatory[] =
    data.signatories && data.signatories.length > 0
      ? data.signatories
      : [
          {
            id: 'sig-1',
            roleLabel: 'Prepared by:',
            name: data.preparedByName || '',
            title: data.preparedByTitle || 'Signature over Printed Name / Designation'
          },
          {
            id: 'sig-2',
            roleLabel: 'Approved by:',
            name: data.approvedByName || 'JUNIE T. ELMIDO',
            title: data.approvedByTitle || 'Municipal/City Agriculturist'
          }
        ];

  const handleSignatoryChange = (
    index: number,
    field: keyof OfficialSignatory,
    val: string
  ) => {
    const updated = currentSignatories.map((sig, idx) => {
      if (idx === index) {
        return { ...sig, [field]: val };
      }
      return sig;
    });
    handleFieldChange('signatories', updated);
  };

  const handleAddSignatory = () => {
    const newSig: OfficialSignatory = {
      id: `sig-${Date.now()}`,
      roleLabel: 'Noted by:',
      name: '',
      title: 'Municipal / Agricultural Officer'
    };
    handleFieldChange('signatories', [...currentSignatories, newSig]);
  };

  const handleDeleteSignatory = (index: number) => {
    if (currentSignatories.length <= 1) {
      alert('At least one signatory should remain on the document.');
      return;
    }
    const updated = currentSignatories.filter((_, idx) => idx !== index);
    handleFieldChange('signatories', updated);
  };

  const handleRowChange = (
    groupIdx: number,
    rowIdx: number,
    field: keyof MpcsrsBarangayRow,
    val: any
  ) => {
    const updatedGroups = data.groups.map((group, gIdx) => {
      if (gIdx !== groupIdx) return group;
      const updatedRows = group.rows.map((row, rIdx) => {
        if (rIdx !== rowIdx) return row;
        return { ...row, [field]: val };
      });
      // Recalculate group subtotal
      const subtotal = updatedRows.reduce((sum, r) => sum + (Number(r.validatedAreaHa) || 0), 0);
      return { ...group, rows: updatedRows, subtotalAreaHa: Number(subtotal.toFixed(2)) };
    });

    // Recalculate grand total
    const totalArea = updatedGroups.reduce((sum, g) => sum + (g.subtotalAreaHa || 0), 0);

    const updated = {
      ...data,
      groups: updatedGroups,
      totalValidatedAreaHa: Number(totalArea.toFixed(2))
    };

    if (onUpdateData) {
      onUpdateData(updated);
    } else {
      saveMpcsrsReportData(updated);
    }
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const handleAddRow = (groupIdx: number) => {
    const newRow: MpcsrsBarangayRow = {
      id: `row-${Date.now()}`,
      barangay: 'New Barangay',
      validatedAreaHa: 10.0,
      newlyPlantedHa: 0
    };
    const updatedGroups = data.groups.map((g, idx) => {
      if (idx !== groupIdx) return g;
      const rows = [...g.rows, newRow];
      const subtotal = rows.reduce((sum, r) => sum + (Number(r.validatedAreaHa) || 0), 0);
      return { ...g, rows, subtotalAreaHa: Number(subtotal.toFixed(2)) };
    });
    const totalArea = updatedGroups.reduce((sum, g) => sum + (g.subtotalAreaHa || 0), 0);
    handleFieldChange('groups', updatedGroups);
    handleFieldChange('totalValidatedAreaHa', Number(totalArea.toFixed(2)));
  };

  const handleDeleteRow = (groupIdx: number, rowIdx: number) => {
    const group = data.groups[groupIdx];
    if (group.rows.length <= 1) {
      alert('A group must have at least one row.');
      return;
    }
    const updatedGroups = data.groups.map((g, idx) => {
      if (idx !== groupIdx) return g;
      const rows = g.rows.filter((_, rIdx) => rIdx !== rowIdx);
      const subtotal = rows.reduce((sum, r) => sum + (Number(r.validatedAreaHa) || 0), 0);
      return { ...g, rows, subtotalAreaHa: Number(subtotal.toFixed(2)) };
    });
    const totalArea = updatedGroups.reduce((sum, g) => sum + (g.subtotalAreaHa || 0), 0);
    handleFieldChange('groups', updatedGroups);
    handleFieldChange('totalValidatedAreaHa', Number(totalArea.toFixed(2)));
  };

  const totalNewlyPlanted = data.groups.reduce((acc, g) => {
    return acc + g.rows.reduce((rAcc, r) => rAcc + (Number(r.newlyPlantedHa) || 0), 0);
  }, 0);

  return (
    <div className="flex flex-col flex-1 justify-between min-h-full text-black font-sans relative space-y-4 max-w-5xl mx-auto leading-tight transition-all">
      {/* Live Direct Editing Status Bar (Screen only) */}
      {onUpdateData && isEditable && (
        <div className="print:hidden bg-emerald-50/90 border border-emerald-300 text-emerald-950 px-3.5 py-2 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-xs mb-3">
          <div className="flex items-center gap-2">
            <Edit3 size={15} className="text-emerald-700 animate-pulse shrink-0" />
            <div>
              <span className="font-bold">MPCSRS Direct Live Editing Active:</span>{' '}
              <span className="text-emerald-800">
                You can edit barangay validated areas, newly planted hectare numbers, stages, and signatories directly on this official report.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {justSaved && (
              <div className="flex items-center gap-1 text-emerald-700 font-bold animate-fade-in text-[11px] bg-emerald-100/70 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={13} />
                <span>Saved Changes</span>
              </div>
            )}
            <span className="text-[10px] bg-emerald-200/70 text-emerald-900 font-mono px-2 py-0.5 rounded font-semibold">
              Exact Photo 1 Template
            </span>
          </div>
        </div>
      )}

      {/* TOP REGION & MUNICIPALITY METADATA (Exact Photo 1 Layout) */}
      <div className="space-y-1 text-xs sm:text-sm font-sans font-bold text-black border-b border-black pb-2 px-1">
        <div className="flex items-center gap-2">
          <span>REGION:</span>
          {onUpdateData && isEditable ? (
            <input
              type="text"
              value={data.region}
              onChange={(e) => handleFieldChange('region', e.target.value)}
              className="font-bold border-b border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/40 outline-hidden px-1 text-xs sm:text-sm"
            />
          ) : (
            <span>{data.region}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span>Municipality/City:</span>
          {onUpdateData && isEditable ? (
            <input
              type="text"
              value={data.municipalityProvince}
              onChange={(e) => handleFieldChange('municipalityProvince', e.target.value)}
              className="font-bold border-b border-slate-300 focus:border-emerald-600 focus:bg-emerald-50/40 outline-hidden px-1 text-xs sm:text-sm"
            />
          ) : (
            <span>{data.municipalityProvince}</span>
          )}
        </div>
      </div>

      {/* DOCUMENT TABLE (Exact Green Header & Grid matching Photo 1) */}
      <div className="overflow-x-auto border-2 border-black">
        <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
          <thead>
            {/* Super Headers */}
            <tr className="border-b-2 border-black">
              <th
                rowSpan={2}
                className="p-2 border-r-2 border-black font-serif font-black text-black uppercase tracking-wider text-center align-middle w-1/3 bg-slate-100 print:bg-transparent"
              >
                Agricultural Technicians/Barangays
              </th>
              <th
                rowSpan={2}
                className="p-2 border-r-2 border-black font-serif font-black text-black uppercase tracking-wider text-center align-middle w-32 bg-slate-100 print:bg-transparent"
              >
                TOTAL VALIDATED AREA
                <span className="block text-[10px] font-normal normal-case">(in Hectares)</span>
              </th>
              <th
                colSpan={4}
                className="p-1.5 border-b border-black text-center font-bold text-white uppercase tracking-wider text-xs"
                style={{ backgroundColor: '#3b7a42' }}
              >
                IRRIGATED
              </th>
            </tr>
            {/* Sub Stage Headers */}
            <tr className="border-b-2 border-black bg-emerald-50/60 print:bg-transparent text-[10px] sm:text-[11px] font-bold text-black text-center">
              <th className="p-1.5 border-r border-black font-bold">Newly Planted/ Seedling Stage</th>
              <th className="p-1.5 border-r border-black font-bold">Vegetative Stage</th>
              <th className="p-1.5 border-r border-black font-bold">Reproductive Stage</th>
              <th className="p-1.5 font-bold">Maturing Stage</th>
            </tr>

            {/* GRAND TOTAL ROW AT TOP (Matching Photo 1) */}
            <tr className="bg-slate-200/90 print:bg-transparent font-black border-b-2 border-black text-black">
              <td className="p-2 border-r-2 border-black font-bold uppercase text-left">
                TOTAL
              </td>
              <td className="p-2 border-r-2 border-black text-right font-mono font-black text-sm">
                {data.totalValidatedAreaHa.toFixed(2)}
              </td>
              <td className="p-2 border-r border-black text-right font-mono font-bold">
                {totalNewlyPlanted > 0 ? totalNewlyPlanted.toFixed(2) : '-'}
              </td>
              <td className="p-2 border-r border-black text-right font-mono font-normal text-slate-400 print:text-black">-</td>
              <td className="p-2 border-r border-black text-right font-mono font-normal text-slate-400 print:text-black">-</td>
              <td className="p-2 text-right font-mono font-normal text-slate-400 print:text-black">-</td>
            </tr>
          </thead>

          <tbody className="divide-y divide-black font-sans">
            {data.groups.map((group, groupIdx) => (
              <React.Fragment key={group.id || groupIdx}>
                {/* Group Header / Technician / Subtotal Row */}
                <tr className="bg-slate-100/80 print:bg-transparent font-bold border-t-2 border-black text-black">
                  <td className="p-1.5 border-r-2 border-black font-black uppercase text-left flex items-center justify-between">
                    <span>
                      {group.technicianName ? group.technicianName : `Group ${groupIdx + 1} Subtotal`}
                    </span>
                    {onUpdateData && isEditable && (
                      <button
                        type="button"
                        onClick={() => handleAddRow(groupIdx)}
                        className="print:hidden px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer"
                        title="Add barangay row to this technician group"
                      >
                        <Plus size={10} />
                        <span>Add Row</span>
                      </button>
                    )}
                  </td>
                  <td className="p-1.5 border-r-2 border-black text-right font-mono font-black text-xs sm:text-sm">
                    {group.subtotalAreaHa !== undefined ? group.subtotalAreaHa.toFixed(2) : '-'}
                  </td>
                  <td className="p-1.5 border-r border-black text-right font-mono text-slate-400 print:text-black">-</td>
                  <td className="p-1.5 border-r border-black text-right font-mono text-slate-400 print:text-black">-</td>
                  <td className="p-1.5 border-r border-black text-right font-mono text-slate-400 print:text-black">-</td>
                  <td className="p-1.5 text-right font-mono text-slate-400 print:text-black">-</td>
                </tr>

                {/* Group Rows (Individual Barangays) */}
                {group.rows.map((row, rowIdx) => (
                  <tr key={row.id || rowIdx} className="hover:bg-amber-50/40 print:hover:bg-transparent group/row">
                    {/* Barangay Name */}
                    <td className="p-1.5 pl-6 border-r-2 border-black font-medium text-black relative">
                      {onUpdateData && isEditable && group.rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(groupIdx, rowIdx)}
                          className="print:hidden absolute left-1 top-1.5 text-rose-500 hover:text-rose-700 opacity-0 group-row:opacity-100 transition p-0.5 cursor-pointer"
                          title="Delete this row"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}

                      {onUpdateData && isEditable ? (
                        <input
                          type="text"
                          value={row.barangay}
                          onChange={(e) => handleRowChange(groupIdx, rowIdx, 'barangay', e.target.value)}
                          className="w-full font-medium text-black border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                      ) : (
                        <span>{row.barangay}</span>
                      )}
                    </td>

                    {/* Validated Area in Ha */}
                    <td className="p-1.5 border-r-2 border-black text-right font-mono font-bold text-black">
                      {onUpdateData && isEditable ? (
                        <input
                          type="number"
                          step="0.01"
                          value={row.validatedAreaHa}
                          onChange={(e) =>
                            handleRowChange(groupIdx, rowIdx, 'validatedAreaHa', Number(e.target.value))
                          }
                          className="w-full text-right font-mono font-bold text-black border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                      ) : (
                        <span>{row.validatedAreaHa ? row.validatedAreaHa.toFixed(2) : '-'}</span>
                      )}
                    </td>

                    {/* Newly Planted Stage */}
                    <td className="p-1.5 border-r border-black text-right font-mono font-bold text-black">
                      {onUpdateData && isEditable ? (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="-"
                          value={row.newlyPlantedHa !== undefined ? row.newlyPlantedHa : ''}
                          onChange={(e) =>
                            handleRowChange(
                              groupIdx,
                              rowIdx,
                              'newlyPlantedHa',
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className="w-full text-right font-mono font-bold text-black border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                      ) : (
                        <span>{row.newlyPlantedHa !== undefined && row.newlyPlantedHa > 0 ? row.newlyPlantedHa.toFixed(2) : '-'}</span>
                      )}
                    </td>

                    {/* Vegetative Stage */}
                    <td className="p-1.5 border-r border-black text-right font-mono text-black">
                      {onUpdateData && isEditable ? (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="-"
                          value={row.vegetativeStageHa !== undefined ? row.vegetativeStageHa : ''}
                          onChange={(e) =>
                            handleRowChange(
                              groupIdx,
                              rowIdx,
                              'vegetativeStageHa',
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className="w-full text-right font-mono text-black border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                      ) : (
                        <span>{row.vegetativeStageHa !== undefined && row.vegetativeStageHa > 0 ? row.vegetativeStageHa.toFixed(2) : '-'}</span>
                      )}
                    </td>

                    {/* Reproductive Stage */}
                    <td className="p-1.5 border-r border-black text-right font-mono text-black">
                      {onUpdateData && isEditable ? (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="-"
                          value={row.reproductiveStageHa !== undefined ? row.reproductiveStageHa : ''}
                          onChange={(e) =>
                            handleRowChange(
                              groupIdx,
                              rowIdx,
                              'reproductiveStageHa',
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className="w-full text-right font-mono text-black border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                      ) : (
                        <span>{row.reproductiveStageHa !== undefined && row.reproductiveStageHa > 0 ? row.reproductiveStageHa.toFixed(2) : '-'}</span>
                      )}
                    </td>

                    {/* Maturing Stage */}
                    <td className="p-1.5 text-right font-mono text-black">
                      {onUpdateData && isEditable ? (
                        <input
                          type="number"
                          step="0.01"
                          placeholder="-"
                          value={row.maturingStageHa !== undefined ? row.maturingStageHa : ''}
                          onChange={(e) =>
                            handleRowChange(
                              groupIdx,
                              rowIdx,
                              'maturingStageHa',
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          className="w-full text-right font-mono text-black border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                      ) : (
                        <span>{row.maturingStageHa !== undefined && row.maturingStageHa > 0 ? row.maturingStageHa.toFixed(2) : '-'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* SIGNATORIES BLOCK AT BOTTOM (Fully Customizable, Clean & Aligned) */}
      <div className="mt-auto pt-8 px-2 sm:px-6 pb-3 border-t-2 border-black space-y-3 break-inside-avoid print:break-inside-avoid print:mt-auto">
        {/* Header & Add Signatory Button */}
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-600 print:text-black">
            Official Certification &amp; Signatures
          </span>
          {onUpdateData && isEditable && (
            <button
              type="button"
              onClick={handleAddSignatory}
              className="print:hidden px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
            >
              <Plus size={13} />
              <span>Add Signatory (Prepared / Reviewed / Noted / Approved)</span>
            </button>
          )}
        </div>

        {/* Dynamic Grid of Signatories */}
        <div
          className={`grid gap-8 text-center items-end ${
            currentSignatories.length === 1
              ? 'grid-cols-1 max-w-xs mx-auto'
              : currentSignatories.length === 2
              ? 'grid-cols-2 max-w-2xl mx-auto'
              : currentSignatories.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : currentSignatories.length === 4
              ? 'grid-cols-2 sm:grid-cols-4'
              : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {currentSignatories.map((sig, idx) => (
            <div
              key={sig.id || `sig-${idx}`}
              className="flex flex-col justify-between h-full space-y-1 relative group/sig p-1 rounded-lg"
            >
              {/* Delete button (Screen only, in edit mode) */}
              {onUpdateData && isEditable && currentSignatories.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteSignatory(idx)}
                  className="print:hidden absolute -top-2 -right-2 p-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-full shadow-xs opacity-0 group-hover/sig:opacity-100 transition cursor-pointer z-10"
                  title="Remove this signatory"
                >
                  <Trash2 size={11} />
                </button>
              )}

              {/* 1. Consistent Role Label (Prepared by:, Noted by:, Approved by:, etc.) */}
              <div>
                {onUpdateData && isEditable ? (
                  <input
                    type="text"
                    value={sig.roleLabel}
                    onChange={(e) => handleSignatoryChange(idx, 'roleLabel', e.target.value)}
                    className="text-sm font-bold text-black uppercase tracking-tight block w-full text-center border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent"
                    title="Click to edit role label"
                  />
                ) : (
                  <span className="text-sm font-bold text-black uppercase tracking-tight block text-center">
                    {sig.roleLabel}
                  </span>
                )}
              </div>

              {/* 2. Open 48px blank space specifically reserved for manual pen signature */}
              <div className="h-12 w-full select-none flex items-center justify-center" />

              {/* 3. Underline Line & Heavy Bold Uppercase Name */}
              <div className="space-y-0.5 w-full">
                {onUpdateData && isEditable ? (
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      value={sig.name}
                      placeholder="___________________________"
                      onChange={(e) => handleSignatoryChange(idx, 'name', e.target.value)}
                      className="font-bold text-black uppercase block w-full text-center text-sm border-b-2 border-black pb-0.5 hover:border-amber-500 focus:bg-amber-50/40 rounded-none px-1 py-0.5 outline-hidden print:border-black print:p-0 print:bg-transparent placeholder:text-black placeholder:font-normal"
                      title="Signatory Printed Name (or leave blank for manual signing)"
                    />
                    <input
                      type="text"
                      value={sig.title}
                      placeholder="Signature over Printed Name / Designation"
                      onChange={(e) => handleSignatoryChange(idx, 'title', e.target.value)}
                      className="text-xs font-semibold text-slate-800 print:text-black uppercase block w-full text-center border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent placeholder:text-slate-600 mt-0.5"
                      title="Signatory subtitle / designation"
                    />
                  </div>
                ) : (
                  <div>
                    {sig.name ? (
                      <p className="font-bold text-black uppercase text-sm tracking-wide border-b-2 border-black pb-0.5 min-h-[22px] text-center">
                        {sig.name}
                      </p>
                    ) : (
                      <div className="border-b-2 border-black pb-0.5 min-h-[22px] w-full" />
                    )}
                    <p className="text-xs font-semibold text-slate-800 print:text-black uppercase tracking-tight text-center mt-0.5">
                      {sig.title || '\u00A0'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTNOTE AT BOTTOM */}
      <div className="pt-2 border-t border-slate-300 text-[9.5px] text-slate-600 print:text-black italic">
        {onUpdateData && isEditable ? (
          <input
            type="text"
            value={data.footnote}
            onChange={(e) => handleFieldChange('footnote', e.target.value)}
            className="w-full text-[9.5px] italic text-slate-600 print:text-black border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden print:border-none print:p-0 print:bg-transparent"
          />
        ) : (
          <p>{data.footnote}</p>
        )}
      </div>
    </div>
  );
};
