import React, { useState, useRef } from 'react';
import {
  IrrigatorsDirectoryLetterData,
  IrrigatorsAssociationItem,
  saveIrrigatorsLetterData
} from '../data/irrigatorsData';
import { OfficialSignatory } from '../types';
import { SilagoSeal, BagongPilipinasLogo } from './Seals';
import { useApp } from '../context/AppContext';
import {
  Edit3,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Camera,
  Layers,
  Sparkles,
  Smartphone,
  Mail
} from 'lucide-react';

interface OfficialIrrigatorsDirectoryDocumentProps {
  data: IrrigatorsDirectoryLetterData;
  onUpdateData?: (updated: IrrigatorsDirectoryLetterData) => void;
  isEditable?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export const OfficialIrrigatorsDirectoryDocument: React.FC<OfficialIrrigatorsDirectoryDocumentProps> = ({
  data,
  onUpdateData,
  isEditable = true,
  orientation = 'portrait'
}) => {
  const { silagoLogoUrl, bagongPilipinasLogoUrl } = useApp();
  const [justSaved, setJustSaved] = useState(false);

  const handleFieldChange = <K extends keyof IrrigatorsDirectoryLetterData>(
    field: K,
    val: IrrigatorsDirectoryLetterData[K]
  ) => {
    const updated = { ...data, [field]: val };
    if (onUpdateData) {
      onUpdateData(updated);
    } else {
      saveIrrigatorsLetterData(updated);
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
            roleLabel: 'Noted by:',
            name: data.notedByName || 'CAREIN M. TOMOL',
            title: data.notedByTitle || 'MAO-OIC'
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
      roleLabel: 'Approved by:',
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

  const handleAssociationChange = (
    index: number,
    field: keyof IrrigatorsAssociationItem,
    val: string
  ) => {
    const updatedAssoc = data.associations.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: val };
      }
      return item;
    });
    handleFieldChange('associations', updatedAssoc);
  };

  const handleAddAssociation = () => {
    const newItem: IrrigatorsAssociationItem = {
      id: `ia-${Date.now()}`,
      associationName: 'NEW IRRIGATORS ASSOCIATION NAME',
      contactPerson: 'CONTACT PERSON NAME',
      barangay: 'BARANGAY NAME'
    };
    handleFieldChange('associations', [...data.associations, newItem]);
  };

  const handleDeleteAssociation = (index: number) => {
    if (data.associations.length <= 1) {
      alert('At least one association should remain on the document.');
      return;
    }
    const updated = data.associations.filter((_, idx) => idx !== index);
    handleFieldChange('associations', updated);
  };

  const isLandscape = orientation === 'landscape';

  return (
    <div className="flex flex-col flex-1 justify-between min-h-full text-black font-sans relative space-y-4 max-w-4xl mx-auto leading-tight transition-all">
      {/* Live Direct Editing Status Bar (Screen only) */}
      {onUpdateData && isEditable && (
        <div className="print:hidden bg-amber-50/90 border border-amber-300 text-amber-950 px-3.5 py-2 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs shadow-xs mb-3">
          <div className="flex items-center gap-2">
            <Edit3 size={15} className="text-amber-700 animate-pulse shrink-0" />
            <div>
              <span className="font-bold">Direct On-Letter Live Editing Active:</span>{' '}
              <span className="text-amber-800">
                You can edit headers, hectare metrics, associations, contact persons, and signatories directly on this official letter.
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
            <span className="text-[10px] bg-amber-200/70 text-amber-900 font-mono px-2 py-0.5 rounded font-semibold">
              Exact Photo 2 Template
            </span>
          </div>
        </div>
      )}

      {/* TOP HEADER: Silago Seal (Left) • Headers (Center) • Bagong Pilipinas (Right) */}
      <div className="flex items-center justify-between pb-3 pt-1 px-4 sm:px-8 relative border-b border-transparent">
        {/* Left: Silago Municipal Seal */}
        <div className="flex-shrink-0">
          <SilagoSeal size={isLandscape ? 68 : 58} customUrl={silagoLogoUrl} />
        </div>

        {/* Center: Official Government Sub-headers */}
        <div className="text-center flex-1 px-2 space-y-0.5">
          {onUpdateData && isEditable ? (
            <div className="space-y-0.5">
              <input
                type="text"
                value={data.republicHeader}
                onChange={(e) => handleFieldChange('republicHeader', e.target.value)}
                className="text-center font-serif text-black text-xs sm:text-sm font-normal w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent"
              />
              <input
                type="text"
                value={data.provinceHeader}
                onChange={(e) => handleFieldChange('provinceHeader', e.target.value)}
                className="text-center font-serif text-black text-xs sm:text-sm font-normal w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent"
              />
              <input
                type="text"
                value={data.municipalityHeader}
                onChange={(e) => handleFieldChange('municipalityHeader', e.target.value)}
                className="text-center font-serif text-black text-xs sm:text-sm font-medium w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent"
              />
            </div>
          ) : (
            <>
              <p className="font-serif text-xs sm:text-sm text-black tracking-normal">
                {data.republicHeader}
              </p>
              <p className="font-serif text-xs sm:text-sm text-black tracking-normal">
                {data.provinceHeader}
              </p>
              <p className="font-serif text-xs sm:text-sm text-black tracking-normal">
                {data.municipalityHeader}
              </p>
            </>
          )}
        </div>

        {/* Right: Bagong Pilipinas Official Logo */}
        <div className="flex-shrink-0 flex flex-col items-center">
          <BagongPilipinasLogo size={isLandscape ? 58 : 50} showText={true} customUrl={bagongPilipinasLogoUrl} />
        </div>
      </div>

      {/* OFFICE OF THE MUNICIPAL AGRICULTURAL SERVICES (Main Title) */}
      <div className="text-center pt-2 pb-3">
        {onUpdateData && isEditable ? (
          <input
            type="text"
            value={data.officeHeader}
            onChange={(e) => handleFieldChange('officeHeader', e.target.value)}
            className="text-center font-sans font-black tracking-wide text-black text-sm sm:text-base md:text-lg uppercase w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs outline-hidden print:border-none print:bg-transparent"
          />
        ) : (
          <h1 className="font-sans font-black tracking-wide text-black text-sm sm:text-base md:text-lg uppercase">
            {data.officeHeader}
          </h1>
        )}
      </div>

      {/* BODY CONTENT & METRIC ARROWS */}
      <div className="space-y-3 sm:space-y-4 px-2 sm:px-6 text-xs sm:text-[13px] font-sans">
        {/* Item 1: Total Area of Irrigated Rice Lands */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-black">
            <span className="text-black font-serif font-black text-sm">➤</span>
            <span>Total Area of Irrigated Rice Lands</span>
          </div>
          <div className="pl-6 font-bold text-black">
            {onUpdateData && isEditable ? (
              <div className="inline-flex items-center gap-1">
                <span>(</span>
                <input
                  type="number"
                  value={data.totalIrrigatedAreaHa}
                  onChange={(e) => handleFieldChange('totalIrrigatedAreaHa', Number(e.target.value))}
                  className="w-16 font-bold text-black border-b border-black text-center focus:bg-amber-50 outline-hidden"
                />
                <span>hectare)</span>
              </div>
            ) : (
              <span>({data.totalIrrigatedAreaHa} hectare)</span>
            )}
          </div>
        </div>

        {/* Item 2: Total Area of Rainfed Rice Land */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-black">
            <span className="text-black font-serif font-black text-sm">➤</span>
            <span>Total Area of Rainfed Rice Land</span>
          </div>
          <div className="pl-6 font-bold text-black">
            {onUpdateData && isEditable ? (
              <div className="inline-flex items-center gap-1">
                <span>(</span>
                <input
                  type="number"
                  value={data.totalRainfedAreaHa}
                  onChange={(e) => handleFieldChange('totalRainfedAreaHa', Number(e.target.value))}
                  className="w-16 font-bold text-black border-b border-black text-center focus:bg-amber-50 outline-hidden"
                />
                <span>hectare)</span>
              </div>
            ) : (
              <span>({data.totalRainfedAreaHa} hectare)</span>
            )}
          </div>
        </div>

        {/* Item 3: Total Number of Rice Farmers */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 font-bold text-black">
            <span className="text-black font-serif font-black text-sm">➤</span>
            <span>Total Number of Rice Farmers</span>
          </div>
          <div className="pl-6 font-bold text-black uppercase">
            {onUpdateData && isEditable ? (
              <div className="inline-flex items-center gap-1">
                <span>(</span>
                <input
                  type="number"
                  value={data.totalRiceFarmersCount}
                  onChange={(e) => handleFieldChange('totalRiceFarmersCount', Number(e.target.value))}
                  className="w-16 font-bold text-black border-b border-black text-center focus:bg-amber-50 outline-hidden"
                />
                <span>RICE FARMER)</span>
              </div>
            ) : (
              <span>({data.totalRiceFarmersCount} RICE FARMER)</span>
            )}
          </div>
        </div>

        {/* Item 4: Name of Irrigators Association/ Contact Person */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 font-bold text-black">
              <span className="text-black font-serif font-black text-sm">➤</span>
              <span>Name of Irrigators Association/ Contact Person</span>
            </div>

            <div className="flex items-center gap-1.5 print:hidden">
              {onUpdateData && isEditable && (
                <button
                  type="button"
                  onClick={handleAddAssociation}
                  className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                >
                  <Plus size={12} />
                  <span>Add Association</span>
                </button>
              )}
            </div>
          </div>

          {/* List of 16 Irrigators Associations */}
          <div className="pl-6 sm:pl-8 space-y-1.5 text-xs">
            {data.associations.map((item, idx) => (
              <div key={item.id || idx} className="relative group/assoc py-0.5">
                {/* Action buttons (Screen only) */}
                <div className="print:hidden absolute -left-12 top-0.5 flex items-center gap-1 opacity-0 group-hover/assoc:opacity-100 transition">
                  {onUpdateData && isEditable && data.associations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteAssociation(idx)}
                      className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                      title="Remove this association"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {/* Association Name */}
                <div className="flex items-start gap-1.5 font-bold text-black uppercase tracking-tight">
                  <span className="text-black font-black select-none">•</span>
                  {onUpdateData && isEditable ? (
                    <input
                      type="text"
                      value={item.associationName}
                      onChange={(e) => handleAssociationChange(idx, 'associationName', e.target.value)}
                      className="font-bold text-black uppercase w-full border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 py-0.2 outline-hidden text-xs print:border-none print:p-0 print:bg-transparent"
                    />
                  ) : (
                    <span>{item.associationName}</span>
                  )}
                </div>

                {/* Contact Person & Barangay */}
                <div className="pl-3.5 text-black font-normal text-[11.5px] uppercase">
                  {onUpdateData && isEditable ? (
                    <div className="inline-flex items-center gap-1">
                      <span>(</span>
                      <input
                        type="text"
                        value={item.contactPerson}
                        placeholder="Contact Person Name"
                        onChange={(e) => handleAssociationChange(idx, 'contactPerson', e.target.value)}
                        className="font-normal text-black uppercase border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden text-[11px] print:border-none print:p-0 print:bg-transparent"
                      />
                      <span>-</span>
                      <input
                        type="text"
                        value={item.barangay}
                        placeholder="Barangay"
                        onChange={(e) => handleAssociationChange(idx, 'barangay', e.target.value)}
                        className="font-normal text-black uppercase border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-amber-50/40 rounded-xs px-1 outline-hidden text-[11px] print:border-none print:p-0 print:bg-transparent"
                      />
                      <span>)</span>
                    </div>
                  ) : (
                    <span>({item.contactPerson}- {item.barangay})</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SIGNATORIES BLOCK AT BOTTOM (Fully Customizable, Clean & Aligned) */}
      <div className="mt-auto pt-8 px-2 sm:px-6 pb-4 border-t-2 border-black space-y-3 break-inside-avoid print:break-inside-avoid print:mt-auto">
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
    </div>
  );
};
