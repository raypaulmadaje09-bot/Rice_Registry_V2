import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  BARANGAYS,
  ASSIGNED_10_BARANGAYS,
  matchBarangay,
  getDisplayBarangay,
  getUserAssignedBarangays,
  isUserAuthorizedForBarangay,
  getAssignedLftForBarangay
} from '../data/barangays';
import { CROPPING_SEASONS, ACTIVE_SEASON, matchesSeasonFilter, getShortSeasonName } from '../data/seasonalProduction';
import { FarmParcel, SeasonalProductionRecord } from '../types';
import { getLandPhoto, getFarmerPhoto } from '../data/photos';
import { calculateCropGrowthStage, RICE_VARIETIES } from '../data/riceVarieties';
import { SeasonalProductionModal } from '../components/SeasonalProductionModal';
import { PhotoPreviewModal } from '../components/PhotoPreviewModal';
import { SafeImage } from '../components/SafeImage';
import { uploadFarmPhoto, sortParcelsAlphabetically, parseFarmerName } from '../utils/supabaseClient';
import { DaLogo, SilagoSeal, BagOngSilagoLogo } from '../components/Seals';
import {
  Search,
  Plus,
  Download,
  Compass,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle2,
  X,
  History,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  Wheat,
  Calendar,
  Layers,
  Scale,
  QrCode,
  Printer,
  FileText,
  FileSpreadsheet,
  ArrowUpDown,
  Archive,
  ArchiveRestore,
  Filter,
  Check,
  Save,
  Upload,
  Camera,
  MapPin,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
  Eye,
  Pencil
} from 'lucide-react';

interface DatabaseViewProps {
  onSelectParcel: (parcel: FarmParcel) => void;
  onEditParcel: (parcel: FarmParcel) => void;
  onOpenAddParcel: () => void;
  onOpenCropPlanting?: (parcel?: FarmParcel | null) => void;
  onOpenPublicInterface?: () => void;
  onNavigateToReports?: (barangay?: string) => void;
  onLocateOnMap?: (parcel: FarmParcel) => void;
  initialSearchQuery?: string;
  openCertificateOnLoad?: boolean;
  onCertificateRouteHandled?: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  onSelectParcel,
  onEditParcel,
  onOpenAddParcel,
  onOpenCropPlanting,
  onOpenPublicInterface,
  onNavigateToReports,
  onLocateOnMap,
  initialSearchQuery,
  openCertificateOnLoad = false,
  onCertificateRouteHandled
}) => {
  const {
    parcels,
    deleteParcel,
    deleteBulkParcels,
    updateParcel,
    currentUser,
    activeSeason,
    permissions,
    realtimeStatus,
    isRealtimeSyncing,
    syncWithSupabase,
    offlineQueueCount,
    syncOfflineQueue,
    isOnline,
    t
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');

  // Synchronize external filter triggers from RiceSsistant
  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [selectedBarangay, setSelectedBarangay] = useState<string>('ALL');
  const [selectedSeason, setSelectedSeason] = useState<string>(activeSeason || ACTIVE_SEASON);
  const [selectedEcosystem, setSelectedEcosystem] = useState<string>('ALL');
  const [selectedVariety, setSelectedVariety] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'area' | 'tag' | 'farmer' | 'barangay'>('farmer');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [showPrintSummaryModal, setShowPrintSummaryModal] = useState<boolean>(false);
  const [parcelToDelete, setParcelToDelete] = useState<FarmParcel | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Search scope matching Swine Registry (All Fields | Tag ID | Owner Name)
  const [searchScope, setSearchScope] = useState<'all' | 'tag' | 'farmer'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [showMoreActionsMenu, setShowMoreActionsMenu] = useState<boolean>(false);
  const moreActionsRef = useRef<HTMLDivElement | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  // Outside click listener for More Actions dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
        setShowMoreActionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Multi-Select Checkboxes State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Reset selected checkboxes and pagination on filter or search query change
  useEffect(() => {
    setSelectedTags([]);
    setCurrentPage(1);
  }, [selectedBarangay, selectedSeason, selectedEcosystem, selectedVariety, searchQuery, searchScope, statusFilter, showArchived]);

  // Inline Row Editing State
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [inlineEditData, setInlineEditData] = useState<{
    swineNameOrId: string;
    farmerFamilyName: string;
    farmerGivenName: string;
    farmerMiddleName: string;
    photoUrl: string;
    fieldPhotoUrl: string;
    barangay: string;
    purok: string;
    residentialAddress: string;
    birthday: string;
    farmLocation: string;
    purpose?: string;
    lat: number;
    lng: number;
    weightKg: number;
    commodity: string;
    breed: string;
  } | null>(null);

  // Certificate Modal state
  const [certificateParcel, setCertificateParcel] = useState<FarmParcel | null>(null);
  const [certificateBarangayScope, setCertificateBarangayScope] = useState('ALL');
  const [certificateSeasonScope, setCertificateSeasonScope] = useState('ALL_SEASONS');
  const [certificatePaperSize, setCertificatePaperSize] = useState<'folio' | 'letter' | 'a4'>('folio');
  const [certificateOrientation, setCertificateOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [certificateZoom, setCertificateZoom] = useState(85);

  useEffect(() => {
    if (!openCertificateOnLoad || parcels.length === 0) return;
    const initialParcel = parcels[0];
    setCertificateParcel(initialParcel);
    onCertificateRouteHandled?.();
  }, [openCertificateOnLoad, onCertificateRouteHandled, parcels]);

  // User assigned barangays (LFT jurisdiction)
  const userAssigned = useMemo(() => {
    return getUserAssignedBarangays(currentUser);
  }, [currentUser]);

  // Seasonal modal state for LFT input
  const [seasonalModalOpen, setSeasonalModalOpen] = useState(false);
  const [seasonalFarmer, setSeasonalFarmer] = useState<FarmParcel | null>(null);
  const [seasonalRecordToEdit, setSeasonalRecordToEdit] = useState<SeasonalProductionRecord | null>(null);

  // Photo preview lightbox state
  const [photoPreview, setPhotoPreview] = useState<{
    isOpen: boolean;
    photoUrl: string;
    photoType: 'profile' | 'field';
    parcel: FarmParcel | null;
  }>({
    isOpen: false,
    photoUrl: '',
    photoType: 'profile',
    parcel: null
  });

  // Format Birthday to standard MM/DD/YYYY format
  const formatBirthday = (bday?: string) => {
    if (!bday) return '-';
    const clean = bday.trim();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(clean)) return clean;
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-');
      return `${m}/${d}/${y}`;
    }
    const d = new Date(clean);
    if (!isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${mm}/${dd}/${yyyy}`;
    }
    return clean;
  };

  const getFarmLocation = (parcel: FarmParcel) => {
    if (parcel.farmLocation && parcel.farmLocation.trim()) {
      return parcel.farmLocation.trim().toUpperCase();
    }
    const brgy = getDisplayBarangay(parcel.barangay).toUpperCase();
    if (parcel.purok) {
      return `${parcel.purok.toUpperCase()}, BRGY. ${brgy}`;
    }
    return `BRGY. ${brgy}`;
  };

  const getEcosystemBadge = (purpose?: string, eco?: string) => {
    const text = (purpose || eco || '').toLowerCase();
    if (text.includes('irrigated')) {
      return {
        label: 'Irrigated Lowland',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300'
      };
    }
    if (text.includes('rainfed')) {
      return {
        label: 'Rainfed Lowland',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300'
      };
    }
    if (text.includes('hybrid')) {
      return {
        label: 'Hybrid Lowland',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-300'
      };
    }
    if (text.includes('upland')) {
      return {
        label: 'Upland Rice',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-300'
      };
    }
    return {
      label: purpose || 'Lowland Rice',
      badgeClass: 'bg-slate-50 text-slate-700 border-slate-200'
    };
  };

  const getFarmerNameParts = (parcel: FarmParcel) => {
    if (parcel.farmerFamilyName && parcel.farmerGivenName) {
      return {
        family: parcel.farmerFamilyName.trim().toUpperCase(),
        given: parcel.farmerGivenName.trim().toUpperCase(),
        middle: (parcel.farmerMiddleName || '').trim().toUpperCase()
      };
    }
    const raw = (parcel.raiserName || '').trim();
    if (raw.includes(',')) {
      const [last, rest] = raw.split(',');
      const restParts = (rest || '').trim().split(/\s+/).filter(Boolean);
      const given = restParts[0] ? restParts[0].toUpperCase() : '';
      const middle = restParts.slice(1).join(' ').toUpperCase();
      return { family: last.trim().toUpperCase(), given, middle };
    }
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return { family: parts[0].toUpperCase(), given: '', middle: '' };
    if (parts.length === 2) return { family: parts[1].toUpperCase(), given: parts[0].toUpperCase(), middle: '' };
    const family = parts[parts.length - 1].toUpperCase();
    const given = parts.slice(0, parts.length - 2).join(' ').toUpperCase() || parts[0].toUpperCase();
    const middle = parts[parts.length - 2].toUpperCase();
    return { family, given, middle };
  };

  const getFarmerDisplayName = (parcel: FarmParcel): string => {
    if (parcel.farmerFamilyName && parcel.farmerGivenName) {
      const fam = parcel.farmerFamilyName.trim().toUpperCase();
      const giv = parcel.farmerGivenName.trim();
      const mid = parcel.farmerMiddleName ? ` ${parcel.farmerMiddleName.trim()}` : '';
      const suf = (parcel as any).farmerSuffix || (parcel as any).suffix ? ` ${(parcel as any).farmerSuffix || (parcel as any).suffix}` : '';
      return `${fam}, ${giv}${mid}${suf}`.trim();
    }
    if (parcel.raiserName && parcel.raiserName.trim()) {
      return parcel.raiserName.trim();
    }
    return 'UNNAMED FARMER';
  };

  // Extract unique rice varieties
  const uniqueVarieties = useMemo(() => {
    const set = new Set<string>();
    parcels.forEach((p) => {
      if (p.breed) set.add(p.breed);
      p.seasonalRecords?.forEach((r) => {
        if (r.seedVariety) set.add(r.seedVariety);
      });
    });
    return Array.from(set).sort();
  }, [parcels]);

  // Filtered parcels with 10 assigned barangays logic, search scope, status filter, and user LFT jurisdiction
  const filteredParcels = useMemo(() => {
    const filtered = parcels.filter((p) => {
      if (showArchived) {
        if (!p.isArchived && !p.is_archived) return false;
      } else {
        if (p.isArchived || p.is_archived) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        if (searchScope === 'tag') {
          matchesSearch =
            (p.tagNumber || '').toLowerCase().includes(q) ||
            Boolean(p.swineNameOrId && p.swineNameOrId.toLowerCase().includes(q));
        } else if (searchScope === 'farmer') {
          matchesSearch =
            (p.raiserName || '').toLowerCase().includes(q) ||
            Boolean(p.farmerFamilyName && p.farmerFamilyName.toLowerCase().includes(q)) ||
            Boolean(p.farmerGivenName && p.farmerGivenName.toLowerCase().includes(q)) ||
            Boolean(p.farmerMiddleName && p.farmerMiddleName.toLowerCase().includes(q));
        } else {
          matchesSearch =
            (p.tagNumber || '').toLowerCase().includes(q) ||
            (p.swineNameOrId || '').toLowerCase().includes(q) ||
            (p.raiserName || '').toLowerCase().includes(q) ||
            Boolean(p.farmerFamilyName && p.farmerFamilyName.toLowerCase().includes(q)) ||
            Boolean(p.farmerGivenName && p.farmerGivenName.toLowerCase().includes(q)) ||
            Boolean(p.farmerMiddleName && p.farmerMiddleName.toLowerCase().includes(q)) ||
            (p.breed || '').toLowerCase().includes(q) ||
            (p.barangay || '').toLowerCase().includes(q) ||
            (p.purok || '').toLowerCase().includes(q) ||
            (p.focalPerson || '').toLowerCase().includes(q);
        }
      }

      let matchesBrgy = true;
      if (selectedBarangay === 'ALL') {
        matchesBrgy = true;
      } else if (selectedBarangay === 'MY_ASSIGNED') {
        matchesBrgy = userAssigned
          ? userAssigned.some((b) => matchBarangay(p.barangay, b))
          : true;
      } else if (selectedBarangay === 'ASSIGNED_10') {
        matchesBrgy = ASSIGNED_10_BARANGAYS.some((b) => matchBarangay(p.barangay, b));
      } else {
        matchesBrgy = matchBarangay(p.barangay, selectedBarangay);
      }

      let matchesStatus = true;
      if (statusFilter === 'verified') {
        matchesStatus = !p.isArchived && !p.is_archived;
      } else if (statusFilter === 'pending') {
        matchesStatus =
          (p.healthStatus || '').toLowerCase().includes('pending') ||
          Boolean((p as any).status && (p as any).status.toLowerCase().includes('pending'));
      } else if (statusFilter === 'irrigated') {
        matchesStatus = (p.purpose || '').toLowerCase().includes('irrigated');
      } else if (statusFilter === 'rainfed') {
        matchesStatus = (p.purpose || '').toLowerCase().includes('rainfed');
      } else if (statusFilter === 'owner') {
        matchesStatus = (p.sex || '').toLowerCase().includes('owner');
      } else if (statusFilter === 'tenant') {
        matchesStatus = (p.sex || '').toLowerCase().includes('tenant');
      }

      const matchesEco =
        selectedEcosystem === 'ALL' ||
        (selectedEcosystem === 'IRRIGATED' && p.purpose.toLowerCase().includes('irrigated')) ||
        (selectedEcosystem === 'HYBRID' && p.purpose.toLowerCase().includes('hybrid')) ||
        (selectedEcosystem === 'RAINFED' && p.purpose.toLowerCase().includes('rainfed')) ||
        (selectedEcosystem === 'UPLAND' && p.purpose.toLowerCase().includes('upland'));

      const currentRecord = selectedSeason === 'ALL_SEASONS'
        ? p.seasonalRecords?.[0]
        : p.seasonalRecords?.find((r) => matchesSeasonFilter(r.season, selectedSeason) || matchesSeasonFilter(r.seasonName, selectedSeason));
      const activeBreed = currentRecord ? (currentRecord.varietyPlanted || currentRecord.seedVariety) : p.breed;

      const matchesVariety =
        selectedVariety === 'ALL' ||
        activeBreed.toLowerCase() === selectedVariety.toLowerCase();

      return matchesSearch && matchesBrgy && matchesStatus && matchesEco && matchesVariety;
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        const dateA = new Date(a.registrationDate || 0).getTime();
        const dateB = new Date(b.registrationDate || 0).getTime();
        cmp = dateA - dateB;
      } else if (sortBy === 'area') {
        const areaA = Number(a.weightKg || a.areaHa || 0);
        const areaB = Number(b.weightKg || b.areaHa || 0);
        cmp = areaA - areaB;
      } else if (sortBy === 'tag') {
        const tagA = (a.swineNameOrId || a.tagNumber || '').toLowerCase();
        const tagB = (b.swineNameOrId || b.tagNumber || '').toLowerCase();
        cmp = tagA.localeCompare(tagB);
      } else if (sortBy === 'barangay') {
        cmp = (a.barangay || '').localeCompare(b.barangay || '');
      } else {
        const nameA = (a.farmerFamilyName ? `${a.farmerFamilyName}, ${a.farmerGivenName || ''}` : a.raiserName || '').toLowerCase();
        const nameB = (b.farmerFamilyName ? `${b.farmerFamilyName}, ${b.farmerGivenName || ''}` : b.raiserName || '').toLowerCase();
        cmp = nameA.localeCompare(nameB);
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [parcels, searchQuery, searchScope, statusFilter, selectedBarangay, selectedSeason, selectedEcosystem, selectedVariety, userAssigned, showArchived, sortBy, sortOrder]);

  const archivedCount = useMemo(() => {
    return parcels.filter((p) => Boolean(p.isArchived || p.is_archived)).length;
  }, [parcels]);

  const activeAdvancedFilterCount = useMemo(() => {
    let count = 0;
    if (selectedVariety !== 'ALL') count++;
    if (selectedEcosystem !== 'ALL') count++;
    if (selectedSeason !== 'ALL_SEASONS' && selectedSeason !== activeSeason) count++;
    if (sortBy !== 'farmer') count++;
    return count;
  }, [selectedVariety, selectedEcosystem, selectedSeason, activeSeason, sortBy]);

  const totalActiveFilterCount = useMemo(() => {
    let count = activeAdvancedFilterCount;
    if (searchQuery.trim()) count++;
    if (searchScope !== 'all') count++;
    if (selectedBarangay !== 'ALL') count++;
    if (statusFilter !== 'all') count++;
    if (showArchived) count++;
    return count;
  }, [activeAdvancedFilterCount, searchQuery, searchScope, selectedBarangay, statusFilter, showArchived]);

  const totalPages = Math.ceil(filteredParcels.length / itemsPerPage) || 1;

  const paginatedParcels = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredParcels.slice(start, start + itemsPerPage);
  }, [filteredParcels, currentPage, itemsPerPage]);

  const certificateCandidates = useMemo(
    () => filteredParcels.filter((parcel) => {
      const inBarangay = certificateBarangayScope === 'ALL' || matchBarangay(parcel.barangay, certificateBarangayScope);
      const inSeason = certificateSeasonScope === 'ALL_SEASONS' || (parcel.seasonalRecords || []).some((record) =>
        matchesSeasonFilter(record.season, certificateSeasonScope) || matchesSeasonFilter(record.seasonName, certificateSeasonScope)
      );
      return inBarangay && inSeason;
    }),
    [filteredParcels, certificateBarangayScope, certificateSeasonScope]
  );

  const certificatePageSize = certificatePaperSize === 'folio'
    ? (certificateOrientation === 'portrait' ? '8.5in 13in' : '13in 8.5in')
    : certificatePaperSize === 'a4'
      ? (certificateOrientation === 'portrait' ? '210mm 297mm' : '297mm 210mm')
      : (certificateOrientation === 'portrait' ? '8.5in 11in' : '11in 8.5in');
  const certificatePageWidth = certificatePaperSize === 'folio'
    ? (certificateOrientation === 'portrait' ? '816px' : '1248px')
    : certificatePaperSize === 'a4'
      ? (certificateOrientation === 'portrait' ? '794px' : '1123px')
      : (certificateOrientation === 'portrait' ? '816px' : '1056px');

  useEffect(() => {
    if (certificateParcel && !certificateCandidates.some((parcel) => parcel.tagNumber === certificateParcel.tagNumber) && certificateCandidates[0]) {
      setCertificateParcel(certificateCandidates[0]);
    }
  }, [certificateCandidates, certificateParcel]);

  // Total area and seasonal production statistics
  const totalAreaMapped = useMemo(() => {
    return filteredParcels.reduce((acc, p) => acc + (p.weightKg || 0), 0);
  }, [filteredParcels]);

  const avgFarmSize = useMemo(() => {
    if (filteredParcels.length === 0) return '0.00';
    return (totalAreaMapped / filteredParcels.length).toFixed(2);
  }, [totalAreaMapped, filteredParcels.length]);

  const seasonalProductionStats = useMemo(() => {
    let totalProdMt = 0;
    let totalBags = 0;
    filteredParcels.forEach((p) => {
      const records = p.seasonalRecords || [];
      if (selectedSeason === 'ALL_SEASONS') {
        if (records.length > 0) {
          records.forEach((r) => {
            totalProdMt += (r.actualProductionVolumeMt || r.yieldMetricTons || 0);
            totalBags += (r.yieldBags ?? r.actualProductionBags ?? Math.round((r.actualProductionVolumeMt || 0) * 20));
          });
        } else {
          totalProdMt += (p.weightKg || 1) * 4.8;
          totalBags += Math.round((p.weightKg || 1) * 4.8 * 20);
        }
      } else {
        const rec = records.find((r) => matchesSeasonFilter(r.season, selectedSeason) || matchesSeasonFilter(r.seasonName, selectedSeason)) || records[0];
        if (rec) {
          totalProdMt += (rec.actualProductionVolumeMt || rec.yieldMetricTons || 0);
          totalBags += (rec.yieldBags ?? rec.actualProductionBags ?? Math.round((rec.actualProductionVolumeMt || 0) * 20));
        } else {
          totalProdMt += (p.weightKg || 1) * 4.8;
          totalBags += Math.round((p.weightKg || 1) * 4.8 * 20);
        }
      }
    });
    const avgYield = totalAreaMapped > 0 ? Number((totalProdMt / totalAreaMapped).toFixed(2)) : 0;
    return {
      totalProdMt: Number(totalProdMt.toFixed(2)),
      totalBags: totalBags || Math.round(totalProdMt * 20),
      avgYieldMtPerHa: avgYield
    };
  }, [filteredParcels, selectedSeason, totalAreaMapped]);

  const handleStartInlineEdit = (e: React.MouseEvent, parcel: FarmParcel) => {
    e.stopPropagation();
    if (!isUserAuthorizedForBarangay(currentUser, parcel.barangay)) {
      setActionNotice(
        `Restricted Access: As an assigned LFT (${currentUser?.name}), you are restricted to managing parcels in your assigned barangays: ${userAssigned?.join(', ')}. Barangay "${parcel.barangay}" is outside your jurisdiction.`
      );
      return;
    }
    const nameParts = getFarmerNameParts(parcel);
    const farmerPhoto = getFarmerPhoto(parcel);
    const landPhoto = getLandPhoto(parcel);

    setEditingTag(parcel.tagNumber);
    setInlineEditData({
      swineNameOrId: parcel.swineNameOrId || '',
      farmerFamilyName: parcel.farmerFamilyName || nameParts.family || '',
      farmerGivenName: parcel.farmerGivenName || nameParts.given || '',
      farmerMiddleName: parcel.farmerMiddleName || nameParts.middle || '',
      photoUrl: parcel.photoUrl || parcel.farmerPhotoUrl || farmerPhoto,
      fieldPhotoUrl: parcel.fieldPhotoUrl || parcel.landPhotoUrl || landPhoto,
      barangay: parcel.barangay || 'Balagawan',
      purok: parcel.purok || 'Purok 1',
      residentialAddress: parcel.residential_address || parcel.address || (parcel.purok ? `Purok ${parcel.purok}, Brgy. ${parcel.barangay}, Silago` : `Brgy. ${parcel.barangay}, Silago`),
      birthday: parcel.birthday ? formatBirthday(parcel.birthday) : '',
      farmLocation: parcel.farmLocation || getFarmLocation(parcel),
      purpose: parcel.purpose || 'Irrigated Lowland (NIA)',
      lat: parcel.lat || 10.5312,
      lng: parcel.lng || 125.1643,
      weightKg: parcel.weightKg || 0,
      commodity: parcel.commodity || 'Rice',
      breed: parcel.breed || 'NSIC Rc 222'
    });
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'field') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const recordTag = editingTag || 'parcel';
      const cleanTag = recordTag.replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicUrl = await uploadFarmPhoto(file, `${cleanTag}-${type}`);

      if (type === 'profile') {
        setInlineEditData((prev) => (prev ? { ...prev, photoUrl: publicUrl } : null));
      } else {
        setInlineEditData((prev) => (prev ? { ...prev, fieldPhotoUrl: publicUrl } : null));
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (type === 'profile') {
          setInlineEditData((prev) => (prev ? { ...prev, photoUrl: dataUrl } : null));
        } else {
          setInlineEditData((prev) => (prev ? { ...prev, fieldPhotoUrl: dataUrl } : null));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInlineEdit = (tagNumber: string) => {
    if (!inlineEditData) return;
    const fam = inlineEditData.farmerFamilyName.trim().toUpperCase();
    const giv = inlineEditData.farmerGivenName.trim();
    const mid = inlineEditData.farmerMiddleName.trim();
    const fullRaiserName = fam && giv ? `${fam}, ${giv} ${mid}`.trim() : (fam || giv || 'UNKNOWN');

    updateParcel(tagNumber, {
      swineNameOrId: inlineEditData.swineNameOrId.trim(),
      farmerFamilyName: fam,
      farmerGivenName: giv,
      farmerMiddleName: mid,
      raiserName: fullRaiserName,
      barangay: inlineEditData.barangay,
      purok: inlineEditData.purok,
      residential_address: inlineEditData.residentialAddress,
      address: inlineEditData.residentialAddress,
      birthday: inlineEditData.birthday,
      farmLocation: inlineEditData.farmLocation,
      purpose: inlineEditData.purpose || 'Irrigated Lowland (NIA)',
      lat: Number(inlineEditData.lat) || 0,
      lng: Number(inlineEditData.lng) || 0,
      weightKg: Number(inlineEditData.weightKg) || 0,
      commodity: inlineEditData.commodity,
      breed: inlineEditData.breed,
      photoUrl: inlineEditData.photoUrl,
      farmerPhotoUrl: inlineEditData.photoUrl,
      fieldPhotoUrl: inlineEditData.fieldPhotoUrl,
      landPhotoUrl: inlineEditData.fieldPhotoUrl
    });

    setEditingTag(null);
    setInlineEditData(null);
    setActionNotice(`Updated RSBSA Record "${inlineEditData.swineNameOrId || tagNumber}" successfully.`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleCancelInlineEdit = () => {
    setEditingTag(null);
    setInlineEditData(null);
  };

  const handleOpenSeasonalInput = (parcel: FarmParcel, record?: SeasonalProductionRecord) => {
    setSeasonalFarmer(parcel);
    setSeasonalRecordToEdit(record || parcel.seasonalRecords?.find((r) => r.season === selectedSeason) || null);
    setSeasonalModalOpen(true);
  };

  const handleEditAttempt = (parcel: FarmParcel) => {
    if (!isUserAuthorizedForBarangay(currentUser, parcel.barangay)) {
      setActionNotice(
        `Restricted Access: As an assigned LFT (${currentUser?.name}), you are restricted to managing parcels in your assigned barangays: ${userAssigned?.join(', ')}. Barangay "${parcel.barangay}" is outside your jurisdiction.`
      );
      return;
    }
    onEditParcel(parcel);
  };

  const handleSeasonalAttempt = (parcel: FarmParcel, record?: SeasonalProductionRecord) => {
    if (!isUserAuthorizedForBarangay(currentUser, parcel.barangay)) {
      setActionNotice(
        `Restricted Access: Cannot record seasonal production for Brgy. ${parcel.barangay}. You (${currentUser?.name}) are only authorized for: ${userAssigned?.join(', ')}.`
      );
      return;
    }
    handleOpenSeasonalInput(parcel, record);
  };

  const handleDeleteAttempt = (parcel: FarmParcel) => {
    if (!permissions.canDeleteParcels) {
      setActionNotice(
        `Restricted Permission: Deleting official farm records is strictly restricted to Central Admin. Field officers (${currentUser?.name || 'User'}) cannot delete registered records.`
      );
      return;
    }
    setParcelToDelete(parcel);
  };

  const handleToggleArchive = (parcel: FarmParcel) => {
    const isCurrentlyArchived = Boolean(parcel.isArchived || parcel.is_archived);
    updateParcel(parcel.tagNumber, {
      isArchived: !isCurrentlyArchived,
      is_archived: !isCurrentlyArchived,
    });
    setActionNotice(
      `Farm parcel "${parcel.swineNameOrId || parcel.tagNumber}" (${getFarmerDisplayName(parcel)}) ${
        !isCurrentlyArchived ? 'moved to archive' : 'restored to active registry'
      }.`
    );
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Export to Excel (CSV format with UTF-8 BOM that opens directly in MS Excel)
  const exportToExcel = () => {
    const headers = [
      'RSBSA NO.',
      'FAMILY NAME',
      'GIVEN NAME',
      'MIDDLE NAME',
      'BARANGAY',
      'PUROK',
      'RESIDENTIAL ADDRESS',
      'BIRTHDAY',
      'FARM LOCATION',
      'GPS LATITUDE',
      'GPS LONGITUDE',
      'FARM AREA (HA)',
      'COMMODITY PLANTED',
      'SEED VARIETY',
      'CROPPING SEASON',
      'PLANTING DATE',
      'HARVEST DATE',
      'PRODUCTION (MT)',
      'YIELD (MT/HA)',
      'STATUS',
      'LFT OFFICER'
    ];

    const rows = filteredParcels.map((p) => {
      const rec = p.seasonalRecords?.find((r) => r.season === selectedSeason) || p.seasonalRecords?.[0];
      const nameParts = getFarmerNameParts(p);
      const bdayFormatted = formatBirthday(p.birthday);
      const farmLoc = getFarmLocation(p);
      const commodityPlanted = `${p.commodity || 'Rice'} / ${rec ? rec.seedVariety : p.breed}`;

      return [
        `"${p.swineNameOrId || 'NO RSBSA'}"`,
        `"${nameParts.family}"`,
        `"${nameParts.given}"`,
        `"${nameParts.middle}"`,
        `"${p.barangay}"`,
        `"${p.purok || 'Purok 1'}"`,
        `"Silago, Southern Leyte"`,
        `"${bdayFormatted}"`,
        `"${farmLoc}"`,
        p.lat ? p.lat.toFixed(6) : '',
        p.lng ? p.lng.toFixed(6) : '',
        (p.weightKg || p.areaHa || 0).toFixed(2),
        `"${commodityPlanted}"`,
        `"${rec ? rec.seedVariety : p.breed}"`,
        `"${selectedSeason}"`,
        `"${rec ? rec.plantingDate : p.plantingDate || '2026-07-20'}"`,
        `"${rec ? (rec.actualHarvestDate || rec.estimatedHarvestDate) : '2026-11-15'}"`,
        rec ? rec.actualProductionVolumeMt.toFixed(2) : ((p.weightKg || 1) * 4.8).toFixed(2),
        rec ? rec.yieldMtPerHa.toFixed(2) : '4.80',
        `"${rec ? rec.productionStatus : 'Standing Crop'}"`,
        `"${rec ? rec.lftOfficerName : p.focalPerson}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DA_Silago_Rice_Records_${selectedBarangay}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to MS Word (.doc with HTML table styling) matching Swine Registry
  const exportToWord = () => {
    const tableRowsHtml = filteredParcels
      .map(
        (p, i) => `
      <tr style="border-bottom: 1px solid #ddd;">
        <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${i + 1}</td>
        <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold; font-family: monospace;">${p.swineNameOrId || p.tagNumber}</td>
        <td style="padding: 6px; border: 1px solid #ccc; font-weight: bold;">${getFarmerDisplayName(p)}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">Brgy. ${p.barangay}</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${p.breed} (${p.seedType || 'INBRED'})</td>
        <td style="padding: 6px; border: 1px solid #ccc;">${p.purpose || 'Irrigated Lowland'}</td>
        <td style="padding: 6px; border: 1px solid #ccc; text-align: right; font-weight: bold;">${(p.weightKg || p.areaHa || 0).toFixed(2)} ha</td>
        <td style="padding: 6px; border: 1px solid #ccc; text-align: right;">${((p.weightKg || 1) * 4.8).toFixed(1)} MT</td>
        <td style="padding: 6px; border: 1px solid #ccc; text-align: center;">${(p.boundaryCoords && p.boundaryCoords.length > 2) || (p.lat && p.lng) ? 'GPS MAPPED' : 'UNMAPPED'}</td>
      </tr>
    `
      )
      .join('');

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>DA Silago Rice Registry</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 11pt; }
        h2, h3 { color: #15803d; margin-bottom: 2px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th { background-color: #15803d; color: white; padding: 8px; border: 1px solid #15803d; text-align: left; }
      </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 10pt;">Republic of the Philippines • Province of Southern Leyte</p>
          <h2 style="margin: 4px 0;">MUNICIPALITY OF SILAGO</h2>
          <h3 style="margin: 0;">DEPARTMENT OF AGRICULTURE - RICE FARM REGISTRY</h3>
          <p style="margin-top: 4px; font-size: 9pt; color: #555;">Official Rice Registry & Georeferencing Summary • Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>RSBSA No</th>
              <th>Farmer Name</th>
              <th>Barangay</th>
              <th>Rice Variety</th>
              <th>Agro-Ecosystem</th>
              <th>Farm Area</th>
              <th>Est. Yield</th>
              <th>GIS Status</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="width: 250px; text-align: center;">
            <p>Prepared by:</p>
            <br/><br/>
            <p style="border-top: 1px solid #000; font-weight: bold; margin-top: 20px;">${currentUser?.name || 'Authorized LFT Officer'}</p>
            <p style="font-size: 9pt; margin: 0;">Local Farmer Technician / AEW</p>
          </div>
          <div style="width: 250px; text-align: center;">
            <p>Attested & Approved by:</p>
            <br/><br/>
            <p style="border-top: 1px solid #000; font-weight: bold; margin-top: 20px;">ENGR. ARNALDO M. VALDEZ</p>
            <p style="font-size: 9pt; margin: 0;">Municipal Agriculturist - Silago</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: 'application/msword;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DA_Silago_Rice_Registry_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = exportToExcel;

  // Selected Parcels calculation
  const selectedParcels = useMemo(() => {
    return parcels.filter((p) => selectedTags.includes(p.tagNumber));
  }, [parcels, selectedTags]);

  const visibleSelectedCount = useMemo(() => {
    return filteredParcels.filter((p) => selectedTags.includes(p.tagNumber)).length;
  }, [filteredParcels, selectedTags]);

  const isAllSelected = filteredParcels.length > 0 && visibleSelectedCount === filteredParcels.length;
  const isSomeSelected = visibleSelectedCount > 0 && visibleSelectedCount < filteredParcels.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const visibleSet = new Set(filteredParcels.map((p) => p.tagNumber));
      setSelectedTags((prev) => prev.filter((t) => !visibleSet.has(t)));
    } else {
      const currentSelectedSet = new Set(selectedTags);
      filteredParcels.forEach((p) => currentSelectedSet.add(p.tagNumber));
      setSelectedTags(Array.from(currentSelectedSet));
    }
  };

  const handleToggleSelectRow = (tagNumber: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagNumber) ? prev.filter((t) => t !== tagNumber) : [...prev, tagNumber]
    );
  };

  const handleClearSelection = () => {
    setSelectedTags([]);
  };

  const handleBulkDeleteSubmit = async () => {
    if (!permissions.canDeleteParcels) {
      setActionNotice('Restricted Permission: Only Central Admin can delete records.');
      setShowBulkDeleteModal(false);
      return;
    }
    setIsBulkDeleting(true);
    try {
      const count = selectedTags.length;
      await deleteBulkParcels(selectedTags);
      setSelectedTags([]);
      setShowBulkDeleteModal(false);
      setActionNotice(`Successfully deleted ${count} farm records from Supabase database.`);
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      console.warn('Bulk delete error:', err);
      setActionNotice(`Bulk delete notice: ${err?.message || 'Error deleting records'}`);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Toast / Feedback Notice */}
      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{actionNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="p-1 text-emerald-700 hover:text-emerald-950 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Card 1: Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-5 py-4 rounded border border-gov-line border-t-2 border-t-gov-forest">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="gov-heading text-xl">{t('database.title', 'Rice Records Registry')}</h2>
            <span className="gov-badge gov-badge-green">
              {filteredParcels.length} Parcels
            </span>
            {currentUser?.barangay && currentUser?.role !== 'Central Admin' && (
              <span className="gov-badge gov-badge-neutral">
                Brgy. {currentUser.barangay} Scope
              </span>
            )}
          </div>
          <p className="text-xs text-gov-muted mt-1 max-w-3xl leading-relaxed">
            Centralized Silago rice registry with immutable Parcel Tag IDs, RSBSA verification, automated farm area recalculations, and dynamic georeferenced tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Record Archives Button */}
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`gov-btn ${
              showArchived
                ? 'bg-gov-gold-soft text-amber-900 border-amber-300'
                : 'gov-btn-secondary'
            }`}
            title="Toggle between active and archived rice parcel records"
          >
            <Archive className="w-3.5 h-3.5 text-gov-muted" />
            <span>Record Archives</span>
            <span className="ml-1 px-1.5 py-0.5 bg-gov-canvas text-gov-ink rounded-sm text-[10px] font-bold tabular-nums">
              {archivedCount}
            </span>
          </button>

          {/* More actions dropdown (Print PDF Summary, Excel CSV, Word DOC, Reports) */}
          <div className="relative inline-block text-left" ref={moreActionsRef}>
            <button
              type="button"
              onClick={() => setShowMoreActionsMenu((prev) => !prev)}
              className="gov-btn gov-btn-secondary"
            >
              <span>More actions</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gov-muted transition-transform ${showMoreActionsMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMoreActionsMenu && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded shadow-lg border border-gov-line py-2 z-40 animate-in fade-in">
                <div className="px-3.5 py-1 text-[11px] font-black text-stone-400 uppercase tracking-wider">
                  EXPORT &amp; REPORTS
                </div>
                <div className="my-1 border-t border-stone-100" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    setShowPrintSummaryModal(true);
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-800 hover:bg-emerald-50 hover:text-emerald-950 font-semibold flex items-center gap-2.5 cursor-pointer transition"
                >
                  <Printer className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div>
                    <div className="font-bold">🖨️ Printable PDF Summary</div>
                    <div className="text-[10px] text-stone-500 font-normal">Official signed summary report</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    exportToExcel();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-800 hover:bg-emerald-50 hover:text-emerald-950 font-semibold flex items-center gap-2.5 cursor-pointer transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="font-bold">📄 Excel Spreadsheet (.CSV)</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    exportToWord();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-800 hover:bg-blue-50 hover:text-blue-950 font-semibold flex items-center gap-2.5 cursor-pointer transition"
                >
                  <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                  <div className="font-bold">📘 Word Document (.DOC)</div>
                </button>
                <div className="my-1 border-t border-stone-100" />
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreActionsMenu(false);
                    onNavigateToReports?.();
                  }}
                  className="w-full text-left px-3.5 py-2 text-xs text-stone-800 hover:bg-purple-50 hover:text-purple-950 font-semibold flex items-center gap-2.5 cursor-pointer transition"
                >
                  <Download className="w-4 h-4 text-purple-700 shrink-0" />
                  <div className="font-bold">📊 Analytics &amp; Production Summary</div>
                </button>
              </div>
            )}
          </div>

          {/* + Register Rice Farm & Crop Planting Form Buttons */}
          {!permissions.isPublicVisitor && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onOpenAddParcel}
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Register Farmer &amp; Farm</span>
              </button>
              {onOpenCropPlanting && (
                <button
                  type="button"
                  onClick={() => onOpenCropPlanting(null)}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Wheat className="w-4 h-4" />
                  <span>Crop &amp; Planting Form</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card 2: Filter & Search Bar matching Swine Registry Screenshot */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
        {/* Row 1: Search Box + SCOPE selector matching screenshot */}
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Parcel ID Tag, Farmer Name, or RSBSA..."
              className="w-full pl-10 pr-28 py-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-xs bg-white text-stone-800 placeholder:text-stone-400 font-medium"
            />
            {/* Inside right: Live Match Counter & Clear Button */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery.trim() && (
                <>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                      filteredParcels.length > 0
                        ? 'bg-emerald-50 text-emerald-850 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}
                  >
                    {filteredParcels.length} {filteredParcels.length === 1 ? 'match' : 'matches'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dedicated Search Scope Selector */}
          <div className="flex items-center bg-gov-canvas p-1 rounded border border-gov-line text-xs shrink-0 gap-1">
            <span className="text-[10px] font-bold uppercase text-gov-muted px-1.5 tracking-wider hidden lg:inline">
              SCOPE:
            </span>
            <button
              type="button"
              onClick={() => setSearchScope('all')}
              className={`px-2.5 py-1 rounded-sm font-semibold text-xs transition cursor-pointer ${
                searchScope === 'all'
                  ? 'bg-white text-gov-ink border border-gov-line'
                  : 'text-gov-muted hover:text-gov-ink border border-transparent'
              }`}
            >
              All Fields
            </button>
            <button
              type="button"
              onClick={() => setSearchScope('tag')}
              className={`px-2.5 py-1 rounded-sm font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
                searchScope === 'tag'
                  ? 'bg-gov-forest text-white'
                  : 'text-gov-muted hover:text-gov-green'
              }`}
            >
              Tag ID
            </button>
            <button
              type="button"
              onClick={() => setSearchScope('farmer')}
              className={`px-2.5 py-1 rounded-sm font-semibold text-xs transition cursor-pointer flex items-center gap-1 ${
                searchScope === 'farmer'
                  ? 'bg-gov-forest text-white'
                  : 'text-gov-muted hover:text-gov-green'
              }`}
            >
              Owner Name
            </button>
          </div>
        </div>

        {/* Row 2: Barangay & Record status dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="gov-label">Barangay</label>
            <select
              value={selectedBarangay}
              onChange={(e) => setSelectedBarangay(e.target.value)}
              className="gov-input font-medium cursor-pointer"
            >
              <option value="ALL">All Barangays (15)</option>
              {userAssigned && (
                <option value="MY_ASSIGNED">📍 My Assigned ({userAssigned.join(', ')})</option>
              )}
              <option value="ASSIGNED_10">⭐ 10 Assigned Barangays (Consolidated)</option>
              <optgroup label="Silago Barangays">
                {BARANGAYS.map((b) => (
                  <option key={b.name} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="gov-label">Record status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="gov-input font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="verified">Verified / Active Parcels</option>
              <option value="pending">Pending Ground Inspection</option>
              <option value="irrigated">Irrigated Lowland (NIA)</option>
              <option value="rainfed">Rainfed Lowland</option>
              <option value="owner">Owner-Cultivated</option>
              <option value="tenant">Tenanted / Leased</option>
            </select>
          </div>
        </div>

        {/* Row 3: Advanced filters accordion toggle */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="text-xs font-semibold text-stone-600 hover:text-emerald-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
            <span>Advanced filters</span>
            <span className="px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded text-[10px] font-bold border border-stone-200">
              {activeAdvancedFilterCount} active
            </span>
          </button>

          {showAdvancedFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Rice Variety</label>
                <select
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white cursor-pointer"
                >
                  <option value="ALL">All Varieties</option>
                  {uniqueVarieties.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Agro-Ecosystem</label>
                <select
                  value={selectedEcosystem}
                  onChange={(e) => setSelectedEcosystem(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white cursor-pointer"
                >
                  <option value="ALL">All Ecosystems</option>
                  <option value="IRRIGATED">Irrigated Lowland (NIA)</option>
                  <option value="HYBRID">Hybrid Seed Production</option>
                  <option value="RAINFED">Rainfed Lowland</option>
                  <option value="UPLAND">Upland &amp; Traditional</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Cropping Season</label>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 bg-white cursor-pointer"
                >
                  <option value="ALL_SEASONS">All Seasons</option>
                  {CROPPING_SEASONS.map((s) => (
                    <option key={s} value={s}>{getShortSeasonName(s)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">Sort Field</label>
                <div className="flex items-center gap-1">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 bg-white cursor-pointer"
                  >
                    <option value="farmer">Sort: Farmer Name</option>
                    <option value="area">Sort: Farm Area (ha)</option>
                    <option value="tag">Sort: Parcel Tag ID</option>
                    <option value="date">Sort: Registration Date</option>
                    <option value="barangay">Sort: Barangay</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 border border-stone-300 rounded-xl bg-white hover:bg-stone-50 text-stone-600 cursor-pointer shadow-2xs"
                    title={`Order: ${sortOrder.toUpperCase()}`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 4: Summary matching Swine Registry */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-stone-100 text-xs text-stone-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold text-[10px]">
              {totalActiveFilterCount} active filter{totalActiveFilterCount !== 1 ? 's' : ''}
            </span>
            <span>
              Showing {paginatedParcels.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredParcels.length)}` : '0-0'} of {filteredParcels.length} matching rice farms
            </span>
            {totalActiveFilterCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchScope('all');
                  setSelectedBarangay('ALL');
                  setStatusFilter('all');
                  setSelectedVariety('ALL');
                  setSelectedEcosystem('ALL');
                  setShowArchived(false);
                }}
                className="text-emerald-700 hover:underline font-bold ml-1 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          <div className="text-[11px] font-medium text-stone-600">
            Database Total: <strong className="text-stone-900">{parcels.length}</strong> recorded parcels ({totalAreaMapped.toFixed(2)} Ha)
          </div>
        </div>
      </div>

      {/* 3.5 Floating / Sticky Bulk Actions Toolbar */}
      {selectedTags.length > 0 && (
        <div className="sticky top-2 z-40 bg-[#0c2340] border-2 border-blue-500 text-white rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-blue-600/40 border border-blue-400/50 px-3 py-1.5 rounded-xl">
              <CheckSquare className="w-4 h-4 text-sky-300" />
              <span className="text-xs font-black tracking-wide text-white">
                {selectedTags.length} {selectedTags.length === 1 ? 'record' : 'records'} selected
              </span>
              <span className="text-blue-300 text-xs">&bull;</span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {selectedParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0).toFixed(2)} ha
              </span>
            </div>

            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear selection</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
            {/* Bulk Delete (Central Admin restricted) */}
            {permissions.canDeleteParcels ? (
              <button
                type="button"
                onClick={() => setShowBulkDeleteModal(true)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                title="Delete selected records from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bulk Delete ({selectedTags.length})</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 bg-slate-700 text-slate-400 rounded-xl text-xs font-semibold opacity-60 cursor-not-allowed flex items-center gap-1.5"
                title="Restricted: Only Central Admin can delete records"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Bulk Delete (Admin Only)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Official DA / LGU RSBSA Rice Farm Records Registry Table */}
      <div className="overflow-x-auto rounded border border-gov-line bg-white">
        {/* Scrollable Container with Sticky Header, Sticky Left Columns, and Visible Scrollbar */}
        <div className="custom-table-scrollbar w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)] min-h-[400px] divide-y divide-gov-line/60 relative">
          <table className="w-full min-w-[1380px] text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-gov-canvas text-gov-muted border-b border-gov-line shadow-2xs">
              <tr className="border-b border-gov-line text-[10px] font-bold uppercase tracking-wider text-gov-muted">
                {/* 1. [Checkbox Selection] */}
                <th className="w-10 min-w-[40px] max-w-[40px] py-2.5 px-2 text-center whitespace-nowrap text-gov-muted border-r border-gov-line">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-3.5 h-3.5 accent-gov-green rounded cursor-pointer transition"
                    title={isAllSelected ? "Deselect All" : "Select All Visible Records"}
                  />
                </th>

                {/* 2. PARCEL ID TAG */}
                <th className="w-40 min-w-[150px] py-2.5 px-3 text-left whitespace-nowrap text-gov-muted border-r border-gov-line">
                  PARCEL ID TAG
                </th>

                {/* 3. FARMER NAME */}
                <th className="w-56 min-w-[210px] py-2.5 px-3 text-left whitespace-nowrap text-gov-muted border-r border-gov-line">
                  FARMER NAME
                </th>

                {/* 4. BARANGAY */}
                <th className="w-36 min-w-[130px] py-2.5 px-3 text-left whitespace-nowrap text-gov-muted border-r border-gov-line">
                  BARANGAY
                </th>

                {/* 5. RICE VARIETY */}
                <th className="w-44 min-w-[160px] py-2.5 px-3 text-left whitespace-nowrap text-gov-muted border-r border-gov-line">
                  RICE VARIETY
                </th>

                {/* 6. TENURE */}
                <th className="w-28 min-w-[100px] py-2.5 px-2 text-center whitespace-nowrap text-gov-muted border-r border-gov-line">
                  TENURE
                </th>

                {/* 7. FARM AREA (HA) */}
                <th className="w-24 min-w-[90px] py-2.5 px-2.5 text-right whitespace-nowrap text-gov-muted border-r border-gov-line">
                  AREA (HA)
                </th>

                {/* 8. EST. YIELD (MT) */}
                <th className="w-24 min-w-[90px] py-2.5 px-2.5 text-right whitespace-nowrap text-gov-muted border-r border-gov-line">
                  YIELD (MT)
                </th>

                {/* 9. AGRO-ECOSYSTEM */}
                <th className="w-36 min-w-[130px] py-2.5 px-3 text-left whitespace-nowrap text-gov-muted border-r border-gov-line">
                  ECOSYSTEM
                </th>

                {/* 10. DATE REGISTERED */}
                <th className="w-28 min-w-[100px] py-2.5 px-2 text-center whitespace-nowrap text-gov-muted border-r border-gov-line">
                  DATE
                </th>

                {/* 11. STATUS */}
                <th className="w-24 min-w-[90px] py-2.5 px-2 text-center whitespace-nowrap text-gov-muted border-r border-gov-line">
                  STATUS
                </th>

                {/* 12. ACTIONS */}
                <th className="w-32 min-w-[120px] py-2.5 px-2.5 text-center whitespace-nowrap text-gov-muted border-l border-gov-line">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80 text-stone-700 bg-white">
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-14 text-center text-stone-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-stone-300 stroke-1" />
                      <p className="text-sm font-semibold text-stone-700">
                        No rice farm records found matching your filters.
                      </p>
                      <p className="text-xs text-stone-500">
                        Try clearing search terms, selecting "All Barangays", or register a new parcel.
                      </p>
                      {permissions.canAddParcels && (
                        <button
                          type="button"
                          onClick={onOpenAddParcel}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Register New Rice Farm</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedParcels.map((parcel, idx) => {
                  const isAuthorized = isUserAuthorizedForBarangay(currentUser, parcel.barangay);
                  const isEditing = editingTag === parcel.tagNumber && inlineEditData !== null;
                  const isSelected = selectedTags.includes(parcel.tagNumber);
                  const farmerPhoto = getFarmerPhoto(parcel);
                  const farmLocation = getFarmLocation(parcel);
                  const rowBg = idx % 2 === 1 ? 'bg-[#f8fafc]' : 'bg-white';
                  const hasGpsCoordinates = Boolean(
                    parcel.lat &&
                    parcel.lng &&
                    parcel.lat !== 0 &&
                    parcel.lng !== 0 &&
                    !isNaN(parcel.lat) &&
                    !isNaN(parcel.lng)
                  );
                  const hasPolygonMapped = Boolean(
                    (parcel.boundaryCoords && parcel.boundaryCoords.length >= 3) ||
                    (parcel.polygonCoords && Array.isArray(parcel.polygonCoords) && parcel.polygonCoords.length >= 3)
                  );
                  const ecoBadge = getEcosystemBadge(parcel.purpose, parcel.ecosystem);

                  // Extract active seasonal record for this cropping season
                  const seasonalRecord = selectedSeason === 'ALL_SEASONS'
                    ? parcel.seasonalRecords?.[0]
                    : (parcel.seasonalRecords?.find((r) => matchesSeasonFilter(r.season, selectedSeason) || matchesSeasonFilter(r.seasonName, selectedSeason)) || parcel.seasonalRecords?.[0]);

                  const activeVariety = seasonalRecord ? (seasonalRecord.varietyPlanted || seasonalRecord.seedVariety) : parcel.breed;

                  const parcelTotalBags = (parcel.seasonalRecords || []).reduce(
                    (sum, r) => sum + (r.yieldBags ?? r.actualProductionBags ?? Math.round((r.actualProductionVolumeMt || 0) * 20)),
                    0
                  );
                  const parcelTotalMt = (parcel.seasonalRecords || []).reduce(
                    (sum, r) => sum + (r.actualProductionVolumeMt || r.yieldMetricTons || 0),
                    0
                  );
                  const latestHarvestRecord = (parcel.seasonalRecords || [])[0];
                  const latestHarvestDate = latestHarvestRecord?.harvestDate || latestHarvestRecord?.actualHarvestDate || latestHarvestRecord?.estimatedHarvestDate || '';

                  if (isEditing && inlineEditData) {
                    return (
                      <tr
                        key={parcel.tagNumber}
                        className="bg-amber-50/70 ring-2 ring-emerald-500/80 transition shadow-inner font-normal text-xs"
                      >
                        {/* 1. [Checkbox Selection] */}
                        <td className="w-10 min-w-[40px] max-w-[40px] py-2 px-2 text-center whitespace-nowrap border-r border-amber-300">
                          <span className="w-4 h-4 inline-block bg-stone-200/50 rounded border border-stone-300"></span>
                        </td>

                        {/* 2. PARCEL ID TAG */}
                        <td className="w-40 min-w-[150px] py-2 px-2 whitespace-nowrap border-r border-amber-300">
                          <input
                            type="text"
                            value={inlineEditData.swineNameOrId}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, swineNameOrId: e.target.value })
                            }
                            className="w-full px-1.5 py-1 bg-white border border-emerald-400 rounded text-[11px] font-mono font-bold text-stone-900 focus:ring-2 focus:ring-emerald-600 shadow-2xs text-center"
                            placeholder="08-64-16-002-XXXXXX"
                          />
                        </td>

                        {/* 3. FARMER NAME */}
                        <td className="w-56 min-w-[210px] py-2 px-2 whitespace-nowrap border-r border-amber-300">
                          <div className="flex flex-col gap-1 min-w-0">
                            <input
                              type="text"
                              value={inlineEditData.farmerFamilyName}
                              onChange={(e) =>
                                setInlineEditData({ ...inlineEditData, farmerFamilyName: e.target.value })
                              }
                              className="w-full px-1.5 py-0.5 bg-white border border-stone-300 rounded text-xs font-bold uppercase text-stone-900 focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                              placeholder="Family Name"
                              title="Family Name"
                            />
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={inlineEditData.farmerGivenName}
                                onChange={(e) =>
                                  setInlineEditData({ ...inlineEditData, farmerGivenName: e.target.value })
                                }
                                className="w-1/2 px-1.5 py-0.5 bg-white border border-stone-300 rounded text-[11px] font-medium text-stone-900 focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                                placeholder="Given Name"
                                title="Given Name"
                              />
                              <input
                                type="text"
                                value={inlineEditData.farmerMiddleName}
                                onChange={(e) =>
                                  setInlineEditData({ ...inlineEditData, farmerMiddleName: e.target.value })
                                }
                                className="w-1/2 px-1.5 py-0.5 bg-white border border-stone-300 rounded text-[11px] text-stone-700 focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                                placeholder="Middle"
                                title="Middle Name"
                              />
                            </div>
                          </div>
                        </td>

                        {/* 4. BARANGAY */}
                        <td className="w-36 min-w-[130px] py-2 px-2 whitespace-nowrap border-r border-amber-300">
                          <select
                            value={inlineEditData.barangay}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, barangay: e.target.value })
                            }
                            className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded text-xs font-semibold text-stone-900 focus:ring-2 focus:ring-emerald-600 shadow-2xs cursor-pointer"
                          >
                            {BARANGAYS.map((b) => (
                              <option key={b.name} value={b.name}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 5. RICE VARIETY */}
                        <td className="w-44 min-w-[160px] py-2 px-2 whitespace-nowrap border-r border-amber-300">
                          <select
                            value={inlineEditData.breed}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, breed: e.target.value })
                            }
                            className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded text-xs font-medium focus:ring-2 focus:ring-emerald-600 shadow-2xs cursor-pointer"
                          >
                            {RICE_VARIETIES.map((rv) => (
                              <option key={rv.name} value={rv.name}>
                                {rv.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 6. TENURE */}
                        <td className="w-28 min-w-[100px] py-2 px-2 text-center whitespace-nowrap border-r border-amber-300">
                          <input
                            type="text"
                            value={inlineEditData.commodity}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, commodity: e.target.value })
                            }
                            className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded text-xs font-medium text-center focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                            placeholder="Owner"
                          />
                        </td>

                        {/* 7. FARM AREA (HA) */}
                        <td className="w-24 min-w-[90px] py-2 px-2 text-right whitespace-nowrap border-r border-amber-300">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={inlineEditData.weightKg}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                weightKg: parseFloat(e.target.value) || 0
                              })
                            }
                            className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded text-xs font-mono font-bold text-right text-stone-900 focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                            placeholder="1.00"
                          />
                        </td>

                        {/* 8. EST. YIELD (MT) */}
                        <td className="w-24 min-w-[90px] py-2 px-2 text-right whitespace-nowrap border-r border-amber-300 font-mono text-xs text-gov-ink">
                          {((inlineEditData.weightKg || 1) * 4.8).toFixed(2)} MT
                        </td>

                        {/* 9. AGRO-ECOSYSTEM */}
                        <td className="w-36 min-w-[130px] py-2 px-2 whitespace-nowrap border-r border-amber-300">
                          <select
                            value={inlineEditData.purpose || 'Irrigated Lowland (NIA)'}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, purpose: e.target.value })
                            }
                            className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded text-xs font-medium text-stone-800 focus:ring-2 focus:ring-emerald-600 shadow-2xs cursor-pointer"
                          >
                            <option value="Irrigated Lowland (NIA)">Irrigated Lowland</option>
                            <option value="Rainfed Lowland">Rainfed Lowland</option>
                            <option value="Hybrid Seed Production">Hybrid Lowland</option>
                            <option value="Upland Rice">Upland Rice</option>
                          </select>
                        </td>

                        {/* 10. DATE REGISTERED */}
                        <td className="w-28 min-w-[100px] py-2 px-2 text-center whitespace-nowrap border-r border-amber-300">
                          <input
                            type="text"
                            value={inlineEditData.birthday}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, birthday: e.target.value })
                            }
                            className="w-full px-1.5 py-1 bg-white border border-stone-300 rounded text-xs font-mono text-center focus:ring-2 focus:ring-emerald-600 shadow-2xs"
                            placeholder="MM/DD/YYYY"
                          />
                        </td>

                        {/* 11. STATUS */}
                        <td className="w-24 min-w-[90px] py-2 px-2 text-center whitespace-nowrap border-r border-amber-300">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Editing
                          </span>
                        </td>

                        {/* 12. ACTIONS */}
                        <td className="w-32 min-w-[120px] py-2 px-2 text-center whitespace-nowrap border-l border-amber-300">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(parcel.tagNumber)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                              title="Cancel editing"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr
                      key={parcel.tagNumber}
                      onClick={() => onSelectParcel(parcel)}
                      className={`hover:bg-emerald-50/40 transition-colors group cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 font-medium ring-1 ring-inset ring-emerald-300'
                          : idx % 2 === 1
                          ? 'bg-[#fcfdfa]'
                          : 'bg-white'
                      }`}
                    >
                      {/* 1. [Checkbox Selection] */}
                      <td className="w-10 min-w-[40px] max-w-[40px] py-2.5 px-2 text-center whitespace-nowrap border-r border-stone-200">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelectRow(parcel.tagNumber);
                          }}
                          className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer transition"
                          title={`Select ${parcel.swineNameOrId || parcel.raiserName}`}
                        />
                      </td>

                      {/* 2. PARCEL ID TAG */}
                      <td className="w-40 min-w-[150px] py-2.5 px-3 text-left whitespace-nowrap border-r border-stone-200">
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectParcel(parcel);
                            }}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-gov-canvas hover:bg-gov-canvas/80 border border-gov-line text-gov-ink font-mono text-[11px] font-bold tracking-tight cursor-pointer transition"
                            title="Click to open Farmer Profile Dossier"
                          >
                            <span className="text-gov-muted text-[10px]">#</span>
                            <span>{parcel.swineNameOrId || parcel.tagNumber}</span>
                          </button>
                          {(parcel.is_pending_sync || parcel.isPendingSync) && (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-300 px-1.5 py-0.5 rounded-full animate-pulse"
                              title="Saved locally offline. Will synchronize automatically when connected."
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Offline
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. FARMER NAME */}
                      <td className="w-56 min-w-[210px] py-2 px-3 whitespace-nowrap border-r border-stone-200">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoPreview({
                                isOpen: true,
                                photoUrl: farmerPhoto,
                                photoType: 'profile',
                                parcel
                              });
                            }}
                            className="relative shrink-0 p-0.5 rounded border border-gov-line hover:border-gov-green transition cursor-pointer"
                            title="Click to view full photo"
                          >
                            <SafeImage
                              src={farmerPhoto}
                              alt={parcel.raiserName}
                              fallbackType="farmer"
                              className="w-6 h-6 rounded-sm object-cover"
                            />
                          </button>
                          <div className="flex flex-col min-w-0">
                            <span
                              className="font-bold text-gov-ink text-xs uppercase truncate block max-w-[170px]"
                              title={getFarmerDisplayName(parcel)}
                            >
                              {getFarmerDisplayName(parcel)}
                            </span>
                            <span className="text-[10px] text-gov-muted truncate block max-w-[170px]">
                              {parcel.focalPerson ? `LFT: ${parcel.focalPerson}` : `Purok ${parcel.purok || '1'}`}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 4. BARANGAY */}
                      <td className="w-36 min-w-[130px] py-2 px-3 whitespace-nowrap text-xs font-semibold text-gov-ink border-r border-stone-200">
                        {getDisplayBarangay(parcel.barangay)}
                      </td>

                      {/* 5. RICE VARIETY */}
                      <td className="w-44 min-w-[160px] py-2 px-3 whitespace-nowrap border-r border-stone-200">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gov-ink text-xs truncate max-w-[150px]" title={activeVariety || 'NSIC Rc 222'}>
                            {activeVariety || 'NSIC Rc 222'}
                          </span>
                          <span className="text-[10px] text-gov-muted font-normal">
                            {parcel.seedType || 'Inbred'}
                          </span>
                        </div>
                      </td>

                      {/* 6. TENURE */}
                      <td className="w-28 min-w-[100px] py-2 px-2 text-center whitespace-nowrap text-xs text-gov-muted border-r border-stone-200">
                        {parcel.sex || 'Owner'}
                      </td>

                      {/* 7. FARM AREA (HA) */}
                      <td className="w-24 min-w-[90px] py-2 px-2.5 text-right whitespace-nowrap font-mono font-bold text-gov-ink text-xs tabular-nums border-r border-stone-200">
                        {(parcel.weightKg || parcel.areaHa || 0).toFixed(2)} ha
                      </td>

                      {/* 8. EST. YIELD (MT) */}
                      <td className="w-24 min-w-[90px] py-2 px-2.5 text-right whitespace-nowrap font-mono font-medium text-gov-muted text-xs tabular-nums border-r border-stone-200">
                        {seasonalRecord ? `${(seasonalRecord.actualProductionVolumeMt || (parcel.weightKg || 1) * 4.8).toFixed(2)}` : `${((parcel.weightKg || 1) * 4.8).toFixed(2)}`} MT
                      </td>

                      {/* 9. AGRO-ECOSYSTEM */}
                      <td className="w-36 min-w-[130px] py-2 px-3 text-left whitespace-nowrap text-xs text-gov-ink border-r border-stone-200">
                        {ecoBadge.label}
                      </td>

                      {/* 10. DATE REGISTERED */}
                      <td className="w-28 min-w-[100px] py-2 px-2 text-center whitespace-nowrap text-[11px] text-gov-muted font-mono border-r border-stone-200">
                        {formatBirthday(parcel.registrationDate || parcel.birthday || '2026-06-15')}
                      </td>

                      {/* 11. STATUS */}
                      <td className="w-24 min-w-[90px] py-2 px-2 text-center whitespace-nowrap border-r border-stone-200">
                        {hasPolygonMapped ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                            Verified
                          </span>
                        ) : hasGpsCoordinates ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gov-green">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* 12. ACTIONS */}
                      <td className="w-32 min-w-[120px] py-2 px-2.5 text-center whitespace-nowrap border-l border-gov-line">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {/* 1. View Dossier */}
                          <button
                            type="button"
                            onClick={() => onSelectParcel(parcel)}
                            className="px-2.5 py-1 rounded bg-gov-green hover:bg-emerald-800 text-white text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                            title="View Farmer Dossier"
                          >
                            View
                          </button>

                          {/* 2. Certificate */}
                          <button
                            type="button"
                            onClick={() => setCertificateParcel(parcel)}
                            className="p-1 rounded border border-gov-line bg-white hover:bg-gov-canvas text-gov-muted hover:text-gov-ink transition cursor-pointer"
                            title="Official Certificate"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Locate on Map */}
                          {hasGpsCoordinates && (
                            <button
                              type="button"
                              onClick={() => onLocateOnMap?.(parcel)}
                              className="p-1 rounded border border-gov-line bg-white hover:bg-gov-canvas text-gov-green transition cursor-pointer"
                              title="Locate on GIS Map"
                            >
                              <MapPin className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 4. Edit (Inline) - Central Admin Only */}
                          {permissions.canEditParcels && (
                            <button
                              type="button"
                              onClick={(e) => handleStartInlineEdit(e, parcel)}
                              className="p-1 rounded border border-gov-line bg-white hover:bg-gov-canvas text-gov-muted hover:text-gov-ink transition cursor-pointer"
                              title="Edit Record Inline (Admin Only)"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 5. Delete (Admin Only) */}
                          {permissions.canDeleteParcels && (
                            <button
                              type="button"
                              onClick={() => handleDeleteAttempt(parcel)}
                              className="p-1 rounded border border-gov-line bg-white hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title="Delete Parcel (Admin Only)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Table Summary Footer matching screenshot */}
        <div className="p-3.5 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Showing {paginatedParcels.length > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredParcels.length)}` : '0-0'} of {filteredParcels.length} matching rice farms
            </span>
            <span className="text-stone-300">&bull;</span>
            <span>
              Total Area: <strong className="text-emerald-700 font-bold font-mono">{totalAreaMapped.toFixed(2)} ha</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2 text-[11px] text-stone-500">
              <span>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-white border border-stone-200 rounded text-xs cursor-pointer font-medium"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium shadow-2xs text-xs"
                >
                  Prev
                </button>
                <span className="px-2 text-xs font-semibold text-stone-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed font-medium shadow-2xs text-xs"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Seasonal Production Modal for LFT Input */}
      {seasonalModalOpen && seasonalFarmer && (
        <SeasonalProductionModal
          isOpen={seasonalModalOpen}
          onClose={() => {
            setSeasonalModalOpen(false);
            setSeasonalFarmer(null);
            setSeasonalRecordToEdit(null);
          }}
          farmer={seasonalFarmer}
          existingRecord={seasonalRecordToEdit}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteModal && selectedTags.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Confirm Bulk Deletion ({selectedTags.length} Records)
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete {selectedTags.length} selected farm records from Supabase?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs max-h-48 overflow-y-auto">
              <div className="font-bold text-slate-700 pb-1 border-b border-slate-200 flex justify-between">
                <span>Selected Farmer Registrations</span>
                <span className="text-slate-500 font-mono font-normal">{selectedTags.length} total</span>
              </div>
              {selectedParcels.slice(0, 10).map((p) => (
                <div key={p.tagNumber} className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-bold text-slate-900">{p.raiserName}</span>
                    <span className="text-[10px] text-slate-500 block">Brgy. {p.barangay}</span>
                  </div>
                  <span className="font-mono text-xs text-blue-900 font-bold">{p.swineNameOrId || p.tagNumber}</span>
                </div>
              ))}
              {selectedParcels.length > 10 && (
                <div className="text-center text-[11px] text-slate-500 pt-1 font-semibold">
                  ...and {selectedParcels.length - 10} more records
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Warning: This action will permanently remove these records from the Supabase database and cannot be undone.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDeleteSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting from Supabase...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete {selectedTags.length} Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {parcelToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Delete Farmer Registration
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete this registration?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Tag ID:</span>
                <span className="font-mono font-bold text-slate-900">{parcelToDelete.tagNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Farmer / Tiller:</span>
                <span className="font-bold text-slate-900">{parcelToDelete.raiserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Location:</span>
                <span className="font-semibold text-slate-900">Brgy. {parcelToDelete.barangay}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Warning: This will remove all linked seasonal production records.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setParcelToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const tag = parcelToDelete.tagNumber;
                  const farmer = parcelToDelete.raiserName;
                  deleteParcel(tag);
                  setParcelToDelete(null);
                  setActionNotice(`Farmer registration ${tag} (${farmer}) was successfully deleted.`);
                  setTimeout(() => setActionNotice(null), 5000);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Registration</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Georeference Certificate Modal */}
      {certificateParcel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95">
            <style>{`@media print { @page { size: ${certificatePageSize}; margin: 12mm; } #printable-certificate-document { transform: none !important; width: 100% !important; max-width: 100% !important; min-height: 0 !important; box-shadow: none !important; } }`}</style>

            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-800">
                  <QrCode className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Certificate preview</h3>
                  <p className="text-xs text-slate-500">Georeference and RSBSA parcel certificate</p>
                </div>
              </div>
              <button type="button" onClick={() => setCertificateParcel(null)} aria-label="Close certificate preview" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="no-print grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-3 xl:grid-cols-6">
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Template
                <select value="georeference" disabled className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800 disabled:cursor-default disabled:opacity-100">
                  <option value="georeference">Rice parcel georeference</option>
                </select>
              </label>
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Barangay scope
                <select value={certificateBarangayScope} onChange={(e) => setCertificateBarangayScope(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800">
                  <option value="ALL">All barangays</option>
                  {BARANGAYS.map((barangay) => <option key={barangay.name} value={barangay.name}>{barangay.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Season / category
                <select value={certificateSeasonScope} onChange={(e) => setCertificateSeasonScope(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800">
                  <option value="ALL_SEASONS">All records</option>
                  {CROPPING_SEASONS.map((season) => <option key={season} value={season}>{getShortSeasonName(season)}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Parcel
                <select value={certificateParcel.tagNumber} onChange={(e) => {
                  const found = certificateCandidates.find((parcel) => parcel.tagNumber === e.target.value);
                  if (found) setCertificateParcel(found);
                }} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800">
                  {certificateCandidates.some((parcel) => parcel.tagNumber === certificateParcel.tagNumber) && null}
                  {!certificateCandidates.some((parcel) => parcel.tagNumber === certificateParcel.tagNumber) && <option value={certificateParcel.tagNumber}>{certificateParcel.raiserName} · {certificateParcel.barangay}</option>}
                  {certificateCandidates.map((parcel) => <option key={parcel.tagNumber} value={parcel.tagNumber}>{parcel.raiserName} · {parcel.barangay} · {parcel.tagNumber}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Paper size
                <select value={certificatePaperSize} onChange={(e) => setCertificatePaperSize(e.target.value as typeof certificatePaperSize)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800">
                  <option value="folio">Folio</option><option value="letter">Letter</option><option value="a4">A4</option>
                </select>
              </label>
              <label className="space-y-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Orientation
                <select value={certificateOrientation} onChange={(e) => setCertificateOrientation(e.target.value as typeof certificateOrientation)} className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold normal-case tracking-normal text-slate-800">
                  <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                </select>
              </label>
            </div>

            {/* Certificate document centered on a neutral preview stage */}
            <div className="overflow-auto rounded-2xl border border-slate-200 bg-[#eef2ec] p-3 sm:p-5">
              <div
                id="printable-certificate-document"
                className="mx-auto border border-emerald-900/20 bg-white px-6 py-7 sm:px-10 sm:py-10 shadow-[0_12px_32px_rgba(15,23,42,0.10)] space-y-6 text-slate-900 origin-top transition-transform print:shadow-none print:border-none"
                style={{
                  width: certificatePageWidth,
                  maxWidth: '100%',
                  minHeight: certificateOrientation === 'landscape' ? '816px' : '1056px',
                  transform: `scale(${certificateZoom / 100})`,
                  transformOrigin: 'top center'
                }}
              >
              {/* Official Seal Header */}
              <div className="flex items-center justify-between gap-2 border-b-2 border-emerald-900/20 pb-4">
                <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                  <DaLogo className="w-14 h-14" />
                </div>

                <div className="text-center space-y-0.5">
                  <div className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-600">
                    Republic of the Philippines
                  </div>
                  <div className="text-xs sm:text-sm font-black text-emerald-900 uppercase tracking-wide">
                    Department of Agriculture • Region VIII
                  </div>
                  <div className="text-[10.5px] sm:text-xs font-bold text-slate-700 uppercase">
                    Province of Southern Leyte • Municipality of Silago
                  </div>
                  <div className="text-[9.5px] sm:text-[10.5px] font-extrabold text-emerald-800 uppercase tracking-tight">
                    Municipal Agriculture Office (MAO)
                  </div>
                </div>

                <div className="w-14 h-14 shrink-0 flex items-center justify-center">
                  <SilagoSeal className="w-14 h-14" />
                </div>
              </div>

              {/* Certificate Title */}
              <div className="text-center space-y-1">
                <h4 className="text-base sm:text-lg font-serif font-black uppercase text-emerald-950 tracking-wide">
                  Certificate of Rice Parcel Georeferencing
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Verified against the Registry System for Basic Sectors in Agriculture (RSBSA) &amp; Municipal GIS Boundary Records
                </p>
                <div className="inline-block px-3 py-0.5 mt-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                  Certificate No: SIL-RICE-2026-{certificateParcel.tagNumber.replace(/[^0-9]/g, '').slice(-4) || '0101'}
                </div>
              </div>

              {/* Certified Parcel Facts Table */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white/80 p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Registered Farmer / Tiller</span>
                    <span className="font-bold text-slate-900 text-sm">{certificateParcel.raiserName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">RSBSA Reference Number</span>
                    <span className="font-mono font-bold text-emerald-900">{certificateParcel.swineNameOrId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact Number</span>
                    <span className="font-medium text-slate-700">{certificateParcel.contactNumber || 'Not recorded'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Location (Barangay &amp; Purok)</span>
                    <span className="font-bold text-slate-800">
                      Brgy. {certificateParcel.barangay}, {certificateParcel.purok}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">GIS Parcel Tag ID</span>
                    <span className="font-mono font-bold text-blue-900">{certificateParcel.tagNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Surveyed Physical Rice Area</span>
                    <span className="font-bold text-slate-900 text-sm">{Number(certificateParcel.areaHa || certificateParcel.weightKg || 0).toFixed(2)} ha</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Rice Variety &amp; Ecosystem</span>
                    <span className="font-semibold text-slate-800">
                      {certificateParcel.breed} • {certificateParcel.purpose} ({certificateParcel.seedType || 'INBRED'})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Georeference Coordinates</span>
                    <span className="font-mono text-slate-700 text-[11px]">
                      {Number.isFinite(certificateParcel.lat) && Number.isFinite(certificateParcel.lng)
                        ? `${certificateParcel.lat.toFixed(6)}° N, ${certificateParcel.lng.toFixed(6)}° E`
                        : 'Not recorded'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatories Row */}
              <div className="pt-6 grid grid-cols-3 gap-2 text-center text-[10.5px]">
                <div>
                  <div className="h-9 flex items-end justify-center font-serif font-bold text-slate-800">
                    {certificateParcel.focalPerson || getAssignedLftForBarangay(certificateParcel.barangay)?.name || 'Not assigned'}
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-extrabold text-slate-900 uppercase">
                    Assigned LFT Officer
                  </div>
                  <div className="text-[9.5px] text-slate-500">Local Farmer Technician</div>
                </div>

                <div>
                  <div className="h-9 flex items-end justify-center font-serif font-bold text-slate-800">
                    Engr. Arnaldo M. Valdez
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-extrabold text-slate-900 uppercase">
                    Municipal Agriculturist
                  </div>
                  <div className="text-[9.5px] text-slate-500">OMAS Silago, So. Leyte</div>
                </div>

                <div>
                  <div className="h-9 flex items-end justify-center font-serif font-bold text-slate-800">
                    Hon. Lemuel P. Honor
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-extrabold text-slate-900 uppercase">
                    Municipal Mayor
                  </div>
                  <div className="text-[9.5px] text-slate-500">Municipality of Silago</div>
                </div>
              </div>
            </div>
            </div>

            <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">Page 1 of 1</span>
                <button type="button" aria-label="Zoom out" onClick={() => setCertificateZoom((zoom) => Math.max(50, zoom - 10))} className="rounded-lg px-2.5 py-1.5 hover:bg-slate-100">−</button>
                <input aria-label="Preview zoom" type="range" min="50" max="120" step="5" value={certificateZoom} onChange={(e) => setCertificateZoom(Number(e.target.value))} className="w-24 accent-emerald-600" />
                <button type="button" aria-label="Zoom in" onClick={() => setCertificateZoom((zoom) => Math.min(120, zoom + 10))} className="rounded-lg px-2.5 py-1.5 hover:bg-slate-100">+</button>
                <span className="w-10 text-center font-mono text-emerald-800">{certificateZoom}%</span>
                <button type="button" onClick={() => setCertificateZoom(85)} className="rounded-lg bg-slate-100 px-2.5 py-1.5 hover:bg-slate-200">Fit</button>
              </div>
              <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-800">
                <Printer className="h-4 w-4" /> Print certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Lightbox Modal */}
      <PhotoPreviewModal
        isOpen={photoPreview.isOpen}
        onClose={() => setPhotoPreview((prev) => ({ ...prev, isOpen: false }))}
        photoUrl={photoPreview.photoUrl}
        photoType={photoPreview.photoType}
        parcel={photoPreview.parcel}
      />

      {/* Printable Summary Report Modal (PDF format) matching Swine Registry style */}
      {showPrintSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200">
            {/* Top Toolbar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Print Official Rice Registry Report (PDF Format)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintSummaryModal(false)}
                  className="text-slate-400 hover:text-white px-2 py-1 text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Content Area */}
            <div className="p-8 space-y-6 text-xs text-slate-800 printable-document bg-white">
              {/* Official Header */}
              <div className="text-center border-b-2 border-emerald-800 pb-4">
                <div className="flex items-center justify-center gap-4 mb-2">
                  <DaLogo size={56} className="h-14 w-14 object-contain shrink-0" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-slate-600 font-medium">Republic of the Philippines</p>
                    <p className="text-[11px] uppercase tracking-wider text-slate-600 font-medium">Province of Southern Leyte</p>
                    <h2 className="text-base font-black text-emerald-950 tracking-tight">MUNICIPALITY OF SILAGO</h2>
                    <h3 className="text-xs font-bold text-emerald-800">OFFICE OF THE MUNICIPAL AGRICULTURIST</h3>
                  </div>
                  <SilagoSeal size={56} className="h-14 w-14 object-contain shrink-0" />
                </div>
                <h4 className="text-sm font-black uppercase text-slate-900 mt-3 tracking-wide">
                  OFFICIAL RICE FARM REGISTRY &amp; MONITORING SUMMARY REPORT
                </h4>
                <p className="text-[10px] text-slate-500">
                  Report Generated on: {new Date().toLocaleDateString()} • Silago, Southern Leyte
                </p>
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-slate-500 text-[10px] block font-semibold">Total Listed Parcels</span>
                  <span className="font-bold text-base text-slate-900">{filteredParcels.length} Farms</span>
                </div>
                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 text-[10px] block font-semibold">Total Farm Area</span>
                  <span className="font-bold text-base text-emerald-900">{totalAreaMapped.toFixed(2)} ha</span>
                </div>
                <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200">
                  <span className="text-blue-700 text-[10px] block font-semibold">Active Cropping Season</span>
                  <span className="font-bold text-xs sm:text-sm text-blue-900 line-clamp-1">{selectedSeason === 'ALL_SEASONS' ? 'All Seasons' : getShortSeasonName(selectedSeason)}</span>
                </div>
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span className="text-amber-700 text-[10px] block font-semibold">GIS Georeferenced</span>
                  <span className="font-bold text-base text-amber-900">
                    {filteredParcels.length > 0 ? Math.round((filteredParcels.filter(p => (p.boundaryCoords && p.boundaryCoords.length > 2) || (p.lat && p.lng)).length / filteredParcels.length) * 100) : 0}% Mapped
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-300 text-[11px]">
                  <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-300">
                    <tr>
                      <th className="p-2 border-r border-slate-300 text-center w-8">#</th>
                      <th className="p-2 border-r border-slate-300">RSBSA No.</th>
                      <th className="p-2 border-r border-slate-300">Farmer Name</th>
                      <th className="p-2 border-r border-slate-300">Barangay</th>
                      <th className="p-2 border-r border-slate-300">Variety / Ecosystem</th>
                      <th className="p-2 border-r border-slate-300 text-right">Area (ha)</th>
                      <th className="p-2 border-r border-slate-300 text-right">Est. Yield</th>
                      <th className="p-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {filteredParcels.map((p, idx) => (
                      <tr key={p.tagNumber}>
                        <td className="p-2 border-r border-slate-300 text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-mono font-bold text-emerald-900">
                          {p.swineNameOrId || p.tagNumber}
                        </td>
                        <td className="p-2 border-r border-slate-300 font-semibold">{getFarmerDisplayName(p)}</td>
                        <td className="p-2 border-r border-slate-300">Brgy. {p.barangay}</td>
                        <td className="p-2 border-r border-slate-300">{p.breed} • {p.purpose}</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">{(p.weightKg || p.areaHa || 0).toFixed(2)} ha</td>
                        <td className="p-2 border-r border-slate-300 text-right font-mono">{((p.weightKg || 1) * 4.8).toFixed(1)} MT</td>
                        <td className="p-2 text-center font-bold text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {p.syncStatus || 'Live Synced'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatories Footer */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-slate-500 mb-8">Prepared &amp; Inspected by:</p>
                  <p className="font-bold border-t border-slate-400 pt-1 text-slate-900 uppercase">
                    {currentUser?.name || 'Authorized LFT Officer'}
                  </p>
                  <p className="text-[10px] text-slate-500">Local Farmer Technician / Agricultural Extension Worker</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-8">Attested &amp; Approved by:</p>
                  <p className="font-bold border-t border-slate-400 pt-1 text-slate-900 uppercase">
                    ENGR. ARNALDO M. VALDEZ
                  </p>
                  <p className="text-[10px] text-slate-500">Municipal Agriculturist (MAO) - Silago, Southern Leyte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
