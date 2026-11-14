import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BARANGAYS, getUserAssignedBarangays, isUserAuthorizedForBarangay, matchBarangay } from '../data/barangays';
import { SUBSIDY_CATEGORIES } from '../data/subsidies';
import {
  FarmParcel,
  GovernmentSubsidyProgram,
  SubsidyCategory,
  SubsidyClaimRecord,
  SubsidyHistoryEntry
} from '../types';
import {
  OFFICE_INPUT_CLASS,
  OFFICE_LABEL_CLASS,
  OFFICE_SELECT_CLASS,
  OfficeKpiItem,
  OfficeKpiStrip,
  OfficeModalHeader,
  OfficePanel
} from '../components/OfficeFormPrimitives';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  History,
  PackageCheck,
  Pencil,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { SubsidyTalaanPrintModal } from '../components/SubsidyTalaanPrintModal';

type ClaimStatusFilter = 'all' | 'pending' | 'claimed';
type SubsidiesViewMode = 'checklist' | 'history';

const QUICK_QTY_CHIPS = [
  '1 bag',
  '2 bags',
  '3 bags',
  '4 bags',
  '20 kg seeds',
  '40 kg seeds',
  '1 pack'
];

/**
 * Shared one-click quantity preset selector used by both claim & giveaway log modals.
 */
const QuickQuantityChips: React.FC<{
  value: string;
  suggested?: string;
  onSelect: (qty: string) => void;
}> = ({ value, suggested, onSelect }) => (
  <div className="flex flex-wrap gap-1.5 mt-1.5">
    {suggested && (
      <button
        type="button"
        onClick={() => onSelect(suggested)}
        className="px-2 py-0.5 rounded-sm border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[10.5px] font-semibold cursor-pointer"
      >
        Suggested: {suggested}
      </button>
    )}
    {QUICK_QTY_CHIPS.map((preset) => (
      <button
        key={preset}
        type="button"
        onClick={() => onSelect(preset)}
        className={`px-2 py-0.5 rounded-sm border text-[10.5px] font-semibold cursor-pointer transition ${
          value === preset
            ? 'bg-emerald-800 text-white border-emerald-900'
            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
        }`}
      >
        {preset}
      </button>
    ))}
  </div>
);

/**
 * Computes a clean suggested release quantity when a program defines a per-hectare rate
 * (e.g. "2 bags / ha" on a 1.25 ha parcel yields "2.5 bags").
 */
const computeSuggestedQuantity = (defaultQuantity: string, areaHa: number): string => {
  const match = defaultQuantity.match(/(\d+(?:\.\d+)?)\s*(bags?|sacks?|kg|packs?|bottles?)\s*\/\s*ha/i);
  if (!match || !areaHa || areaHa <= 0) return defaultQuantity;
  const rate = Number(match[1]);
  const unit = match[2];
  const calculated = Math.max(0.5, Math.round(rate * areaHa * 2) / 2);
  return `${calculated} ${unit}`;
};

interface ProgramFormDraft {
  id?: string;
  title: string;
  category: SubsidyCategory;
  itemDescription: string;
  defaultQuantity: string;
  fundingSource: string;
  season: string;
  targetBarangay: string;
  distributionDate: string;
  status: 'Active' | 'Completed' | 'Upcoming';
}

interface ClaimModalState {
  parcel: FarmParcel;
  claimed: boolean;
  inputType: SubsidyCategory;
  itemGiven: string;
  claimedAt: string;
  quantityReceived: string;
  releasedBy: string;
  slipOrVoucherNo: string;
  recipientName: string;
  remarks: string;
}

interface PreviousGiveawayDraft {
  parcelTag: string;
  inputType: SubsidyCategory;
  itemGiven: string;
  quantityGiven: string;
  dateGiven: string;
  programTitle: string;
  fundingSource: string;
  releasedBy: string;
  slipOrVoucherNo: string;
  recipientName: string;
  remarks: string;
}

const CATEGORY_BADGE_STYLES: Record<SubsidyCategory, string> = {
  'Seedlings / Seeds': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Fertilizer: 'bg-amber-50 text-amber-800 border-amber-200',
  'Farm Input Pack': 'bg-blue-50 text-blue-800 border-blue-200',
  'Cash / Voucher': 'bg-violet-50 text-violet-800 border-violet-200'
};

const PROGRAM_STATUS_STYLES: Record<GovernmentSubsidyProgram['status'], string> = {
  Active: 'bg-emerald-700 text-white border-emerald-800',
  Completed: 'bg-slate-200 text-slate-700 border-slate-300',
  Upcoming: 'bg-sky-50 text-sky-800 border-sky-200'
};

const csvCell = (val: unknown) => `"${String(val ?? '').replace(/"/g, '""')}"`;

/**
 * Municipal Agriculture Office official distribution ledger (Talaan) for tracking
 * government-provided seedlings, fertilizer, and farm input distributions across
 * registered riceland owners, including release dates, voucher numbers, and full history.
 */
export const SubsidiesView: React.FC = () => {
  const {
    currentUser,
    municipalBranding,
    parcels,
    seasons,
    permissions,
    subsidyPrograms,
    subsidyClaims,
    subsidyHistory,
    addSubsidyProgram,
    updateSubsidyProgram,
    deleteSubsidyProgram,
    setOwnerSubsidyClaim,
    bulkMarkSubsidyClaims,
    addSubsidyHistoryEntry,
    deleteSubsidyHistoryEntry
  } = useApp();

  const todayIso = () => new Date().toISOString().split('T')[0];

  const assignedBrgys = useMemo(() => getUserAssignedBarangays(currentUser), [currentUser]);
  const isLftUser = Boolean(
    assignedBrgys && assignedBrgys.length > 0 && currentUser?.role === 'Barangay Focal Person'
  );

  const [viewMode, setViewMode] = useState<SubsidiesViewMode>('checklist');
  const [selectedProgramId, setSelectedProgramId] = useState<string>(
    () => subsidyPrograms.find((p) => p.status === 'Active')?.id || subsidyPrograms[0]?.id || ''
  );
  const [quickDateGiven, setQuickDateGiven] = useState<string>(todayIso);
  const [searchQuery, setSearchQuery] = useState('');
  const [barangayFilter, setBarangayFilter] = useState<string>(() => {
    const assigned = getUserAssignedBarangays(currentUser);
    if (assigned && assigned.length > 0 && currentUser?.role === 'Barangay Focal Person') {
      return 'ASSIGNED';
    }
    return 'All';
  });

  useEffect(() => {
    const assigned = getUserAssignedBarangays(currentUser);
    if (assigned && assigned.length > 0 && currentUser?.role === 'Barangay Focal Person') {
      setBarangayFilter('ASSIGNED');
    } else {
      setBarangayFilter('All');
    }
  }, [currentUser]);
  const [statusFilter, setStatusFilter] = useState<ClaimStatusFilter>('all');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'All' | SubsidyCategory>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDeleteProgramId, setConfirmDeleteProgramId] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [programDraft, setProgramDraft] = useState<ProgramFormDraft>({
    title: '',
    category: 'Seedlings / Seeds',
    itemDescription: '',
    defaultQuantity: '2 bags',
    fundingSource: 'DA / LGU-Silago MAO',
    season: seasons[0] || 'Wet Season (WS) 2026',
    targetBarangay: 'All Barangays',
    distributionDate: todayIso(),
    status: 'Active'
  });

  const [claimModal, setClaimModal] = useState<ClaimModalState | null>(null);
  const [historyOwnerParcel, setHistoryOwnerParcel] = useState<FarmParcel | null>(null);
  const [logGiveawayOpen, setLogGiveawayOpen] = useState(false);
  const [logGiveawayDraft, setLogGiveawayDraft] = useState<PreviousGiveawayDraft>({
    parcelTag: '',
    inputType: 'Fertilizer',
    itemGiven: '',
    quantityGiven: '2 bags',
    dateGiven: todayIso(),
    programTitle: 'Previous Government Rice Subsidy',
    fundingSource: 'DA / LGU-Silago',
    releasedBy: currentUser?.name || 'MAO Staff',
    slipOrVoucherNo: '',
    recipientName: 'Owner (Self)',
    remarks: ''
  });

  const showNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const selectedProgram = useMemo(
    () =>
      subsidyPrograms.find((p) => p.id === selectedProgramId) ||
      subsidyPrograms[0] ||
      null,
    [subsidyPrograms, selectedProgramId]
  );

  // Active registered riceland parcels sorted cleanly by owner name
  const activeParcels = useMemo(
    () =>
      parcels
        .filter((p) => !p.isArchived)
        .slice()
        .sort((a, b) => (a.raiserName || '').localeCompare(b.raiserName || '')),
    [parcels]
  );

  // Respect program barangay targeting (if set to a specific barangay)
  const programEligibleParcels = useMemo(() => {
    if (!selectedProgram || selectedProgram.targetBarangay === 'All Barangays') {
      return activeParcels;
    }
    return activeParcels.filter((p) =>
      matchBarangay(p.barangay, selectedProgram.targetBarangay)
    );
  }, [activeParcels, selectedProgram]);

  const selectedClaimMap = useMemo(() => {
    const map = new Map<string, SubsidyClaimRecord>();
    if (!selectedProgram) return map;
    for (const c of subsidyClaims) {
      if (c.programId === selectedProgram.id) {
        map.set(c.parcelTag, c);
      }
    }
    return map;
  }, [subsidyClaims, selectedProgram]);

  // Combined timeline of previous government giveaways per riceland owner (history + any legacy claims)
  const unifiedHistoryEntries = useMemo(() => {
    const programLookup = new Map(subsidyPrograms.map((p) => [p.id, p]));
    const byId = new Map<string, SubsidyHistoryEntry>();
    for (const entry of subsidyHistory) {
      byId.set(entry.id, entry);
    }
    for (const claim of subsidyClaims) {
      if (!claim.claimed) continue;
      const histKey = `hist::${claim.id}`;
      if (byId.has(histKey)) continue;
      const program = programLookup.get(claim.programId);
      byId.set(histKey, {
        id: histKey,
        programId: claim.programId,
        programTitle: program?.title || 'Government Assistance Program',
        fundingSource: program?.fundingSource || 'DA / LGU-Silago',
        parcelTag: claim.parcelTag,
        rsbsaNo: claim.rsbsaNo,
        ownerName: claim.ownerName,
        barangay: claim.barangay,
        inputType: claim.inputType || program?.category || 'Seedlings / Seeds',
        itemGiven: claim.itemGiven || program?.itemDescription || program?.title || 'Agricultural Input',
        quantityGiven: claim.quantityReceived || program?.defaultQuantity || '1 unit',
        dateGiven: claim.claimedAt || '',
        releasedBy: claim.releasedBy || 'MAO Staff',
        slipOrVoucherNo: claim.slipOrVoucherNo || '',
        recipientName: claim.recipientName || 'Owner (Self)',
        remarks: claim.remarks || '',
        recordedAt: claim.updatedAt
      });
    }
    return Array.from(byId.values()).sort((a, b) =>
      (b.dateGiven || b.recordedAt || '').localeCompare(a.dateGiven || a.recordedAt || '')
    );
  }, [subsidyHistory, subsidyClaims, subsidyPrograms]);

  const historyByParcel = useMemo(() => {
    const grouped = new Map<string, SubsidyHistoryEntry[]>();
    for (const item of unifiedHistoryEntries) {
      const list = grouped.get(item.parcelTag) || [];
      list.push(item);
      grouped.set(item.parcelTag, list);
    }
    return grouped;
  }, [unifiedHistoryEntries]);

  // Apply search, barangay, and claim status filters for Checklist view
  const filteredParcels = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return programEligibleParcels.filter((p) => {
      if (barangayFilter === 'ASSIGNED') {
        if (!isUserAuthorizedForBarangay(currentUser, p.barangay)) {
          return false;
        }
      } else if (barangayFilter !== 'All' && !matchBarangay(p.barangay, barangayFilter)) {
        return false;
      }
      const claim = selectedClaimMap.get(p.tagNumber);
      const isClaimed = Boolean(claim?.claimed);
      if (statusFilter === 'claimed' && !isClaimed) return false;
      if (statusFilter === 'pending' && isClaimed) return false;

      if (!q) return true;
      const haystack = `${p.raiserName} ${p.swineNameOrId} ${p.tagNumber} ${p.barangay} ${p.contactNumber || ''} ${p.variety || p.breed || ''} ${claim?.slipOrVoucherNo || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [programEligibleParcels, barangayFilter, statusFilter, searchQuery, selectedClaimMap, currentUser]);

  // Apply filters for Previous Give-aways History view
  const filteredHistoryEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unifiedHistoryEntries.filter((entry) => {
      if (historyTypeFilter !== 'All' && entry.inputType !== historyTypeFilter) return false;
      if (barangayFilter === 'ASSIGNED') {
        if (!isUserAuthorizedForBarangay(currentUser, entry.barangay)) return false;
      } else if (barangayFilter !== 'All' && !matchBarangay(entry.barangay, barangayFilter)) {
        return false;
      }
      if (!q) return true;
      const haystack = `${entry.ownerName} ${entry.rsbsaNo} ${entry.parcelTag} ${entry.barangay} ${entry.inputType} ${entry.itemGiven} ${entry.programTitle} ${entry.fundingSource} ${entry.slipOrVoucherNo || ''} ${entry.recipientName || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [unifiedHistoryEntries, historyTypeFilter, barangayFilter, searchQuery, currentUser]);

  // Program KPI stats
  const stats = useMemo(() => {
    let claimedCount = 0;
    let totalHa = 0;
    const targetParcels = programEligibleParcels.filter((p) => {
      if (barangayFilter === 'ASSIGNED') {
        return isUserAuthorizedForBarangay(currentUser, p.barangay);
      }
      if (barangayFilter !== 'All') {
        return matchBarangay(p.barangay, barangayFilter);
      }
      return true;
    });

    for (const p of targetParcels) {
      totalHa += Number(p.areaHa || p.weightKg || 0);
      if (selectedClaimMap.get(p.tagNumber)?.claimed) claimedCount += 1;
    }
    const eligibleCount = targetParcels.length;
    const pendingCount = Math.max(0, eligibleCount - claimedCount);
    const coveragePct = eligibleCount > 0 ? Math.round((claimedCount / eligibleCount) * 100) : 0;
    return { eligibleCount, claimedCount, pendingCount, coveragePct, totalHa };
  }, [programEligibleParcels, selectedClaimMap, barangayFilter, currentUser]);

  const kpiItems: OfficeKpiItem[] = [
    {
      label: isLftUser && barangayFilter === 'ASSIGNED' ? 'Eligible Sector Farmers' : 'Eligible Riceland Owners',
      value: stats.eligibleCount,
      note: `${stats.totalHa.toFixed(2)} ha ${isLftUser && barangayFilter === 'ASSIGNED' ? 'in assigned sector' : 'total landholding'}`,
      icon: Users
    },
    {
      label: 'Already Claimed',
      value: stats.claimedCount,
      note: `${stats.coveragePct}% distributed for selected batch`,
      icon: CheckCircle2,
      valueToneClass: 'text-emerald-800'
    },
    {
      label: 'Not Yet Claimed',
      value: stats.pendingCount,
      note: 'Pending owner release / pickup',
      icon: Clock,
      valueToneClass: stats.pendingCount > 0 ? 'text-amber-700' : 'text-slate-700'
    },
    {
      label: 'Total Previous Releases',
      value: unifiedHistoryEntries.length,
      note: 'Recorded Seedlings & Fertilizer giveaways',
      icon: History
    }
  ];

  // Program modal helpers
  const openCreateProgram = () => {
    const defaultBrgy =
      !permissions.isCentralAdmin && currentUser?.barangay ? currentUser.barangay : 'All Barangays';
    setProgramDraft({
      title: '',
      category: 'Seedlings / Seeds',
      itemDescription: '',
      defaultQuantity: '2 bags / ha',
      fundingSource: 'DA / LGU-Silago MAO',
      season: seasons[0] || 'Wet Season (WS) 2026',
      targetBarangay: defaultBrgy,
      distributionDate: todayIso(),
      status: 'Active'
    });
    setProgramModalOpen(true);
  };

  const openEditProgram = (program: GovernmentSubsidyProgram) => {
    setProgramDraft({
      id: program.id,
      title: program.title,
      category: program.category,
      itemDescription: program.itemDescription,
      defaultQuantity: program.defaultQuantity,
      fundingSource: program.fundingSource,
      season: program.season,
      targetBarangay: program.targetBarangay,
      distributionDate: program.distributionDate,
      status: program.status
    });
    setProgramModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programDraft.title.trim()) return;
    const payload = {
      title: programDraft.title.trim(),
      category: programDraft.category,
      itemDescription: programDraft.itemDescription.trim() || programDraft.title.trim(),
      defaultQuantity: programDraft.defaultQuantity.trim() || '1 unit',
      fundingSource: programDraft.fundingSource.trim() || 'Government Assistance',
      season: programDraft.season,
      targetBarangay: programDraft.targetBarangay,
      distributionDate: programDraft.distributionDate,
      status: programDraft.status
    };
    if (programDraft.id) {
      updateSubsidyProgram(programDraft.id, payload);
      showNotice(`Updated "${payload.title}".`);
    } else {
      const created = addSubsidyProgram(payload);
      if (created?.id) setSelectedProgramId(created.id);
      showNotice(`Added assistance program: "${payload.title}".`);
    }
    setProgramModalOpen(false);
  };

  const handleQuickMark = (parcel: FarmParcel, claimed: boolean) => {
    if (!selectedProgram) return;
    const areaHa = Number(parcel.areaHa || parcel.weightKg || 0);
    const suggestedQty = computeSuggestedQuantity(selectedProgram.defaultQuantity, areaHa);
    setOwnerSubsidyClaim(selectedProgram.id, parcel, {
      claimed,
      inputType: selectedProgram.category,
      itemGiven: selectedProgram.itemDescription || selectedProgram.title,
      claimedAt: claimed ? quickDateGiven || todayIso() : '',
      quantityReceived: claimed ? suggestedQty : '',
      recipientName: claimed ? 'Owner (Self)' : ''
    });
    showNotice(
      claimed
        ? `Marked ${parcel.raiserName} as Claimed (${selectedProgram.category} • Given ${quickDateGiven || todayIso()}).`
        : `Reverted ${parcel.raiserName} to Not Yet Claimed.`
    );
  };

  const openClaimDetailsModal = (parcel: FarmParcel) => {
    if (!selectedProgram) return;
    const existing = selectedClaimMap.get(parcel.tagNumber);
    const areaHa = Number(parcel.areaHa || parcel.weightKg || 0);
    const suggestedQty = computeSuggestedQuantity(selectedProgram.defaultQuantity, areaHa);
    setClaimModal({
      parcel,
      claimed: existing ? existing.claimed : true,
      inputType: existing?.inputType || selectedProgram.category,
      itemGiven: existing?.itemGiven || selectedProgram.itemDescription || selectedProgram.title,
      claimedAt: existing?.claimedAt || quickDateGiven || todayIso(),
      quantityReceived: existing?.quantityReceived || suggestedQty,
      releasedBy: existing?.releasedBy || currentUser?.name || 'MAO Staff',
      slipOrVoucherNo: existing?.slipOrVoucherNo || '',
      recipientName: existing?.recipientName || 'Owner (Self)',
      remarks: existing?.remarks || ''
    });
  };

  const handleSaveClaimModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimModal || !selectedProgram) return;
    setOwnerSubsidyClaim(selectedProgram.id, claimModal.parcel, {
      claimed: claimModal.claimed,
      inputType: claimModal.inputType,
      itemGiven: claimModal.itemGiven.trim() || selectedProgram.itemDescription,
      claimedAt: claimModal.claimedAt || todayIso(),
      quantityReceived: claimModal.quantityReceived.trim() || selectedProgram.defaultQuantity,
      releasedBy: claimModal.releasedBy.trim() || currentUser?.name || 'MAO Staff',
      slipOrVoucherNo: claimModal.slipOrVoucherNo.trim(),
      recipientName: claimModal.recipientName.trim() || 'Owner (Self)',
      remarks: claimModal.remarks.trim()
    });
    showNotice(
      claimModal.claimed
        ? `Saved claim record for ${claimModal.parcel.raiserName} (${claimModal.inputType} • ${claimModal.claimedAt}).`
        : `Updated ${claimModal.parcel.raiserName} to Pending.`
    );
    setClaimModal(null);
  };

  const openLogPreviousGiveaway = (preselectedParcel?: FarmParcel) => {
    const authorizedList = activeParcels.filter((p) =>
      isUserAuthorizedForBarangay(currentUser, p.barangay)
    );
    const defaultParcel = preselectedParcel || authorizedList[0] || activeParcels[0];
    setLogGiveawayDraft({
      parcelTag: defaultParcel?.tagNumber || '',
      inputType: 'Fertilizer',
      itemGiven: 'Urea (46-0-0) & Complete (14-14-14) Fertilizer',
      quantityGiven: '2 bags',
      dateGiven: todayIso(),
      programTitle: 'Previous Government Input Distribution',
      fundingSource: 'DA / LGU-Silago MAO',
      releasedBy: currentUser?.name || 'MAO Staff',
      slipOrVoucherNo: '',
      recipientName: 'Owner (Self)',
      remarks: ''
    });
    setLogGiveawayOpen(true);
  };

  const handleSavePreviousGiveaway = (e: React.FormEvent) => {
    e.preventDefault();
    const parcel = activeParcels.find((p) => p.tagNumber === logGiveawayDraft.parcelTag);
    if (!parcel) return;
    const saved = addSubsidyHistoryEntry(
      {
        programTitle: logGiveawayDraft.programTitle.trim() || 'Government Assistance',
        fundingSource: logGiveawayDraft.fundingSource.trim() || 'DA / LGU-Silago',
        parcelTag: parcel.tagNumber,
        rsbsaNo: parcel.swineNameOrId || parcel.rsbsa_no || '',
        ownerName: parcel.raiserName,
        barangay: parcel.barangay,
        inputType: logGiveawayDraft.inputType,
        itemGiven: logGiveawayDraft.itemGiven.trim() || logGiveawayDraft.inputType,
        quantityGiven: logGiveawayDraft.quantityGiven.trim() || '1 unit',
        dateGiven: logGiveawayDraft.dateGiven || todayIso(),
        releasedBy: logGiveawayDraft.releasedBy.trim() || currentUser?.name || 'MAO Staff',
        slipOrVoucherNo: logGiveawayDraft.slipOrVoucherNo.trim(),
        recipientName: logGiveawayDraft.recipientName.trim() || 'Owner (Self)',
        remarks: logGiveawayDraft.remarks.trim()
      },
      parcel
    );
    if (saved) {
      showNotice(
        `Logged ${saved.inputType} give-away for ${parcel.raiserName} (${saved.dateGiven}).`
      );
      setLogGiveawayOpen(false);
    }
  };

  const authorizedFiltered = useMemo(
    () => filteredParcels.filter((p) => isUserAuthorizedForBarangay(currentUser, p.barangay)),
    [filteredParcels, currentUser]
  );

  const authorizedPendingTags = useMemo(
    () =>
      authorizedFiltered
        .filter((p) => !selectedClaimMap.get(p.tagNumber)?.claimed)
        .map((p) => p.tagNumber),
    [authorizedFiltered, selectedClaimMap]
  );

  const allAuthorizedSelected =
    authorizedFiltered.length > 0 &&
    authorizedFiltered.every((p) => selectedTags.includes(p.tagNumber));

  const toggleSelectAll = () => {
    if (allAuthorizedSelected) {
      setSelectedTags([]);
    } else {
      setSelectedTags(authorizedFiltered.map((p) => p.tagNumber));
    }
  };

  const toggleSelectRow = (tagNumber: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagNumber) ? prev.filter((t) => t !== tagNumber) : [...prev, tagNumber]
    );
  };

  const handleBulkAction = (claimed: boolean) => {
    if (!selectedProgram || selectedTags.length === 0) return;
    const targetParcels = programEligibleParcels.filter((p) => selectedTags.includes(p.tagNumber));
    bulkMarkSubsidyClaims(
      selectedProgram.id,
      targetParcels,
      claimed,
      selectedProgram.defaultQuantity,
      claimed ? quickDateGiven || todayIso() : undefined,
      selectedProgram.category,
      selectedProgram.itemDescription || selectedProgram.title
    );
    showNotice(
      claimed
        ? `Marked ${targetParcels.length} riceland owner(s) as Claimed (${quickDateGiven || todayIso()}).`
        : `Reverted ${targetParcels.length} riceland owner(s) to Not Yet Claimed.`
    );
    setSelectedTags([]);
  };

  const handleExportCsv = () => {
    if (viewMode === 'history') {
      const headers = [
        'No.',
        'Date Given',
        'Give-away Type',
        'Item Given',
        'Quantity',
        'Riceland Owner',
        'RSBSA No.',
        'Parcel ID',
        'Barangay',
        'Program / Batch',
        'Funding Agency',
        'Claim Slip / Voucher No.',
        'Received By',
        'Released By',
        'Remarks'
      ];
      const rows = filteredHistoryEntries.map((h, idx) =>
        [
          idx + 1,
          h.dateGiven,
          h.inputType,
          h.itemGiven,
          h.quantityGiven,
          h.ownerName,
          h.rsbsaNo,
          h.parcelTag,
          h.barangay,
          h.programTitle,
          h.fundingSource,
          h.slipOrVoucherNo || '',
          h.recipientName || 'Owner (Self)',
          h.releasedBy,
          h.remarks
        ]
          .map(csvCell)
          .join(',')
      );
      const csv = [headers.map(csvCell).join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `silago-previous-govt-giveaways-${todayIso()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!selectedProgram) return;
    const headers = [
      'No.',
      'Assistance Program',
      'Give-away Type',
      'Item Given',
      'Riceland Owner',
      'Contact No.',
      'RSBSA No.',
      'Parcel ID',
      'Barangay',
      'Area (ha)',
      'Claim Status',
      'Date Given',
      'Quantity Received',
      'Claim Slip / Voucher No.',
      'Received By',
      'Released By',
      'Remarks'
    ];
    const rows = filteredParcels.map((p, idx) => {
      const claim = selectedClaimMap.get(p.tagNumber);
      const areaHa = Number(p.areaHa || p.weightKg || 0).toFixed(2);
      return [
        idx + 1,
        selectedProgram.title,
        claim?.inputType || selectedProgram.category,
        claim?.itemGiven || selectedProgram.itemDescription,
        p.raiserName,
        p.contactNumber || '',
        p.swineNameOrId || '',
        p.tagNumber,
        p.barangay,
        areaHa,
        claim?.claimed ? 'Already Claimed' : 'Not Yet Claimed',
        claim?.claimed ? claim.claimedAt : '',
        claim?.claimed ? claim.quantityReceived : '',
        claim?.claimed ? claim.slipOrVoucherNo || '' : '',
        claim?.claimed ? claim.recipientName || 'Owner (Self)' : '',
        claim?.claimed ? claim.releasedBy : '',
        claim?.remarks || ''
      ]
        .map(csvCell)
        .join(',');
    });
    const csv = [headers.map(csvCell).join(','), ...rows].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `silago-subsidy-claims-${selectedProgram.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${todayIso()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedOwnerHistory = useMemo(() => {
    if (!historyOwnerParcel) return [];
    return historyByParcel.get(historyOwnerParcel.tagNumber) || [];
  }, [historyOwnerParcel, historyByParcel]);

  return (
    <div className="space-y-4 pb-20">
      {notice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md px-4 py-2.5 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* OFFICIAL LEDGER TOP BAR & WORKFLOW STEPPER */}
      <div className="bg-white border border-gov-line border-t-2 border-t-gov-forest rounded overflow-hidden">
        <div className="bg-gov-canvas/70 border-b border-gov-line px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-gov-ink">
            <FileText className="w-4 h-4 text-gov-forest shrink-0" />
            <span className="font-serif text-sm">Official MAO Distribution Ledger (Talaan)</span>
          </div>
          <div className="text-[11px] text-gov-muted flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-semibold text-gov-green">Office Flow:</span>
            <span>1. Select Batch</span>
            <span className="text-gov-muted/60">&rarr;</span>
            <span>2. Confirm Date Given</span>
            <span className="text-gov-muted/60">&rarr;</span>
            <span>3. Mark Claimed / Print Talaan</span>
          </div>
        </div>

        <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setViewMode('checklist')}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'checklist'
                  ? 'bg-gov-forest text-white border-gov-forest-dark'
                  : 'bg-white text-gov-ink border-gov-line-strong hover:bg-gov-canvas'
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>1. Distribution Talaan (Current)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`px-3 py-1.5 rounded text-xs font-semibold border transition inline-flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'history'
                  ? 'bg-gov-forest text-white border-gov-forest-dark'
                  : 'bg-white text-gov-ink border-gov-line-strong hover:bg-gov-canvas'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>2. Previous Gov&apos;t Give-aways Log</span>
              <span
                className={`px-1.5 py-0.5 rounded-sm text-[10px] font-bold tabular-nums ${
                  viewMode === 'history'
                    ? 'bg-white/20 text-white'
                    : 'bg-gov-canvas text-gov-ink'
                }`}
              >
                {unifiedHistoryEntries.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setPrintModalOpen(true)}
              className="gov-btn gov-btn-secondary"
            >
              <Printer className="w-3.5 h-3.5 text-gov-green" />
              <span>Print Official Talaan</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="gov-btn gov-btn-secondary"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => openLogPreviousGiveaway()}
              className="gov-btn gov-btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Previous Give-away</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'checklist' ? (
        <>
          {/* STEP 1. SELECT GOVERNMENT SEEDLING / FERTILIZER PROGRAM BATCH */}
          <OfficePanel
            title="Step 1 — Select Government Seedlings / Fertilizer Program Batch"
            subtitle="Choose the distribution batch below to view eligible riceland owners and mark claims."
            rightContent={
              permissions.isCentralAdmin ? (
                <button
                  type="button"
                  onClick={openCreateProgram}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Seedlings / Fertilizer Program</span>
                </button>
              ) : undefined
            }
          >
            {subsidyPrograms.length > 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {subsidyPrograms.map((program) => {
                    const isSelected = selectedProgram?.id === program.id;
                    const claimedInProg = subsidyClaims.filter(
                      (c) => c.programId === program.id && c.claimed
                    ).length;

                    return (
                      <button
                        key={program.id}
                        type="button"
                        onClick={() => {
                          setSelectedProgramId(program.id);
                          setSelectedTags([]);
                          setConfirmDeleteProgramId(null);
                        }}
                        className={`px-3 py-2 rounded-md border text-left transition cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-700 ring-1 ring-emerald-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border shrink-0 ${
                            CATEGORY_BADGE_STYLES[program.category]
                          }`}
                        >
                          {program.category}
                        </span>
                        <span className="text-xs font-semibold text-slate-900">{program.title}</span>
                        <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                          ({claimedInProg} claimed)
                        </span>
                      </button>
                    );
                  })}
                </div>

                {selectedProgram && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md px-3.5 py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${
                            PROGRAM_STATUS_STYLES[selectedProgram.status]
                          }`}
                        >
                          {selectedProgram.status}
                        </span>
                        <span className="font-bold text-slate-900">{selectedProgram.itemDescription}</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
                        <span>Give-away Type: <strong>{selectedProgram.category}</strong></span>
                        <span>Source: <strong>{selectedProgram.fundingSource}</strong></span>
                        <span>Season: <strong>{selectedProgram.season}</strong></span>
                        <span>Target: <strong>{selectedProgram.targetBarangay}</strong></span>
                        <span>Allocation Rate: <strong>{selectedProgram.defaultQuantity}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-700 rounded-full transition-all"
                            style={{ width: `${stats.coveragePct}%` }}
                          />
                        </div>
                        <span className="text-[10.5px] font-semibold text-slate-600 tabular-nums">
                          {stats.claimedCount} / {stats.eligibleCount} claimed ({stats.coveragePct}%)
                        </span>
                      </div>
                    </div>

                    {permissions.isCentralAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditProgram(selectedProgram)}
                          className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>Edit</span>
                        </button>

                        {subsidyPrograms.length > 1 && (
                          confirmDeleteProgramId === selectedProgram.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteSubsidyProgram(selectedProgram.id);
                                  setConfirmDeleteProgramId(null);
                                  showNotice(`Removed "${selectedProgram.title}".`);
                                }}
                                className="px-2.5 py-1 rounded-md bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                Confirm Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProgramId(null)}
                                className="px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-600 text-[11px] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteProgramId(selectedProgram.id)}
                              className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Delete</span>
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                No subsidy programs configured yet. Click &ldquo;Add Seedlings / Fertilizer Program&rdquo; to create one.
              </p>
            )}
          </OfficePanel>

          {/* BATCH SUMMARY KPI STRIP */}
          <OfficeKpiStrip items={kpiItems} />

          {/* STEP 2. OFFICIAL RICELAND OWNER DISTRIBUTION TALAAN */}
          <OfficePanel
            title={
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">Distribution Talaan (Seed &amp; Fertilizer Ledger)</span>
                {isLftUser && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-semibold">
                    <span>Field Officer Sector:</span>
                    <span className="font-bold">{assignedBrgys?.join(', ')}</span>
                  </span>
                )}
              </div>
            }
            subtitle={
              selectedProgram
                ? `Showing ${filteredParcels.length} ${
                    isLftUser && barangayFilter === 'ASSIGNED' ? 'sector farmer-beneficiaries' : 'registered riceland owner(s)'
                  } for "${selectedProgram.title}"`
                : 'Select a program above'
            }
            noPadding
            rightContent={
              <div className="flex items-center gap-1 flex-wrap">
                {(['all', 'pending', 'claimed'] as ClaimStatusFilter[]).map((mode) => {
                  const label =
                    mode === 'all'
                      ? 'All Owners'
                      : mode === 'pending'
                      ? `Pending (${stats.pendingCount})`
                      : `Claimed (${stats.claimedCount})`;
                  const active = statusFilter === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setStatusFilter(mode)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-emerald-800 text-white border-emerald-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            }
          >
            {/* Filter Bar + Date Given Selector + Quick Bulk Helpers */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 flex-wrap">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search owner, RSBSA, contact, or slip #..."
                    className={`${OFFICE_INPUT_CLASS} pl-9`}
                  />
                </div>

                <div className="w-full sm:w-56">
                  <select
                    value={barangayFilter}
                    onChange={(e) => setBarangayFilter(e.target.value)}
                    className={OFFICE_SELECT_CLASS}
                    aria-label="Filter by barangay"
                  >
                    {isLftUser ? (
                      <>
                        <option value="ASSIGNED">
                          My Assigned Sector ({assignedBrgys?.length || 0} Barangays)
                        </option>
                        <optgroup label="My Assigned Barangays">
                          {assignedBrgys?.map((b) => (
                            <option key={b} value={b}>
                              Brgy. {b}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Municipal Overview">
                          <option value="All">All 15 Silago Barangays (Read-Only Outside)</option>
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <option value="All">All 15 Silago Barangays</option>
                        {BARANGAYS.map((b) => (
                          <option key={b.name} value={b.name}>
                            Brgy. {b.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-md px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <label htmlFor="quick-date-given" className="text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                    Date Given:
                  </label>
                  <input
                    id="quick-date-given"
                    type="date"
                    value={quickDateGiven}
                    onChange={(e) => setQuickDateGiven(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-900 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {selectedTags.length > 0 ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-1.5 shrink-0">
                  <span className="text-[11px] font-bold text-emerald-900">
                    {selectedTags.length} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => handleBulkAction(true)}
                    className="px-2.5 py-1 rounded-sm bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    Mark Claimed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction(false)}
                    className="px-2.5 py-1 rounded-sm border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold cursor-pointer"
                  >
                    Mark Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTags([])}
                    className="text-[11px] text-slate-600 hover:text-slate-900 underline cursor-pointer ml-1"
                  >
                    Clear
                  </button>
                </div>
              ) : authorizedPendingTags.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setSelectedTags(authorizedPendingTags)}
                  className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer"
                >
                  Select All Pending ({authorizedPendingTags.length})
                </button>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 pl-3 pr-1 w-8">
                      <input
                        type="checkbox"
                        checked={allAuthorizedSelected}
                        onChange={toggleSelectAll}
                        aria-label="Select all authorized owners"
                        className="rounded border-slate-300 accent-emerald-700 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-1.5 w-9 text-center">No.</th>
                    <th className="py-2.5 px-2.5">Riceland Owner &amp; Farm Parcel</th>
                    <th className="py-2.5 px-2.5">Previous Gov&apos;t Aid</th>
                    <th className="py-2.5 px-2.5">Release Status (Type &amp; Date)</th>
                    <th className="py-2.5 pl-2 pr-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {filteredParcels.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500">
                        No registered riceland owners match your current search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredParcels.map((parcel, index) => {
                      const claim = selectedClaimMap.get(parcel.tagNumber);
                      const isClaimed = Boolean(claim?.claimed);
                      const canEditRow = isUserAuthorizedForBarangay(currentUser, parcel.barangay);
                      const areaHa = Number(parcel.areaHa || parcel.weightKg || 0);
                      const ownerHistory = historyByParcel.get(parcel.tagNumber) || [];
                      const claimType = claim?.inputType || selectedProgram?.category || 'Seedlings / Seeds';
                      const suggestedQty = selectedProgram
                        ? computeSuggestedQuantity(selectedProgram.defaultQuantity, areaHa)
                        : '1 unit';

                      return (
                        <tr
                          key={parcel.tagNumber}
                          className={isClaimed ? 'bg-emerald-50/25 hover:bg-emerald-50/50' : 'hover:bg-slate-50'}
                        >
                          <td className="py-2.5 pl-3 pr-1 align-top">
                            <input
                              type="checkbox"
                              disabled={!canEditRow}
                              checked={selectedTags.includes(parcel.tagNumber)}
                              onChange={() => toggleSelectRow(parcel.tagNumber)}
                              aria-label={`Select ${parcel.raiserName}`}
                              className="mt-0.5 rounded border-slate-300 accent-emerald-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            />
                          </td>

                          <td className="py-2.5 px-1.5 align-top text-center font-mono text-[11px] font-bold text-slate-500 tabular-nums">
                            {index + 1}
                          </td>

                          <td className="py-2.5 px-2.5 align-top">
                            <div className="font-bold text-slate-900 leading-snug">{parcel.raiserName}</div>
                            <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                              Brgy. {parcel.barangay} &bull; {areaHa.toFixed(2)} ha
                              {parcel.variety || parcel.breed ? ` • ${parcel.variety || parcel.breed}` : ''}
                            </div>
                            <div className="text-[10.5px] text-slate-500 mt-0.5 font-mono flex flex-wrap items-center gap-x-2">
                              <span>RSBSA: {parcel.swineNameOrId || 'Unrecorded'}</span>
                              {parcel.contactNumber && (
                                <span className="inline-flex items-center gap-0.5 font-sans text-slate-600">
                                  <Phone className="w-2.5 h-2.5" />
                                  {parcel.contactNumber}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-2.5 align-top">
                            <div className="space-y-1">
                              {ownerHistory.length === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => setHistoryOwnerParcel(parcel)}
                                  className="inline-flex items-center gap-1 text-[10.5px] font-medium text-slate-400 hover:text-emerald-700 hover:underline cursor-pointer"
                                >
                                  <History className="w-3 h-3 text-slate-400" />
                                  <span>No prior aid</span>
                                </button>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex flex-wrap gap-1">
                                    {ownerHistory.slice(0, 2).map((entry) => (
                                      <span
                                        key={entry.id}
                                        title={`${entry.itemGiven} (${entry.quantityGiven}) • Given: ${entry.dateGiven} • ${entry.programTitle}`}
                                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm border text-[10px] font-semibold ${
                                          CATEGORY_BADGE_STYLES[entry.inputType]
                                        }`}
                                      >
                                        <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                        <span>{entry.inputType === 'Seedlings / Seeds' ? 'Seeds' : entry.inputType}</span>
                                        {entry.dateGiven && (
                                          <span className="opacity-80 font-mono">{entry.dateGiven}</span>
                                        )}
                                      </span>
                                    ))}
                                    {ownerHistory.length > 2 && (
                                      <span className="text-[10px] font-semibold text-slate-600 px-1 py-0.5">
                                        +{ownerHistory.length - 2} more
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setHistoryOwnerParcel(parcel)}
                                    className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-800 hover:text-emerald-950 hover:underline cursor-pointer"
                                  >
                                    <History className="w-3 h-3" />
                                    <span>History ({ownerHistory.length})</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-2.5 px-2.5 align-top">
                            {isClaimed ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide">
                                    <PackageCheck className="w-2.5 h-2.5" />
                                    <span>Claimed</span>
                                  </span>
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border text-[10px] font-bold ${
                                      CATEGORY_BADGE_STYLES[claimType]
                                    }`}
                                  >
                                    {claimType}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-700">
                                  <span className="font-semibold">Date:</span>{' '}
                                  <span className="font-mono font-semibold text-slate-900">
                                    {claim?.claimedAt || 'Recorded'}
                                  </span>
                                  {claim?.quantityReceived && (
                                    <span> &bull; {claim.quantityReceived}</span>
                                  )}
                                </div>
                                {(claim?.slipOrVoucherNo ||
                                  (claim?.recipientName && claim.recipientName !== 'Owner (Self)')) && (
                                  <div className="text-[10.5px] text-slate-500">
                                    {claim?.slipOrVoucherNo ? `Slip #${claim.slipOrVoucherNo}` : ''}
                                    {claim?.slipOrVoucherNo &&
                                    claim?.recipientName &&
                                    claim.recipientName !== 'Owner (Self)'
                                      ? ' • '
                                      : ''}
                                    {claim?.recipientName && claim.recipientName !== 'Owner (Self)'
                                      ? `Rcvd by: ${claim.recipientName}`
                                      : ''}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold uppercase tracking-wide">
                                  <Clock className="w-2.5 h-2.5" />
                                  <span>Pending</span>
                                </span>
                                <span className="block text-[10.5px] text-slate-500">
                                  {claimType} &bull; Est: {suggestedQty}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 pl-2 pr-3 align-top text-right whitespace-nowrap w-[1%]">
                            {!canEditRow ? (
                              <span className="text-[10px] font-medium text-slate-400 italic">
                                Outside Assigned Sector
                              </span>
                            ) : isClaimed ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openClaimDetailsModal(parcel)}
                                  className="px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickMark(parcel, false)}
                                  className="px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Undo</span>
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickMark(parcel, true)}
                                  className="px-2.5 py-1 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3 h-3 stroke-[2.5]" />
                                  <span>Mark Claimed</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openClaimDetailsModal(parcel)}
                                  title="Set give-away type (Seeds/Fertilizer), Date Given, voucher #, or recipient"
                                  className="px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold cursor-pointer"
                                >
                                  Details
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </OfficePanel>
        </>
      ) : (
        /* PREVIOUS GOVERNMENT GIVE-AWAYS HISTORY TAB */
        <>
          <OfficeKpiStrip items={kpiItems} />

          <OfficePanel
            title="Previous Government Seedlings & Fertilizer Give-aways Ledger"
            subtitle={`Complete chronological record of ${filteredHistoryEntries.length} of ${unifiedHistoryEntries.length} government assistance releases across registered riceland owners.`}
            noPadding
            rightContent={
              <button
                type="button"
                onClick={() => openLogPreviousGiveaway()}
                className="px-3 py-1 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Record Previous Give-away</span>
              </button>
            }
          >
            {/* History Filters */}
            <div className="px-4 py-3 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search owner, item (seeds/urea), slip #, or barangay..."
                    className={`${OFFICE_INPUT_CLASS} pl-9`}
                  />
                </div>

                <div className="w-full sm:w-44">
                  <select
                    value={historyTypeFilter}
                    onChange={(e) => setHistoryTypeFilter(e.target.value as 'All' | SubsidyCategory)}
                    className={OFFICE_SELECT_CLASS}
                    aria-label="Filter by give-away type"
                  >
                    <option value="All">All Input Types</option>
                    {SUBSIDY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full sm:w-56">
                  <select
                    value={barangayFilter}
                    onChange={(e) => setBarangayFilter(e.target.value)}
                    className={OFFICE_SELECT_CLASS}
                    aria-label="Filter history by barangay"
                  >
                    {isLftUser ? (
                      <>
                        <option value="ASSIGNED">
                          My Assigned Sector ({assignedBrgys?.length || 0} Barangays)
                        </option>
                        <optgroup label="My Assigned Barangays">
                          {assignedBrgys?.map((b) => (
                            <option key={b} value={b}>
                              Brgy. {b}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Municipal Overview">
                          <option value="All">All 15 Silago Barangays (Read-Only Outside)</option>
                        </optgroup>
                      </>
                    ) : (
                      <>
                        <option value="All">All 15 Silago Barangays</option>
                        {BARANGAYS.map((b) => (
                          <option key={b.name} value={b.name}>
                            Brgy. {b.name}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <th className="py-2.5 pl-3 pr-1.5 w-9 text-center">No.</th>
                    <th className="py-2.5 px-2.5">Date Given</th>
                    <th className="py-2.5 px-2.5">Riceland Owner / RSBSA</th>
                    <th className="py-2.5 px-2.5">Give-away Type</th>
                    <th className="py-2.5 px-2.5">Item &amp; Government Program</th>
                    <th className="py-2.5 px-2.5">Qty / Slip #</th>
                    <th className="py-2.5 px-2.5">Released / Received By</th>
                    <th className="py-2.5 pl-2 pr-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs bg-white">
                  {filteredHistoryEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-500">
                        No previous government give-aways recorded yet. Mark claims in the Distribution Talaan or click &ldquo;Record Previous Give-away&rdquo;.
                      </td>
                    </tr>
                  ) : (
                    filteredHistoryEntries.map((entry, idx) => {
                      const canDelete = permissions.isCentralAdmin;
                      return (
                        <tr key={entry.id} className="hover:bg-slate-50">
                          <td className="py-2.5 pl-3 pr-1.5 align-top text-center font-mono text-[11px] font-bold text-slate-500 tabular-nums">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-2.5 align-top font-mono font-bold text-slate-900 whitespace-nowrap">
                            {entry.dateGiven || '—'}
                          </td>
                          <td className="py-2.5 px-2.5 align-top">
                            <div className="font-bold text-slate-900">{entry.ownerName}</div>
                            <div className="text-[11px] text-slate-500">
                              Brgy. {entry.barangay} &bull; RSBSA: {entry.rsbsaNo || 'Unrecorded'}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 align-top">
                            <span
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-sm border text-[10px] font-bold ${
                                CATEGORY_BADGE_STYLES[entry.inputType]
                              }`}
                            >
                              {entry.inputType}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 align-top">
                            <div className="font-semibold text-slate-900">{entry.itemGiven}</div>
                            <div className="text-[11px] text-slate-500">
                              {entry.programTitle} &bull; {entry.fundingSource}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 align-top font-semibold text-slate-800 whitespace-nowrap">
                            <div>{entry.quantityGiven}</div>
                            {entry.slipOrVoucherNo && (
                              <div className="text-[10.5px] font-mono text-slate-500">
                                Slip #{entry.slipOrVoucherNo}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-2.5 align-top text-[11px] text-slate-600">
                            <div>{entry.releasedBy}</div>
                            {entry.recipientName && entry.recipientName !== 'Owner (Self)' && (
                              <div className="text-slate-700">Rcvd: {entry.recipientName}</div>
                            )}
                            {entry.remarks && <div className="text-slate-500">{entry.remarks}</div>}
                          </td>
                          <td className="py-2.5 pl-2 pr-3 align-top text-right whitespace-nowrap w-[1%]">
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => {
                                  deleteSubsidyHistoryEntry(entry.id);
                                  showNotice('Removed entry from give-away history.');
                                }}
                                className="px-2 py-1 rounded-md border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </OfficePanel>
        </>
      )}

      {/* MODAL: ADD / EDIT GOVERNMENT SEEDLINGS & FERTILIZER PROGRAM */}
      {programModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-md w-full max-w-lg overflow-hidden shadow-xl">
            <OfficeModalHeader
              title={
                programDraft.id
                  ? 'Edit Government Assistance Program'
                  : 'Add Government Seedlings / Fertilizer Program'
              }
              subtitle="Register a government distribution batch for riceland owner claim tracking"
              onClose={() => setProgramModalOpen(false)}
            />
            <form onSubmit={handleSaveProgram} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className={OFFICE_LABEL_CLASS}>Program / Assistance Title *</label>
                <input
                  type="text"
                  required
                  value={programDraft.title}
                  onChange={(e) => setProgramDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Free Certified Palay Seedlings Batch 2"
                  className={`${OFFICE_INPUT_CLASS} mt-1`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Give-away Type (Seeds / Fertilizer) *</label>
                  <select
                    value={programDraft.category}
                    onChange={(e) =>
                      setProgramDraft((p) => ({ ...p, category: e.target.value as SubsidyCategory }))
                    }
                    className={`${OFFICE_SELECT_CLASS} mt-1`}
                  >
                    {SUBSIDY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={OFFICE_LABEL_CLASS}>Default Quantity / Allocation *</label>
                  <input
                    type="text"
                    required
                    value={programDraft.defaultQuantity}
                    onChange={(e) =>
                      setProgramDraft((p) => ({ ...p, defaultQuantity: e.target.value }))
                    }
                    placeholder="e.g. 2 bags / ha"
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
              </div>

              <div>
                <label className={OFFICE_LABEL_CLASS}>Item Description / Variety or Fertilizer Grade</label>
                <input
                  type="text"
                  value={programDraft.itemDescription}
                  onChange={(e) =>
                    setProgramDraft((p) => ({ ...p, itemDescription: e.target.value }))
                  }
                  placeholder="e.g. NSIC Rc 222 Seeds (20kg) or Complete 14-14-14 Fertilizer"
                  className={`${OFFICE_INPUT_CLASS} mt-1`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Government Funding Agency</label>
                  <input
                    type="text"
                    value={programDraft.fundingSource}
                    onChange={(e) =>
                      setProgramDraft((p) => ({ ...p, fundingSource: e.target.value }))
                    }
                    placeholder="e.g. DA-RFO VIII / RCEF / LGU-Silago"
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>

                <div>
                  <label className={OFFICE_LABEL_CLASS}>Cropping Season</label>
                  <select
                    value={programDraft.season}
                    onChange={(e) => setProgramDraft((p) => ({ ...p, season: e.target.value }))}
                    className={`${OFFICE_SELECT_CLASS} mt-1`}
                  >
                    {seasons.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Target Barangay</label>
                  <select
                    value={programDraft.targetBarangay}
                    onChange={(e) =>
                      setProgramDraft((p) => ({ ...p, targetBarangay: e.target.value }))
                    }
                    className={`${OFFICE_SELECT_CLASS} mt-1`}
                  >
                    <option value="All Barangays">All Barangays</option>
                    {BARANGAYS.map((b) => (
                      <option key={b.name} value={b.name}>
                        Brgy. {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={OFFICE_LABEL_CLASS}>Release Date</label>
                  <input
                    type="date"
                    value={programDraft.distributionDate}
                    onChange={(e) =>
                      setProgramDraft((p) => ({ ...p, distributionDate: e.target.value }))
                    }
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>

                <div>
                  <label className={OFFICE_LABEL_CLASS}>Program Status</label>
                  <select
                    value={programDraft.status}
                    onChange={(e) =>
                      setProgramDraft((p) => ({
                        ...p,
                        status: e.target.value as GovernmentSubsidyProgram['status']
                      }))
                    }
                    className={`${OFFICE_SELECT_CLASS} mt-1`}
                  >
                    <option value="Active">Active</option>
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProgramModalOpen(false)}
                  className="px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold cursor-pointer"
                >
                  {programDraft.id ? 'Save Changes' : 'Create Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD / EDIT OWNER CLAIM DETAILS (TYPE, DATE GIVEN, VOUCHER, RECIPIENT) */}
      {claimModal && selectedProgram && (() => {
        const modalAreaHa = Number(claimModal.parcel.areaHa || claimModal.parcel.weightKg || 0);
        const modalSuggested = computeSuggestedQuantity(selectedProgram.defaultQuantity, modalAreaHa);
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border border-slate-300 rounded-md w-full max-w-xl overflow-hidden shadow-xl my-auto">
              <OfficeModalHeader
                title="Record Assistance Release / Claim"
                subtitle={`${claimModal.parcel.raiserName} • Brgy. ${claimModal.parcel.barangay}`}
                onClose={() => setClaimModal(null)}
              />
              <form onSubmit={handleSaveClaimModal} className="p-5 space-y-3.5 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Selected Government Program
                    </span>
                    <span className="text-[10.5px] font-semibold text-emerald-800">
                      Area: {modalAreaHa.toFixed(2)} ha &bull; Suggested: {modalSuggested}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 mt-0.5">{selectedProgram.title}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5 flex flex-wrap gap-x-2">
                    <span>Parcel: {claimModal.parcel.tagNumber}</span>
                    <span>&bull; RSBSA: {claimModal.parcel.swineNameOrId || 'Unrecorded'}</span>
                    {claimModal.parcel.contactNumber && (
                      <span>&bull; Tel: {claimModal.parcel.contactNumber}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border border-slate-200 rounded-md p-3">
                  <div>
                    <span className="font-bold text-slate-800 block">Claim Status</span>
                    <span className="text-[11px] text-slate-500">
                      Mark whether the riceland owner has already received this input
                    </span>
                  </div>
                  <select
                    value={claimModal.claimed ? 'claimed' : 'pending'}
                    onChange={(e) =>
                      setClaimModal((prev) =>
                        prev ? { ...prev, claimed: e.target.value === 'claimed' } : null
                      )
                    }
                    className="px-2.5 py-1.5 border border-slate-300 rounded-md font-semibold text-xs text-slate-900 bg-white"
                  >
                    <option value="claimed">Already Claimed</option>
                    <option value="pending">Not Yet Claimed</option>
                  </select>
                </div>

                {claimModal.claimed && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={OFFICE_LABEL_CLASS}>Give-away Type (Seeds / Fertilizer) *</label>
                        <select
                          value={claimModal.inputType}
                          onChange={(e) =>
                            setClaimModal((prev) =>
                              prev ? { ...prev, inputType: e.target.value as SubsidyCategory } : null
                            )
                          }
                          className={`${OFFICE_SELECT_CLASS} mt-1`}
                        >
                          {SUBSIDY_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={OFFICE_LABEL_CLASS}>Date Given *</label>
                        <input
                          type="date"
                          required
                          value={claimModal.claimedAt}
                          onChange={(e) =>
                            setClaimModal((prev) =>
                              prev ? { ...prev, claimedAt: e.target.value } : null
                            )
                          }
                          className={`${OFFICE_INPUT_CLASS} mt-1`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={OFFICE_LABEL_CLASS}>Specific Seed Variety / Fertilizer Grade Given</label>
                      <input
                        type="text"
                        value={claimModal.itemGiven}
                        onChange={(e) =>
                          setClaimModal((prev) =>
                            prev ? { ...prev, itemGiven: e.target.value } : null
                          )
                        }
                        placeholder="e.g. NSIC Rc 222 Certified Seeds or Urea 46-0-0"
                        className={`${OFFICE_INPUT_CLASS} mt-1`}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label className={OFFICE_LABEL_CLASS}>Quantity Received</label>
                        <span className="text-[10px] text-slate-500">One-click quick fill:</span>
                      </div>
                      <input
                        type="text"
                        value={claimModal.quantityReceived}
                        onChange={(e) =>
                          setClaimModal((prev) =>
                            prev ? { ...prev, quantityReceived: e.target.value } : null
                          )
                        }
                        placeholder="e.g. 2 bags (40 kg)"
                        className={`${OFFICE_INPUT_CLASS} mt-1`}
                      />
                      <QuickQuantityChips
                        value={claimModal.quantityReceived}
                        suggested={
                          modalSuggested !== selectedProgram.defaultQuantity
                            ? modalSuggested
                            : undefined
                        }
                        onSelect={(qty) =>
                          setClaimModal((prev) =>
                            prev ? { ...prev, quantityReceived: qty } : null
                          )
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={OFFICE_LABEL_CLASS}>Claim Slip / RSBSA Voucher No.</label>
                        <input
                          type="text"
                          value={claimModal.slipOrVoucherNo}
                          onChange={(e) =>
                            setClaimModal((prev) =>
                              prev ? { ...prev, slipOrVoucherNo: e.target.value } : null
                            )
                          }
                          placeholder="e.g. SLG-2026-0041"
                          className={`${OFFICE_INPUT_CLASS} mt-1`}
                        />
                      </div>
                      <div>
                        <label className={OFFICE_LABEL_CLASS}>Received By (Owner / Representative)</label>
                        <input
                          type="text"
                          value={claimModal.recipientName}
                          onChange={(e) =>
                            setClaimModal((prev) =>
                              prev ? { ...prev, recipientName: e.target.value } : null
                            )
                          }
                          placeholder="Owner (Self) or Spouse / Representative"
                          className={`${OFFICE_INPUT_CLASS} mt-1`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={OFFICE_LABEL_CLASS}>Released / Verified By (MAO Staff)</label>
                      <input
                        type="text"
                        value={claimModal.releasedBy}
                        onChange={(e) =>
                          setClaimModal((prev) =>
                            prev ? { ...prev, releasedBy: e.target.value } : null
                          )
                        }
                        className={`${OFFICE_INPUT_CLASS} mt-1`}
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className={OFFICE_LABEL_CLASS}>Remarks / Release Note</label>
                  <input
                    type="text"
                    value={claimModal.remarks}
                    onChange={(e) =>
                      setClaimModal((prev) => (prev ? { ...prev, remarks: e.target.value } : null))
                    }
                    placeholder="Optional (e.g. Verified RSBSA ID & signed distribution talaan)"
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setClaimModal(null)}
                    className="px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold cursor-pointer"
                  >
                    Save Claim Status
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL: VIEW ALL PREVIOUS GOV'T GIVE-AWAYS FOR ONE RICELAND OWNER */}
      {historyOwnerParcel && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-md w-full max-w-2xl overflow-hidden shadow-xl max-h-[85vh] flex flex-col">
            <OfficeModalHeader
              title="Previous Government Give-aways History"
              subtitle={`${historyOwnerParcel.raiserName} • Brgy. ${historyOwnerParcel.barangay} • RSBSA: ${historyOwnerParcel.swineNameOrId || 'Unrecorded'}`}
              onClose={() => setHistoryOwnerParcel(null)}
            />
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-700">
                  All Seedlings, Fertilizer &amp; Farm Inputs Given ({selectedOwnerHistory.length})
                </span>
                {isUserAuthorizedForBarangay(currentUser, historyOwnerParcel.barangay) && (
                  <button
                    type="button"
                    onClick={() => openLogPreviousGiveaway(historyOwnerParcel)}
                    className="px-3 py-1.5 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Previous / New Give-away</span>
                  </button>
                )}
              </div>

              {selectedOwnerHistory.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-300 rounded-md bg-slate-50 text-slate-500">
                  No previous government seedlings or fertilizer releases recorded for this riceland owner yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 border border-slate-200 rounded-md">
                  {selectedOwnerHistory.map((entry) => (
                    <div key={entry.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-sm border text-[10px] font-bold ${
                              CATEGORY_BADGE_STYLES[entry.inputType]
                            }`}
                          >
                            {entry.inputType}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            Date Given: {entry.dateGiven || '—'}
                          </span>
                          <span className="text-slate-600">&bull; {entry.quantityGiven}</span>
                          {entry.slipOrVoucherNo && (
                            <span className="font-mono text-[10.5px] text-slate-600">
                              &bull; Slip #{entry.slipOrVoucherNo}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900">{entry.itemGiven}</div>
                        <div className="text-[11px] text-slate-500">
                          Program: {entry.programTitle} ({entry.fundingSource}) &bull; Released by {entry.releasedBy}
                          {entry.recipientName && entry.recipientName !== 'Owner (Self)'
                            ? ` • Received by ${entry.recipientName}`
                            : ''}
                          {entry.remarks ? ` • ${entry.remarks}` : ''}
                        </div>
                      </div>

                      {permissions.isCentralAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            deleteSubsidyHistoryEntry(entry.id);
                            showNotice('Removed history record.');
                          }}
                          className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-rose-50 hover:border-rose-300 text-rose-700 text-[11px] font-semibold inline-flex items-center gap-1 self-start sm:self-center cursor-pointer shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryOwnerParcel(null)}
                className="px-4 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG PREVIOUS / EXTRA GOVERNMENT GIVE-AWAY */}
      {logGiveawayOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-300 rounded-md w-full max-w-xl overflow-hidden shadow-xl my-auto">
            <OfficeModalHeader
              title="Log Government Give-away (Previous or Extra)"
              subtitle="Record free seeds or fertilizer previously given by government to a riceland owner"
              onClose={() => setLogGiveawayOpen(false)}
            />
            <form onSubmit={handleSavePreviousGiveaway} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className={OFFICE_LABEL_CLASS}>Riceland Owner *</label>
                <select
                  required
                  value={logGiveawayDraft.parcelTag}
                  onChange={(e) =>
                    setLogGiveawayDraft((p) => ({ ...p, parcelTag: e.target.value }))
                  }
                  className={`${OFFICE_SELECT_CLASS} mt-1`}
                >
                  <option value="">-- Select Registered Riceland Owner --</option>
                  {activeParcels
                    .filter((p) => isUserAuthorizedForBarangay(currentUser, p.barangay))
                    .map((p) => (
                      <option key={p.tagNumber} value={p.tagNumber}>
                        {p.raiserName} • Brgy. {p.barangay} ({p.swineNameOrId || p.tagNumber})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Give-away Type (Fertilizer / Seeds) *</label>
                  <select
                    value={logGiveawayDraft.inputType}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({
                        ...p,
                        inputType: e.target.value as SubsidyCategory
                      }))
                    }
                    className={`${OFFICE_SELECT_CLASS} mt-1`}
                  >
                    {SUBSIDY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={OFFICE_LABEL_CLASS}>Date Given *</label>
                  <input
                    type="date"
                    required
                    value={logGiveawayDraft.dateGiven}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({ ...p, dateGiven: e.target.value }))
                    }
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
              </div>

              <div>
                <label className={OFFICE_LABEL_CLASS}>Item / Seed or Fertilizer Name *</label>
                <input
                  type="text"
                  required
                  value={logGiveawayDraft.itemGiven}
                  onChange={(e) =>
                    setLogGiveawayDraft((p) => ({ ...p, itemGiven: e.target.value }))
                  }
                  placeholder="e.g. Urea 46-0-0 / NSIC Rc 222"
                  className={`${OFFICE_INPUT_CLASS} mt-1`}
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-2">
                  <label className={OFFICE_LABEL_CLASS}>Quantity Given *</label>
                  <span className="text-[10px] text-slate-500">One-click quick fill:</span>
                </div>
                <input
                  type="text"
                  required
                  value={logGiveawayDraft.quantityGiven}
                  onChange={(e) =>
                    setLogGiveawayDraft((p) => ({ ...p, quantityGiven: e.target.value }))
                  }
                  placeholder="e.g. 2 bags"
                  className={`${OFFICE_INPUT_CLASS} mt-1`}
                />
                <QuickQuantityChips
                  value={logGiveawayDraft.quantityGiven}
                  onSelect={(qty) =>
                    setLogGiveawayDraft((p) => ({ ...p, quantityGiven: qty }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Program / Batch Title</label>
                  <input
                    type="text"
                    value={logGiveawayDraft.programTitle}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({ ...p, programTitle: e.target.value }))
                    }
                    placeholder="e.g. Dry Season 2026 Subsidy"
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Funding Agency / Source</label>
                  <input
                    type="text"
                    value={logGiveawayDraft.fundingSource}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({ ...p, fundingSource: e.target.value }))
                    }
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Claim Slip / Voucher No.</label>
                  <input
                    type="text"
                    value={logGiveawayDraft.slipOrVoucherNo}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({ ...p, slipOrVoucherNo: e.target.value }))
                    }
                    placeholder="Optional slip or voucher #"
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Received By (Owner / Representative)</label>
                  <input
                    type="text"
                    value={logGiveawayDraft.recipientName}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({ ...p, recipientName: e.target.value }))
                    }
                    placeholder="Owner (Self) or Representative"
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Released By</label>
                  <input
                    type="text"
                    value={logGiveawayDraft.releasedBy}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({ ...p, releasedBy: e.target.value }))
                    }
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
                <div>
                  <label className={OFFICE_LABEL_CLASS}>Remarks</label>
                  <input
                    type="text"
                    value={logGiveawayDraft.remarks}
                    onChange={(e) =>
                      setLogGiveawayDraft((p) => ({ ...p, remarks: e.target.value }))
                    }
                    placeholder="Optional note"
                    className={`${OFFICE_INPUT_CLASS} mt-1`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLogGiveawayOpen(false)}
                  className="px-3.5 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white font-semibold cursor-pointer"
                >
                  Save Previous Give-away
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINTABLE OFFICIAL LGU DISTRIBUTION TALAAN (LOGBOOK) MODAL */}
      {printModalOpen && (
        viewMode === 'checklist' ? (
          <SubsidyTalaanPrintModal
            mode="checklist"
            program={selectedProgram}
            parcels={filteredParcels}
            claimMap={selectedClaimMap}
            preparedBy={currentUser?.name || 'MAO Staff'}
            municipalityName={municipalBranding?.municipalityName}
            onClose={() => setPrintModalOpen(false)}
          />
        ) : (
          <SubsidyTalaanPrintModal
            mode="history"
            historyEntries={filteredHistoryEntries}
            preparedBy={currentUser?.name || 'MAO Staff'}
            municipalityName={municipalBranding?.municipalityName}
            onClose={() => setPrintModalOpen(false)}
          />
        )
      )}
    </div>
  );
};
