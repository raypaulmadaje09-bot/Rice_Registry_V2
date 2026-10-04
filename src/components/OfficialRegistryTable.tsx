import React, { useState, useEffect, useMemo } from 'react';
import { FarmParcel, OfficialSignatory } from '../types';
import { BagongPilipinasLogo, SilagoSeal, SouthernLeyteSeal, DaLogo } from './Seals';
import { CustomTableData } from './TableEditorModal';
import { Plus, Trash2, Edit3, CheckCircle2, RotateCcw } from 'lucide-react';
import { supabaseDb, sortParcelsAlphabetically } from '../utils/supabaseClient';

interface OfficialRegistryTableProps {
  reportParcels: FarmParcel[];
  visibleColumns: Record<string, boolean>;
  totalAreaHa: number;
  memoRef: string;
  reportDate: string;
  selectedBarangay: string;
  preparedBy?: string;
  preparedTitle?: string;
  reviewedBy?: string;
  reviewedTitle?: string;
  approvedBy?: string;
  approvedTitle?: string;
  signatories?: OfficialSignatory[];
  onUpdateSignatories?: (signatories: OfficialSignatory[]) => void;
  isEditable?: boolean;
  orientation?: 'portrait' | 'landscape';
  customTableData?: CustomTableData | null;
  columnOrder?: string[];
}

// Helper to parse names into family, given, middle
const parseFarmerName = (parcel: FarmParcel) => {
  if (parcel.farmerFamilyName && parcel.farmerGivenName) {
    return {
      family: parcel.farmerFamilyName.trim().toUpperCase(),
      given: parcel.farmerGivenName.trim().toUpperCase(),
      middle: (parcel.farmerMiddleName || '').trim().toUpperCase()
    };
  }
  const raw = (parcel.raiserName || '').trim();
  if (!raw) {
    return { family: '', given: '', middle: '' };
  }
  if (raw.includes(',')) {
    const [last, rest] = raw.split(',');
    const restParts = (rest || '').trim().split(/\s+/).filter(Boolean);
    const given = restParts[0] ? restParts[0].toUpperCase() : '';
    const middle = restParts.slice(1).join(' ').toUpperCase();
    return {
      family: last.trim().toUpperCase(),
      given,
      middle
    };
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { family: parts[0].toUpperCase(), given: '', middle: '' };
  }
  if (parts.length === 2) {
    return { family: parts[1].toUpperCase(), given: parts[0].toUpperCase(), middle: '' };
  }
  const family = parts[parts.length - 1].toUpperCase();
  const given = parts.slice(0, parts.length - 2).join(' ').toUpperCase() || parts[0].toUpperCase();
  const middle = parts[parts.length - 2].toUpperCase();
  return { family, given, middle };
};

const formatBirthday = (raw?: string) => {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    return trimmed;
  }
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) {
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }
  return trimmed;
};

export const OfficialRegistryTable: React.FC<OfficialRegistryTableProps> = ({
  reportParcels,
  visibleColumns,
  customTableData,
  totalAreaHa,
  memoRef,
  reportDate,
  selectedBarangay,
  preparedBy,
  preparedTitle,
  reviewedBy,
  reviewedTitle,
  approvedBy,
  approvedTitle,
  signatories,
  onUpdateSignatories,
  isEditable = false,
  orientation = 'landscape',
  columnOrder
}) => {
  const isLandscape = orientation === 'landscape';

  const DEFAULT_SEQUENCE = [
    'rsbsaNo',
    'farmerName',
    'barangay',
    'municipality',
    'province',
    'birthday',
    'farmLocation',
    'latitude',
    'longitude',
    'farmArea',
    'commodity'
  ];

  const effectiveOrder = columnOrder && columnOrder.length > 0 ? columnOrder : DEFAULT_SEQUENCE;
  const isDefaultSequence = effectiveOrder.every((id, idx) => id === DEFAULT_SEQUENCE[idx]);
  const activeOrderedColumns = effectiveOrder.filter((k) => visibleColumns[k]);

  const COLUMN_DEF_MAP: Record<string, { label: string; width: string }> = {
    rsbsaNo: { label: 'RSBSA NO.', width: '13%' },
    farmerName: { label: 'FARMER NAME', width: '19%' },
    familyName: { label: 'FAMILY NAME', width: '8%' },
    givenName: { label: 'GIVEN NAME', width: '8%' },
    middleName: { label: 'MIDDLE NAME', width: '6%' },
    barangay: { label: 'BARANGAY', width: '9%' },
    municipality: { label: 'MUNICIPALITY', width: '7%' },
    province: { label: 'PROVINCE', width: '8%' },
    birthday: { label: 'BIRTHDAY', width: '7%' },
    farmLocation: { label: 'FARM LOCATION', width: '11%' },
    latitude: { label: 'LATITUDE', width: '8%' },
    longitude: { label: 'LONGITUDE', width: '8%' },
    farmArea: { label: 'FARM AREA (ha)', width: '6%' },
    commodity: { label: 'COMMODITY', width: '6%' }
  };

  const renderCellByColId = (colId: string, p: FarmParcel, family: string, given: string, middle: string, bday: string, farmLoc: string) => {
    switch (colId) {
      case 'rsbsaNo':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 font-mono text-[10px] print:text-[8.5px] font-bold text-center whitespace-nowrap align-middle">
            {p.swineNameOrId || 'NO RSBSA'}
          </td>
        );
      case 'farmerName':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 font-bold text-left uppercase break-words align-middle">
            {family && given ? `${family}, ${given}${middle ? ` ${middle}` : ''}` : (p.raiserName || '-')}
          </td>
        );
      case 'familyName':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 font-bold text-left uppercase whitespace-nowrap">
            {family}
          </td>
        );
      case 'givenName':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 font-bold text-left uppercase whitespace-nowrap">
            {given}
          </td>
        );
      case 'middleName':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 font-bold text-left uppercase whitespace-nowrap">
            {middle}
          </td>
        );
      case 'barangay':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center uppercase whitespace-nowrap">
            {p.barangay.toUpperCase()}
          </td>
        );
      case 'municipality':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center uppercase whitespace-nowrap">
            SILAGO
          </td>
        );
      case 'province':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center uppercase whitespace-nowrap">
            SOUTHERN LEYTE
          </td>
        );
      case 'birthday':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center font-mono whitespace-nowrap">
            {bday}
          </td>
        );
      case 'farmLocation':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center uppercase whitespace-nowrap">
            {farmLoc}
          </td>
        );
      case 'latitude':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center font-mono text-[10px] print:text-[8.5px] whitespace-nowrap">
            {p.lat ? p.lat.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : ''}
          </td>
        );
      case 'longitude':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center font-mono text-[10px] print:text-[8.5px] whitespace-nowrap">
            {p.lng ? p.lng.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : ''}
          </td>
        );
      case 'farmArea': {
        const val = Number(p.weightKg ?? p.areaHa ?? (p as any).farm_area_ha ?? 0);
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center font-mono font-bold whitespace-nowrap">
            {val > 0 ? val.toFixed(2) : ''}
          </td>
        );
      }
      case 'commodity':
        return (
          <td key={colId} className="border border-black px-1.5 py-1 text-center font-bold uppercase whitespace-nowrap">
            {p.commodity?.toUpperCase() || 'RICE'}
          </td>
        );
      default:
        return null;
    }
  };

  // Initial Signatories state resolution
  const getInitialSignatories = (): OfficialSignatory[] => {
    if (signatories && signatories.length > 0) return signatories;
    return [
      {
        id: 'reg-sig-1',
        roleLabel: 'PREPARED & VERIFIED BY:',
        name: preparedBy || 'WELLA S. BONGON',
        title: preparedTitle || 'Rice Technician / Agricultural Technologist'
      },
      {
        id: 'reg-sig-2',
        roleLabel: 'REVIEWED & CERTIFIED BY:',
        name: reviewedBy || 'JUNIE T. ELMIDO',
        title: reviewedTitle || 'Municipal / Technical Officer'
      },
      {
        id: 'reg-sig-3',
        roleLabel: 'NOTED & APPROVED BY:',
        name: approvedBy || 'HON. LEMUEL D. HONRADO',
        title: approvedTitle || 'Municipal Mayor'
      }
    ];
  };

  const [currentSignatories, setCurrentSignatories] = useState<OfficialSignatory[]>(getInitialSignatories);
  const [isLocalEditing, setIsLocalEditing] = useState<boolean>(false);

  // Alphabetical sorting A-Z by family_name, secondary by given_name
  const sortedReportParcels = useMemo(
    () => sortParcelsAlphabetically(reportParcels),
    [reportParcels]
  );

  // Sync when incoming prop changes or load from Supabase cloud database
  useEffect(() => {
    if (signatories && signatories.length > 0) {
      setCurrentSignatories(signatories);
    } else {
      supabaseDb.getSetting<OfficialSignatory[]>('silago_registry_table_signatories').then((saved) => {
        if (Array.isArray(saved) && saved.length > 0) {
          setCurrentSignatories(saved);
        }
      });
    }
  }, [signatories]);

  const isEditing = isEditable || isLocalEditing;

  const handleSignatoryChange = (index: number, field: keyof OfficialSignatory, val: string) => {
    const updated = currentSignatories.map((sig, idx) => {
      if (idx === index) {
        return { ...sig, [field]: val };
      }
      return sig;
    });
    setCurrentSignatories(updated);
    supabaseDb.setSetting('silago_registry_table_signatories', updated);
    onUpdateSignatories?.(updated);
  };

  const handleAddSignatory = () => {
    const newSig: OfficialSignatory = {
      id: `reg-sig-${Date.now()}`,
      roleLabel: 'Noted & Approved by:',
      name: '',
      title: 'Municipal / Agricultural Officer'
    };
    const updated = [...currentSignatories, newSig];
    setCurrentSignatories(updated);
    supabaseDb.setSetting('silago_registry_table_signatories', updated);
    onUpdateSignatories?.(updated);
  };

  const handleDeleteSignatory = (index: number) => {
    if (currentSignatories.length <= 1) {
      return;
    }
    const updated = currentSignatories.filter((_, idx) => idx !== index);
    setCurrentSignatories(updated);
    supabaseDb.setSetting('silago_registry_table_signatories', updated);
    onUpdateSignatories?.(updated);
  };

  const handleResetSignatories = () => {
    const resetSigs: OfficialSignatory[] = [
      {
        id: 'reg-sig-1',
        roleLabel: 'Prepared & Verified by:',
        name: preparedBy || '',
        title: preparedTitle || 'Signature over Printed Name / Designation'
      },
      {
        id: 'reg-sig-2',
        roleLabel: 'Reviewed & Certified by:',
        name: reviewedBy || 'JUNIE T. ELMIDO',
        title: reviewedTitle || 'Municipal / Technical Officer'
      },
      {
        id: 'reg-sig-3',
        roleLabel: 'Noted & Approved by:',
        name: approvedBy || 'HON. LEMUEL D. HONRADO',
        title: approvedTitle || 'Municipal Mayor'
      }
    ];
    setCurrentSignatories(resetSigs);
    supabaseDb.setSetting('silago_registry_table_signatories', resetSigs);
    onUpdateSignatories?.(resetSigs);
  };

  // Compute visible columns in groups
  const visibleNameCols = ['familyName', 'givenName', 'middleName'].filter((c) => visibleColumns[c]);
  const visibleAddressCols = ['barangay', 'municipality', 'province'].filter((c) => visibleColumns[c]);
  const visibleGpsCols = ['latitude', 'longitude'].filter((c) => visibleColumns[c]);
  const hasAnyGroup = visibleNameCols.length > 0 || visibleAddressCols.length > 0 || visibleGpsCols.length > 0;

  // Number of visible columns before farm area for footer colSpan
  const colsBeforeArea = [
    'rsbsaNo',
    'farmerName',
    'familyName',
    'givenName',
    'middleName',
    'barangay',
    'municipality',
    'province',
    'birthday',
    'farmLocation',
    'latitude',
    'longitude'
  ].filter((c) => visibleColumns[c]).length;

  const totalVisibleCols = [
    'rsbsaNo',
    'farmerName',
    'familyName',
    'givenName',
    'middleName',
    'barangay',
    'municipality',
    'province',
    'birthday',
    'farmLocation',
    'latitude',
    'longitude',
    'farmArea',
    'commodity'
  ].filter((c) => visibleColumns[c]).length;

  return (
    <div className="flex flex-col flex-1 justify-between min-h-full space-y-4 text-black font-sans">
      {/* 1. Official Government Letterhead (The 3 Logos Placed Above Republic of the Philippines) */}
      <div className="flex flex-col items-center justify-center pb-3 border-b-2 border-black">
        {/* 3 Government Logos: Bagong Pilipinas, Municipal Seal ng Silago, at Department of Agriculture */}
        <div className="flex items-center justify-center gap-6 mb-2">
          <div className="h-16 w-auto max-w-[70px] flex items-center justify-center">
            <BagongPilipinasLogo size={58} showText={true} className="h-16 w-auto max-w-[70px] object-contain" />
          </div>
          <div className="h-16 w-auto max-w-[70px] flex items-center justify-center">
            <SilagoSeal size={58} className="h-16 w-auto max-w-[70px] object-contain" />
          </div>
          <div className="h-16 w-auto max-w-[70px] flex items-center justify-center">
            <DaLogo size={58} className="h-16 w-auto max-w-[70px] object-contain" />
          </div>
        </div>

        {/* Official Header Hierarchy */}
        <div className="text-center">
          <p className="text-xs sm:text-[13px] font-sans tracking-wide text-black font-normal leading-tight">
            Republic of the Philippines
          </p>
          <p className="text-xs sm:text-[13px] font-sans tracking-wide text-black font-normal leading-tight">
            Province of Southern Leyte
          </p>
          <h1 className="text-sm sm:text-base font-serif font-black tracking-wider text-black uppercase leading-tight mt-0.5">
            MUNICIPALITY OF SILAGO
          </h1>
          <h2 className="text-xs sm:text-[13px] font-sans font-black tracking-wide text-black uppercase leading-tight mt-0.5">
            MUNICIPAL AGRICULTURE OFFICE
          </h2>
        </div>
      </div>

      {/* 2. Official Registry Subheading / Title */}
      <div className="text-center space-y-0.5 pt-1 pb-1">
        <h3 className="text-xs sm:text-sm font-serif font-black text-black uppercase tracking-wider">
          OFFICIAL MASTERLIST OF RSBSA-REGISTERED RICE FARMERS &amp; GIS-MAPPED AGRICULTURAL LANDHOLDINGS
        </h3>
        <p className="text-[11px] font-sans font-bold text-slate-800 uppercase tracking-wide">
          {selectedBarangay === 'ALL'
            ? 'CONSOLIDATED REGISTRY - ALL SILAGO BARANGAYS'
            : selectedBarangay === 'ASSIGNED_10'
            ? 'CONSOLIDATED REGISTRY - 10 ASSIGNED RICE BARANGAYS'
            : `BARANGAY ${selectedBarangay.toUpperCase()}, SILAGO, SOUTHERN LEYTE`}
        </p>
      </div>

      {/* 3. Customizable Multi-Column Registry Table with Standard Horizontal / Simple Stacked Headers */}
      <div className="w-full overflow-x-auto">
        {customTableData && Array.isArray(customTableData.columns) && customTableData.columns.length > 0 ? (
          <table className="w-full border-collapse border border-black text-black font-sans text-xs print:text-[9.5px]">
            <thead>
              <tr className="bg-white text-center font-bold">
                {customTableData.columns.map((col) => (
                  <th
                    key={col.id}
                    style={{ width: col.width || 'auto' }}
                    className={`border border-black px-2 py-2 text-${col.align} align-middle font-black text-[10.5px] print:text-[9px] uppercase leading-tight bg-white`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(!customTableData.rows || customTableData.rows.length === 0) ? (
                <tr>
                  <td
                    colSpan={customTableData.columns.length}
                    className="border border-black py-8 text-center text-slate-400 font-mono"
                  >
                    No farmer records found in table.
                  </td>
                </tr>
              ) : (
                customTableData.rows.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className={idx % 2 === 1 ? 'bg-slate-50/50 print:bg-transparent' : 'bg-white'}
                  >
                    {customTableData.columns.map((col) => (
                      <td
                        key={col.id}
                        className={`border border-black px-2 py-1 text-${col.align} ${
                          col.wrapText ? 'break-words' : 'whitespace-nowrap'
                        }`}
                      >
                        {row.cells ? (row.cells[col.id] ?? '') : ''}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-bold border-t-2 border-black text-black print:bg-transparent">
                <td
                  colSpan={customTableData.columns.length}
                  className="border border-black px-3 py-1.5 text-right font-serif uppercase tracking-wider text-[10px] print:text-[8.5px]"
                >
                  TOTAL RECORDS: {customTableData.rows?.length || 0} &bull; TOTAL REGISTERED AREA: {totalAreaHa.toFixed(2)} HA
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
        <table className="w-full border-collapse border border-black text-black font-sans text-[10px] leading-tight print:text-[8pt] print:leading-tight">
          <thead>
            {/* When user reordered columns, render the custom sequence headers */}
            {!isDefaultSequence ? (
              <tr className="bg-white text-center font-bold">
                {activeOrderedColumns.map((colId) => (
                  <th
                    key={colId}
                    style={{ width: COLUMN_DEF_MAP[colId]?.width || 'auto' }}
                    className="border border-black px-1.5 py-1 text-center align-middle font-black text-[10px] print:text-[8pt] uppercase leading-tight bg-white"
                  >
                    {COLUMN_DEF_MAP[colId]?.label || colId}
                  </th>
                ))}
              </tr>
            ) : (
              <>
                {/* Top Header Row for Official Default Grouped Layout */}
                <tr className="bg-white text-center font-bold">
                  {visibleColumns.rsbsaNo && (
                    <th
                      rowSpan={hasAnyGroup ? 2 : 1}
                      style={{ width: '13%' }}
                      className="border border-black px-1.5 py-1 text-center align-middle font-black text-[10px] print:text-[8pt] uppercase leading-tight bg-white whitespace-nowrap"
                    >
                      RSBSA NO.
                    </th>
                  )}

                  {visibleColumns.farmerName && (
                    <th
                      rowSpan={hasAnyGroup ? 2 : 1}
                      style={{ width: '19%' }}
                      className="border border-black px-1.5 py-1 text-center align-middle font-black text-[10px] print:text-[8pt] uppercase leading-tight bg-white break-words"
                    >
                      FARMER NAME
                    </th>
                  )}

                  {visibleNameCols.length > 0 && (
                    <th
                      colSpan={visibleNameCols.length}
                      className="border border-black px-1.5 py-1 uppercase text-center font-black text-[10.5px] print:text-[8.5pt] tracking-wider bg-white"
                    >
                      NAME
                    </th>
                  )}

                  {visibleAddressCols.length > 0 && (
                    <th
                      colSpan={visibleAddressCols.length}
                      className="border border-black px-1.5 py-1 uppercase text-center font-black text-[10.5px] print:text-[8.5pt] tracking-wider bg-white"
                    >
                      RESIDENTIAL ADDRESS
                    </th>
                  )}

                  {visibleColumns.birthday && (
                    <th
                      rowSpan={hasAnyGroup ? 2 : 1}
                      style={{ width: '7%' }}
                      className="border border-black px-1.5 py-1 text-center align-middle font-black text-[10px] print:text-[8pt] uppercase leading-tight bg-white whitespace-nowrap"
                    >
                      BIRTHDAY
                    </th>
                  )}

                  {visibleColumns.farmLocation && (
                    <th
                      rowSpan={hasAnyGroup ? 2 : 1}
                      style={{ width: '11%' }}
                      className="border border-black px-1.5 py-1 text-center align-middle font-black text-[10px] print:text-[8pt] uppercase leading-tight bg-white break-words"
                    >
                      FARM<br />LOCATION
                    </th>
                  )}

                  {visibleGpsCols.length > 0 && (
                    <th
                      colSpan={visibleGpsCols.length}
                      className="border border-black px-1.5 py-1 uppercase text-center font-black text-[10.5px] print:text-[8.5pt] tracking-wider bg-white"
                    >
                      GPS COORDINATE
                    </th>
                  )}

                  {visibleColumns.farmArea && (
                    <th
                      rowSpan={hasAnyGroup ? 2 : 1}
                      style={{ width: '6%' }}
                      className="border border-black px-1.5 py-1 text-center align-middle font-black text-[10px] print:text-[8pt] uppercase leading-tight bg-white whitespace-nowrap"
                    >
                      FARM AREA<br />(ha)
                    </th>
                  )}

                  {visibleColumns.commodity && (
                    <th
                      rowSpan={hasAnyGroup ? 2 : 1}
                      style={{ width: '6%' }}
                      className="border border-black px-1.5 py-1 text-center align-middle font-black text-[10px] print:text-[8pt] uppercase leading-tight bg-white whitespace-nowrap"
                    >
                      COMMODITY<br />PLANTED
                    </th>
                  )}
                </tr>

                {/* Second Header Row for Grouped Subcolumns */}
                {hasAnyGroup && (
                  <tr className="bg-white text-center font-bold">
                    {visibleColumns.familyName && (
                      <th style={{ width: '8%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white">
                        FAMILY<br />NAME
                      </th>
                    )}
                    {visibleColumns.givenName && (
                      <th style={{ width: '8%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white">
                        GIVEN<br />NAME
                      </th>
                    )}
                    {visibleColumns.middleName && (
                      <th style={{ width: '6%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white">
                        MIDDLE<br />NAME
                      </th>
                    )}

                    {visibleColumns.barangay && (
                      <th style={{ width: '9%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white whitespace-nowrap">
                        BARANGAY
                      </th>
                    )}
                    {visibleColumns.municipality && (
                      <th style={{ width: '7%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white whitespace-nowrap">
                        MUNICIPALITY
                      </th>
                    )}
                    {visibleColumns.province && (
                      <th style={{ width: '8%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white whitespace-nowrap">
                        PROVINCE
                      </th>
                    )}

                    {visibleColumns.latitude && (
                      <th style={{ width: '8%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white whitespace-nowrap">
                        LATITUDE
                      </th>
                    )}
                    {visibleColumns.longitude && (
                      <th style={{ width: '8%' }} className="border border-black px-1 py-1 text-center align-middle font-bold text-[9.5px] print:text-[7.5pt] uppercase leading-tight bg-white whitespace-nowrap">
                        LONGITUDE
                      </th>
                    )}
                  </tr>
                )}
              </>
            )}
          </thead>

          {/* Table Body */}
          <tbody>
            {sortedReportParcels.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, totalVisibleCols)} className="border border-black p-4 text-center text-slate-500 italic">
                  No RSBSA records found for the selected barangay.
                </td>
              </tr>
            ) : !isDefaultSequence ? (
              sortedReportParcels.map((p, idx) => {
                const { family, given, middle } = parseFarmerName(p);
                const bday = formatBirthday(p.birthday);
                const farmLoc = (p.farmLocation || p.barangay).toUpperCase();

                return (
                  <tr key={p.tagNumber || idx} className="border-b border-black hover:bg-slate-50 print:hover:bg-transparent">
                    {activeOrderedColumns.map((colId) =>
                      renderCellByColId(colId, p, family, given, middle, bday, farmLoc)
                    )}
                  </tr>
                );
              })
            ) : (
              sortedReportParcels.map((p, idx) => {
                const { family, given, middle } = parseFarmerName(p);
                const bday = formatBirthday(p.birthday);
                const farmLoc = (p.farmLocation || p.barangay).toUpperCase();

                return (
                  <tr key={p.tagNumber || idx} className="border-b border-black hover:bg-slate-50 print:hover:bg-transparent">
                    {visibleColumns.rsbsaNo && (
                      <td className="border border-black px-1.5 py-1 font-mono text-[10px] print:text-[8.5px] font-bold text-center whitespace-nowrap">
                        {p.swineNameOrId || 'NO RSBSA'}
                      </td>
                    )}
                    {visibleColumns.farmerName && (
                      <td className="border border-black px-1.5 py-1 font-bold text-left uppercase break-words align-middle">
                        {family && given ? `${family}, ${given}${middle ? ` ${middle}` : ''}` : (p.raiserName || '-')}
                      </td>
                    )}
                    {visibleColumns.familyName && (
                      <td className="border border-black px-1.5 py-1 font-bold text-left uppercase whitespace-nowrap">
                        {family}
                      </td>
                    )}
                    {visibleColumns.givenName && (
                      <td className="border border-black px-1.5 py-1 font-bold text-left uppercase whitespace-nowrap">
                        {given}
                      </td>
                    )}
                    {visibleColumns.middleName && (
                      <td className="border border-black px-1.5 py-1 font-bold text-left uppercase whitespace-nowrap">
                        {middle}
                      </td>
                    )}
                    {visibleColumns.barangay && (
                      <td className="border border-black px-1.5 py-1 text-center uppercase whitespace-nowrap">
                        {p.barangay.toUpperCase()}
                      </td>
                    )}
                    {visibleColumns.municipality && (
                      <td className="border border-black px-1.5 py-1 text-center uppercase whitespace-nowrap">
                        SILAGO
                      </td>
                    )}
                    {visibleColumns.province && (
                      <td className="border border-black px-1.5 py-1 text-center uppercase whitespace-nowrap">
                        SOUTHERN LEYTE
                      </td>
                    )}
                    {visibleColumns.birthday && (
                      <td className="border border-black px-1.5 py-1 text-center font-mono whitespace-nowrap">
                        {bday}
                      </td>
                    )}
                    {visibleColumns.farmLocation && (
                      <td className="border border-black px-1.5 py-1 text-center uppercase break-words">
                        {farmLoc}
                      </td>
                    )}
                    {visibleColumns.latitude && (
                      <td className="border border-black px-1.5 py-1 text-center font-mono text-[10px] print:text-[8.5px] whitespace-nowrap">
                        {p.lat ? p.lat.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : ''}
                      </td>
                    )}
                    {visibleColumns.longitude && (
                      <td className="border border-black px-1.5 py-1 text-center font-mono text-[10px] print:text-[8.5px] whitespace-nowrap">
                        {p.lng ? p.lng.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : ''}
                      </td>
                    )}
                    {visibleColumns.farmArea && (
                      <td className="border border-black px-1.5 py-1 text-center font-mono font-bold whitespace-nowrap">
                        {(() => {
                          const val = Number(p.weightKg ?? p.areaHa ?? (p as any).farm_area_ha ?? 0);
                          return val > 0 ? val.toFixed(2) : '';
                        })()}
                      </td>
                    )}
                    {visibleColumns.commodity && (
                      <td className="border border-black px-1.5 py-1 text-center font-bold uppercase whitespace-nowrap">
                        {p.commodity?.toUpperCase() || 'RICE'}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer */}
          <tfoot>
            <tr className="bg-slate-100 font-bold border-t-2 border-black text-black print:bg-transparent">
              {!isDefaultSequence ? (
                visibleColumns.farmArea ? (
                  <>
                    {(() => {
                      const areaIdx = activeOrderedColumns.indexOf('farmArea');
                      const afterCount = activeOrderedColumns.length - areaIdx - 1;
                      return (
                        <>
                          {areaIdx > 0 && (
                            <td colSpan={areaIdx} className="border border-black px-2 py-1 text-right font-serif uppercase tracking-wider text-[10px] print:text-[8.5px]">
                              TOTAL REGISTERED FARM AREA:
                            </td>
                          )}
                          <td className="border border-black px-1.5 py-1 text-center font-mono font-black text-emerald-950 print:text-black">
                            {totalAreaHa.toFixed(2)}
                          </td>
                          {afterCount > 0 && (
                            <td colSpan={afterCount} className="border border-black px-1.5 py-1 text-center text-[9px] font-mono text-slate-700 print:text-black">
                              {reportParcels.length} Records
                            </td>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <td colSpan={Math.max(1, activeOrderedColumns.length)} className="border border-black px-2 py-1 text-center font-mono text-xs">
                    Total Records: {reportParcels.length}
                  </td>
                )
              ) : (
                visibleColumns.farmArea ? (
                  <>
                    {colsBeforeArea > 0 && (
                      <td colSpan={colsBeforeArea} className="border border-black px-2 py-1 text-right font-serif uppercase tracking-wider text-[10px] print:text-[8.5px]">
                        TOTAL REGISTERED FARM AREA:
                      </td>
                    )}
                    <td className="border border-black px-1.5 py-1 text-center font-mono font-black text-emerald-950 print:text-black">
                      {totalAreaHa.toFixed(2)}
                    </td>
                    {visibleColumns.commodity && (
                      <td className="border border-black px-1.5 py-1 text-center text-[9px] font-mono text-slate-700 print:text-black">
                        {reportParcels.length} Records
                      </td>
                    )}
                  </>
                ) : (
                  <td colSpan={Math.max(1, totalVisibleCols)} className="border border-black px-2 py-1 text-center font-mono text-xs">
                    Total Records: {reportParcels.length}
                  </td>
                )
              )}
            </tr>
          </tfoot>
        </table>
        )}
      </div>

      {/* 4. Document Sub-footer */}
      <div className="pt-2 flex items-center justify-between text-[9.5px] font-mono text-slate-700 print:text-black">
        <span>
          Barangay Jurisdiction: <strong>{selectedBarangay === 'ALL' ? 'ALL SILAGO BARANGAYS' : selectedBarangay.toUpperCase()}</strong> &bull; Total RSBSA Records: <strong>{reportParcels.length}</strong> &bull; Total Area: <strong>{totalAreaHa.toFixed(2)} ha</strong>
        </span>
        <span>
          Ref No: <strong>{memoRef}</strong> &bull; Date: <strong>{reportDate}</strong>
        </span>
      </div>

      {/* 5. Official Signatories Block (Editable, Dynamic Add/Delete, Perfectly Aligned) */}
      <div className="mt-auto pt-8 px-2 sm:px-6 pb-2 border-t-2 border-black space-y-3 break-inside-avoid print:break-inside-avoid print:mt-auto">
        {/* Header & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="print:hidden text-xs uppercase tracking-wider font-bold text-slate-600">
            Official Signatures
          </span>

          <div className="print:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocalEditing(!isLocalEditing)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs border ${
                isEditing
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Toggle inline editing for signatories"
            >
              {isEditing ? <CheckCircle2 size={13} /> : <Edit3 size={13} />}
              <span>{isEditing ? 'Done Editing Signatures' : 'Edit Signatures'}</span>
            </button>

            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleAddSignatory}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title="Add another signatory block"
                >
                  <Plus size={13} />
                  <span>Add Signatory</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetSignatories}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                  title="Reset to 3 standard signatories"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </>
            )}
          </div>
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
              key={sig.id || `reg-sig-${idx}`}
              className="flex flex-col justify-between h-full space-y-1 relative group/sig p-1 rounded-lg"
            >
              {/* Delete button (Screen only, in edit mode) */}
              {isEditing && currentSignatories.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteSignatory(idx)}
                  className="print:hidden absolute -top-2 -right-2 p-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-full shadow-xs opacity-0 group-hover/sig:opacity-100 transition cursor-pointer z-10"
                  title="Remove this signatory"
                >
                  <Trash2 size={11} />
                </button>
              )}

              {/* 1. Consistent Role Label */}
              <div>
                {isEditing ? (
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

              {/* 3. Underline Line & Heavy Bold Uppercase Name & Subtitle */}
              <div className="space-y-0.5 w-full">
                {isEditing ? (
                  <div className="space-y-0.5">
                    <input
                      type="text"
                      value={sig.name}
                      placeholder="___________________________"
                      onChange={(e) => handleSignatoryChange(idx, 'name', e.target.value)}
                      className="font-bold text-black uppercase block w-full text-center text-sm border-b-2 border-black pb-0.5 hover:border-amber-500 focus:bg-amber-50/40 rounded-none px-1 py-0.5 outline-hidden print:border-black print:p-0 print:bg-transparent placeholder:text-black placeholder:font-normal"
                      title="Signatory Printed Name (or leave blank for manual pen signing)"
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
