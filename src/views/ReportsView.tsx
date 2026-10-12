import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { supabaseDb, sortParcelsAlphabetically } from '../utils/supabaseClient';
import {
  BARANGAYS,
  OFFICIAL_15_BARANGAYS,
  ASSIGNED_10_BARANGAYS,
  matchBarangay,
  getDisplayBarangay,
  getAssignedLftForBarangay
} from '../data/barangays';
import { CROPPING_SEASONS, ACTIVE_SEASON, matchesSeasonFilter, getShortSeasonName } from '../data/seasonalProduction';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, BagongPilipinasLogo } from '../components/Seals';
import {
  Printer,
  FileText,
  FileSpreadsheet,
  Download,
  RotateCcw,
  Check,
  Edit3,
  Calendar,
  Wheat,
  Scale,
  Sparkles,
  MapPin,
  TrendingUp,
  UserCheck,
  Award,
  Columns,
  Plus,
  Trash2,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Settings2,
  Camera
} from 'lucide-react';
import { FarmParcel, OfficialSignatory, SeasonalProductionRecord } from '../types';
import {
  exportRegistryTableExcel,
  exportMpcsrsExcel,
  exportIrrigatorsExcel,
  exportLetterExcel,
  exportRegistryTableWord,
  exportMpcsrsWord,
  exportIrrigatorsWord,
  exportLetterWord,
  exportCompletePackageExcel,
  exportCompletePackageWord
} from '../utils/reportExportUtils';
import {
  OfficialReportLetter,
  DEFAULT_REPORT_LETTERS,
  loadSavedReportLetters,
  saveReportLetters
} from '../data/reportLetters';
import {
  loadIrrigatorsLetterData,
  saveIrrigatorsLetterData,
  IrrigatorsDirectoryLetterData
} from '../data/irrigatorsData';
import {
  loadMpcsrsReportData,
  saveMpcsrsReportData,
  MpcsrsReportData
} from '../data/mpcsrsData';
import { LetterEditorModal } from '../components/LetterEditorModal';
import { TableEditorModal, CustomTableData } from '../components/TableEditorModal';
import { OfficialLetterDocument } from '../components/OfficialLetterDocument';
import { OfficialRegistryTable } from '../components/OfficialRegistryTable';
import { OfficialIrrigatorsDirectoryDocument } from '../components/OfficialIrrigatorsDirectoryDocument';
import { MpcsrsPalayReportDocument } from '../components/MpcsrsPalayReportDocument';
import { ReportLogoEditorModal, ReportLogoType } from '../components/ReportLogoEditorModal';
import { FloatingReportActionDock } from '../components/FloatingReportActionDock';
import { DocumentParametersModal } from '../components/DocumentParametersModal';
import { SmartColumnDrawer, OFFICIAL_REGISTRY_COLUMNS } from '../components/SmartColumnDrawer';
import { StandardReportHeader } from '../components/StandardReportHeader';

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
  // Check if comma separated (e.g. "TABUGON, ROLANDO JR. B." or "ALAS, MARIO")
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

const formatBirthday = (bday?: string) => {
  if (!bday) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(bday)) return bday;
  if (/^\d{4}-\d{2}-\d{2}$/.test(bday)) {
    const [y, m, d] = bday.split('-');
    return `${m}/${d}/${y}`;
  }
  return bday;
};

export const REGISTRY_COLUMNS = [
  { id: 'rsbsaNo', label: 'RSBSA No.', group: undefined },
  { id: 'farmerName', label: 'Farmer Name', group: undefined },
  { id: 'familyName', label: 'Family Name', group: 'NAME' },
  { id: 'givenName', label: 'Given Name', group: 'NAME' },
  { id: 'middleName', label: 'Middle Name', group: 'NAME' },
  { id: 'barangay', label: 'Barangay', group: 'RESIDENTIAL ADDRESS' },
  { id: 'municipality', label: 'Municipality', group: 'RESIDENTIAL ADDRESS' },
  { id: 'province', label: 'Province', group: 'RESIDENTIAL ADDRESS' },
  { id: 'birthday', label: 'Birthday', group: undefined },
  { id: 'farmLocation', label: 'Farm Location', group: undefined },
  { id: 'latitude', label: 'Latitude', group: 'GPS COORDINATE' },
  { id: 'longitude', label: 'Longitude', group: 'GPS COORDINATE' },
  { id: 'farmArea', label: 'Farm Area (ha)', group: undefined },
  { id: 'commodity', label: 'Commodity Planted', group: undefined }
];

interface ReportsViewProps {
  initialBarangay?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialBarangay }) => {
  const { parcels, currentUser, activeSeason } = useApp();

  const [reportType, setReportType] = useState<
    'official_registry' | 'seasonal_production' | 'barangay_consolidated' | 'census' | 'rsbsa'
  >('official_registry');
  const [selectedBarangay, setSelectedBarangay] = useState<string>(initialBarangay || 'ALL');

  const [persistedSignatories, setPersistedSignatories] = useState<OfficialSignatory[] | null>(null);

  useEffect(() => {
    supabaseDb.getSetting<OfficialSignatory[]>('silago_registry_table_signatories').then((saved) => {
      if (Array.isArray(saved) && saved.length > 0) {
        setPersistedSignatories(saved);
      }
    });
  }, []);

  React.useEffect(() => {
    if (initialBarangay) {
      setSelectedBarangay(initialBarangay);
    }
  }, [initialBarangay]);

  // Document presentation mode: Letter only, Irrigators Letter, MPCSRS Report, Registry Table only, or Complete Package
  const [documentView, setDocumentView] = useState<
    'letter' | 'irrigators_letter' | 'mpcsrs_report' | 'registry_table' | 'complete_package'
  >('registry_table');

  // Specialized Letter / Situation Reports Data
  const [irrigatorsData, setIrrigatorsData] = useState<IrrigatorsDirectoryLetterData>(() =>
    loadIrrigatorsLetterData()
  );
  const [mpcsrsData, setMpcsrsData] = useState<MpcsrsReportData>(() =>
    loadMpcsrsReportData()
  );

  const handleSaveIrrigatorsData = (updated: IrrigatorsDirectoryLetterData) => {
    setIrrigatorsData(updated);
    saveIrrigatorsLetterData(updated);
  };

  const handleSaveMpcsrsData = (updated: MpcsrsReportData) => {
    setMpcsrsData(updated);
    saveMpcsrsReportData(updated);
  };

  // Official Letter Management
  const [letters, setLetters] = useState<OfficialReportLetter[]>(() => loadSavedReportLetters());
  const [activeLetterId, setActiveLetterId] = useState<string>(() => letters[0]?.id || 'letter-irrigators-overview');
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<OfficialReportLetter | null>(null);
  const [isDirectEditingLetter, setIsDirectEditingLetter] = useState(false);
  const [editingSeasonalLogo, setEditingSeasonalLogo] = useState<ReportLogoType | null>(null);

  const currentLetter = useMemo(() => {
    return letters.find((l) => l.id === activeLetterId) || letters[0] || DEFAULT_REPORT_LETTERS[0];
  }, [letters, activeLetterId]);

  // Column visibility for Registry Table
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    rsbsaNo: true,
    farmerName: true,
    familyName: false,
    givenName: false,
    middleName: false,
    barangay: true,
    municipality: true,
    province: true,
    birthday: true,
    farmLocation: true,
    latitude: true,
    longitude: true,
    farmArea: true,
    commodity: true
  });
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    OFFICIAL_REGISTRY_COLUMNS.map((c) => c.id)
  );

  const handleToggleColumn = (colId: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId]
    }));
  };

  const handleReorderColumn = (startIndex: number, direction: 'up' | 'down') => {
    setColumnOrder((prev) => {
      const targetIndex = direction === 'up' ? startIndex - 1 : startIndex + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(startIndex, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
  };

  const handleSelectAllColumns = () => {
    const all: Record<string, boolean> = {};
    OFFICIAL_REGISTRY_COLUMNS.forEach((col) => {
      all[col.id] = true;
    });
    setVisibleColumns(all);
  };

  const handleDeselectAllColumns = () => {
    const none: Record<string, boolean> = {};
    OFFICIAL_REGISTRY_COLUMNS.forEach((col) => {
      none[col.id] = false;
    });
    none.rsbsaNo = true; // Retain at least 1 key to prevent empty table layout error
    setVisibleColumns(none);
  };

  const handleResetColumnsToTemplate = () => {
    setVisibleColumns({
      rsbsaNo: true,
      farmerName: true,
      familyName: false,
      givenName: false,
      middleName: false,
      barangay: true,
      municipality: true,
      province: true,
      birthday: true,
      farmLocation: true,
      latitude: true,
      longitude: true,
      farmArea: true,
      commodity: true
    });
    setColumnOrder(OFFICIAL_REGISTRY_COLUMNS.map((c) => c.id));
  };
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isParamsModalOpen, setIsParamsModalOpen] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [customTableData, setCustomTableData] = useState<CustomTableData | null>(null);

  const [selectedSeason, setSelectedSeason] = useState<string>(activeSeason || ACTIVE_SEASON);
  const [paperSize, setPaperSize] = useState('folio');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [margins, setMargins] = useState('standard');
  const [tableDensity, setTableDensity] = useState('compact');
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);

  // Word-Style Manuscript Print Preview & Pagination State
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(1);
  const [wordViewMode, setWordViewMode] = useState<'all_pages' | 'single_page'>('all_pages');

  // Official report memo and signatory parameters (blank by default as per request, fully editable)
  const [memoRef, setMemoRef] = useState('SLG-MAO-RICE-2024-02B');
  const [reportDate, setReportDate] = useState('February 21, 2024');
  const [preparedBy, setPreparedBy] = useState('');
  const [preparedTitle, setPreparedTitle] = useState('');
  const [reviewedBy, setReviewedBy] = useState('');
  const [reviewedTitle, setReviewedTitle] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [approvedTitle, setApprovedTitle] = useState('');

  // Filter parcels based on selected barangay (or ALL for all 15 barangays), sorted alphabetically A-Z
  const reportParcels = useMemo(() => {
    const filtered = parcels.filter((p) => {
      if (selectedBarangay === 'ALL' || selectedBarangay === 'ASSIGNED_10') return true;
      return matchBarangay(p.barangay, selectedBarangay);
    });
    return sortParcelsAlphabetically(filtered);
  }, [parcels, selectedBarangay]);

  // Extract seasonal production record for each parcel matching selected season
  const parcelsWithSeason = useMemo(() => {
    return reportParcels.map((p) => {
      const records = p.seasonalRecords || [];
      if (selectedSeason === 'ALL_SEASONS') {
        const totalVol = records.reduce((sum, r) => sum + (r.actualProductionVolumeMt || r.yieldMetricTons || 0), 0);
        const totalBags = records.reduce((sum, r) => sum + (r.yieldBags ?? r.actualProductionBags ?? Math.round((r.actualProductionVolumeMt || 0) * 20)), 0);
        const area = Number(p.weightKg || p.areaHa || (p as any).farm_area_ha || 1);
        const avgYield = area > 0 ? Number((totalVol / area).toFixed(2)) : 0;
        const latestRec = records[0];

        const consolidated: SeasonalProductionRecord = {
          id: `PROD-${p.tagNumber}-CONSOLIDATED`,
          parcelTag: p.tagNumber,
          season: 'All Seasons (Consolidated Historical)',
          seasonName: 'All Seasons (Consolidated)',
          seedVariety: latestRec?.seedVariety || p.breed || 'NSIC Rc 222',
          varietyPlanted: latestRec?.varietyPlanted || p.breed || 'NSIC Rc 222',
          seedType: (p.seedType as any) || 'INBRED',
          plantingDate: latestRec?.plantingDate || p.plantingDate || '2026-07-20',
          estimatedHarvestDate: latestRec?.estimatedHarvestDate || '2026-11-15',
          actualHarvestDate: latestRec?.actualHarvestDate,
          harvestDate: latestRec?.harvestDate || latestRec?.actualHarvestDate || '2026-11-15',
          actualProductionVolumeMt: Number(totalVol.toFixed(2)),
          actualProductionBags: totalBags,
          yieldBags: totalBags,
          yieldMtPerHa: avgYield,
          yieldMetricTons: avgYield,
          productionStatus: 'Harvest Completed',
          status: 'Harvested',
          growthStage: 'Historical Total',
          lftOfficerName: p.focalPerson || getAssignedLftForBarangay(p.barangay).name,
          recordedAt: new Date().toISOString()
        };

        return {
          parcel: p,
          seasonRecord: consolidated
        };
      }

      const matched =
        records.find((r) => matchesSeasonFilter(r.season, selectedSeason) || matchesSeasonFilter(r.seasonName, selectedSeason)) ||
        records[0] || {
          id: `PROD-${p.tagNumber}-TEMP`,
          parcelTag: p.tagNumber,
          season: selectedSeason,
          seasonName: getShortSeasonName(selectedSeason),
          seedVariety: p.breed || 'NSIC Rc 222',
          varietyPlanted: p.breed || 'NSIC Rc 222',
          seedType: (p.seedType as any) || 'INBRED',
          plantingDate: p.plantingDate || '2026-07-20',
          estimatedHarvestDate: '2026-11-15',
          actualProductionVolumeMt: Number(((p.weightKg || 1) * 4.8).toFixed(2)),
          actualProductionBags: Math.round(((p.weightKg || 1) * 4.8) * 20),
          yieldBags: Math.round(((p.weightKg || 1) * 4.8) * 20),
          yieldMtPerHa: 4.8,
          yieldMetricTons: 4.8,
          productionStatus: 'Standing Crop',
          status: 'Ongoing',
          growthStage: 'Tillering (Vegetative)',
          lftOfficerName: p.focalPerson || getAssignedLftForBarangay(p.barangay).name,
          recordedAt: new Date().toISOString()
        };

      return {
        parcel: p,
        seasonRecord: matched
      };
    });
  }, [reportParcels, selectedSeason]);

  // Aggregate stats: Total Registered Farm Area
  const totalAreaHa = useMemo(() => {
    return reportParcels.reduce((sum, p) => sum + (Number(p.weightKg || p.areaHa || (p as any).farm_area_ha || 0)), 0);
  }, [reportParcels]);

  const totalProductionMt = useMemo(() => {
    return parcelsWithSeason.reduce((sum, item) => sum + (item.seasonRecord.actualProductionVolumeMt || 0), 0);
  }, [parcelsWithSeason]);

  const totalBags = useMemo(() => {
    return Math.round(totalProductionMt * 20);
  }, [totalProductionMt]);

  const averageYieldMtPerHa = useMemo(() => {
    if (totalAreaHa <= 0) return 0;
    return Number((totalProductionMt / totalAreaHa).toFixed(2));
  }, [totalProductionMt, totalAreaHa]);

  // 10 Assigned Barangays Comparative Data Breakdown
  const barangayComparativeData = useMemo(() => {
    return ASSIGNED_10_BARANGAYS.map((brgy) => {
      const brgyParcels = parcels.filter((p) => matchBarangay(p.barangay, brgy));
      const brgyArea = brgyParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
      const brgyProd = brgyParcels.reduce((sum, p) => {
        const rec = p.seasonalRecords?.find((r) => r.season === selectedSeason) || p.seasonalRecords?.[0];
        return sum + (rec?.actualProductionVolumeMt || (p.weightKg || 1) * 4.8);
      }, 0);
      const avgYield = brgyArea > 0 ? Number((brgyProd / brgyArea).toFixed(2)) : 0;
      const varietiesSet = new Set(brgyParcels.map((p) => p.breed).filter(Boolean));

      return {
        barangay: brgy,
        farmerCount: brgyParcels.length,
        areaHa: Number(brgyArea.toFixed(2)),
        productionMt: Number(brgyProd.toFixed(2)),
        bags: Math.round(brgyProd * 20),
        avgYieldMtPerHa: avgYield,
        varieties: Array.from(varietiesSet).slice(0, 3).join(', ') || 'NSIC Rc 222',
        focalPerson: brgyParcels[0]?.focalPerson || 'Local Farmer Technician'
      };
    });
  }, [parcels, selectedSeason]);

  // Predominant rice varieties in currently filtered parcels
  const predominantVarieties = useMemo(() => {
    const counts: Record<string, number> = {};
    reportParcels.forEach((p) => {
      const v = p.breed || 'NSIC Rc 222';
      counts[v] = (counts[v] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([v, count]) => `${v} (${count} parcels)`)
      .join(', ');
  }, [reportParcels]);

  // Assigned LFT officer for the active barangay
  const assignedLft = useMemo(() => {
    return getAssignedLftForBarangay(selectedBarangay);
  }, [selectedBarangay]);

  // Pagination & Chunking Engine for Masterlist Registry (15 rows for landscape, 22 for portrait)
  const rowsPerPage = useMemo(() => {
    if (tableDensity === 'ultra') return orientation === 'landscape' ? 20 : 28;
    if (tableDensity === 'comfortable') return orientation === 'landscape' ? 12 : 18;
    return orientation === 'landscape' ? 15 : 22; // default compact
  }, [orientation, tableDensity]);

  const registryPageChunks = useMemo(() => {
    if (!reportParcels || reportParcels.length === 0) return [[]];
    const chunks: FarmParcel[][] = [];
    for (let i = 0; i < reportParcels.length; i += rowsPerPage) {
      chunks.push(reportParcels.slice(i, i + rowsPerPage));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [reportParcels, rowsPerPage]);

  // Calculate total pages for Word-Style print preview pagination
  const totalDocumentPages = useMemo(() => {
    if (reportType !== 'official_registry') return 1;
    if (documentView === 'complete_package') {
      return 3 + registryPageChunks.length;
    }
    if (documentView === 'registry_table') {
      return registryPageChunks.length;
    }
    return 1;
  }, [reportType, documentView, registryPageChunks.length]);

  useEffect(() => {
    if (currentPageIndex > totalDocumentPages) {
      setCurrentPageIndex(1);
    }
  }, [totalDocumentPages, currentPageIndex]);

  // Dynamic Sheet Dimensions base sa ORIENTATION ug PAPER SIZE
  // Folio: 8.5" x 13" (Portrait) / 13" x 8.5" (Landscape)
  // Letter: 8.5" x 11" (Portrait) / 11" x 8.5" (Landscape)
  // A4: 210mm x 297mm (Portrait) / 297mm x 210mm (Landscape)
  const getWordSheetStyle = () => {
    const isPortrait = orientation === 'portrait';
    const isLandscape = !isPortrait;

    let width = '8.5in';
    let minHeight = '13in';

    if (paperSize === 'letter') {
      width = isLandscape ? '11in' : '8.5in';
      minHeight = isLandscape ? '8.5in' : '11in';
    } else if (paperSize === 'a4') {
      width = isLandscape ? '297mm' : '210mm';
      minHeight = isLandscape ? '210mm' : '297mm';
    } else {
      // folio
      width = isLandscape ? '13in' : '8.5in';
      minHeight = isLandscape ? '8.5in' : '13in';
    }

    const padding = margins === 'narrow' ? '0.25in' : margins === 'wide' ? '0.75in' : '0.5in';

    return {
      width,
      minHeight,
      padding
    };
  };

  // Handlers for Letter Management
  const handleOpenAddLetter = () => {
    setEditingLetter(null);
    setIsLetterModalOpen(true);
  };

  const handleOpenEditLetter = () => {
    // If on registry table only, switch to letter view so user can edit directly
    if (documentView === 'registry_table') {
      setDocumentView('letter');
    }
    // Toggle direct inline editing without any popup modal
    setIsDirectEditingLetter((prev) => !prev);
    // Smooth scroll down to letter document
    setTimeout(() => {
      document.getElementById('official-print-document')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleDeleteLetter = () => {
    if (letters.length <= 1) {
      alert('At least one official letter template must be maintained.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${currentLetter.title}"?`)) {
      const updated = letters.filter((l) => l.id !== currentLetter.id);
      setLetters(updated);
      saveReportLetters(updated);
      setActiveLetterId(updated[0].id);
    }
  };

  const handleSaveLetter = (saved: OfficialReportLetter) => {
    const exists = letters.some((l) => l.id === saved.id);
    let updated: OfficialReportLetter[];
    if (exists) {
      updated = letters.map((l) => (l.id === saved.id ? saved : l));
    } else {
      updated = [...letters, saved];
    }
    setLetters(updated);
    saveReportLetters(updated);
    setActiveLetterId(saved.id);
  };

  const buildInitialTableData = (
    parcelsList: FarmParcel[],
    visibleCols: Record<string, boolean>
  ): CustomTableData => {
    const activeCols = REGISTRY_COLUMNS.filter((c) => visibleCols[c.id]);
    const columns = activeCols.map((c) => ({
      id: c.id,
      label: c.label.toUpperCase(),
      group: c.group,
      align: (['rsbsaNo', 'birthday', 'latitude', 'longitude', 'farmArea', 'commodity'].includes(c.id) ? 'center' : 'left') as 'left' | 'center' | 'right',
      wrapText: true
    }));

    const rows = parcelsList.map((p, idx) => {
      const names = parseFarmerName(p);
      const bday = formatBirthday(p.birthday);
      const farmLoc = p.purok
        ? `${p.purok}, Brgy. ${getDisplayBarangay(p.barangay)}`
        : `Brgy. ${getDisplayBarangay(p.barangay)}`;

      const farmerFullName = names.family && names.given
        ? `${names.family}, ${names.given}${names.middle ? ` ${names.middle}` : ''}`
        : (p.raiserName || '');

      const cells: Record<string, string> = {
        rsbsaNo: p.swineNameOrId || '',
        farmerName: farmerFullName,
        familyName: names.family || '',
        givenName: names.given || '',
        middleName: names.middle || '',
        barangay: getDisplayBarangay(p.barangay),
        municipality: 'SILAGO',
        province: 'SOUTHERN LEYTE',
        birthday: bday || '',
        farmLocation: farmLoc || '',
        latitude: p.lat ? p.lat.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
        longitude: p.lng ? p.lng.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
        farmArea: p.weightKg !== undefined ? String(p.weightKg === 1 ? '1' : p.weightKg) : '',
        commodity: p.commodity?.toUpperCase() || 'RICE'
      };
      return { id: p.tagNumber || `row-${idx}`, cells };
    });

    return { columns, rows };
  };

  const handleOpenTableEditor = () => {
    if (!customTableData) {
      setCustomTableData(buildInitialTableData(reportParcels, visibleColumns));
    }
    setIsTableModalOpen(true);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-report-canvas') || document.getElementById('official-print-document') || document.getElementById('printable-area');
    const isLandscape = orientation === 'landscape';
    const originalTitle = document.title;
    const brgyName = selectedBarangay === 'ALL' ? 'All_Barangays' : selectedBarangay.replace(/\s+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];

    let docTitle = `Masterlist_Registry_${brgyName}_${dateStr}`;
    if (documentView === 'letter') {
      docTitle = `Transmittal_Letter_Silago_${dateStr}`;
    } else if (documentView === 'irrigators_letter') {
      docTitle = `Irrigators_Directory_Silago_${dateStr}`;
    } else if (documentView === 'mpcsrs_report') {
      docTitle = `MPCSRS_Palay_Report_Silago_${dateStr}`;
    } else if (documentView === 'complete_package') {
      docTitle = `Complete_Package_Silago_${dateStr}`;
    }

    if (!printContent) {
      document.title = docTitle;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
      return;
    }

    // Create a hidden iframe for clean printing inside iframe/sandboxes
    const printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = '0';
    printIframe.style.opacity = '0';
    printIframe.style.pointerEvents = 'none';
    document.body.appendChild(printIframe);

    const iframeDoc = printIframe.contentWindow || (printIframe.contentDocument as any)?.document || printIframe.contentDocument;
    if (!iframeDoc) {
      document.title = docTitle;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
      return;
    }

    // Clone and sanitize content so direct editing outlines or buttons are removed
    const cloned = printContent.cloneNode(true) as HTMLElement;
    cloned.querySelectorAll('.no-print, button, select, input[type="file"], #rice-ssistant-widget, .sidebar, nav, aside').forEach((el) => el.remove());

    const isPortrait = orientation === 'portrait';
    let printPageSize = isPortrait ? '8.5in 11in portrait' : '11in 8.5in landscape';
    if (paperSize === 'folio') {
      printPageSize = isPortrait ? '8.5in 13in portrait' : '13in 8.5in landscape';
    } else if (paperSize === 'a4') {
      printPageSize = isPortrait ? '210mm 297mm portrait' : '297mm 210mm landscape';
    }
    const printMargin = '0.5in';

    const doc = (iframeDoc as any).document || iframeDoc;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle}</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
          <style>
            @page {
              size: ${printPageSize};
              margin: ${printMargin};
            }
            .word-paper-sheet {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            .print-page-number::after {
              content: "Page " counter(page) " of " counter(pages);
            }
            html, body {
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }
            aside, nav, header, .floating-fab-dock, .no-print, button, select, input[type="file"] {
              display: none !important;
            }
            table {
              width: 100% !important;
              max-width: 100% !important;
              border-collapse: collapse !important;
              font-size: 8pt !important;
              line-height: 1.15 !important;
            }
            th, td {
              border: 1px solid #000000 !important;
              color: #000000 !important;
              padding: 2px 3px !important;
              box-sizing: border-box !important;
              vertical-align: middle !important;
            }
            thead {
              display: table-header-group !important;
            }
            tbody {
              display: table-row-group !important;
            }
            tfoot {
              display: table-footer-group !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .break-inside-avoid, .print-avoid-break, .signatories-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .print\\:hidden, .no-print {
              display: none !important;
            }
            .print-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
          </style>
        </head>
        <body class="p-0 bg-white">
          ${cloned.innerHTML}
        </body>
      </html>
    `);
    doc.close();

    // Wait for assets/images to load then print
    setTimeout(() => {
      try {
        if (printIframe.contentWindow) {
          printIframe.contentWindow.focus();
          printIframe.contentWindow.print();
        } else {
          window.print();
        }
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print():', err);
        window.print();
      }
      setTimeout(() => {
        if (document.body.contains(printIframe)) {
          document.body.removeChild(printIframe);
        }
      }, 1500);
    }, 600);
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'official_registry') {
      const colKeys = [
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
      ].filter((k) => visibleColumns[k]);

      const headerLabels: Record<string, string> = {
        rsbsaNo: 'RSBSA NO.',
        farmerName: 'FARMER NAME',
        familyName: 'FAMILY NAME',
        givenName: 'GIVEN NAME',
        middleName: 'MIDDLE NAME',
        barangay: 'BARANGAY',
        municipality: 'MUNICIPALITY',
        province: 'PROVINCE',
        birthday: 'BIRTHDAY',
        farmLocation: 'FARM LOCATION',
        latitude: 'LATITUDE',
        longitude: 'LONGITUDE',
        farmArea: 'FARM AREA (ha)',
        commodity: 'COMMODITY PLANTED'
      };

      headers = colKeys.map((k) => headerLabels[k]);

      rows = reportParcels.map((p) => {
        const { family, given, middle } = parseFarmerName(p);
        const bday = formatBirthday(p.birthday);
        const farmLoc = (p.farmLocation || p.barangay).toUpperCase();
        const farmerFullName = family && given
          ? `${family}, ${given}${middle ? ` ${middle}` : ''}`
          : (p.raiserName || '-');

        const valMap: Record<string, string | number> = {
          rsbsaNo: `"${p.swineNameOrId || 'NO RSBSA'}"`,
          farmerName: `"${farmerFullName}"`,
          familyName: `"${family}"`,
          givenName: `"${given}"`,
          middleName: `"${middle}"`,
          barangay: `"${p.barangay.toUpperCase()}"`,
          municipality: '"SILAGO"',
          province: '"SOUTHERN LEYTE"',
          birthday: `"${bday}"`,
          farmLocation: `"${farmLoc}"`,
          latitude: p.lat ? p.lat.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
          longitude: p.lng ? p.lng.toFixed(7).replace(/0+$/, '').replace(/\.$/, '') : '',
          farmArea: p.weightKg !== undefined ? p.weightKg : '',
          commodity: `"${p.commodity?.toUpperCase() || 'RICE'}"`
        };

        return colKeys.map((k) => valMap[k]);
      });
    } else if (reportType === 'seasonal_production') {
      headers = [
        'No.',
        'Parcel Tag ID',
        'RSBSA Number',
        'Farmer Full Name',
        'Barangay',
        'Purok',
        'Farm Area (ha)',
        'Cropping Season',
        'Rice Variety',
        'Seed Type',
        'Planting Date',
        'Est. Harvest Date',
        'Actual Volume (MT)',
        'Volume in Bags (50kg)',
        'Yield (MT/ha)',
        'Production Status',
        'Assigned LFT'
      ];

      rows = parcelsWithSeason.map((item, i) => [
        i + 1,
        `"${item.parcel.tagNumber}"`,
        `"${item.parcel.swineNameOrId}"`,
        `"${item.parcel.raiserName}"`,
        `"${item.parcel.barangay}"`,
        `"${item.parcel.purok || 'Purok 1'}"`,
        (item.parcel.weightKg || 0).toFixed(2),
        `"${item.seasonRecord.season}"`,
        `"${item.seasonRecord.seedVariety}"`,
        `"${item.seasonRecord.seedType}"`,
        `"${item.seasonRecord.plantingDate}"`,
        `"${(item.seasonRecord as any).actualHarvestDate || item.seasonRecord.estimatedHarvestDate}"`,
        item.seasonRecord.actualProductionVolumeMt.toFixed(2),
        item.seasonRecord.actualProductionBags || Math.round(item.seasonRecord.actualProductionVolumeMt * 20),
        item.seasonRecord.yieldMtPerHa.toFixed(2),
        `"${item.seasonRecord.productionStatus}"`,
        `"${item.seasonRecord.lftOfficerName}"`
      ]);
    } else if (reportType === 'barangay_consolidated') {
      headers = [
        'No.',
        'Assigned Barangay',
        'Registered Farmers',
        'Total Farm Area (ha)',
        'Primary Seed Varieties',
        'Production Volume (MT)',
        'Production Volume (Bags)',
        'Average Yield (MT/ha)',
        'Assigned LFT Officer'
      ];

      rows = barangayComparativeData.map((item, i) => [
        i + 1,
        `"${item.barangay}"`,
        item.farmerCount,
        item.areaHa.toFixed(2),
        `"${item.varieties}"`,
        item.productionMt.toFixed(2),
        item.bags,
        item.avgYieldMtPerHa.toFixed(2),
        `"${item.focalPerson}"`
      ]);
    } else {
      headers = [
        'No.',
        'Parcel ID',
        'RSBSA Number',
        'Farmer Full Name',
        'Barangay',
        'Purok',
        'Farm Area (ha)',
        'Tenurial Status',
        'Agro-Ecosystem',
        'Irrigation Association',
        'Variety',
        'Growth Stage',
        'PCIC Status',
        'Assigned LFT'
      ];

      rows = reportParcels.map((p, i) => [
        i + 1,
        `"${p.tagNumber}"`,
        `"${p.swineNameOrId}"`,
        `"${p.raiserName}"`,
        `"${p.barangay}"`,
        `"${p.purok || 'Purok 1'}"`,
        (p.weightKg || 0).toFixed(2),
        `"${p.sex || 'Owner'}"`,
        `"${p.purpose}"`,
        `"${p.irrigationAssociation || 'NIA Sector'}"`,
        `"${p.breed}"`,
        `"${p.healthStatus}"`,
        `"${p.vaccinationStatus || 'PCIC Insured'}"`,
        `"${p.focalPerson}"`
      ]);
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Silago_Rice_Report_${selectedBarangay}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActiveSignatories = (): OfficialSignatory[] => {
    if (persistedSignatories && persistedSignatories.length > 0) return persistedSignatories;
    return [
      {
        id: 'reg-sig-1',
        roleLabel: 'Prepared by:',
        name: preparedBy || 'WELLA S. BONGON',
        title: preparedTitle || 'Rice Technician / Agricultural Technologist'
      },
      {
        id: 'reg-sig-2',
        roleLabel: 'Reviewed by:',
        name: reviewedBy || 'JUNIE T. ELMIDO',
        title: reviewedTitle || 'Municipal / City Agriculturist'
      },
      {
        id: 'reg-sig-3',
        roleLabel: 'Noted / Approved by:',
        name: approvedBy || 'HON. LEMUEL P. HONOR',
        title: approvedTitle || 'Municipal Mayor'
      }
    ];
  };

  const handleExportExcel = () => {
    if (documentView === 'complete_package') {
      exportCompletePackageExcel(
        reportParcels,
        visibleColumns,
        selectedBarangay,
        currentLetter.date || reportDate,
        currentLetter.memoRef || memoRef,
        getActiveSignatories(),
        currentLetter,
        irrigatorsData,
        mpcsrsData
      );
    } else if (documentView === 'mpcsrs_report') {
      exportMpcsrsExcel(mpcsrsData);
    } else if (documentView === 'irrigators_letter') {
      exportIrrigatorsExcel(irrigatorsData);
    } else if (documentView === 'letter') {
      exportLetterExcel(
        currentLetter,
        currentLetter.signatories && currentLetter.signatories.length > 0
          ? currentLetter.signatories
          : getActiveSignatories()
      );
    } else {
      exportRegistryTableExcel(
        reportParcels,
        visibleColumns,
        selectedBarangay,
        reportDate,
        memoRef,
        getActiveSignatories()
      );
    }
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      if (documentView === 'complete_package') {
        await exportCompletePackageWord(
          reportParcels,
          visibleColumns,
          selectedBarangay,
          currentLetter.date || reportDate,
          currentLetter.memoRef || memoRef,
          getActiveSignatories(),
          currentLetter,
          irrigatorsData,
          mpcsrsData,
          { paperSize, orientation }
        );
      } else if (documentView === 'mpcsrs_report') {
        await exportMpcsrsWord(mpcsrsData);
      } else if (documentView === 'irrigators_letter') {
        await exportIrrigatorsWord(irrigatorsData);
      } else if (documentView === 'letter') {
        await exportLetterWord(
          currentLetter,
          currentLetter.signatories && currentLetter.signatories.length > 0
            ? currentLetter.signatories
            : getActiveSignatories()
        );
      } else {
        await exportRegistryTableWord(
          reportParcels,
          visibleColumns,
          selectedBarangay,
          reportDate,
          memoRef,
          getActiveSignatories()
        );
      }
    } catch (err) {
      console.error('Word export error:', err);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handleResetDefaults = () => {
    setReportType('official_registry');
    setSelectedBarangay('ALL');
    setSelectedSeason(activeSeason || ACTIVE_SEASON);
    setPaperSize('folio');
    setOrientation('landscape');
    setMargins('standard');
    setTableDensity('compact');
    setMemoRef('SLG-MAO-RICE-2024-02B');
    setReportDate('February 21, 2024');
  };

  // Human-readable scope title for report header
  const reportScopeTitle = useMemo(() => {
    if (selectedBarangay === 'ALL' || selectedBarangay === 'ASSIGNED_10') {
      return 'CONSOLIDATED MUNICIPAL REPORT (ALL 15 SILAGO BARANGAYS)';
    }
    return `BARANGAY-SPECIFIC REPORT: BARANGAY ${selectedBarangay.toUpperCase()}`;
  }, [selectedBarangay]);

  // Calculate visible columns count
  const visibleColumnsCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  // Render a Word-Style Sheet Container with Running Header and Footer
  const renderWordSheet = (
    content: React.ReactNode,
    pageNumber: number | string,
    totalPagesDisplay: number | string,
    sheetSubtitle: string,
    key?: string | number
  ) => {
    const sheetDim = getWordSheetStyle();
    return (
      <div
        key={key}
        className={`word-paper-sheet bg-white text-black shadow-2xl border border-slate-300 relative mx-auto font-serif leading-relaxed flex flex-col justify-between transition-all print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:break-after-page text-justify ${
          isDirectEditingLetter ? 'direct-canvas-edit-active' : ''
        }`}
        style={{
          width: sheetDim.width,
          minHeight: sheetDim.minHeight,
          padding: sheetDim.padding,
          pageBreakAfter: 'always',
          breakAfter: 'page'
        }}
      >
        {/* Dynamic Running Header on each page */}
        <div className="word-sheet-header text-[8.5pt] font-sans text-slate-500 border-b border-slate-300 pb-1 mb-4 flex items-center justify-between uppercase tracking-wider select-none print:text-black">
          <span className="font-bold text-slate-700 print:text-black">
            Republic of the Philippines &bull; Municipality of Silago &bull; DA-MAO
          </span>
          <span className="font-mono text-[7.5pt] text-slate-500 print:text-black truncate max-w-[280px]">
            {sheetSubtitle}
          </span>
        </div>

        {/* Document Content */}
        <div className="flex-1 flex flex-col justify-between">
          {content}
        </div>

        {/* Dynamic Running Footer on each page */}
        <div className="word-sheet-footer text-[8.5pt] font-sans text-slate-500 border-t border-slate-300 pt-1.5 mt-auto flex items-center justify-between select-none print:text-black">
          <div className="flex items-center gap-2 text-[8pt]">
            <span className="font-mono font-bold text-slate-700 print:text-black">
              {currentLetter.memoRef || memoRef}
            </span>
            <span>&bull;</span>
            <span>Date: {currentLetter.date || reportDate}</span>
          </div>
          <div className="text-right font-mono font-bold text-[8.5pt] text-slate-800 print:text-black">
            {typeof pageNumber === 'number'
              ? `Page ${pageNumber} of ${totalPagesDisplay}`
              : `${pageNumber}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Strict CSS Dynamic @page Orientation and Word Manuscript Print Rules */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: ${
              paperSize === 'folio'
                ? (orientation === 'landscape' ? '13in 8.5in' : '8.5in 13in')
                : paperSize === 'a4'
                ? (orientation === 'landscape' ? '297mm 210mm' : '210mm 297mm')
                : (orientation === 'landscape' ? '11in 8.5in' : '8.5in 11in')
            };
            margin: 0.5in;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-report-canvas,
          #printable-report-canvas *,
          #official-print-document,
          #official-print-document *,
          #printable-manuscript-report,
          #printable-manuscript-report *,
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-report-canvas,
          #official-print-document,
          #printable-manuscript-report {
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            transform: none !important;
            box-shadow: none !important;
            border: none !important;
          }
          .word-paper-sheet {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0.5in !important;
            width: 100% !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          tr, p, div.section-block, .break-inside-avoid, .print-avoid-break, .signatories-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          thead {
            display: table-header-group !important;
          }
          tbody {
            display: table-row-group !important;
          }
          tfoot {
            display: table-footer-group !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse !important;
          }
          tr, td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-page-number::after {
            content: "Page " counter(page) " of " counter(pages);
          }
          html, body, #root {
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          nav, aside, .sidebar, .no-print, header, .floating-fab-dock, .top-control-bar, #admin-mobile-menu-btn, button, select, #rice-ssistant-widget {
            display: none !important;
          }
        }
        /* Subtle dotted amber/blue focus outline when direct on-canvas editing is active */
        .direct-canvas-edit-active input,
        .direct-canvas-edit-active textarea,
        .direct-canvas-edit-active [contenteditable="true"] {
          outline: 1px dashed #f59e0b !important;
          background-color: rgba(254, 243, 199, 0.3) !important;
          transition: all 0.15s ease-in-out;
        }
        .direct-canvas-edit-active input:hover,
        .direct-canvas-edit-active textarea:hover,
        .direct-canvas-edit-active [contenteditable="true"]:hover {
          outline: 1px dashed #d97706 !important;
          background-color: rgba(254, 243, 199, 0.5) !important;
        }
        .direct-canvas-edit-active input:focus,
        .direct-canvas-edit-active textarea:focus,
        .direct-canvas-edit-active [contenteditable="true"]:focus {
          outline: 2px solid #f59e0b !important;
          background-color: rgba(254, 243, 199, 0.8) !important;
          border-radius: 2px !important;
        }
      `}} />

      {/* REORGANIZED CLEAN TOP CONTROL HEADER (Two-Tier Bar) */}
      <div className="no-print top-control-bar bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Tier 1 (Document Types): Clear horizontal pills */}
        <div className="px-5 py-3.5 bg-slate-50/90 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              DOCUMENT TYPE:
            </span>

            {/* 5 Horizontal Document Type Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
              {/* Tab 1: Transmittal Letter */}
              <button
                type="button"
                onClick={() => {
                  setDocumentView('letter');
                  setOrientation('portrait');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  documentView === 'letter'
                    ? 'bg-white text-emerald-950 shadow-xs font-extrabold ring-1 ring-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${documentView === 'letter' ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>Transmittal Letter</span>
              </button>

              {/* Tab 2: Irrigators Directory */}
              <button
                type="button"
                onClick={() => {
                  setActiveLetterId('letter-irrigators-overview');
                  setDocumentView('irrigators_letter');
                  setOrientation('portrait');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  documentView === 'irrigators_letter'
                    ? 'bg-white text-teal-950 shadow-xs font-extrabold ring-1 ring-teal-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 ${documentView === 'irrigators_letter' ? 'text-teal-700' : 'text-slate-400'}`} />
                <span>Irrigators Directory</span>
              </button>

              {/* Tab 3: MPCSRS Palay Report */}
              <button
                type="button"
                onClick={() => {
                  setActiveLetterId('letter-mpcsrs-monthly');
                  setDocumentView('mpcsrs_report');
                  setOrientation('landscape');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  documentView === 'mpcsrs_report'
                    ? 'bg-white text-emerald-950 shadow-xs font-extrabold ring-1 ring-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Wheat className={`w-3.5 h-3.5 ${documentView === 'mpcsrs_report' ? 'text-emerald-700' : 'text-slate-400'}`} />
                <span>MPCSRS Palay Report</span>
              </button>

              {/* Tab 4: Masterlist Registry */}
              <button
                type="button"
                onClick={() => {
                  setDocumentView('registry_table');
                  setOrientation('landscape');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  documentView === 'registry_table'
                    ? 'bg-white text-blue-950 shadow-xs font-extrabold ring-1 ring-blue-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Wheat className={`w-3.5 h-3.5 ${documentView === 'registry_table' ? 'text-blue-700' : 'text-slate-400'}`} />
                <span>Masterlist Registry</span>
              </button>

              {/* Tab 5: Complete Package */}
              <button
                type="button"
                onClick={() => {
                  setDocumentView('complete_package');
                  setOrientation('portrait');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  documentView === 'complete_package'
                    ? 'bg-indigo-700 text-white shadow-xs font-extrabold ring-1 ring-indigo-400'
                    : 'text-indigo-900 hover:text-indigo-950 hover:bg-indigo-50 font-semibold'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-300" />
                <span>Complete Package (All 4)</span>
              </button>
            </div>
          </div>

          {/* Quick Helper Tools (Letter Template / Columns / Reset) */}
          <div className="flex items-center gap-2">
            {documentView === 'letter' && (
              <select
                value={activeLetterId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveLetterId(newId);
                }}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-2xs max-w-[200px] truncate"
                title="Select official letter template"
              >
                {letters.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            )}

            {(documentView === 'registry_table' || documentView === 'complete_package') && (
              <div className="relative z-[60]">
                <button
                  type="button"
                  onClick={() => setIsColumnPickerOpen(true)}
                  className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-2xs ${
                    isColumnPickerOpen
                      ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-300'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400'
                  }`}
                  title="Open Smart Column & Field Customizer side drawer"
                >
                  <Columns className="w-3.5 h-3.5 text-blue-600" />
                  <span>Columns ({visibleColumnsCount}/13)</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleResetDefaults}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              title="Reset parameters to default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier 2 (Parameters & Page Setup): Single inline row */}
        <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-center text-xs">
          {/* 1. Barangay Filter Dropdown */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              BARANGAY SCOPE
            </label>
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs truncate"
            >
              <optgroup label="🌟 Consolidated">
                <option value="ALL">
                  All 15 Barangays (All Records - {parcels.length} {parcels.length === 1 ? 'record' : 'records'})
                </option>
              </optgroup>
              <optgroup label="📍 Specific Barangays (15 Official)">
                {OFFICIAL_15_BARANGAYS.map((b) => {
                  const count = parcels.filter((p) => matchBarangay(p.barangay, b)).length;
                  return (
                    <option key={b} value={b}>
                      Brgy. {b} ({count} {count === 1 ? 'record' : 'records'})
                    </option>
                  );
                })}
              </optgroup>
            </select>
          </div>

          {/* 2. Cropping Season Selector */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              CROPPING SEASON
            </label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs truncate"
            >
              <option value="ALL_SEASONS">All Seasons (Consolidated Historical)</option>
              {CROPPING_SEASONS.map((s) => (
                <option key={s} value={s}>
                  {getShortSeasonName(s)}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Paper Size Selector */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              PAPER SIZE
            </label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 cursor-pointer shadow-2xs truncate"
            >
              <option value="folio">Folio (8.5" x 13" - PH Std)</option>
              <option value="letter">Letter (8.5" x 11")</option>
              <option value="a4">A4 (210 x 297mm)</option>
            </select>
          </div>

          {/* 4. Orientation Switcher */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              ORIENTATION
            </label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 cursor-pointer shadow-2xs truncate"
            >
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          {/* 5. Margins & Table Density */}
          <div className="space-y-0.5">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block">
              MARGINS &amp; DENSITY
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <select
                value={margins}
                onChange={(e) => setMargins(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 cursor-pointer shadow-2xs text-[11px]"
              >
                <option value="standard">Normal (0.5")</option>
                <option value="narrow">Narrow (0.25")</option>
                <option value="wide">Wide (0.75")</option>
              </select>
              <select
                value={tableDensity}
                onChange={(e) => setTableDensity(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 cursor-pointer shadow-2xs text-[11px]"
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfort</option>
                <option value="ultra">Dense</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Screen-Only Edit Notification Banner when in Direct In-Line Edit Mode */}
      {isDirectEditingLetter && (
        <div className="no-print bg-amber-500/10 border border-amber-400 text-amber-950 px-4 py-2.5 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span className="font-extrabold text-amber-900 uppercase">DIRECT ON-CANVAS EDITING MODE ACTIVE:</span>
            <span className="text-amber-800 hidden sm:inline">
              Click directly on any text, memo numbers, table cells, or signatories below to type. All changes sync instantly!
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsDirectEditingLetter(false)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <span>Save &amp; Exit Edit</span>
          </button>
        </div>
      )}

      {/* 2. Word-Style Sheet Canvas Stage on Screen Preview */}
      <div className="w-full bg-slate-200/80 p-6 sm:p-8 min-h-screen overflow-x-auto flex flex-col items-center gap-8 rounded-2xl border border-slate-300/80 shadow-inner print:bg-transparent print:p-0 print:m-0 print:border-none print:shadow-none print:min-h-0 print:overflow-visible">
        <div
          id="printable-report-canvas"
          data-printable-area="true"
          className="transition-transform duration-200 origin-top flex flex-col items-center gap-8 print:transform-none print:gap-0 print:w-full"
          style={{
            transform: zoomPercent !== 100 ? `scale(${zoomPercent / 100})` : undefined,
            transformOrigin: 'top center'
          }}
        >
          {reportType === 'official_registry' ? (
            /* ========================================================================= */
            /* OFFICIAL REGISTRY REPORT (LETTER, REGISTRY TABLE, OR COMPLETE PACKAGE)     */
            /* ========================================================================= */
            documentView === 'complete_package' ? (
              <>
                {/* [Sheet 1/4] Official Transmittal Letter */}
                {(wordViewMode === 'all_pages' || currentPageIndex === 1) &&
                  renderWordSheet(
                    <OfficialLetterDocument
                      letter={currentLetter}
                      activeBarangay={selectedBarangay}
                      activeSeason={selectedSeason}
                      farmerCount={reportParcels.length}
                      totalAreaHa={totalAreaHa}
                      predominantVarieties={predominantVarieties}
                      assignedLftName={assignedLft.name}
                      onUpdateLetter={handleSaveLetter}
                      isEditable={isDirectEditingLetter}
                      orientation={orientation}
                    />,
                    1,
                    totalDocumentPages,
                    'Dossier 1: Official Transmittal Letter',
                    'sheet-complete-1'
                  )}

                {/* [Sheet 2/4] Irrigators Directory */}
                {(wordViewMode === 'all_pages' || currentPageIndex === 2) &&
                  renderWordSheet(
                    <OfficialIrrigatorsDirectoryDocument
                      data={irrigatorsData}
                      onUpdateData={handleSaveIrrigatorsData}
                      isEditable={isDirectEditingLetter}
                      orientation={orientation}
                    />,
                    2,
                    totalDocumentPages,
                    'Dossier 2: Irrigators Association Directory',
                    'sheet-complete-2'
                  )}

                {/* [Sheet 3/4] MPCSRS Palay Report */}
                {(wordViewMode === 'all_pages' || currentPageIndex === 3) &&
                  renderWordSheet(
                    <MpcsrsPalayReportDocument
                      data={mpcsrsData}
                      onUpdateData={handleSaveMpcsrsData}
                      isEditable={isDirectEditingLetter}
                      orientation={orientation}
                    />,
                    3,
                    totalDocumentPages,
                    'Dossier 3: Monthly Palay Crop Status Report (MPCSRS)',
                    'sheet-complete-3'
                  )}

                {/* [Sheets 4..N] Masterlist Registry Chunks */}
                {registryPageChunks.map((chunk, idx) => {
                  const pageNum = 4 + idx;
                  if (wordViewMode === 'single_page' && currentPageIndex !== pageNum) {
                    return null;
                  }
                  const isLastChunk = idx === registryPageChunks.length - 1;
                  return renderWordSheet(
                    <OfficialRegistryTable
                      reportParcels={chunk}
                      visibleColumns={visibleColumns}
                      columnOrder={columnOrder}
                      customTableData={customTableData ? {
                        ...customTableData,
                        rows: customTableData.rows?.slice(idx * rowsPerPage, (idx + 1) * rowsPerPage) || []
                      } : null}
                      totalAreaHa={totalAreaHa}
                      memoRef={currentLetter.memoRef || memoRef}
                      reportDate={currentLetter.date || reportDate}
                      selectedBarangay={selectedBarangay}
                      preparedBy={currentLetter.preparedBy || preparedBy}
                      preparedTitle={currentLetter.preparedTitle || preparedTitle}
                      reviewedBy={currentLetter.reviewedBy || reviewedBy}
                      reviewedTitle={currentLetter.reviewedTitle || reviewedTitle}
                      approvedBy={currentLetter.approvedBy || approvedBy}
                      approvedTitle={currentLetter.approvedTitle || approvedTitle}
                      isEditable={isDirectEditingLetter}
                      orientation={orientation}
                      pageNumber={pageNum}
                      totalPages={totalDocumentPages}
                      hideSignatories={!isLastChunk}
                    />,
                    pageNum,
                    totalDocumentPages,
                    `Dossier ${pageNum}/${totalDocumentPages}: Masterlist Registry`,
                    `sheet-complete-${pageNum}`
                  );
                })}
              </>
            ) : documentView === 'letter' ? (
              renderWordSheet(
                <OfficialLetterDocument
                  letter={currentLetter}
                  activeBarangay={selectedBarangay}
                  activeSeason={selectedSeason}
                  farmerCount={reportParcels.length}
                  totalAreaHa={totalAreaHa}
                  predominantVarieties={predominantVarieties}
                  assignedLftName={assignedLft.name}
                  onUpdateLetter={handleSaveLetter}
                  isEditable={isDirectEditingLetter}
                  orientation={orientation}
                />,
                1,
                1,
                'Official Transmittal Letter'
              )
            ) : documentView === 'irrigators_letter' ? (
              renderWordSheet(
                <OfficialIrrigatorsDirectoryDocument
                  data={irrigatorsData}
                  onUpdateData={handleSaveIrrigatorsData}
                  isEditable={isDirectEditingLetter}
                  orientation={orientation}
                />,
                1,
                1,
                'Irrigators Association Directory'
              )
            ) : documentView === 'mpcsrs_report' ? (
              renderWordSheet(
                <MpcsrsPalayReportDocument
                  data={mpcsrsData}
                  onUpdateData={handleSaveMpcsrsData}
                  isEditable={isDirectEditingLetter}
                  orientation={orientation}
                />,
                1,
                1,
                'Monthly Palay Crop Status Report (MPCSRS)'
              )
            ) : (
              /* documentView === 'registry_table' - Genuine Multi-Page Chunked Registry */
              <>
                {registryPageChunks.map((chunk, idx) => {
                  const pageNum = idx + 1;
                  if (wordViewMode === 'single_page' && currentPageIndex !== pageNum) {
                    return null;
                  }
                  const isLastChunk = idx === registryPageChunks.length - 1;
                  return renderWordSheet(
                    <OfficialRegistryTable
                      reportParcels={chunk}
                      visibleColumns={visibleColumns}
                      columnOrder={columnOrder}
                      customTableData={customTableData ? {
                        ...customTableData,
                        rows: customTableData.rows?.slice(idx * rowsPerPage, (idx + 1) * rowsPerPage) || []
                      } : null}
                      totalAreaHa={totalAreaHa}
                      memoRef={currentLetter.memoRef || memoRef}
                      reportDate={currentLetter.date || reportDate}
                      selectedBarangay={selectedBarangay}
                      preparedBy={currentLetter.preparedBy || preparedBy}
                      preparedTitle={currentLetter.preparedTitle || preparedTitle}
                      reviewedBy={currentLetter.reviewedBy || reviewedBy}
                      reviewedTitle={currentLetter.reviewedTitle || reviewedTitle}
                      approvedBy={currentLetter.approvedBy || approvedBy}
                      approvedTitle={currentLetter.approvedTitle || approvedTitle}
                      isEditable={isDirectEditingLetter}
                      orientation={orientation}
                      pageNumber={pageNum}
                      totalPages={registryPageChunks.length}
                      hideSignatories={!isLastChunk}
                    />,
                    pageNum,
                    registryPageChunks.length,
                    `Field-Validated Masterlist Registry (Page ${pageNum} of ${registryPageChunks.length})`,
                    `registry-sheet-${pageNum}`
                  );
                })}
              </>
            )
          ) : (
            /* ========================================================================= */
            /* SEASONAL / CONSOLIDATED PRODUCTION REPORTS FORMAT                          */
            /* ========================================================================= */
            renderWordSheet(
              <div className="flex flex-col flex-1 justify-between min-h-full">
                {/* Government Official Header with 3 Seals Center-Aligned */}
                <div className="text-center pb-3 mb-4 space-y-2">
                  <StandardReportHeader
                    isEditable={false}
                    className="mb-3"
                  />

                  <div className="space-y-0.5 text-center">
                    <p className="text-[11px] font-sans font-bold text-emerald-800 uppercase tracking-wide">
                      LOCAL FARMER TECHNICIAN (LFT) RICE PRODUCTION &amp; REGISTRY SYSTEM
                    </p>
                  </div>

                  {/* Memorandum Subhead */}
                  <div className="pt-2 flex items-center justify-between text-xs font-mono border-t border-slate-200 mt-2 px-1 text-slate-600">
                    <span>MEMO REF: <strong>{memoRef}</strong></span>
                    <span>ACTIVE SEASON: <strong>{getShortSeasonName(selectedSeason)}</strong></span>
                    <span>DATE: <strong>{reportDate}</strong></span>
                  </div>
                </div>

              {/* Document Title Banner */}
              <div className="bg-slate-900 text-white px-4 py-2.5 rounded-sm flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
                <div>
                  <span className="text-[9.5px] uppercase tracking-wider text-emerald-300 font-bold block">
                    {reportScopeTitle}
                  </span>
                  <h2 className="text-sm sm:text-base font-serif font-bold uppercase tracking-wide">
                    {reportType === 'seasonal_production'
                      ? `Seasonal Rice Production & Harvest Volume Report (${getShortSeasonName(selectedSeason)})`
                      : reportType === 'barangay_consolidated'
                      ? '10 Assigned Barangays Rice Production Summary & Yield Ranking'
                      : 'Rice Farmer Profile Registry & Land Holding Masterlist'}
                  </h2>
                </div>
                <div className="text-right text-[11px] font-mono text-slate-300">
                  <span>Enrolled: <strong>{reportParcels.length} Farmers</strong></span> &bull;{' '}
                  <span>Area: <strong>{totalAreaHa.toFixed(2)} ha</strong></span>
                </div>
              </div>

              {/* Consolidated Executive Metric Summary Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/70 border border-emerald-300 p-3.5 rounded-lg mb-5 text-center">
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Rice Farmers</span>
                  <span className="text-lg font-black text-slate-900 font-mono">{reportParcels.length}</span>
                  <span className="text-[10px] text-slate-500 block">Registered Profiles</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Production Area</span>
                  <span className="text-lg font-black text-emerald-800 font-mono">{totalAreaHa.toFixed(2)} ha</span>
                  <span className="text-[10px] text-emerald-700 block">Mapped Rice Area</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Total Production Volume</span>
                  <span className="text-lg font-black text-amber-900 font-mono">{totalProductionMt.toFixed(2)} MT</span>
                  <span className="text-[10px] text-amber-700 block">({totalBags.toLocaleString()} Bags / Cavans)</span>
                </div>
                <div className="bg-white p-2.5 rounded border border-emerald-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Average Yield</span>
                  <span className="text-lg font-black text-blue-900 font-mono">{averageYieldMtPerHa.toFixed(2)} MT/ha</span>
                  <span className="text-[10px] text-blue-700 block">Municipal Productivity</span>
                </div>
              </div>

          {/* Main Content Table: Depending on selected report format */}
          {reportType === 'barangay_consolidated' ? (
            /* 10 Assigned Barangays Comparative Table */
            <div className="overflow-x-auto border border-slate-300 rounded-sm mb-6">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800 text-white font-serif uppercase tracking-wider text-[10px]">
                    <th className="p-2 border border-slate-700 text-center w-10">No.</th>
                    <th className="p-2 border border-slate-700">Assigned Barangay</th>
                    <th className="p-2 border border-slate-700 text-center">Farmers</th>
                    <th className="p-2 border border-slate-700 text-right">Farm Area (ha)</th>
                    <th className="p-2 border border-slate-700">Dominant Varieties</th>
                    <th className="p-2 border border-slate-700 text-right">Prod. Volume (MT)</th>
                    <th className="p-2 border border-slate-700 text-right">Volume (50kg Bags)</th>
                    <th className="p-2 border border-slate-700 text-right">Average Yield</th>
                    <th className="p-2 border border-slate-700">Assigned LFT Officer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {barangayComparativeData.map((item, idx) => (
                    <tr key={item.barangay} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="p-2 border border-slate-300 font-extrabold text-slate-900">
                        Brgy. {item.barangay}
                      </td>
                      <td className="p-2 border border-slate-300 text-center font-mono font-bold text-slate-800">
                        {item.farmerCount}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-bold text-emerald-800">
                        {item.areaHa.toFixed(2)} ha
                      </td>
                      <td className="p-2 border border-slate-300 text-slate-700 text-[11px]">
                        {item.varieties}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-black text-amber-900">
                        {item.productionMt.toFixed(2)} MT
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono text-slate-700">
                        {item.bags.toLocaleString()}
                      </td>
                      <td className="p-2 border border-slate-300 text-right font-mono font-black text-blue-900">
                        {item.avgYieldMtPerHa.toFixed(2)} MT/ha
                      </td>
                      <td className="p-2 border border-slate-300 font-medium text-slate-800 text-[11px]">
                        {item.focalPerson}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-slate-900 text-xs">
                    <td colSpan={2} className="p-2 border border-slate-300 text-right font-serif uppercase">
                      10 Assigned Barangays Total:
                    </td>
                    <td className="p-2 border border-slate-300 text-center font-mono">
                      {barangayComparativeData.reduce((s, b) => s + b.farmerCount, 0)}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-emerald-900">
                      {barangayComparativeData.reduce((s, b) => s + b.areaHa, 0).toFixed(2)} ha
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-500 text-[10px]">
                      Certified Inbred &amp; Hybrid Seeds
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-amber-950">
                      {barangayComparativeData.reduce((s, b) => s + b.productionMt, 0).toFixed(2)} MT
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      {barangayComparativeData.reduce((s, b) => s + b.bags, 0).toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-blue-950">
                      {averageYieldMtPerHa.toFixed(2)} MT/ha
                    </td>
                    <td className="p-2 border border-slate-300 text-slate-500">
                      Consolidated LFT Sector
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            /* Master-Detail Seasonal Production & Yield Table */
            <div className="overflow-x-auto border border-slate-300 rounded-sm mb-6">
              <table
                className={`w-full text-left border-collapse ${
                  tableDensity === 'ultra' ? 'text-[8.5px]' : tableDensity === 'compact' ? 'text-[9.5px]' : 'text-xs'
                }`}
              >
                <thead>
                  <tr className="bg-slate-900 text-white font-serif uppercase tracking-wider text-[9px]">
                    <th className="p-2 border border-slate-800 text-center w-8">No.</th>
                    <th className="p-2 border border-slate-800">Farmer Profile (Master)</th>
                    <th className="p-2 border border-slate-800">Barangay &amp; Purok</th>
                    <th className="p-2 border border-slate-800 text-right">Area (ha)</th>
                    <th className="p-2 border border-slate-800">Variety &amp; Type</th>
                    <th className="p-2 border border-slate-800">Planting Date</th>
                    <th className="p-2 border border-slate-800">Est. / Act. Harvest</th>
                    <th className="p-2 border border-slate-800 text-right">Actual Vol. (MT)</th>
                    <th className="p-2 border border-slate-800 text-right">Bags (50kg)</th>
                    <th className="p-2 border border-slate-800 text-right">Yield (MT/ha)</th>
                    <th className="p-2 border border-slate-800 text-center">Status</th>
                    <th className="p-2 border border-slate-800">Recording LFT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {parcelsWithSeason.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-500 font-medium">
                        <p className="text-xs font-bold text-slate-700">Walay nakit-ang basakan. Palihug pagdugang og bag-ong rekord.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">No farm records found in the database for the selected criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    parcelsWithSeason.map((item, idx) => (
                    <tr key={item.parcel.tagNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="p-1.5 border border-slate-300 whitespace-nowrap">
                        <span className="font-extrabold text-slate-900 block">{item.parcel.raiserName}</span>
                        <span className="text-[9px] font-mono text-slate-500">{item.parcel.swineNameOrId}</span>
                      </td>
                      <td className="p-1.5 border border-slate-300 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">Brgy. {getDisplayBarangay(item.parcel.barangay)}</span>
                        <span className="text-[9px] text-slate-500">{item.parcel.purok || 'Purok 1'}</span>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono font-extrabold text-emerald-800 whitespace-nowrap">
                        {(item.parcel.weightKg || 0).toFixed(2)}
                      </td>
                      <td className="p-1.5 border border-slate-300 whitespace-nowrap">
                        <span className="font-bold text-slate-900 block">{item.seasonRecord.seedVariety}</span>
                        <span className="text-[8.5px] px-1 py-0.2 rounded bg-slate-100 font-mono text-slate-600">
                          {item.seasonRecord.seedType}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-300 font-mono text-slate-700 whitespace-nowrap">
                        {item.seasonRecord.plantingDate}
                      </td>
                      <td className="p-1.5 border border-slate-300 font-mono text-slate-700 whitespace-nowrap">
                        {(item.seasonRecord as any).actualHarvestDate || item.seasonRecord.estimatedHarvestDate}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-amber-900 whitespace-nowrap">
                        {item.seasonRecord.actualProductionVolumeMt.toFixed(2)}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono text-slate-700 whitespace-nowrap">
                        {item.seasonRecord.actualProductionBags || Math.round(item.seasonRecord.actualProductionVolumeMt * 20)}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-right font-mono font-black text-blue-900 whitespace-nowrap">
                        {item.seasonRecord.yieldMtPerHa.toFixed(2)}
                      </td>
                      <td className="p-1.5 border border-slate-300 text-center whitespace-nowrap">
                        <span
                          className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full border ${
                            item.seasonRecord.productionStatus === 'Harvest Completed'
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : 'bg-amber-100 text-amber-900 border-amber-300'
                          }`}
                        >
                          {item.seasonRecord.productionStatus}
                        </span>
                      </td>
                      <td className="p-1.5 border border-slate-300 text-slate-700 whitespace-nowrap">
                        {item.seasonRecord.lftOfficerName}
                      </td>
                    </tr>
                  )))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t-2 border-slate-800 text-slate-900">
                    <td colSpan={3} className="p-2 border border-slate-300 text-right font-serif uppercase">
                      Consolidated Summary Total:
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-emerald-900">
                      {totalAreaHa.toFixed(2)} ha
                    </td>
                    <td colSpan={3} className="p-2 border border-slate-300 text-center text-slate-500 text-[10px]">
                      Active Cropping Records
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-amber-950">
                      {totalProductionMt.toFixed(2)} MT
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono">
                      {totalBags.toLocaleString()}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono text-blue-950">
                      {averageYieldMtPerHa.toFixed(2)} MT/ha
                    </td>
                    <td colSpan={2} className="p-2 border border-slate-300 text-slate-500 text-center">
                      Verified
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Official Signatory Blocks */}
          <div className="mt-auto grid grid-cols-3 gap-6 pt-6 border-t-2 border-slate-800 text-xs text-center break-inside-avoid print:break-inside-avoid print:mt-auto">
            {/* 1. Prepared by LFT */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Prepared &amp; Verified by:</span>
              <div className="pt-8 pb-1">
                <span className="font-serif font-black text-slate-900 border-b border-slate-900 pb-0.5 uppercase tracking-wide block">
                  {preparedBy}
                </span>
                <span className="text-[10px] text-slate-600 block mt-1">{preparedTitle}</span>
                <span className="text-[9.5px] text-slate-400 font-mono">DA-LGU Agricultural Extension Worker</span>
              </div>
            </div>

            {/* 2. Reviewed by Municipal Agriculturist */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Reviewed &amp; Certified by:</span>
              <div className="pt-8 pb-1">
                <span className="font-serif font-black text-slate-900 border-b border-slate-900 pb-0.5 uppercase tracking-wide block">
                  {reviewedBy}
                </span>
                <span className="text-[10px] text-slate-600 block mt-1">{reviewedTitle}</span>
                <span className="text-[9.5px] text-slate-400 font-mono">Lic. Agriculturist PRC No. 0041892</span>
              </div>
            </div>

            {/* 3. Approved by Municipal Mayor */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Noted &amp; Approved by:</span>
              <div className="pt-8 pb-1">
                <span className="font-serif font-black text-slate-900 border-b border-slate-900 pb-0.5 uppercase tracking-wide block">
                  {approvedBy}
                </span>
                <span className="text-[10px] text-slate-600 block mt-1">{approvedTitle}</span>
                <span className="text-[9.5px] text-slate-400 font-mono">Executive Head of Agency</span>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex items-center justify-between text-[9.5px] text-slate-400 font-mono">
            <span>Security Hash: SHA256-SLG-MAO-RICE-{reportDate.replace(/\s+/g, '')}</span>
            <span>Page 1 of 1 • System Generated by Silago MAO Digital Agriculture Portal</span>
          </div>

          {/* Word-Style Official Print Document Footer */}
          <div className="hidden print:flex items-center justify-between text-[8pt] font-mono text-slate-700 border-t border-black pt-1.5 mt-4">
            <span>REF NO: {memoRef || 'SLG-MAO-PRODUCTION-REPORT'}</span>
            <span>DATE PRINTED: {reportDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span className="print-page-number"></span>
          </div>
        </div>,
        1,
        1,
        'Consolidated Agricultural Production Report'
      )
    )}
        </div>
      </div>

      {/* Word-Style Bottom Navigation & Zoom Toolbar */}
      <div className="no-print fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3.5 text-xs font-sans select-none animate-in fade-in slide-in-from-bottom-2">
        {/* Page indicator & arrows */}
        <div className="flex items-center gap-1.5 border-r border-slate-700 pr-3">
          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.max(1, prev - 1))}
            disabled={currentPageIndex <= 1}
            className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-bold px-1.5 whitespace-nowrap">
            {currentPageIndex} of {totalDocumentPages}
          </span>
          <button
            type="button"
            onClick={() => setCurrentPageIndex((prev) => Math.min(totalDocumentPages, prev + 1))}
            disabled={currentPageIndex >= totalDocumentPages}
            className="p-1 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Switcher: All Pages vs Single Page */}
        {totalDocumentPages > 1 && (
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setWordViewMode('all_pages')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                wordViewMode === 'all_pages'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              All Pages
            </button>
            <button
              type="button"
              onClick={() => setWordViewMode('single_page')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                wordViewMode === 'single_page'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Page {currentPageIndex}
            </button>
          </div>
        )}

        {/* Zoom Percentage Slider & Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomPercent((prev) => Math.max(50, prev - 10))}
            className="p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Zoom Out (-10%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="50"
            max="150"
            step="5"
            value={zoomPercent}
            onChange={(e) => setZoomPercent(Number(e.target.value))}
            className="w-20 accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
          />
          <button
            type="button"
            onClick={() => setZoomPercent((prev) => Math.min(150, prev + 10))}
            className="p-1 hover:bg-white/10 rounded-lg transition cursor-pointer"
            title="Zoom In (+10%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] font-bold w-9 text-center text-emerald-400">
            {zoomPercent}%
          </span>
          <button
            type="button"
            onClick={() => setZoomPercent(100)}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-200 transition cursor-pointer"
            title="Reset Zoom to 100%"
          >
            100%
          </button>
          <button
            type="button"
            onClick={() => setZoomPercent(orientation === 'landscape' ? 68 : 88)}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-bold text-slate-200 transition cursor-pointer"
            title="Fit to Window"
          >
            Fit
          </button>
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={handlePrint}
          className="ml-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer"
          title="Print official document"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>
      </div>

      {/* Floating Quick Action Dock (Right-Hand Fixed Action Center) */}
      <FloatingReportActionDock
        onPrint={handlePrint}
        onExportWord={handleExportWord}
        onExportExcel={handleExportExcel}
        isDirectEditing={isDirectEditingLetter}
        onToggleDirectEdit={() => setIsDirectEditingLetter(!isDirectEditingLetter)}
        documentView={documentView}
        isExportingWord={isExportingWord}
      />

      {/* Document Parameters Modal for Signatories, Dates, Control Numbers & Layout */}
      <DocumentParametersModal
        isOpen={isParamsModalOpen}
        onClose={() => setIsParamsModalOpen(false)}
        signatories={getActiveSignatories()}
        onUpdateSignatories={(sigs) => {
          setPersistedSignatories(sigs);
          supabaseDb.setSetting('silago_registry_table_signatories', sigs);
          if (sigs.length >= 1) {
            setPreparedBy(sigs[0].name);
            setPreparedTitle(sigs[0].title);
          }
          if (sigs.length >= 2) {
            setReviewedBy(sigs[1].name);
            setReviewedTitle(sigs[1].title);
          }
          if (sigs.length >= 3) {
            setApprovedBy(sigs[2].name);
            setApprovedTitle(sigs[2].title);
          }
          if (currentLetter) {
            handleSaveLetter({
              ...currentLetter,
              signatories: sigs
            });
          }
        }}
        memoRef={currentLetter.memoRef || memoRef}
        onUpdateMemoRef={(val) => {
          setMemoRef(val);
          if (currentLetter) {
            handleSaveLetter({
              ...currentLetter,
              memoRef: val
            });
          }
        }}
        reportDate={currentLetter.date || reportDate}
        onUpdateReportDate={(val) => {
          setReportDate(val);
          if (currentLetter) {
            handleSaveLetter({
              ...currentLetter,
              date: val
            });
          }
        }}
        headerConfig={{
          republicHeader: currentLetter.republicHeader,
          provinceHeader: currentLetter.provinceHeader,
          municipalityHeader: currentLetter.municipalityHeader,
          officeHeader: currentLetter.officeHeader
        }}
        onUpdateHeaderConfig={(headers) => {
          if (currentLetter) {
            handleSaveLetter({
              ...currentLetter,
              ...headers
            });
          }
        }}
        paperSize={paperSize}
        onChangePaperSize={(size) => setPaperSize(size)}
        orientation={orientation}
        onChangeOrientation={(ori) => setOrientation(ori)}
        margins={margins}
        onChangeMargins={(m) => setMargins(m)}
        tableDensity={tableDensity}
        onChangeTableDensity={(d) => setTableDensity(d)}
        visibleColumns={visibleColumns}
        onChangeVisibleColumns={(cols) => setVisibleColumns(cols)}
        documentView={documentView}
      />

      {/* Letter Editor Modal for Adding / Editing Official Letters */}
      <LetterEditorModal
        isOpen={isLetterModalOpen}
        onClose={() => setIsLetterModalOpen(false)}
        onSave={handleSaveLetter}
        initialLetter={editingLetter}
        activeBarangay={selectedBarangay}
        activeSeason={selectedSeason}
        farmerCount={reportParcels.length}
        totalAreaHa={totalAreaHa}
      />

      {/* Table Editor Modal for Live Interactive Table Cell/Row/Column Editing */}
      {isTableModalOpen && (
        <TableEditorModal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          tableData={customTableData || buildInitialTableData(reportParcels, visibleColumns)}
          initialData={customTableData || buildInitialTableData(reportParcels, visibleColumns)}
          onSaveTableData={(data) => setCustomTableData(data)}
          onSave={(data) => setCustomTableData(data)}
          onResetToDatabase={() => {
            const fresh = buildInitialTableData(reportParcels, visibleColumns);
            setCustomTableData(fresh);
          }}
        />
      )}

      {/* Smart Column & Field Customizer (Slide-out Drawer from the right) */}
      <SmartColumnDrawer
        isOpen={isColumnPickerOpen}
        onClose={() => setIsColumnPickerOpen(false)}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        columnOrder={columnOrder}
        onReorderColumn={handleReorderColumn}
        onSelectAll={handleSelectAllColumns}
        onDeselectAll={handleDeselectAllColumns}
        onResetToTemplate={handleResetColumnsToTemplate}
        parcels={reportParcels}
      />

      {/* Seasonal Report Logo Editor Modal */}
      <ReportLogoEditorModal
        isOpen={editingSeasonalLogo !== null}
        onClose={() => setEditingSeasonalLogo(null)}
        logoType={editingSeasonalLogo}
      />
    </div>
  );
};
