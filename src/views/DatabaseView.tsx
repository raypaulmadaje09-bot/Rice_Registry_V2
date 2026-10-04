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
import { CROPPING_SEASONS, ACTIVE_SEASON } from '../data/seasonalProduction';
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
  Check,
  Save,
  Upload,
  Camera,
  MapPin,
  CheckSquare,
  Square,
  MinusSquare,
  Loader2
} from 'lucide-react';

interface DatabaseViewProps {
  onSelectParcel: (parcel: FarmParcel) => void;
  onEditParcel: (parcel: FarmParcel) => void;
  onOpenAddParcel: () => void;
  onOpenPublicInterface?: () => void;
  onNavigateToReports?: (barangay?: string) => void;
  onLocateOnMap?: (parcel: FarmParcel) => void;
  initialSearchQuery?: string;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  onSelectParcel,
  onEditParcel,
  onOpenAddParcel,
  onOpenPublicInterface,
  onNavigateToReports,
  onLocateOnMap,
  initialSearchQuery
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
    isOnline
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
  const [parcelToDelete, setParcelToDelete] = useState<FarmParcel | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Multi-Select Checkboxes State
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState<boolean>(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState<boolean>(false);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);

  // Reset selected checkboxes on filter or search query change
  useEffect(() => {
    setSelectedTags([]);
  }, [selectedBarangay, selectedSeason, selectedEcosystem, selectedVariety, searchQuery]);

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
    lat: number;
    lng: number;
    weightKg: number;
    commodity: string;
    breed: string;
  } | null>(null);

  // Certificate Modal state
  const [certificateParcel, setCertificateParcel] = useState<FarmParcel | null>(null);

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

  // Filtered parcels with 10 assigned barangays logic and user LFT jurisdiction
  const filteredParcels = useMemo(() => {
    const filtered = parcels.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.swineNameOrId.toLowerCase().includes(q) ||
        p.raiserName.toLowerCase().includes(q) ||
        (p.farmerFamilyName && p.farmerFamilyName.toLowerCase().includes(q)) ||
        (p.farmerGivenName && p.farmerGivenName.toLowerCase().includes(q)) ||
        (p.farmerMiddleName && p.farmerMiddleName.toLowerCase().includes(q)) ||
        p.breed.toLowerCase().includes(q) ||
        p.barangay.toLowerCase().includes(q) ||
        p.purok.toLowerCase().includes(q) ||
        p.focalPerson.toLowerCase().includes(q);

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

      const matchesEco =
        selectedEcosystem === 'ALL' ||
        (selectedEcosystem === 'IRRIGATED' && p.purpose.toLowerCase().includes('irrigated')) ||
        (selectedEcosystem === 'HYBRID' && p.purpose.toLowerCase().includes('hybrid')) ||
        (selectedEcosystem === 'RAINFED' && p.purpose.toLowerCase().includes('rainfed')) ||
        (selectedEcosystem === 'UPLAND' && p.purpose.toLowerCase().includes('upland'));

      const currentRecord = p.seasonalRecords?.find((r) => r.season === selectedSeason);
      const activeBreed = currentRecord ? currentRecord.seedVariety : p.breed;

      const matchesVariety =
        selectedVariety === 'ALL' ||
        activeBreed.toLowerCase() === selectedVariety.toLowerCase();

      return matchesSearch && matchesBrgy && matchesEco && matchesVariety;
    });

    // Default Alphabetical Sorting: A to Z by family_name, secondary by given_name
    return sortParcelsAlphabetically(filtered);
  }, [parcels, searchQuery, selectedBarangay, selectedSeason, selectedEcosystem, selectedVariety, userAssigned]);

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
    filteredParcels.forEach((p) => {
      const rec = p.seasonalRecords?.find((r) => r.season === selectedSeason) || p.seasonalRecords?.[0];
      if (rec) {
        totalProdMt += rec.actualProductionVolumeMt;
      } else {
        totalProdMt += (p.weightKg || 1) * 4.8;
      }
    });
    const avgYield = totalAreaMapped > 0 ? Number((totalProdMt / totalAreaMapped).toFixed(2)) : 0;
    return {
      totalProdMt: Number(totalProdMt.toFixed(2)),
      totalBags: Math.round(totalProdMt * 20),
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
      residentialAddress: 'Silago, Southern Leyte',
      birthday: parcel.birthday ? formatBirthday(parcel.birthday) : '',
      farmLocation: parcel.farmLocation || getFarmLocation(parcel),
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
      birthday: inlineEditData.birthday,
      farmLocation: inlineEditData.farmLocation,
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

  const handleExportCSV = () => {
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
        (p.weightKg || 0).toFixed(2),
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

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DA_LGU_Silago_RSBSA_Registry_${selectedBarangay}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* Main Database Card wrapping Header, Stats, and Filters matching photo layout */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        {/* Row 1: Subtitle badge, realtime status, and action buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#eafaf1] text-[#0f5132] border border-[#a3e635]/40">
              MUNICIPAL AGRICULTURE OFFICE - SILAGO • RSBSA &amp; GIS STANDARD
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Municipality of Silago, Southern Leyte (15 Barangays)
            </span>

            {/* Supabase Realtime Sync Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 border border-slate-200 text-slate-700">
              <span className={`w-2 h-2 rounded-full ${
                !isOnline ? 'bg-amber-500' : realtimeStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`} />
              <span>
                {!isOnline ? 'Offline Mode' : realtimeStatus === 'connected' ? 'Supabase Realtime: Live Synced' : `Realtime: ${realtimeStatus}`}
              </span>
              <button
                type="button"
                onClick={() => syncWithSupabase()}
                disabled={isRealtimeSyncing}
                className="ml-1 text-[10px] text-blue-700 hover:text-blue-900 underline cursor-pointer disabled:opacity-50"
                title="Force refresh database from Supabase"
              >
                {isRealtimeSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {/* Offline Pending Records Badge & Sync Button */}
            {offlineQueueCount > 0 && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                <span>{offlineQueueCount} offline record{offlineQueueCount > 1 ? 's' : ''} queued</span>
                <button
                  type="button"
                  onClick={() => syncOfflineQueue()}
                  disabled={!isOnline}
                  className="ml-1 px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white rounded text-[10px] font-bold transition cursor-pointer"
                  title="Upload queued offline records to cloud database"
                >
                  Upload Queue
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onNavigateToReports && (
              <button
                type="button"
                onClick={() => onNavigateToReports(selectedBarangay === 'ALL' ? 'Balagawan' : selectedBarangay)}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                title="Open and print the official government rice registry report"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-300" />
                <span>Print Official Registry</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV / Masterlist</span>
            </button>
          </div>
        </div>

        {/* Public Visitor or LFT Officer Jurisdiction Banner */}
        {permissions.isPublicVisitor && (
          <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-base">👁️</span>
              <div>
                <strong>Public Visitor Mode (Read-Only):</strong> You are viewing general registry statistics and farm records. Edit, create, and administrative actions are locked.
              </div>
            </div>
          </div>
        )}

        {permissions.isLftOfficer && (
          <div className="p-2.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              <span>
                <strong>LFT Sector Jurisdiction:</strong> Authorized for <strong>{userAssigned && userAssigned.length > 0 ? userAssigned.join(', ') : 'Assigned Barangays'}</strong>. Deletion is restricted to Central Admin.
              </span>
            </div>
          </div>
        )}

        {/* Row 2: Title and + Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#0f3822] tracking-tight">
              Rice Farm Records Database
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              Official live registry of georeferenced rice farm parcels, RSBSA tillers, palay varieties, and PCIC insurance across all 15 Silago barangays.
            </p>
          </div>

          {!permissions.isPublicVisitor && (
            <button
              type="button"
              onClick={onOpenAddParcel}
              className="px-4 py-2 bg-[#0e3b23] hover:bg-[#154d2f] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>+ Add Rice Farm Registration</span>
            </button>
          )}
        </div>

        {/* Row 3: 4 Metric Cards matching photo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Filtered Parcels */}
          <div className="bg-[#fffefb] border border-[#fef08a] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
              FILTERED PARCELS
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900">
                {filteredParcels.length}
              </span>
              <span className="text-xs font-bold text-slate-600">lots</span>
            </div>
          </div>

          {/* Card 2: Total Area Mapped */}
          <div className="bg-[#fffefb] border border-[#fef08a] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
              TOTAL AREA MAPPED
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#059669]">
                {totalAreaMapped.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-[#059669]">ha</span>
            </div>
          </div>

          {/* Card 3: Average Farm Size */}
          <div className="bg-[#fffefb] border border-[#fef08a] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
              AVERAGE FARM SIZE
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#2563eb]">
                {avgFarmSize}
              </span>
              <span className="text-xs font-bold text-[#2563eb]">ha / lot</span>
            </div>
          </div>

          {/* Card 4: Georeference Coverage */}
          <div className="bg-[#fffefb] border border-[#fef08a] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <span className="text-[10px] sm:text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider block">
              GEOREFERENCE COVERAGE
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0 self-center">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900">100%</span>
              <span className="text-xs font-bold text-emerald-700">GPS Mapped</span>
            </div>
          </div>
        </div>

        {/* Row 4: Search and Filter Bar */}
        <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
          {/* Left Search Input */}
          <div className="relative flex-1 min-w-[260px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by RSBSA No., farmer name, barangay, variety..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 shadow-2xs"
            />
          </div>

          {/* Right Dropdown Filter System */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs">
            {/* 1. Barangay Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">BRGY:</span>
              <select
                value={selectedBarangay}
                onChange={(e) => setSelectedBarangay(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-800 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All 15 Barangays</option>
                {userAssigned && (
                  <option value="MY_ASSIGNED">
                    📍 My Assigned ({userAssigned.join(', ')})
                  </option>
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

            {/* 2. Ecosystem Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">ECOSYSTEM:</span>
              <select
                value={selectedEcosystem}
                onChange={(e) => setSelectedEcosystem(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-800 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Ecosystems</option>
                <option value="IRRIGATED">Irrigated Lowland (NIA)</option>
                <option value="HYBRID">Hybrid Seed Production</option>
                <option value="RAINFED">Rainfed Lowland</option>
                <option value="UPLAND">Upland &amp; Traditional</option>
              </select>
            </div>

            {/* 3. Rice Variety Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">VARIETY:</span>
              <select
                value={selectedVariety}
                onChange={(e) => setSelectedVariety(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-800 cursor-pointer shadow-2xs"
              >
                <option value="ALL">All Varieties</option>
                {uniqueVarieties.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Active Cropping Season Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">SEASON:</span>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-800 cursor-pointer shadow-2xs"
              >
                {CROPPING_SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
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
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Scrollable Container with Sticky Header, Sticky Left Columns, and Visible Scrollbar */}
        <div className="custom-table-scrollbar w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-240px)] min-h-[400px] divide-y divide-slate-100 relative">
          <table className="w-full min-w-[1600px] text-left border-collapse text-xs">
            <thead className="sticky top-0 z-20 bg-[#0c2340] text-white shadow-xs">
              <tr className="border-b border-[#08182b] text-[10px] font-bold uppercase tracking-wider">
                {/* 0. MULTI-SELECT CHECKBOX (Frozen Left 0) */}
                <th className="sticky top-0 left-0 z-30 bg-[#0c2340] w-[44px] min-w-[44px] max-w-[44px] py-3 px-2 text-center whitespace-nowrap text-white border-b border-[#08182b] border-r border-slate-700/80 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
                  <input
                    type="checkbox"
                    ref={headerCheckboxRef}
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer transition"
                    title={isAllSelected ? "Deselect All" : "Select All Visible Records"}
                  />
                </th>

                {/* 1. RSBSA NO. (Frozen Left 44px) */}
                <th className="sticky top-0 left-[44px] z-30 bg-[#0c2340] w-[155px] min-w-[155px] max-w-[155px] py-3 px-3 text-center whitespace-nowrap text-white border-b border-[#08182b] border-r-2 border-slate-700/80 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.4)]">
                  RSBSA NO.
                </th>

                {/* 2. PROFILE PHOTO */}
                <th className="sticky top-0 z-20 bg-[#0c2340] w-[64px] min-w-[64px] max-w-[64px] py-3 px-2 text-center whitespace-nowrap text-white border-b border-[#08182b]">
                  PROFILE
                </th>

                {/* 3. FAMILY NAME */}
                <th className="sticky top-0 z-20 bg-[#0c2340] w-[125px] min-w-[125px] max-w-[125px] py-3 px-3.5 text-left whitespace-nowrap text-white border-b border-[#08182b]">
                  FAMILY NAME
                </th>

                {/* 4. GIVEN NAME */}
                <th className="sticky top-0 z-20 bg-[#0c2340] w-[125px] min-w-[125px] max-w-[125px] py-3 px-3.5 text-left whitespace-nowrap text-white border-b border-[#08182b]">
                  GIVEN NAME
                </th>

                {/* 5. MIDDLE NAME */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3 text-left whitespace-nowrap text-white border-b border-[#08182b] w-[100px] min-w-[100px]">
                  MIDDLE NAME
                </th>

                {/* 6. FIELD PHOTO */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-2 text-center whitespace-nowrap text-white border-b border-[#08182b] w-[80px] min-w-[80px]">
                  FIELD PHOTO
                </th>

                {/* 7. BARANGAY */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3.5 text-left whitespace-nowrap text-white border-b border-[#08182b] w-[125px] min-w-[125px]">
                  BARANGAY
                </th>

                {/* 8. PUROK */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-2.5 text-left whitespace-nowrap text-white border-b border-[#08182b] w-[90px] min-w-[90px]">
                  PUROK
                </th>

                {/* 9. RESIDENTIAL ADDRESS */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3.5 text-left whitespace-nowrap text-white border-b border-[#08182b] w-[150px] min-w-[150px]">
                  RESIDENTIAL ADDRESS
                </th>

                {/* 10. BIRTHDAY */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3 text-center whitespace-nowrap text-white border-b border-[#08182b] w-[100px] min-w-[100px]">
                  BIRTHDAY
                </th>

                {/* 11. FARM LOCATION */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3.5 text-left whitespace-nowrap text-white border-b border-[#08182b] w-[140px] min-w-[140px]">
                  FARM LOCATION
                </th>

                {/* 12. GPS COORDINATES */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3.5 text-center whitespace-nowrap text-white border-b border-[#08182b] w-[160px] min-w-[160px]">
                  GPS COORDINATES
                </th>

                {/* 13. FARM AREA (ha) */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3 text-right whitespace-nowrap text-white border-b border-[#08182b] w-[110px] min-w-[110px]">
                  FARM AREA (ha)
                </th>

                {/* 14. COMMODITY PLANTED */}
                <th className="sticky top-0 z-20 bg-[#0c2340] py-3 px-3.5 text-left whitespace-nowrap text-white border-b border-[#08182b] w-[180px] min-w-[180px]">
                  COMMODITY PLANTED
                </th>

                {/* 15. ACTIONS (Sticky Right) */}
                <th className="sticky top-0 right-0 z-30 bg-[#0c2340] py-3 px-3.5 text-center whitespace-nowrap shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.3)] border-b border-[#08182b] text-white w-[115px] min-w-[115px]">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 text-slate-700 bg-white">
              {filteredParcels.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-14 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-slate-300 stroke-1" />
                      <p className="text-sm font-semibold text-slate-700">
                        Walay nakit-ang basakan. Palihug pagdugang og bag-ong rekord.
                      </p>
                      <p className="text-xs text-slate-500">
                        No farm records found in the database. Try adjusting your search filters or click &quot;Register Farm Parcel&quot; to add a new record.
                      </p>
                      {permissions.canAddParcels && (
                        <button
                          type="button"
                          onClick={onOpenAddParcel}
                          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Register New Farm Parcel</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredParcels.map((parcel, idx) => {
                  const isAuthorized = isUserAuthorizedForBarangay(currentUser, parcel.barangay);
                  const isEditing = editingTag === parcel.tagNumber && inlineEditData !== null;
                  const isSelected = selectedTags.includes(parcel.tagNumber);
                  const farmerPhoto = getFarmerPhoto(parcel);
                  const landPhoto = getLandPhoto(parcel);
                  const nameParts = getFarmerNameParts(parcel);
                  const birthdayFormatted = formatBirthday(parcel.birthday);
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

                  // Extract active seasonal record for this cropping season
                  const seasonalRecord =
                    parcel.seasonalRecords?.find((r) => r.season === selectedSeason) ||
                    parcel.seasonalRecords?.[0];

                  const activeVariety = seasonalRecord ? seasonalRecord.seedVariety : parcel.breed;

                  if (isEditing && inlineEditData) {
                    return (
                      <tr
                        key={parcel.tagNumber}
                        className="bg-amber-50 ring-2 ring-blue-500/80 transition shadow-inner font-normal text-xs"
                      >
                        {/* 0. MULTI-SELECT CHECKBOX (Frozen Left 0) */}
                        <td className="sticky left-0 z-10 bg-amber-50 w-[44px] min-w-[44px] max-w-[44px] py-2.5 px-2 text-center whitespace-nowrap border-r border-amber-300">
                          <span className="w-4 h-4 inline-block bg-slate-200/50 rounded border border-slate-300"></span>
                        </td>

                        {/* 1. RSBSA NO. (Frozen Left 44px) */}
                        <td className="sticky left-[44px] z-10 bg-amber-50 w-[155px] min-w-[155px] max-w-[155px] py-2.5 px-2 text-center whitespace-nowrap border-r-2 border-amber-300 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.12)]">
                          <input
                            type="text"
                            value={inlineEditData.swineNameOrId}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, swineNameOrId: e.target.value })
                            }
                            className="w-full max-w-[140px] px-1.5 py-1 bg-white border border-blue-400 rounded text-[11px] font-mono font-black text-blue-900 focus:ring-2 focus:ring-blue-600 shadow-2xs text-center"
                            placeholder="08-64-16-002-XXXXXX"
                          />
                        </td>

                        {/* 2. PROFILE PHOTO */}
                        <td className="w-[64px] min-w-[64px] max-w-[64px] py-2 px-1 text-center whitespace-nowrap bg-amber-50">
                          <div className="flex flex-col items-center gap-0.5">
                            <SafeImage
                              src={inlineEditData.photoUrl || farmerPhoto}
                              alt="Farmer"
                              fallbackType="farmer"
                              className="w-8 h-8 rounded-full object-cover border border-blue-400 shadow-2xs"
                            />
                            <label className="text-[9px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoFileChange(e, 'profile')}
                              />
                            </label>
                          </div>
                        </td>

                        {/* 3. FAMILY NAME */}
                        <td className="w-[125px] min-w-[125px] max-w-[125px] py-2.5 px-2 text-left whitespace-nowrap bg-amber-50">
                          <input
                            type="text"
                            value={inlineEditData.farmerFamilyName}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, farmerFamilyName: e.target.value })
                            }
                            className="w-full max-w-[115px] px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-bold uppercase text-slate-900 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                            placeholder="Last Name"
                          />
                        </td>

                        {/* 4. GIVEN NAME */}
                        <td className="w-[125px] min-w-[125px] max-w-[125px] py-2.5 px-2 text-left whitespace-nowrap bg-amber-50">
                          <input
                            type="text"
                            value={inlineEditData.farmerGivenName}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, farmerGivenName: e.target.value })
                            }
                            className="w-full max-w-[115px] px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                            placeholder="First Name"
                          />
                        </td>

                        {/* 5. MIDDLE NAME */}
                        <td className="py-2.5 px-2 text-left whitespace-nowrap w-[100px] min-w-[100px] bg-amber-50">
                          <input
                            type="text"
                            value={inlineEditData.farmerMiddleName}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, farmerMiddleName: e.target.value })
                            }
                            className="w-20 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                            placeholder="Middle"
                          />
                        </td>

                        {/* 6. FIELD PHOTO */}
                        <td className="py-2 px-2 text-center whitespace-nowrap w-[80px] min-w-[80px] bg-amber-50">
                          <div className="flex flex-col items-center gap-0.5">
                            <SafeImage
                              src={inlineEditData.fieldPhotoUrl || landPhoto}
                              alt="Farm Field"
                              fallbackType="field"
                              className="w-9 h-7 rounded object-cover border border-blue-400 shadow-2xs"
                            />
                            <label className="text-[9px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer">
                              Change
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoFileChange(e, 'field')}
                              />
                            </label>
                          </div>
                        </td>

                        {/* 7. BARANGAY */}
                        <td className="py-2.5 px-2.5 text-left whitespace-nowrap w-[125px] min-w-[125px] bg-amber-50">
                          <select
                            value={inlineEditData.barangay}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, barangay: e.target.value })
                            }
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 shadow-2xs cursor-pointer"
                          >
                            {BARANGAYS.map((b) => (
                              <option key={b.name} value={b.name}>
                                {getDisplayBarangay(b.name)}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 8. PUROK */}
                        <td className="py-2.5 px-2 text-left whitespace-nowrap w-[90px] min-w-[90px] bg-amber-50">
                          <select
                            value={inlineEditData.purok}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, purok: e.target.value })
                            }
                            className="px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 shadow-2xs cursor-pointer"
                          >
                            {[
                              'Purok 1',
                              'Purok 2',
                              'Purok 3',
                              'Purok 4',
                              'Purok 5',
                              'Purok 6',
                              'Purok 7',
                              'Sitio Centro',
                              'Sitio Riverside',
                              'Sitio Upper'
                            ].map((p) => (
                              <option key={p} value={p}>
                                {p}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* 9. RESIDENTIAL ADDRESS */}
                        <td className="py-2.5 px-2.5 text-left whitespace-nowrap w-[150px] min-w-[150px] bg-amber-50">
                          <input
                            type="text"
                            value={inlineEditData.residentialAddress}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, residentialAddress: e.target.value })
                            }
                            className="w-32 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                            placeholder="Silago, Southern Leyte"
                          />
                        </td>

                        {/* 10. BIRTHDAY */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap w-[100px] min-w-[100px] bg-amber-50">
                          <input
                            type="text"
                            value={inlineEditData.birthday}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, birthday: e.target.value })
                            }
                            className="w-24 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono text-center text-slate-800 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                            placeholder="MM/DD/YYYY"
                          />
                        </td>

                        {/* 11. FARM LOCATION */}
                        <td className="py-2.5 px-2.5 text-left whitespace-nowrap w-[140px] min-w-[140px] bg-amber-50">
                          <input
                            type="text"
                            value={inlineEditData.farmLocation}
                            onChange={(e) =>
                              setInlineEditData({ ...inlineEditData, farmLocation: e.target.value })
                            }
                            className="w-32 px-2 py-1 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                            placeholder="Sitio / Brgy"
                          />
                        </td>

                        {/* 12. GPS COORDINATES */}
                        <td className="py-2.5 px-2 text-center whitespace-nowrap w-[160px] min-w-[160px] bg-amber-50">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.000001"
                              value={inlineEditData.lat}
                              onChange={(e) =>
                                setInlineEditData({
                                  ...inlineEditData,
                                  lat: parseFloat(e.target.value) || 0
                                })
                              }
                              className="w-18 px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono focus:ring-2 focus:ring-blue-600 shadow-2xs"
                              placeholder="Lat"
                              title="Latitude"
                            />
                            <span className="text-slate-400">,</span>
                            <input
                              type="number"
                              step="0.000001"
                              value={inlineEditData.lng}
                              onChange={(e) =>
                                setInlineEditData({
                                  ...inlineEditData,
                                  lng: parseFloat(e.target.value) || 0
                                })
                              }
                              className="w-18 px-1.5 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono focus:ring-2 focus:ring-blue-600 shadow-2xs"
                              placeholder="Lng"
                              title="Longitude"
                            />
                          </div>
                        </td>

                        {/* 13. FARM AREA (ha) */}
                        <td className="py-2.5 px-2.5 text-right whitespace-nowrap w-[110px] min-w-[110px] bg-amber-50">
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
                            className="w-20 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono font-bold text-right text-slate-900 focus:ring-2 focus:ring-blue-600 shadow-2xs"
                            placeholder="0.25"
                          />
                        </td>

                        {/* 14. COMMODITY PLANTED */}
                        <td className="py-2.5 px-2.5 text-left whitespace-nowrap w-[180px] min-w-[180px] bg-amber-50">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={inlineEditData.commodity}
                              onChange={(e) =>
                                setInlineEditData({ ...inlineEditData, commodity: e.target.value })
                              }
                              className="w-16 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold focus:ring-2 focus:ring-blue-600 shadow-2xs"
                              placeholder="Rice"
                            />
                            <select
                              value={inlineEditData.breed}
                              onChange={(e) =>
                                setInlineEditData({ ...inlineEditData, breed: e.target.value })
                              }
                              className="w-28 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs font-medium focus:ring-2 focus:ring-blue-600 shadow-2xs cursor-pointer"
                            >
                              {RICE_VARIETIES.map((rv) => (
                                <option key={rv.name} value={rv.name}>
                                  {rv.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>

                        {/* 15. ACTIONS (Save & Cancel - Sticky Right) */}
                        <td className="py-2 px-3 text-center whitespace-nowrap sticky right-0 z-10 bg-amber-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.08)] w-[90px] min-w-[90px]">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSaveInlineEdit(parcel.tagNumber)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-xs"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Save</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelInlineEdit}
                              className="px-2 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
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
                      className={`hover:bg-blue-50/50 transition-colors group ${
                        isSelected
                          ? 'bg-blue-50/90 font-medium ring-1 ring-inset ring-blue-300'
                          : idx % 2 === 1
                          ? 'bg-[#f8fafc]'
                          : 'bg-white'
                      }`}
                    >
                      {/* 0. MULTI-SELECT CHECKBOX (Frozen Left 0) */}
                      <td className={`sticky left-0 z-10 ${isSelected ? 'bg-blue-100/90' : rowBg} group-hover:bg-blue-50/90 w-[44px] min-w-[44px] max-w-[44px] py-2.5 px-2 text-center whitespace-nowrap border-r border-slate-200 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleToggleSelectRow(parcel.tagNumber);
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer transition"
                          title={`Select ${parcel.swineNameOrId || parcel.raiserName}`}
                        />
                      </td>

                      {/* 1. RSBSA NO. (Frozen Left 44px) */}
                      <td className={`sticky left-[44px] z-10 ${isSelected ? 'bg-blue-100/90' : rowBg} group-hover:bg-slate-100/90 w-[155px] min-w-[155px] max-w-[155px] py-2.5 px-2.5 text-center whitespace-nowrap border-r-2 border-slate-200 shadow-[4px_0_6px_-2px_rgba(0,0,0,0.1)]`}>
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-block px-2 py-1 rounded bg-blue-50/90 border border-blue-200 text-blue-900 font-mono text-[11px] font-black tracking-tight">
                            {parcel.swineNameOrId || 'NO RSBSA'}
                          </span>
                          {(parcel.is_pending_sync || parcel.isPendingSync) && (
                            <span
                              className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-800 bg-amber-100/90 border border-amber-300 px-1.5 py-0.5 rounded-full shadow-2xs animate-pulse"
                              title="Saved locally offline. Will synchronize to database automatically when internet is available."
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Offline / Pending Sync
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. PROFILE PHOTO */}
                      <td className="w-[64px] min-w-[64px] max-w-[64px] py-2 px-1 text-center whitespace-nowrap">
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
                          className="relative inline-block group/photo p-0.5 rounded-full border-2 border-slate-200 hover:border-emerald-500 hover:scale-115 active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md"
                          title="Click to view full farmer profile photo"
                        >
                          <SafeImage
                            src={farmerPhoto}
                            alt={parcel.raiserName}
                            fallbackType="farmer"
                            className="w-8 h-8 rounded-full object-cover transition-transform group-hover/photo:brightness-105"
                          />
                        </button>
                      </td>

                      {/* 3. FAMILY NAME */}
                      <td
                        className="w-[125px] min-w-[125px] max-w-[125px] py-2.5 px-3 whitespace-nowrap font-bold text-slate-900 text-xs uppercase truncate"
                        title={nameParts.family || '-'}
                      >
                        {nameParts.family || '-'}
                      </td>

                      {/* 4. GIVEN NAME */}
                      <td
                        className="w-[125px] min-w-[125px] max-w-[125px] py-2.5 px-3 whitespace-nowrap font-medium text-slate-800 text-xs truncate"
                        title={nameParts.given || '-'}
                      >
                        {nameParts.given || '-'}
                      </td>

                      {/* 5. MIDDLE NAME */}
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-600 text-xs w-[100px] min-w-[100px]">
                        {nameParts.middle || '-'}
                      </td>

                      {/* 6. FIELD PHOTO */}
                      <td className="py-2 px-2 text-center whitespace-nowrap w-[80px] min-w-[80px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPhotoPreview({
                              isOpen: true,
                              photoUrl: landPhoto,
                              photoType: 'field',
                              parcel
                            });
                          }}
                          className="relative inline-block group/land p-0.5 rounded-lg border-2 border-slate-200 hover:border-emerald-500 hover:scale-115 active:scale-95 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md"
                          title="Click to view full field photo"
                        >
                          <SafeImage
                            src={landPhoto}
                            alt={`Farm field ${parcel.swineNameOrId}`}
                            fallbackType="field"
                            className="w-9 h-7 rounded-md object-cover transition-transform group-hover/land:brightness-105"
                          />
                        </button>
                      </td>

                      {/* 7. BARANGAY (e.g. Balagawan) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-900 font-semibold text-xs w-[125px] min-w-[125px]">
                        {getDisplayBarangay(parcel.barangay) || parcel.barangay || '-'}
                      </td>

                      {/* 8. PUROK (e.g. Purok 1) */}
                      <td className="py-2.5 px-2.5 whitespace-nowrap text-slate-700 text-xs w-[90px] min-w-[90px]">
                        {parcel.purok || 'Purok 1'}
                      </td>

                      {/* 9. RESIDENTIAL ADDRESS (Municipality & Province: Silago, Southern Leyte) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 text-xs w-[150px] min-w-[150px]" title={parcel.residential_address || parcel.address || 'Silago, Southern Leyte'}>
                        {parcel.residential_address || parcel.address || 'Silago, Southern Leyte'}
                      </td>

                      {/* 10. BIRTHDAY (MM/DD/YYYY format) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap font-mono text-slate-700 text-xs w-[100px] min-w-[100px]">
                        {birthdayFormatted}
                      </td>

                      {/* 11. FARM LOCATION (Barangay/Sitio) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-800 text-xs w-[140px] min-w-[140px]">
                        {farmLocation}
                      </td>

                      {/* 12. GPS COORDINATES (Latitude & Longitude formatted cleanly) */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap font-mono text-[11px] text-slate-700 w-[160px] min-w-[160px]">
                        {parcel.lat ? `${parcel.lat.toFixed(6)}, ${parcel.lng.toFixed(6)}` : '-'}
                      </td>

                      {/* 13. FARM AREA (ha) (e.g. 0.25 ha) */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900 text-xs w-[110px] min-w-[110px]">
                        {(parcel.weightKg || 0).toFixed(2)} ha
                      </td>

                      {/* 14. COMMODITY PLANTED (e.g. Rice / Variety) */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-800 text-xs w-[180px] min-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{parcel.commodity || 'Rice'}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-blue-900 font-medium text-[11px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/70">
                            {activeVariety || 'NSIC Rc 222'}
                          </span>
                        </div>
                      </td>

                      {/* 15. ACTIONS: Governed strictly by RBAC & GIS locate */}
                      <td className={`py-2.5 px-2.5 text-center whitespace-nowrap sticky right-0 z-10 ${rowBg} group-hover:bg-blue-50/70 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] w-[115px] min-w-[115px]`}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* 1. Locate on GIS Map (MapPin Icon) */}
                          {hasGpsCoordinates ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLocateOnMap?.(parcel);
                              }}
                              className="p-1.5 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 transition cursor-pointer inline-flex items-center justify-center shadow-2xs hover:border-emerald-400"
                              title="I-locate sa GIS Mapa / Locate on GIS Map"
                            >
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-400 opacity-30 cursor-not-allowed inline-flex items-center justify-center"
                              title="Walay GPS coordinates"
                            >
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          )}

                          {permissions.isPublicVisitor ? (
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md border border-slate-200" title="Read-Only Mode for Public Visitors">
                              Read-Only
                            </span>
                          ) : (
                            <>
                              {/* 2. Edit (Pencil Icon) -> triggers inline row editing if authorized for sector */}
                              <button
                                type="button"
                                onClick={(e) => handleStartInlineEdit(e, parcel)}
                                className={`p-1.5 rounded-lg border transition cursor-pointer inline-flex items-center justify-center shadow-2xs ${
                                  isAuthorized
                                    ? 'border-blue-300 bg-white hover:bg-blue-50 text-blue-700'
                                    : 'border-slate-200 bg-slate-100 text-slate-400 hover:bg-slate-200 opacity-60'
                                }`}
                                title={
                                  isAuthorized
                                    ? 'Edit Farmer Record Inline'
                                    : `Restricted: Brgy. ${parcel.barangay} is outside your assigned sector`
                                }
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* 3. Delete (Trash Icon) -> ONLY Central Admin can delete */}
                              {permissions.canDeleteParcels && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteAttempt(parcel);
                                  }}
                                  className="p-1.5 rounded-lg border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 transition cursor-pointer inline-flex items-center justify-center shadow-2xs"
                                  title="Delete Registration (Central Admin Only)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
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

        {/* Scrollable Table Summary Footer Bar (Replacing old pagination controls) */}
        <div className="p-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/80">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              Total RSBSA Records: <strong className="text-slate-900 font-bold">{filteredParcels.length}</strong>
            </span>
            <span className="text-slate-300">&bull;</span>
            <span>
              Total Area: <strong className="text-emerald-700 font-bold font-mono">{totalAreaMapped.toFixed(2)} ha</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
            <span>Scroll vertically to view all entries</span>
            <span className="text-slate-300">&bull;</span>
            <span>Sticky header enabled</span>
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
          <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95">
            {/* Modal Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-700" />
                <h3 className="text-sm font-bold text-slate-900">
                  Official Georeference &amp; RSBSA Parcel Certificate
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Switch parcel dropdown */}
                <select
                  value={certificateParcel.tagNumber}
                  onChange={(e) => {
                    const found = parcels.find((p) => p.tagNumber === e.target.value);
                    if (found) setCertificateParcel(found);
                  }}
                  className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-800"
                >
                  {filteredParcels.map((p) => (
                    <option key={p.tagNumber} value={p.tagNumber}>
                      {p.swineNameOrId || p.tagNumber} - {p.raiserName} ({p.barangay})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCertificateParcel(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Document Surface */}
            <div className="border-4 border-double border-emerald-900/30 bg-[#fffefb] p-6 sm:p-8 rounded-xl shadow-inner space-y-6 text-slate-900">
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
                    <span className="font-medium text-slate-700">{certificateParcel.contactNumber || '0917-000-0000'}</span>
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
                    <span className="font-bold text-slate-900 text-sm">{certificateParcel.weightKg} Hectares</span>
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
                      {certificateParcel.lat.toFixed(6)}° N, {certificateParcel.lng.toFixed(6)}° E
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatories Row */}
              <div className="pt-6 grid grid-cols-3 gap-2 text-center text-[10.5px]">
                <div>
                  <div className="h-9 flex items-end justify-center font-serif font-bold text-slate-800">
                    {certificateParcel.focalPerson || getAssignedLftForBarangay(certificateParcel.barangay)?.name || 'Wella S. Bongons'}
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
    </div>
  );
};
