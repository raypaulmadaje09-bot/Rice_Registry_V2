import React, { useState, useRef } from 'react';
import { OfficialReportLetter } from '../data/reportLetters';
import { DaLogo, SilagoSeal, SouthernLeyteSeal, BagongPilipinasLogo } from './Seals';
import { useApp } from '../context/AppContext';
import { ReportLogoEditorModal, ReportLogoType } from './ReportLogoEditorModal';
import { OfficialSignatory } from '../types';
import {
  Edit3,
  CheckCircle2,
  Plus,
  Trash2,
  Upload,
  RotateCcw,
  Image as ImageIcon,
  Check,
  X,
  Camera,
  Maximize2
} from 'lucide-react';

import { StandardReportHeader } from './StandardReportHeader';

interface OfficialLetterDocumentProps {
  letter: OfficialReportLetter;
  activeBarangay: string;
  activeSeason: string;
  farmerCount: number;
  totalAreaHa: number;
  predominantVarieties: string;
  assignedLftName: string;
  onUpdateLetter?: (updated: OfficialReportLetter) => void;
  isEditable?: boolean;
  orientation?: 'portrait' | 'landscape';
  pageNumber?: number;
  totalPages?: number;
}

export const OfficialLetterDocument: React.FC<OfficialLetterDocumentProps> = ({
  letter,
  activeBarangay,
  activeSeason,
  farmerCount,
  totalAreaHa,
  predominantVarieties,
  assignedLftName,
  onUpdateLetter,
  isEditable = true,
  orientation = 'portrait',
  pageNumber,
  totalPages
}) => {
  const {
    bagongPilipinasLogoUrl,
    southernLeyteLogoUrl,
    silagoLogoUrl
  } = useApp();

  const [justSaved, setJustSaved] = useState(false);
  const [editingLogo, setEditingLogo] = useState<ReportLogoType | null>(null);

  const handleFieldChange = (field: keyof OfficialReportLetter, value: any) => {
    if (!onUpdateLetter) return;
    const updated = {
      ...letter,
      [field]: value
    };
    onUpdateLetter(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  // Signatories management (add, edit, delete)
  const currentSignatories: OfficialSignatory[] = (letter.signatories && letter.signatories.length > 0)
    ? letter.signatories
    : [
        {
          id: 'sig-prepared',
          roleLabel: 'Prepared & Verified by:',
          name: letter.preparedBy || 'Wella S. Bongons',
          title: letter.preparedTitle || 'Local Farmer Technician (LFT) / Rice Sector Focal'
        },
        {
          id: 'sig-reviewed',
          roleLabel: 'Reviewed & Certified by:',
          name: letter.reviewedBy || 'Engr. Arnaldo M. Valdez',
          title: letter.reviewedTitle || 'Municipal Agriculturist / Municipal LFT Coordinator'
        },
        {
          id: 'sig-approved',
          roleLabel: 'Noted & Approved by:',
          name: letter.approvedBy || 'Hon. Lemuel P. Honor',
          title: letter.approvedTitle || 'Municipal Mayor - Silago, Southern Leyte'
        }
      ];

  const handleSignatoryChange = (index: number, field: keyof OfficialSignatory, val: string) => {
    const updated = currentSignatories.map((sig, idx) => {
      if (idx === index) {
        return { ...sig, [field]: val };
      }
      return sig;
    });

    // Also sync backwards-compatible top-level properties
    const updatedLetter: OfficialReportLetter = {
      ...letter,
      signatories: updated
    };
    if (updated[0]) {
      updatedLetter.preparedBy = updated[0].name;
      updatedLetter.preparedTitle = updated[0].title;
    }
    if (updated[1]) {
      updatedLetter.reviewedBy = updated[1].name;
      updatedLetter.reviewedTitle = updated[1].title;
    }
    if (updated[2]) {
      updatedLetter.approvedBy = updated[2].name;
      updatedLetter.approvedTitle = updated[2].title;
    }

    if (onUpdateLetter) {
      onUpdateLetter(updatedLetter);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1500);
    }
  };

  const handleAddSignatory = () => {
    const newSig: OfficialSignatory = {
      id: `sig-${Date.now()}`,
      roleLabel: 'Recommending Approval / Noted by:',
      name: 'Enter Officer Name',
      title: 'Designation / Office Title'
    };
    const updated = [...currentSignatories, newSig];
    handleFieldChange('signatories', updated);
  };

  const handleDeleteSignatory = (index: number) => {
    if (currentSignatories.length <= 1) {
      alert('At least one signatory should remain on the official document.');
      return;
    }
    const updated = currentSignatories.filter((_, idx) => idx !== index);
    handleFieldChange('signatories', updated);
  };

  // Logo uploader handlers
  const handleOpenLogoEditor = (which: ReportLogoType) => {
    setEditingLogo(which);
  };

  // Dynamic replacement of variables in letter body
  const formatText = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{BARANGAY}/g, activeBarangay === 'ALL' ? 'ALL BARANGAYS (CONSOLIDATED)' : activeBarangay.toUpperCase())
      .replace(/{FARMER_COUNT}/g, String(farmerCount))
      .replace(/{TOTAL_AREA}/g, totalAreaHa.toFixed(2))
      .replace(/{SEASON}/g, activeSeason)
      .replace(/{DATE}/g, letter.date);
  };

  const isLandscape = orientation === 'landscape';

  // Responsive font & layout tokens based on portrait vs landscape
  const logoSize = isLandscape ? 66 : 56;
  const bodyTextClass = isLandscape
    ? 'text-sm sm:text-base leading-relaxed tracking-normal'
    : 'text-xs sm:text-[13px] leading-normal tracking-tight';
  const headingH1Class = isLandscape
    ? 'text-base sm:text-lg font-serif font-black tracking-wider uppercase'
    : 'text-sm sm:text-base font-serif font-black tracking-wider uppercase';
  const headingSubClass = isLandscape
    ? 'text-xs sm:text-sm font-sans tracking-wide'
    : 'text-xs sm:text-[12.5px] font-sans tracking-wide';
  const memoTextClass = isLandscape
    ? 'text-xs sm:text-sm font-sans'
    : 'text-[11px] sm:text-xs font-sans';
  const containerSpacing = isLandscape ? 'space-y-6' : 'space-y-5';

  return (
    <div className={`flex flex-col flex-1 justify-between min-h-full text-black font-sans relative ${containerSpacing} transition-all`}>
      {/* Screen-Only Direct-Edit Notification Bar */}
      {onUpdateLetter && isEditable && (
        <div className="print:hidden bg-amber-50/90 border border-amber-300 text-amber-950 px-3.5 py-2 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Edit3 size={15} className="text-amber-700 animate-pulse shrink-0" />
            <div>
              <span className="font-bold">Direct On-Letter Live Editing Active:</span>{' '}
              <span className="text-amber-800">
                Click directly on any text, header, logo, or signatory on the letter to edit. Changes save immediately.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            {justSaved && (
              <div className="flex items-center gap-1 text-emerald-700 font-bold animate-fade-in text-[11px] bg-emerald-100/70 px-2 py-0.5 rounded-md">
                <CheckCircle2 size={13} />
                <span>Saved to Template</span>
              </div>
            )}
            <span className="text-[10.5px] bg-amber-200/70 text-amber-900 font-mono px-2 py-0.5 rounded font-semibold">
              {isLandscape ? 'Landscape Mode' : 'Portrait Mode'} (Auto-Scaled Font)
            </span>
          </div>
        </div>
      )}

      {/* 1. Official Standardized Government Letterhead */}
      <StandardReportHeader
        isEditable={isEditable}
        republicHeader={letter.countryHeader || 'Republic of the Philippines'}
        provinceHeader={letter.provinceHeader || 'Province of Southern Leyte'}
        municipalityHeader={letter.municipalityHeader || 'MUNICIPALITY OF SILAGO'}
        officeHeader={letter.officeHeader || 'Municipal Agriculture Office'}
        subtitle={
          totalPages && totalPages > 1
            ? pageNumber === 2
              ? 'TRANSMITTAL MEMORANDUM (PAGE 2: OFFICIAL CERTIFICATION & SIGNATURES)'
              : 'TRANSMITTAL MEMORANDUM (PAGE 1: NARRATIVE & AGRICULTURAL METRICS)'
            : undefined
        }
        onEditLogo={(logo) => handleOpenLogoEditor(logo)}
        onHeaderChange={(field, val) => {
          if (field === 'republicHeader') handleFieldChange('countryHeader', val);
          else if (field === 'provinceHeader') handleFieldChange('provinceHeader', val);
          else if (field === 'municipalityHeader') handleFieldChange('municipalityHeader', val);
          else if (field === 'officeHeader') handleFieldChange('officeHeader', val);
        }}
      />

      {/* If Page 2 of 2: Render Subject reference, Closing statement, and Signatories */}
      {totalPages === 2 && pageNumber === 2 ? (
        <div className="flex flex-col flex-1 justify-between min-h-0 space-y-5 pt-2">
          {/* Memo Subject Reference Bar */}
          <div className="border-b border-black pb-2 text-xs font-mono text-slate-800 flex items-center justify-between">
            <span>MEMO REF: <strong>{letter.memoRef}</strong></span>
            <span>DATE: <strong>{letter.date}</strong></span>
            <span className="truncate max-w-sm">SUBJECT: <strong>{letter.subject}</strong></span>
          </div>

          {/* 7. Closing Statement */}
          {letter.closingStatement && (
            <div className={`pt-2 ${bodyTextClass}`}>
              {onUpdateLetter && isEditable ? (
                <textarea
                  value={letter.closingStatement}
                  rows={3}
                  onChange={(e) => handleFieldChange('closingStatement', e.target.value)}
                  className="w-full text-justify border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-1 outline-hidden resize-none print:border-none print:p-0 print:bg-transparent"
                />
              ) : (
                <p className="text-justify indent-8">{formatText(letter.closingStatement)}</p>
              )}
            </div>
          )}

          {/* 8. Fully Manageable Official Signatories Block */}
          <div className="mt-auto pt-8 border-t-2 border-black space-y-3 break-inside-avoid print:break-inside-avoid print:mt-auto">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-800 print:text-black">
                Certified correct and verified by:
              </span>
              {onUpdateLetter && isEditable && (
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="print:hidden px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Add Signatory (Prepared / Reviewed / Noted)</span>
                </button>
              )}
            </div>

            <div
              className={`grid gap-6 text-center ${
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
                <div key={sig.id || `sig-${idx}`} className="space-y-1 relative group/sig p-1 rounded-lg">
                  {onUpdateLetter && isEditable && currentSignatories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSignatory(idx)}
                      className="print:hidden absolute -top-2 -right-2 p-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-full shadow-xs opacity-0 group-hover/sig:opacity-100 transition cursor-pointer"
                      title="Remove this signatory"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}

                  {onUpdateLetter && isEditable ? (
                    <input
                      type="text"
                      value={sig.roleLabel}
                      onChange={(e) => handleSignatoryChange(idx, 'roleLabel', e.target.value)}
                      className="text-xs font-bold text-black uppercase tracking-tight block w-full text-center border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent"
                    />
                  ) : (
                    <span className="text-xs font-bold text-black uppercase tracking-tight block text-center">
                      {sig.roleLabel}
                    </span>
                  )}

                  <div className="h-12 w-full select-none" />

                  <div className="space-y-0.5 w-full">
                    {onUpdateLetter && isEditable ? (
                      <div className="space-y-0.5">
                        <input
                          type="text"
                          value={sig.name}
                          placeholder="___________________________"
                          onChange={(e) => handleSignatoryChange(idx, 'name', e.target.value)}
                          className="font-bold text-black uppercase block w-full text-center text-xs border-b-2 border-black pb-0.5 hover:border-amber-500 focus:bg-amber-50/40 rounded-none px-1 py-0.5 outline-hidden print:border-black print:p-0 print:bg-transparent placeholder:text-black placeholder:font-normal"
                        />
                        <input
                          type="text"
                          value={sig.title}
                          placeholder="Signature over Printed Name / Designation"
                          onChange={(e) => handleSignatoryChange(idx, 'title', e.target.value)}
                          className="text-[10.5px] font-semibold text-slate-800 print:text-black uppercase block w-full text-center border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent placeholder:text-slate-600 mt-0.5"
                        />
                      </div>
                    ) : (
                      <div>
                        {sig.name ? (
                          <p className="font-bold text-black uppercase text-xs tracking-wide border-b-2 border-black pb-0.5 min-h-[20px] text-center">
                            {sig.name}
                          </p>
                        ) : (
                          <div className="border-b-2 border-black pb-0.5 min-h-[20px] w-full" />
                        )}
                        <p className="text-[10.5px] font-semibold text-slate-800 print:text-black uppercase tracking-tight text-center mt-0.5">
                          {sig.title || '\u00A0'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* PAGE 1 (OR SINGLE PAGE IN PORTRAIT) */
        <>
          {/* 2. Official Memorandum Header Details */}
          <div className={`space-y-2 border-b-2 border-black pb-3.5 ${memoTextClass}`}>
            <div className="flex justify-between items-center font-mono text-slate-800 print:text-black font-semibold pb-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold">MEMO REF:</span>
                {onUpdateLetter && isEditable ? (
                  <input
                    type="text"
                    value={letter.memoRef}
                    onChange={(e) => handleFieldChange('memoRef', e.target.value)}
                    className="font-bold border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-0.5 text-black outline-hidden print:border-none print:p-0 print:bg-transparent"
                    title="Click to edit Memo Reference Number"
                  />
                ) : (
                  <strong>{letter.memoRef}</strong>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold">DATE:</span>
                {onUpdateLetter && isEditable ? (
                  <input
                    type="text"
                    value={letter.date}
                    onChange={(e) => handleFieldChange('date', e.target.value)}
                    className="font-bold border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-0.5 text-black outline-hidden text-right print:border-none print:p-0 print:bg-transparent"
                    title="Click to edit Date"
                  />
                ) : (
                  <strong>{letter.date}</strong>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[170px_1fr] gap-y-1.5 pt-1">
              <div className="font-serif font-bold text-black uppercase tracking-wider">
                MEMORANDUM FOR:
              </div>
              <div>
                {onUpdateLetter && isEditable ? (
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      value={letter.memorandumFor}
                      onChange={(e) => handleFieldChange('memorandumFor', e.target.value)}
                      className="font-bold text-black uppercase block w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent"
                    />
                    <input
                      type="text"
                      value={letter.memorandumForTitle}
                      onChange={(e) => handleFieldChange('memorandumForTitle', e.target.value)}
                      className="text-slate-700 print:text-black text-xs block w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent"
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-black uppercase block">{letter.memorandumFor}</span>
                    <span className="text-slate-700 print:text-black text-xs block">{letter.memorandumForTitle}</span>
                  </>
                )}
              </div>

              {(letter.thru || (onUpdateLetter && isEditable)) && (
                <>
                  <div className="font-serif font-bold text-black uppercase tracking-wider">
                    THRU:
                  </div>
                  <div>
                    {onUpdateLetter && isEditable ? (
                      <div className="space-y-0.5">
                        <input
                          type="text"
                          value={letter.thru || ''}
                          placeholder="(Optional) THRU recipient name"
                          onChange={(e) => handleFieldChange('thru', e.target.value)}
                          className="font-bold text-black uppercase block w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                        <input
                          type="text"
                          value={letter.thruTitle || ''}
                          placeholder="(Optional) THRU designation"
                          onChange={(e) => handleFieldChange('thruTitle', e.target.value)}
                          className="text-slate-700 print:text-black text-xs block w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent"
                        />
                      </div>
                    ) : (
                      <>
                        <span className="font-bold text-black uppercase block">{letter.thru}</span>
                        <span className="text-slate-700 print:text-black text-xs block">{letter.thruTitle}</span>
                      </>
                    )}
                  </div>
                </>
              )}

              <div className="font-serif font-bold text-black uppercase tracking-wider">
                FROM:
              </div>
              <div>
                {onUpdateLetter && isEditable ? (
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      value={letter.fromOfficer || letter.from || ''}
                      onChange={(e) => {
                        handleFieldChange('from', e.target.value);
                        handleFieldChange('fromOfficer', e.target.value);
                      }}
                      className="font-bold text-black uppercase block w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent"
                    />
                    <input
                      type="text"
                      value={letter.fromTitle}
                      onChange={(e) => handleFieldChange('fromTitle', e.target.value)}
                      className="text-slate-700 print:text-black text-xs block w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent"
                    />
                  </div>
                ) : (
                  <>
                    <span className="font-bold text-black uppercase block">{letter.fromOfficer || letter.from}</span>
                    <span className="text-slate-700 print:text-black text-xs block">{letter.fromTitle}</span>
                  </>
                )}
              </div>

              <div className="font-serif font-bold text-black uppercase tracking-wider">
                SUBJECT:
              </div>
              <div>
                {onUpdateLetter && isEditable ? (
                  <textarea
                    value={letter.subject}
                    rows={isLandscape ? 2 : 2}
                    onChange={(e) => handleFieldChange('subject', e.target.value)}
                    className="font-black text-black uppercase block w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden resize-none print:border-none print:p-0 print:bg-transparent"
                  />
                ) : (
                  <span className="font-black text-black uppercase block">{formatText(letter.subject)}</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. Opening Salutation */}
          <div className={bodyTextClass}>
            {onUpdateLetter && isEditable ? (
              <input
                type="text"
                value={letter.openingGreeting}
                onChange={(e) => handleFieldChange('openingGreeting', e.target.value)}
                className="w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent font-medium"
              />
            ) : (
              <p className="font-medium">{letter.openingGreeting}</p>
            )}
          </div>

          {/* 4. Body Paragraph 1 */}
          <div className={bodyTextClass}>
            {onUpdateLetter && isEditable ? (
              <textarea
                value={letter.bodyParagraph1}
                rows={isLandscape ? 2 : 3}
                onChange={(e) => handleFieldChange('bodyParagraph1', e.target.value)}
                className="w-full text-justify border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-1 outline-hidden resize-none print:border-none print:p-0 print:bg-transparent"
              />
            ) : (
              <p className="text-justify indent-8">{formatText(letter.bodyParagraph1)}</p>
            )}
          </div>

          {/* 5. Highlight Summary Statistics Table */}
          <div className="border border-black bg-slate-50/70 print:bg-transparent p-2.5 sm:p-3 rounded-xs text-xs font-sans space-y-1.5">
            <div className="flex items-center justify-between border-b border-black pb-1 font-bold uppercase text-[10.5px]">
              <span>Key Verified Agricultural Metrics</span>
              <span>Coverage Scope: {activeBarangay === 'ALL' ? 'Municipal-Wide' : `Brgy. ${activeBarangay}`}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="border-r border-slate-300 last:border-none pr-2">
                <span className="text-[9.5px] text-slate-600 print:text-black uppercase block">Total Rice Farmers</span>
                <strong className="text-xs sm:text-sm font-serif block text-black">{farmerCount} Registered</strong>
              </div>
              <div className="border-r border-slate-300 last:border-none pr-2">
                <span className="text-[9.5px] text-slate-600 print:text-black uppercase block">Physical Farm Area</span>
                <strong className="text-xs sm:text-sm font-serif block text-black">{totalAreaHa.toFixed(2)} Hectares</strong>
              </div>
              <div className="border-r border-slate-300 last:border-none pr-2">
                <span className="text-[9.5px] text-slate-600 print:text-black uppercase block">Cropping Season</span>
                <strong className="text-[11px] sm:text-xs font-serif block text-black truncate">{activeSeason}</strong>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-600 print:text-black uppercase block">Lead Seed Varieties</span>
                <strong className="text-[11px] sm:text-xs font-serif block text-black truncate" title={predominantVarieties}>
                  {predominantVarieties || 'NSIC Rc 222, Rc 160'}
                </strong>
              </div>
            </div>
          </div>

          {/* 6. Body Paragraph 2 */}
          <div className={bodyTextClass}>
            {onUpdateLetter && isEditable ? (
              <textarea
                value={letter.bodyParagraph2}
                rows={isLandscape ? 2 : 3}
                onChange={(e) => handleFieldChange('bodyParagraph2', e.target.value)}
                className="w-full text-justify border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-1 outline-hidden resize-none print:border-none print:p-0 print:bg-transparent"
              />
            ) : (
              <p className="text-justify indent-8">{formatText(letter.bodyParagraph2)}</p>
            )}
          </div>

          {/* When single page (portrait), also render closing statement and signatories below */}
          {(!totalPages || totalPages === 1) && (
            <>
              {letter.closingStatement && (
                <div className={bodyTextClass}>
                  {onUpdateLetter && isEditable ? (
                    <textarea
                      value={letter.closingStatement}
                      rows={2}
                      onChange={(e) => handleFieldChange('closingStatement', e.target.value)}
                      className="w-full text-justify border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-1 outline-hidden resize-none print:border-none print:p-0 print:bg-transparent"
                    />
                  ) : (
                    <p className="text-justify indent-8">{formatText(letter.closingStatement)}</p>
                  )}
                </div>
              )}

              {/* Signatories on single page */}
              <div className="mt-auto pt-6 border-t-2 border-black space-y-3 break-inside-avoid print:break-inside-avoid print:mt-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] uppercase tracking-wider font-extrabold text-slate-600 print:text-black">
                    Official Certification &amp; Signatures
                  </span>
                  {onUpdateLetter && isEditable && (
                    <button
                      type="button"
                      onClick={handleAddSignatory}
                      className="print:hidden px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <Plus size={13} />
                      <span>Add Signatory (Prepared / Reviewed / Noted)</span>
                    </button>
                  )}
                </div>

                <div
                  className={`grid gap-6 text-center ${
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
                    <div key={sig.id || `sig-${idx}`} className="space-y-1 relative group/sig p-1 rounded-lg">
                      {onUpdateLetter && isEditable && currentSignatories.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeleteSignatory(idx)}
                          className="print:hidden absolute -top-2 -right-2 p-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-full shadow-xs opacity-0 group-hover/sig:opacity-100 transition cursor-pointer"
                          title="Remove this signatory"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}

                      {onUpdateLetter && isEditable ? (
                        <input
                          type="text"
                          value={sig.roleLabel}
                          onChange={(e) => handleSignatoryChange(idx, 'roleLabel', e.target.value)}
                          className="text-xs font-bold text-black uppercase tracking-tight block w-full text-center border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent"
                        />
                      ) : (
                        <span className="text-xs font-bold text-black uppercase tracking-tight block text-center">
                          {sig.roleLabel}
                        </span>
                      )}

                      <div className="h-10 w-full select-none" />

                      <div className="space-y-0.5 w-full">
                        {onUpdateLetter && isEditable ? (
                          <div className="space-y-0.5">
                            <input
                              type="text"
                              value={sig.name}
                              placeholder="___________________________"
                              onChange={(e) => handleSignatoryChange(idx, 'name', e.target.value)}
                              className="font-bold text-black uppercase block w-full text-center text-xs border-b-2 border-black pb-0.5 hover:border-amber-500 focus:bg-amber-50/40 rounded-none px-1 py-0.5 outline-hidden print:border-black print:p-0 print:bg-transparent placeholder:text-black placeholder:font-normal"
                            />
                            <input
                              type="text"
                              value={sig.title}
                              placeholder="Signature over Printed Name / Designation"
                              onChange={(e) => handleSignatoryChange(idx, 'title', e.target.value)}
                              className="text-[10px] font-semibold text-slate-800 print:text-black uppercase block w-full text-center border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.5 outline-hidden print:border-none print:p-0 print:bg-transparent placeholder:text-slate-600 mt-0.5"
                            />
                          </div>
                        ) : (
                          <div>
                            {sig.name ? (
                              <p className="font-bold text-black uppercase text-xs tracking-wide border-b-2 border-black pb-0.5 min-h-[20px] text-center">
                                {sig.name}
                              </p>
                            ) : (
                              <div className="border-b-2 border-black pb-0.5 min-h-[20px] w-full" />
                            )}
                            <p className="text-[10px] font-semibold text-slate-800 print:text-black uppercase tracking-tight text-center mt-0.5">
                              {sig.title || '\u00A0'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Continuation prompt on Page 1 if multi-page */}
          {totalPages === 2 && pageNumber === 1 && (
            <div className="mt-auto pt-4 border-t border-slate-300 text-center font-mono text-[9pt] text-slate-600 italic">
              *** Document continues on Page 2 for Official Verification and Signatures ***
            </div>
          )}
        </>
      )}

      {/* Word-Style Official Print Document Footer */}
      <div className="hidden print:flex items-center justify-between text-[8pt] font-mono text-slate-700 border-t border-black pt-1.5 mt-4">
        <span>MEMO REF: {letter.memoRef || 'SLG-MAO-RICE-2024-02B'}</span>
        <span>DATE PRINTED: {letter.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        <span className="print-page-number"></span>
      </div>

      {/* Unified Global Logo Editor Modal */}
      <ReportLogoEditorModal
        isOpen={editingLogo !== null}
        onClose={() => setEditingLogo(null)}
        logoType={editingLogo}
      />
    </div>
  );
};
