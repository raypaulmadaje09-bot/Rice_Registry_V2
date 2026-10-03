import React, { useState, useRef } from 'react';
import { OfficialReportLetter } from '../data/reportLetters';
import { BagongPilipinasLogo, SilagoSeal, SouthernLeyteSeal } from './Seals';
import { useApp } from '../context/AppContext';
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
  orientation = 'portrait'
}) => {
  const {
    bagongPilipinasLogoUrl,
    setBagongPilipinasLogoUrl,
    southernLeyteLogoUrl,
    setSouthernLeyteLogoUrl,
    silagoLogoUrl,
    setSilagoLogoUrl
  } = useApp();

  const [justSaved, setJustSaved] = useState(false);
  const [editingLogo, setEditingLogo] = useState<'bagongPilipinas' | 'southernLeyte' | 'silago' | null>(null);
  const [logoInputUrl, setLogoInputUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleOpenLogoEditor = (which: 'bagongPilipinas' | 'southernLeyte' | 'silago') => {
    setEditingLogo(which);
    if (which === 'bagongPilipinas') setLogoInputUrl(bagongPilipinasLogoUrl || '');
    if (which === 'southernLeyte') setLogoInputUrl(southernLeyteLogoUrl || '');
    if (which === 'silago') setLogoInputUrl(silagoLogoUrl || '');
  };

  const handleApplyLogoUrl = () => {
    if (!editingLogo) return;
    if (editingLogo === 'bagongPilipinas') setBagongPilipinasLogoUrl(logoInputUrl.trim() || undefined);
    if (editingLogo === 'southernLeyte') setSouthernLeyteLogoUrl(logoInputUrl.trim() || undefined);
    if (editingLogo === 'silago') setSilagoLogoUrl(logoInputUrl.trim() || undefined);
    setEditingLogo(null);
  };

  const handleResetLogo = () => {
    if (!editingLogo) return;
    if (editingLogo === 'bagongPilipinas') setBagongPilipinasLogoUrl(undefined);
    if (editingLogo === 'southernLeyte') setSouthernLeyteLogoUrl(undefined);
    if (editingLogo === 'silago') setSilagoLogoUrl(undefined);
    setEditingLogo(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLogo) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (editingLogo === 'bagongPilipinas') setBagongPilipinasLogoUrl(dataUrl);
      if (editingLogo === 'southernLeyte') setSouthernLeyteLogoUrl(dataUrl);
      if (editingLogo === 'silago') setSilagoLogoUrl(dataUrl);
      setEditingLogo(null);
    };
    reader.readAsDataURL(file);
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
      {/* Hidden File Input for Logo Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

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

      {/* 1. Official Government Letterhead (The 3 Logos Placed Above Republic of the Philippines) */}
      <div className="flex flex-col items-center justify-center pb-3 border-b-2 border-black relative">
        {/* 3 Government Logos: Bagong Pilipinas, Province of Southern Leyte, Municipality of Silago */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-2">
          {/* Logo 1: Bagong Pilipinas */}
          <div className="relative group/logo">
            <BagongPilipinasLogo size={logoSize} showText={true} />
            {isEditable && (
              <button
                type="button"
                onClick={() => handleOpenLogoEditor('bagongPilipinas')}
                className="print:hidden absolute -bottom-1 -right-1 bg-white hover:bg-amber-100 text-amber-900 p-1 rounded-full shadow-xs border border-amber-300 cursor-pointer transition opacity-70 group-hover/logo:opacity-100"
                title="Change or upload Bagong Pilipinas Logo"
              >
                <Camera size={11} />
              </button>
            )}
          </div>

          {/* Logo 2: Southern Leyte Seal */}
          <div className="relative group/logo">
            <SouthernLeyteSeal size={logoSize + 4} />
            {isEditable && (
              <button
                type="button"
                onClick={() => handleOpenLogoEditor('southernLeyte')}
                className="print:hidden absolute -bottom-1 -right-1 bg-white hover:bg-amber-100 text-amber-900 p-1 rounded-full shadow-xs border border-amber-300 cursor-pointer transition opacity-70 group-hover/logo:opacity-100"
                title="Change or upload Province of Southern Leyte Seal"
              >
                <Camera size={11} />
              </button>
            )}
          </div>

          {/* Logo 3: Municipality of Silago Seal */}
          <div className="relative group/logo">
            <SilagoSeal size={logoSize + 4} />
            {isEditable && (
              <button
                type="button"
                onClick={() => handleOpenLogoEditor('silago')}
                className="print:hidden absolute -bottom-1 -right-1 bg-white hover:bg-amber-100 text-amber-900 p-1 rounded-full shadow-xs border border-amber-300 cursor-pointer transition opacity-70 group-hover/logo:opacity-100"
                title="Change or upload Municipality of Silago Seal"
              >
                <Camera size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Official Header Hierarchy (Directly Editable on Letter) */}
        <div className="text-center w-full max-w-xl space-y-0.5">
          {onUpdateLetter && isEditable ? (
            <div className="space-y-0.5">
              <input
                type="text"
                value={letter.countryHeader || 'Republic of the Philippines'}
                onChange={(e) => handleFieldChange('countryHeader', e.target.value)}
                className={`text-center font-sans tracking-wide text-black font-normal w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent ${headingSubClass}`}
                title="Click to edit country header"
              />
              <input
                type="text"
                value={letter.provinceHeader || 'Province of Southern Leyte'}
                onChange={(e) => handleFieldChange('provinceHeader', e.target.value)}
                className={`text-center font-sans tracking-wide text-black font-normal w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent ${headingSubClass}`}
                title="Click to edit province header"
              />
              <input
                type="text"
                value={letter.municipalityHeader || 'MUNICIPALITY OF SILAGO'}
                onChange={(e) => handleFieldChange('municipalityHeader', e.target.value)}
                className={`text-center text-black leading-tight w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent ${headingH1Class}`}
                title="Click to edit municipality header"
              />
              <input
                type="text"
                value={letter.officeHeader || 'Municipal Agriculture Office'}
                onChange={(e) => handleFieldChange('officeHeader', e.target.value)}
                className={`text-center font-sans font-black tracking-wide text-black uppercase leading-tight w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent ${headingSubClass}`}
                title="Click to edit department office title"
              />
            </div>
          ) : (
            <>
              <p className={`text-black font-normal leading-tight ${headingSubClass}`}>
                {letter.countryHeader || 'Republic of the Philippines'}
              </p>
              <p className={`text-black font-normal leading-tight ${headingSubClass}`}>
                {letter.provinceHeader || 'Province of Southern Leyte'}
              </p>
              <h1 className={`text-black leading-tight mt-0.5 ${headingH1Class}`}>
                {letter.municipalityHeader || 'MUNICIPALITY OF SILAGO'}
              </h1>
              <h2 className={`font-sans font-black tracking-wide text-black uppercase leading-tight mt-0.5 ${headingSubClass}`}>
                {letter.officeHeader || 'Municipal Agriculture Office'}
              </h2>
            </>
          )}
        </div>
      </div>

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
            rows={isLandscape ? 3 : 4}
            onChange={(e) => handleFieldChange('bodyParagraph1', e.target.value)}
            className="w-full text-justify border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-1 outline-hidden resize-none print:border-none print:p-0 print:bg-transparent"
          />
        ) : (
          <p className="text-justify indent-8">{formatText(letter.bodyParagraph1)}</p>
        )}
      </div>

      {/* 5. Highlight Summary Statistics Table */}
      <div className="border border-black bg-slate-50/70 print:bg-transparent p-3 sm:p-4 rounded-xs text-xs font-sans space-y-2">
        <div className="flex items-center justify-between border-b border-black pb-1 font-bold uppercase text-[10.5px] sm:text-xs">
          <span>Key Verified Agricultural Metrics</span>
          <span>Coverage Scope: {activeBarangay === 'ALL' ? 'Municipal-Wide' : `Brgy. ${activeBarangay}`}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center pt-1">
          <div className="border-r border-slate-300 last:border-none pr-2">
            <span className="text-[10px] text-slate-600 print:text-black uppercase block">Total Rice Farmers</span>
            <strong className="text-sm sm:text-base font-serif block text-black">{farmerCount} Registered</strong>
          </div>
          <div className="border-r border-slate-300 last:border-none pr-2">
            <span className="text-[10px] text-slate-600 print:text-black uppercase block">Physical Farm Area</span>
            <strong className="text-sm sm:text-base font-serif block text-black">{totalAreaHa.toFixed(2)} Hectares</strong>
          </div>
          <div className="border-r border-slate-300 last:border-none pr-2">
            <span className="text-[10px] text-slate-600 print:text-black uppercase block">Cropping Season</span>
            <strong className="text-xs sm:text-sm font-serif block text-black truncate">{activeSeason}</strong>
          </div>
          <div>
            <span className="text-[10px] text-slate-600 print:text-black uppercase block">Lead Seed Varieties</span>
            <strong className="text-xs sm:text-[13px] font-serif block text-black truncate" title={predominantVarieties}>
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
            rows={isLandscape ? 3 : 4}
            onChange={(e) => handleFieldChange('bodyParagraph2', e.target.value)}
            className="w-full text-justify border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1.5 py-1 outline-hidden resize-none print:border-none print:p-0 print:bg-transparent"
          />
        ) : (
          <p className="text-justify indent-8">{formatText(letter.bodyParagraph2)}</p>
        )}
      </div>

      {/* 7. Closing Statement */}
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

      {/* 8. Fully Manageable Official Signatories Block (Add, Edit, Delete) */}
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
              {/* Delete button (Screen only, in edit mode) */}
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

              {/* Editable Signatory Role Label */}
              {onUpdateLetter && isEditable ? (
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

              {/* Open 48px blank space specifically reserved for manual pen signature */}
              <div className="h-12 w-full select-none" />

              {/* Signature Line, Name, and Designation */}
              <div className="space-y-0.5 w-full">
                {onUpdateLetter && isEditable ? (
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

      {/* POPUP / MODAL: DIRECT LOGO CHANGER (Screen-Only) */}
      {editingLogo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  {editingLogo === 'bagongPilipinas' && 'Configure Bagong Pilipinas Logo'}
                  {editingLogo === 'southernLeyte' && 'Configure Southern Leyte Province Seal'}
                  {editingLogo === 'silago' && 'Configure Municipality of Silago Seal'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLogo(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Update the official seal shown on the letter header. You can upload an image file from your device, provide an image web URL, or revert to the official default vector emblem.
            </p>

            <div className="space-y-3">
              {/* Option 1: File Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/50 hover:bg-blue-50 text-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Upload size={15} />
                <span>Upload Logo File from Computer</span>
              </button>

              {/* Option 2: Image Web URL */}
              <div className="space-y-1">
                <label className="text-[10.5px] font-bold text-slate-600 uppercase">Or Enter Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={logoInputUrl}
                    onChange={(e) => setLogoInputUrl(e.target.value)}
                    placeholder="https://example.com/seal.png"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs outline-hidden focus:border-blue-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLogoUrl}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleResetLogo}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-rose-600 font-semibold flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw size={13} />
                <span>Reset to Default Seal</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingLogo(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
