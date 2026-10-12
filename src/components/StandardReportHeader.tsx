import React from 'react';
import { useApp } from '../context/AppContext';
import { DaLogo, SilagoSeal, SouthernLeyteSeal } from './Seals';
import { ReportLogoType } from './ReportLogoEditorModal';
import { Camera } from 'lucide-react';

interface StandardReportHeaderProps {
  republicHeader?: string;
  provinceHeader?: string;
  municipalityHeader?: string;
  officeHeader?: string;
  isEditable?: boolean;
  onEditLogo?: (logoType: ReportLogoType) => void;
  className?: string;
}

/**
 * StandardReportHeader
 * Standardized across all 4 reports (Letter, Irrigators Directory, MPCSRS Report, Masterlist Registry)
 * Layout matches top-left app branding:
 * [Logo 1: Department of Agriculture] [Logo 2: Municipality of Silago Seal] [Logo 3: Province of Southern Leyte Seal]
 * All sized h-14 w-14 object-contain center-aligned above:
 * Republic of the Philippines
 * Province of Southern Leyte
 * MUNICIPALITY OF SILAGO
 * MUNICIPAL AGRICULTURE OFFICE
 */
export const StandardReportHeader: React.FC<StandardReportHeaderProps> = ({
  republicHeader = 'Republic of the Philippines',
  provinceHeader = 'Province of Southern Leyte',
  municipalityHeader = 'MUNICIPALITY OF SILAGO',
  officeHeader = 'MUNICIPAL AGRICULTURE OFFICE',
  isEditable = false,
  onEditLogo,
  className = ''
}) => {
  const { daLogoUrl, silagoLogoUrl, southernLeyteLogoUrl } = useApp();

  return (
    <div className={`flex flex-col items-center justify-center pb-3 border-b-2 border-black text-center select-none ${className}`}>
      {/* Logos Container: DA • Silago • Southern Leyte */}
      <div className="flex items-center justify-center gap-6 mb-2">
        {/* Logo 1: Department of Agriculture / Bagong Silago */}
        <div className="relative group/logo h-14 w-14 flex items-center justify-center shrink-0">
          <div
            onClick={() => isEditable && onEditLogo?.('da')}
            className={`h-14 w-14 flex items-center justify-center shrink-0 ${isEditable ? 'cursor-pointer hover:opacity-85' : ''}`}
            title={isEditable ? 'Click to change Department of Agriculture logo' : 'Department of Agriculture'}
          >
            <DaLogo size={56} customUrl={daLogoUrl || undefined} className="h-14 w-14 object-contain" />
          </div>
          {isEditable && (
            <button
              type="button"
              onClick={() => onEditLogo?.('da')}
              className="print:hidden absolute -bottom-1 -right-1 bg-white hover:bg-amber-100 text-amber-900 p-0.5 rounded-full shadow-xs border border-amber-300 cursor-pointer transition opacity-70 group-hover/logo:opacity-100"
              title="Change DA Seal"
            >
              <Camera size={10} />
            </button>
          )}
        </div>

        {/* Logo 2: Municipality of Silago Seal */}
        <div className="relative group/logo h-14 w-14 flex items-center justify-center shrink-0">
          <div
            onClick={() => isEditable && onEditLogo?.('silago')}
            className={`h-14 w-14 flex items-center justify-center shrink-0 ${isEditable ? 'cursor-pointer hover:opacity-85' : ''}`}
            title={isEditable ? 'Click to change Municipality of Silago Seal' : 'Municipality of Silago'}
          >
            <SilagoSeal size={56} customUrl={silagoLogoUrl || undefined} className="h-14 w-14 object-contain" />
          </div>
          {isEditable && (
            <button
              type="button"
              onClick={() => onEditLogo?.('silago')}
              className="print:hidden absolute -bottom-1 -right-1 bg-white hover:bg-amber-100 text-amber-900 p-0.5 rounded-full shadow-xs border border-amber-300 cursor-pointer transition opacity-70 group-hover/logo:opacity-100"
              title="Change Silago Seal"
            >
              <Camera size={10} />
            </button>
          )}
        </div>

        {/* Logo 3: Province of Southern Leyte Seal */}
        <div className="relative group/logo h-14 w-14 flex items-center justify-center shrink-0">
          <div
            onClick={() => isEditable && onEditLogo?.('southernLeyte')}
            className={`h-14 w-14 flex items-center justify-center shrink-0 ${isEditable ? 'cursor-pointer hover:opacity-85' : ''}`}
            title={isEditable ? 'Click to change Southern Leyte Seal' : 'Province of Southern Leyte'}
          >
            <SouthernLeyteSeal size={56} customUrl={southernLeyteLogoUrl || undefined} className="h-14 w-14 object-contain" />
          </div>
          {isEditable && (
            <button
              type="button"
              onClick={() => onEditLogo?.('southernLeyte')}
              className="print:hidden absolute -bottom-1 -right-1 bg-white hover:bg-amber-100 text-amber-900 p-0.5 rounded-full shadow-xs border border-amber-300 cursor-pointer transition opacity-70 group-hover/logo:opacity-100"
              title="Change Southern Leyte Seal"
            >
              <Camera size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Official Hierarchy Text */}
      <div className="text-center">
        <p className="text-xs sm:text-[13px] font-sans tracking-wide text-black font-normal leading-tight">
          {republicHeader}
        </p>
        <p className="text-xs sm:text-[13px] font-sans tracking-wide text-black font-normal leading-tight">
          {provinceHeader}
        </p>
        <h1 className="text-sm sm:text-base font-serif font-black tracking-wider text-black uppercase leading-tight mt-0.5">
          {municipalityHeader}
        </h1>
        <h2 className="text-xs sm:text-[13px] font-sans font-black tracking-wide text-black uppercase leading-tight mt-0.5">
          {officeHeader}
        </h2>
      </div>
    </div>
  );
};
