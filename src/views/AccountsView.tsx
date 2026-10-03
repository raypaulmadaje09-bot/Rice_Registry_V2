import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BARANGAYS,
  OFFICIAL_15_BARANGAYS,
  ASSIGNED_10_BARANGAYS,
  WELLA_ASSIGNED_BARANGAYS,
  BRANDO_ASSIGNED_BARANGAYS,
  matchBarangay
} from '../data/barangays';
import { LftAccount, isAccountActive } from '../types';
import { AdminProfileModal } from '../components/AdminProfileModal';
import {
  Users,
  ShieldCheck,
  Phone,
  Mail,
  Search,
  CheckCircle2,
  MapPin,
  Lock,
  Plus,
  Pencil,
  Trash2,
  X,
  AlertCircle,
  RotateCcw,
  UserCheck,
  Check,
  ExternalLink,
  Layers,
  Settings,
  Activity,
  Building2,
  BadgeCheck,
  IdCard,
  FileCheck2,
  BarChart3,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ChevronsDownUp,
  ChevronsUpDown,
  Image as ImageIcon,
  Upload,
  Loader2
} from 'lucide-react';
import { uploadFarmPhoto } from '../utils/supabaseClient';
import { SafeImage } from '../components/SafeImage';

export const AccountsView: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    parcels,
    lftAccounts,
    addLftAccount,
    updateLftAccount,
    deleteLftAccount,
    resetLftAccounts,
    adminProfile
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [officerFilter, setOfficerFilter] = useState<string>('ALL');
  const [matrixBarangaySearch, setMatrixBarangaySearch] = useState<string>('');

  // Minimize / Maximize state tracking (Set of collapsed account IDs)
  const [collapsedCardIds, setCollapsedCardIds] = useState<Set<string>>(new Set());

  // Modals & Panels
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminProfileModalOpen, setIsAdminProfileModalOpen] = useState(false);
  const [activityModalOfficer, setActivityModalOfficer] = useState<LftAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<LftAccount | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Quick Assign Barangay to LFT Officer Modal State
  const [assignModalData, setAssignModalData] = useState<{
    isOpen: boolean;
    barangay: string;
    displayBarangay: string;
    selectedOfficerId: string;
  } | null>(null);

  // Form state for Adding / Editing LFT Officer
  const [formData, setFormData] = useState({
    name: '',
    barangay: 'Salvacion, Laguna, Pd2, Pd1, Hingatungan',
    username: '',
    contactNumber: '',
    terrain: 'NIA Irrigated Lowland & River Basin Sector',
    areaHa: 25.0,
    status: 'Active / Certified',
    email: '',
    puroks: 22,
    photoUrl: ''
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleUploadOfficerPhoto = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const cleanUsername = (formData.username || formData.name || 'officer').replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicUrl = await uploadFarmPhoto(file, `lft_account_${cleanUsername}`);
      setFormData((prev) => ({ ...prev, photoUrl: publicUrl }));
      showToast('Officer photo uploaded to cloud storage.');
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setFormData((prev) => ({ ...prev, photoUrl: e.target?.result as string }));
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Toggle single card collapse/expand
  const toggleCardCollapse = (id: string) => {
    setCollapsedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Global Toggle All Cards
  const areAllCollapsed = useMemo(() => {
    if (lftAccounts.length === 0) return false;
    return lftAccounts.every((acc) => collapsedCardIds.has(acc.id));
  }, [lftAccounts, collapsedCardIds]);

  const handleToggleAllCards = () => {
    if (areAllCollapsed) {
      // Expand all
      setCollapsedCardIds(new Set());
    } else {
      // Collapse all
      setCollapsedCardIds(new Set(lftAccounts.map((a) => a.id)));
    }
  };

  // Format uniform display tag names for barangay chips
  const formatBarangayChipName = (rawName: string): string => {
    const trimmed = rawName.trim();
    const lower = trimmed.toLowerCase();
    if (lower === 'pd1' || lower === 'pob1' || lower === 'poblacion 1' || lower === 'poblacion district 1') return 'Poblacion District 1';
    if (lower === 'pd2' || lower === 'pob2' || lower === 'poblacion 2' || lower === 'poblacion district 2') return 'Poblacion District 2';
    if (lower === 'laguma') return 'Laguna';
    return trimmed;
  };

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      name: '',
      barangay: 'Salvacion, Laguna, Pd2, Pd1, Hingatungan',
      username: '',
      contactNumber: '0917-000-0000',
      terrain: 'NIA Irrigated Lowland & River Basin Sector',
      areaHa: 20.0,
      status: 'Active / Certified',
      email: '',
      puroks: 15,
      photoUrl: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: LftAccount) => {
    setEditingAccount(acc);
    setFormData({
      name: acc.name,
      barangay: acc.barangay,
      username: acc.username,
      contactNumber: acc.contactNumber,
      terrain: acc.terrain,
      areaHa: acc.areaHa,
      status: acc.status || 'Active / Certified',
      email: acc.email || `${acc.username.replace('@', '')}@silago-agriculture.gov.ph`,
      puroks: acc.puroks || 20,
      photoUrl: acc.photoUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenReassign = (acc: LftAccount) => {
    handleOpenEdit(acc);
  };

  const handleOpenAssignBarangay = (bName: string, currentAccount?: LftAccount) => {
    setAssignModalData({
      isOpen: true,
      barangay: bName,
      displayBarangay: formatBarangayChipName(bName),
      selectedOfficerId: currentAccount?.id || (lftAccounts[0]?.id || '')
    });
  };

  const handleAssignBarangayConfirm = (targetOfficerId: string, bName: string) => {
    if (!targetOfficerId) {
      // Unassign: remove this barangay from all officers
      lftAccounts.forEach((officer) => {
        const list = parseAssignedBarangays(officer.barangay);
        const hasB = list.some((item) => matchBarangay(item, bName) || matchBarangay(bName, item));
        if (hasB) {
          const nextList = list.filter((item) => !matchBarangay(item, bName) && !matchBarangay(bName, item));
          updateLftAccount(officer.id, {
            barangay: nextList.join(', '),
            assignedBarangays: nextList
          });
        }
      });
      setNotification(`Brgy. ${formatBarangayChipName(bName)} na-set na isip Unassigned LFT.`);
      setTimeout(() => setNotification(null), 4000);
      setAssignModalData(null);
      return;
    }

    const targetOfficer = lftAccounts.find((a) => a.id === targetOfficerId);
    if (!targetOfficer) return;

    // Remove bName from all other officers if present
    lftAccounts.forEach((other) => {
      if (other.id !== targetOfficerId) {
        const otherList = parseAssignedBarangays(other.barangay);
        const hasB = otherList.some((item) => matchBarangay(item, bName) || matchBarangay(bName, item));
        if (hasB) {
          const nextList = otherList.filter((item) => !matchBarangay(item, bName) && !matchBarangay(bName, item));
          updateLftAccount(other.id, {
            barangay: nextList.join(', '),
            assignedBarangays: nextList
          });
        }
      }
    });

    // Add bName to target officer if not already in list
    const currentList = parseAssignedBarangays(targetOfficer.barangay);
    const alreadyIn = currentList.some((item) => matchBarangay(item, bName) || matchBarangay(bName, item));
    const nextTargetList = alreadyIn ? currentList : [...currentList, bName];

    updateLftAccount(targetOfficer.id, {
      barangay: nextTargetList.join(', '),
      assignedBarangays: nextTargetList
    });

    setNotification(`Brgy. ${formatBarangayChipName(bName)} malampusong gi-assign kang ${targetOfficer.name}!`);
    setTimeout(() => setNotification(null), 4000);
    setAssignModalData(null);
  };

  const parseAssignedBarangays = (bStr: string): string[] => {
    if (!bStr) return [];
    return bStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const isBarangayAssigned = (bName: string, currentAssignedStr: string): boolean => {
    const list = parseAssignedBarangays(currentAssignedStr);
    return list.some((item) => matchBarangay(item, bName) || matchBarangay(bName, item));
  };

  const toggleAssignedBarangay = (bName: string) => {
    const list = parseAssignedBarangays(formData.barangay);
    const exists = list.some((item) => matchBarangay(item, bName) || matchBarangay(bName, item));
    let nextList: string[];
    if (exists) {
      nextList = list.filter((item) => !matchBarangay(item, bName) && !matchBarangay(bName, item));
    } else {
      nextList = [...list, bName];
    }
    setFormData((prev) => ({
      ...prev,
      barangay: nextList.join(', ')
    }));
  };

  const setAssignedBarangaysList = (names: readonly string[] | string[]) => {
    setFormData((prev) => ({
      ...prev,
      barangay: names.join(', ')
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please provide the LFT Officer Full Name.');
      return;
    }
    if (!formData.barangay.trim() || parseAssignedBarangays(formData.barangay).length === 0) {
      alert('Please check at least one specific barangay that this LFT officer serves.');
      return;
    }

    if (editingAccount) {
      updateLftAccount(editingAccount.id, {
        name: formData.name.trim(),
        barangay: formData.barangay,
        username: formData.username.trim(),
        contactNumber: formData.contactNumber.trim(),
        terrain: formData.terrain,
        areaHa: Number(formData.areaHa) || 0,
        status: formData.status,
        email: formData.email.trim(),
        puroks: Number(formData.puroks) || 20,
        photoUrl: formData.photoUrl.trim() || undefined
      });
      showToast(`Successfully updated account for ${formData.name.trim()}`);
    } else {
      addLftAccount({
        name: formData.name.trim(),
        barangay: formData.barangay,
        username: formData.username.trim() || `${formData.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.lft`,
        contactNumber: formData.contactNumber.trim() || '0917-000-0000',
        terrain: formData.terrain,
        areaHa: Number(formData.areaHa) || 0,
        status: formData.status,
        email: formData.email.trim(),
        puroks: Number(formData.puroks) || 20,
        photoUrl: formData.photoUrl.trim() || undefined
      });
      showToast(`Added new LFT account for ${formData.name.trim()}`);
    }

    setIsModalOpen(false);
    setEditingAccount(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingAccountId) return;
    const target = lftAccounts.find((a) => a.id === deletingAccountId);
    deleteLftAccount(deletingAccountId);
    setDeletingAccountId(null);
    showToast(`Deleted LFT account for ${target ? target.name : 'officer'}`);
  };

  // Helper to extract assigned barangay array for an officer
  const getOfficerBarangays = (officer: LftAccount): string[] => {
    if (officer.assignedBarangays && officer.assignedBarangays.length > 0) {
      return officer.assignedBarangays;
    }
    if (officer.name.toLowerCase().includes('wella')) {
      return ['Salvacion', 'Laguna', 'Poblacion District 1', 'Poblacion District 2', 'Sap-ang'];
    }
    if (officer.name.toLowerCase().includes('brando')) {
      return ['Mercedes', 'Katipunan', 'Puntana', 'Hingatungan', 'Balagawan'];
    }
    return officer.barangay.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const getOfficerId = (officer: LftAccount, idx: number): string => {
    if (officer.id && officer.id.startsWith('LFT-')) return officer.id;
    return `LFT-SLG-${String(idx + 1).padStart(3, '0')}`;
  };

  const getOfficerEmail = (officer: LftAccount): string => {
    if (officer.email && officer.email.includes('@')) return officer.email;
    const cleanUser = (officer.username || 'lft').replace('@', '').toLowerCase();
    return `${cleanUser}@silago-agriculture.gov.ph`;
  };

  const getOfficerDisplayName = (officer: LftAccount): string => {
    return officer.name || 'LFT Field Officer';
  };

  // Profile photo for officer
  const getOfficerPhotoUrl = (officer: LftAccount): string | undefined => {
    return officer.photoUrl || undefined;
  };

  const filteredAccounts = useMemo(() => {
    return lftAccounts.filter((acc) => {
      const matchSearch =
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.barangay.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.username.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      return true;
    });
  }, [lftAccounts, searchTerm]);

  const isCentralAdmin = currentUser?.role === 'Central Admin';

  // Coverage Matrix calculation across all 15 official barangays
  const matrixData = useMemo(() => {
    return OFFICIAL_15_BARANGAYS.map((bName, idx) => {
      const isCluster1 = WELLA_ASSIGNED_BARANGAYS.some(
        (w) => w.toLowerCase() === bName.toLowerCase()
      );
      const assignedAccount = lftAccounts.find((acc) =>
        (acc.assignedBarangays && acc.assignedBarangays.some((ab) => matchBarangay(ab, bName))) ||
        matchBarangay(acc.barangay, bName)
      );
      const officerName = assignedAccount ? assignedAccount.name : 'Unassigned LFT';
      const officerId = assignedAccount ? (assignedAccount.username || assignedAccount.id) : `LFT-${bName.toUpperCase()}`;
      const brgyParcels = parcels.filter((p) => matchBarangay(p.barangay, bName));
      const brgyArea = brgyParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
      const displayBarangay = formatBarangayChipName(bName);

      // RSBSA-audited count & mapped hectares
      const verifiedParcels = brgyParcels.filter(
        (p) =>
          (p as any).status === 'Verified' ||
          p.syncStatus === 'Live Synced' ||
          (p.swineNameOrId && p.swineNameOrId !== 'NO RSBSA' && p.lat && p.lng)
      );
      const verifiedCount = verifiedParcels.length;
      const verifiedArea = verifiedParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);

      // Compute dynamic audit progress based on RSBSA count & hectares (0% when no farmers registered)
      let progressPct = 0;
      if (brgyParcels.length > 0) {
        const countRatio = verifiedCount / brgyParcels.length;
        const areaRatio = brgyArea > 0 ? Math.min(1, verifiedArea / brgyArea) : countRatio;
        progressPct = Math.min(100, Math.round(((countRatio * 0.6) + (areaRatio * 0.4)) * 100));
        if (progressPct === 0 && verifiedCount > 0) {
          progressPct = Math.round((verifiedCount / brgyParcels.length) * 100);
        }
      } else {
        progressPct = 0;
      }

      return {
        no: idx + 1,
        rawName: bName,
        displayName: displayBarangay,
        officerName,
        officerId,
        assignedAccount,
        isCluster1,
        farmersCount: brgyParcels.length,
        areaHa: brgyArea,
        progressPct
      };
    }).filter((row) => {
        // Filter tabs: All 15 Barangays | Assigned | Unassigned
        if (officerFilter === 'ASSIGNED') {
          if (!row.assignedAccount || row.officerName === 'Unassigned LFT') return false;
        } else if (officerFilter === 'UNASSIGNED') {
          if (row.assignedAccount && row.officerName !== 'Unassigned LFT') return false;
        }

        if (matrixBarangaySearch.trim()) {
          const query = matrixBarangaySearch.toLowerCase();
          return (
            row.displayName.toLowerCase().includes(query) ||
            row.rawName.toLowerCase().includes(query) ||
            row.officerName.toLowerCase().includes(query)
          );
        }
        return true;
      });
  }, [parcels, lftAccounts, matrixBarangaySearch, officerFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* 1. CENTRAL ADMIN & COORDINATOR EXECUTIVE HEADER */}
      <div className="bg-[#0c2340]/95 backdrop-blur-md text-white rounded-3xl p-5 sm:p-7 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Officer Identity & Avatar */}
          <div className="flex items-start sm:items-center gap-4.5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-emerald-600 to-blue-700 text-white flex items-center justify-center font-serif font-black text-2xl shadow-lg border-2 border-white/30 overflow-hidden ring-4 ring-white/10">
                {adminProfile.photoUrl ? (
                  <img
                    src={adminProfile.photoUrl}
                    alt={adminProfile.name || 'Ray Paul Madaje'}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>RM</span>
                )}
              </div>
              <span
                className="absolute bottom-0 right-0 flex h-4 w-4"
                title="Active / On Duty"
              >
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0c2340]"></span>
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-400/30 tracking-wider">
                  MUNICIPAL LFT COORDINATOR
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  DA-MAO SILAGO
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                  <BadgeCheck className="w-3 h-3 text-emerald-400" />
                  Active / Certified
                </span>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-white tracking-tight">
                  {adminProfile.name || 'Ray Paul Madaje'}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  {adminProfile.title || 'Municipal Agriculturist / LFT Program Coordinator'}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  Silago Municipal Agriculture Office (DA-MAO)
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Full Administrative Authority
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsAdminProfileModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 border border-emerald-400/40 cursor-pointer active:scale-98"
            >
              <Settings className="w-4 h-4" />
              <span>Account &amp; Security Settings</span>
            </button>

            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-400 px-1">
              <span className="font-mono text-[11px] text-slate-300 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                Line: (053) 545-1200
              </span>
              <span className="text-slate-600 hidden sm:inline">&bull;</span>
              <span className="text-[11px] text-slate-300 font-mono hidden sm:inline">
                mao.silago@southernleyte.gov.ph
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. COMPACT LFT PERSONNEL CARDS SECTION */}
      <div className="space-y-4">
        {/* Controls Bar with Minimize All / Expand All Toggle */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                FIELD PERSONNEL ROSTER
              </span>
            </div>
            <h2 className="text-lg font-serif font-black text-slate-900 mt-1">
              Local Farmer Technicians (LFT) Officers
            </h2>
            <p className="text-xs text-slate-500">
              Assigned field extension officers supervising farmer RSBSA profiling, georeferenced audits, and municipal rice production.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search officer, barangay, or ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Global Minimize All / Expand All Toggle */}
            <button
              type="button"
              onClick={handleToggleAllCards}
              className={`px-3 py-1.5 border font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                areAllCollapsed
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
              title={areAllCollapsed ? 'Expand All Officer Cards' : 'Minimize All Officer Cards'}
            >
              {areAllCollapsed ? (
                <>
                  <ChevronsDownUp className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Expand All</span>
                </>
              ) : (
                <>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-slate-600" />
                  <span>Minimize All</span>
                </>
              )}
            </button>

            {/* Add Officer & Reset Buttons (Central Admin Only) */}
            {isCentralAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset roster to the two official assigned municipal LFT officers (Wella S. Bongon & Brando T. Tabugon)?')) {
                      resetLftAccounts();
                      showToast('Reset to official LFT officers (Wella S. Bongon & Brando T. Tabugon)');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  title="Reset to default official officers"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Reset Default</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Officer</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Compact LFT Officer Grid (2 or 3 Columns Responsive) */}
        {filteredAccounts.length === 0 ? (
          <div className="bg-slate-50/90 border-2 border-dashed border-slate-300 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-800">Walay nakit-ang LFT technician sa database.</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">No technician accounts found in database. Please click &quot;+ Add LFT Officer&quot; to enroll a new field technician.</p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add LFT Officer</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
            {filteredAccounts.map((lft, idx) => {
            const officerBrgys = getOfficerBarangays(lft);
            const officerId = getOfficerId(lft, idx);
            const officerEmail = getOfficerEmail(lft);
            const officerName = getOfficerDisplayName(lft);
            const photoUrl = getOfficerPhotoUrl(lft);
            const isCollapsed = collapsedCardIds.has(lft.id);
            const isLftActive = isAccountActive(lft.status);

            // Compute dynamic scope metrics from parcel data
            const assignedParcels = parcels.filter((p) =>
              officerBrgys.some((b) => matchBarangay(p.barangay, b))
            );
            const totalAssignedFarmers = assignedParcels.length;
            const totalMappedArea = assignedParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
            const isCurrentSession = currentUser?.name === lft.name || currentUser?.name === officerName;
            const isWella = lft.name.toLowerCase().includes('wella');

            return (
              <div
                key={lft.id}
                className={`bg-white/95 backdrop-blur-md rounded-2xl border transition-all duration-300 shadow-xs hover:shadow-md flex flex-col justify-between overflow-hidden ${
                  isCurrentSession
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* Header Row: Always visible */}
                <div className={`p-4 transition-all duration-300 ${isCollapsed ? 'bg-slate-50/60' : 'bg-white'}`}>
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left: Circular Photo & Identity */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Circular Profile Picture with Fallback Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-serif font-black text-sm text-white shadow-xs border-2 overflow-hidden ring-2 ring-white ${
                            isWella
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 border-emerald-400'
                              : 'bg-gradient-to-br from-blue-600 to-indigo-800 border-blue-400'
                          }`}
                        >
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={officerName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span>
                              {lft.name
                                .split(' ')
                                .filter(Boolean)
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join('')}
                            </span>
                          )}
                        </div>
                        {/* Active / Inactive Indicator Dot */}
                        <span
                          className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5"
                          title={isLftActive ? 'Active & Certified' : 'Inactive / Disabled'}
                        >
                          <span
                            className={`relative inline-flex rounded-full h-3.5 w-3.5 border-2 border-white ${
                              isLftActive ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></span>
                        </span>
                      </div>

                      {/* Name & Quick Metadata */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[9.5px] uppercase font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {officerId}
                          </span>
                          <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            {officerBrgys.length} Brgys
                          </span>
                          {isCurrentSession && (
                            <span className="text-[9px] uppercase font-black text-white bg-emerald-700 px-1.5 py-0.2 rounded shadow-2xs">
                              Active
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-serif font-bold text-slate-900 truncate mt-0.5">
                          {officerName}
                        </h3>
                        <p className="text-[11px] font-semibold text-emerald-800 truncate">
                          Local Farmer Technician
                        </p>
                      </div>
                    </div>

                    {/* Right: Quick Status Badge & Minimize/Maximize Toggle */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isLftActive ? (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <BadgeCheck className="w-3 h-3 text-emerald-600" />
                          <span>Active / Certified</span>
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>Disabled / Inactive</span>
                        </span>
                      )}

                      {/* Minimize / Maximize Toggle Button */}
                      <button
                        type="button"
                        onClick={() => toggleCardCollapse(lft.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer border border-transparent hover:border-slate-200"
                        title={isCollapsed ? 'Expand Details' : 'Minimize Card'}
                        aria-label={isCollapsed ? 'Expand' : 'Minimize'}
                      >
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-slate-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Maximized Expandable Content */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 space-y-3.5 border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                    {/* Contact info grid */}
                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                          Phone Number
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="font-mono font-bold text-slate-800 text-[11px]">
                            {lft.contactNumber || (isWella ? '0917-829-4501' : '0928-554-7123')}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">
                          Official Email
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-slate-700 text-[10.5px] truncate">
                            {officerEmail}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Barangays Chips */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-700" />
                          <span>Assigned Rice Barangays ({officerBrgys.length})</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleOpenReassign(lft)}
                          className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md transition flex items-center gap-0.5 cursor-pointer"
                          title="Reassign covered barangay territories"
                        >
                          <Plus className="w-2.5 h-2.5" />
                          <span>Reassign</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {officerBrgys.map((bName) => (
                          <span
                            key={bName}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white border border-slate-200 text-slate-800 shadow-2xs"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{formatBarangayChipName(bName)}</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Performance Summary Metrics */}
                    <div className="grid grid-cols-3 gap-1.5 pt-0.5 text-center">
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Farmers
                        </span>
                        <span className="text-xs font-bold font-mono text-slate-900">
                          {totalAssignedFarmers}
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Mapped Area
                        </span>
                        <span className="text-xs font-bold font-mono text-emerald-800">
                          {totalMappedArea.toFixed(1)} ha
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">
                          Submission
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center justify-center gap-0.5 mt-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          <span>Up-to-Date</span>
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons: Edit, View Activity, Quick Status Toggle (Governed by RBAC) */}
                    <div className="bg-slate-50/90 border-t border-slate-100 -mx-4 -mb-4 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap mt-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isCentralAdmin && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(lft)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                            title="Edit officer account details"
                          >
                            <Pencil className="w-3 h-3 text-slate-500" />
                            <span>Edit</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setActivityModalOfficer(lft)}
                          className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300/80 font-bold text-[11px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
                          title="View officer field audit activity"
                        >
                          <Activity className="w-3 h-3 text-emerald-600" />
                          <span>Activity</span>
                        </button>

                        {/* Quick Toggle Status (Central Admin only) */}
                        {isCentralAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus = isLftActive ? 'Disabled / Inactive' : 'Certified Field LFT (Active)';
                              updateLftAccount(lft.id, { status: newStatus });
                              showToast(`${officerName} account status set to: ${newStatus}`);
                            }}
                            className={`px-2 py-1 font-bold text-[10.5px] rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer border ${
                              isLftActive
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                            }`}
                            title={isLftActive ? 'Deactivate account login access' : 'Activate account login access'}
                          >
                            <span>{isLftActive ? 'Disable' : 'Activate'}</span>
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!isLftActive) {
                            alert('Account Inactive: Your account has been disabled or is pending activation by Central Admin.');
                            return;
                          }
                          setCurrentUser({
                            username: lft.username,
                            role: 'Barangay Focal Person',
                            name: officerName,
                            barangay: lft.barangay,
                            assignedBarangays: officerBrgys,
                            title: 'Local Farmer Technician - Rice Sector',
                            photoUrl
                          });
                          showToast(`Switched active municipal session to ${officerName}`);
                        }}
                        className={`px-3 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                          !isLftActive
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : isCurrentSession
                            ? 'bg-emerald-700 text-white ring-1 ring-emerald-600'
                            : 'bg-[#0c2340] hover:bg-slate-800 text-white'
                        }`}
                      >
                        <UserCheck className="w-3 h-3" />
                        <span>{isCurrentSession ? 'Active' : 'Switch/Login'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* 3. MUNICIPAL BARANGAY COVERAGE MATRIX */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                TERRITORIAL COVERAGE MATRIX
              </span>
            </div>
            <h3 className="font-serif font-black text-lg text-slate-900 mt-1">
              Municipal Rice Barangay Coverage Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Overview of all designated rice barangays, assigned extension technicians, verified RSBSA registrants, and surveyed land hectarage.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center border border-slate-300 rounded-xl p-0.5 bg-slate-100 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOfficerFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  officerFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All 15 Barangays
              </button>
              <button
                type="button"
                onClick={() => setOfficerFilter('ASSIGNED')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  officerFilter === 'ASSIGNED'
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Assigned
              </button>
              <button
                type="button"
                onClick={() => setOfficerFilter('UNASSIGNED')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                  officerFilter === 'UNASSIGNED'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Unassigned
              </button>
            </div>

            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={matrixBarangaySearch}
                onChange={(e) => setMatrixBarangaySearch(e.target.value)}
                placeholder="Filter matrix by barangay..."
                className="w-full pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0c2340] text-white">
                <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-center w-12">#</th>
                <th className="py-2.5 px-3 font-bold border-r border-slate-700">Barangay Name</th>
                <th className="py-2.5 px-3 font-bold border-r border-slate-700">Assigned LFT Officer</th>
                <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-center">Officer ID</th>
                <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-right">RSBSA Farmers</th>
                <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-right">Mapped Hectares</th>
                <th className="py-2.5 px-3 font-bold border-r border-slate-700 text-center">Audit Progress</th>
                <th className="py-2.5 px-3 font-bold text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {matrixData.map((row) => (
                <tr key={row.rawName} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500 border-r border-slate-100">
                    {row.no}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-100 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Brgy. {row.displayName}</span>
                  </td>
                  <td className="py-2.5 px-3 border-r border-slate-100 font-semibold">
                    {!row.assignedAccount || row.officerName === 'Unassigned LFT' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60 shadow-2xs">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        Unassigned LFT
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span>{row.officerName}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-100">
                    <span className="inline-block font-mono text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 tracking-tight shadow-2xs">
                      {row.officerId}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 border-r border-slate-100">
                    {row.farmersCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800 border-r border-slate-100">
                    {row.areaHa.toFixed(2)} ha
                  </td>
                  <td className="py-2.5 px-3 text-center border-r border-slate-100">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            row.progressPct === 0
                              ? 'bg-slate-300 w-0'
                              : row.progressPct < 50
                              ? 'bg-amber-500'
                              : row.progressPct < 80
                              ? 'bg-blue-600'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${row.progressPct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono font-bold ${
                        row.progressPct === 0 ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {row.progressPct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenAssignBarangay(row.rawName, row.assignedAccount)}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition cursor-pointer shadow-2xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 hover:border-emerald-400 active:scale-95"
                      title={`Assign or reassign LFT Officer for Brgy. ${row.displayName}`}
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Assign</span>
                    </button>
                  </td>
                </tr>
              ))}
              {matrixData.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 px-4 text-center">
                    <div className="bg-slate-50/90 border-2 border-dashed border-slate-300 rounded-2xl p-6 sm:p-8 max-w-sm mx-auto text-center flex flex-col items-center justify-center shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mb-2.5">
                        <Users className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-xs font-bold text-slate-800">Walay nakit-ang coverage record.</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 mb-3.5">No technician accounts found in database. Please click &quot;+ Add LFT Officer&quot; to enroll a new field technician.</p>
                      <button
                        type="button"
                        onClick={handleOpenAdd}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Add LFT Officer</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ACTIVITY LOGS */}
      {activityModalOfficer && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setActivityModalOfficer(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 space-y-4"
          >
            <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-serif font-bold text-base">
                    Field Activity &amp; Audit Log
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {getOfficerDisplayName(activityModalOfficer)} &bull; {activityModalOfficer.username}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivityModalOfficer(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 max-h-80 overflow-y-auto text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 block">Recent RSBSA Batch Verification</span>
                <p className="text-slate-600">
                  Verified 12 rice parcels and logged GPS boundary polygons for {activityModalOfficer.barangay}.
                </p>
                <span className="text-[10px] text-slate-400 block font-mono">Today at 10:45 AM</span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                <span className="font-bold text-blue-900 block">Season Crop Stage Update</span>
                <p className="text-slate-600">
                  Updated crop growth stages to Tillering for Inbred NSIC Rc 222 seed varieties.
                </p>
                <span className="text-[10px] text-slate-400 block font-mono">Yesterday at 3:15 PM</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setActivityModalOfficer(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Activity Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT LFT OFFICER */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
          >
            <div className="bg-[#0c2340] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-serif font-bold text-base">
                  {editingAccount ? 'Edit LFT Officer Account' : 'Add New LFT Officer Account'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Wella S. Bongon"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Login Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. wella.bongon"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Account Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs bg-white font-medium"
                  >
                    <option value="Certified Field LFT (Active)">Active / Certified</option>
                    <option value="Pending Activation">Pending Activation</option>
                    <option value="Disabled / Inactive">Disabled / Inactive</option>
                  </select>
                </div>
              </div>

              {/* Profile Picture URL Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Profile Photo (Cloud Storage / URL)</span>
                  </label>
                  {isUploadingPhoto && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Uploading to Supabase...
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shrink-0 bg-slate-100 flex items-center justify-center shadow-xs">
                    {isUploadingPhoto ? (
                      <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                    ) : formData.photoUrl ? (
                      <SafeImage
                        src={formData.photoUrl}
                        alt="Preview"
                        fallbackType="farmer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <input
                    type="url"
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    placeholder="Paste direct URL or upload photo"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
                  />
                  <label className={`px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                    {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploadingPhoto}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadOfficerPhoto(file);
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* ASSIGNED BARANGAYS SELECTION */}
              <div className="space-y-2.5 bg-slate-50/90 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Assigned Barangays (Check Specific Served Barangays)</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {parseAssignedBarangays(formData.barangay).length} Checked
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setAssignedBarangaysList(WELLA_ASSIGNED_BARANGAYS)}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 hover:border-emerald-300 transition cursor-pointer shadow-2xs"
                    >
                      Wella Cluster (5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignedBarangaysList(BRANDO_ASSIGNED_BARANGAYS)}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 transition cursor-pointer shadow-2xs"
                    >
                      Brando Cluster (5)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignedBarangaysList(OFFICIAL_15_BARANGAYS)}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer shadow-2xs"
                    >
                      All 15
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignedBarangaysList([])}
                      className="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-white hover:bg-red-50 text-red-600 border border-slate-200 transition cursor-pointer shadow-2xs"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200/90 shadow-inner">
                  {OFFICIAL_15_BARANGAYS.map((bName) => {
                    const isChecked = isBarangayAssigned(bName, formData.barangay);

                    return (
                      <div
                        key={bName}
                        onClick={() => toggleAssignedBarangay(bName)}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-400/40 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="pt-0.5 shrink-0">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center transition ${
                              isChecked
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-300 bg-white'
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs truncate block font-bold">
                              Brgy. {formatBarangayChipName(bName)}
                            </span>
                            <span className="text-[8.5px] font-extrabold uppercase px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 shrink-0">
                              Official
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Contact Number</label>
                  <input
                    type="text"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="e.g. 0917-829-4501"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Official Municipal Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. wella.bongon@silago-agriculture.gov.ph"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer text-xs"
                >
                  {editingAccount ? 'Save Changes' : 'Create LFT Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingAccountId && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setDeletingAccountId(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-slate-200 space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Confirm Account Deletion</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to delete this LFT Officer account? You can restore default officers anytime by clicking &quot;Reset Default&quot;.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingAccountId(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN BARANGAY TO LFT OFFICER */}
      {assignModalData && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setAssignModalData(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-[#0c2340] text-white p-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center">
                  <UserCheck className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base leading-tight">
                    Assign LFT Officer
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Brgy. {assignModalData.displayBarangay} Coverage Assignment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalData(null)}
                className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-[11px] font-bold text-emerald-900 block">Territory / Target Barangay</span>
                  <span className="text-xs font-semibold text-emerald-950">Brgy. {assignModalData.displayBarangay}, Silago, Southern Leyte</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Field Extension Technician (LFT)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {lftAccounts.map((officer) => {
                    const officerBrgys = getOfficerBarangays(officer);
                    const isAssignedToThis = officerBrgys.some((b) =>
                      matchBarangay(b, assignModalData.barangay)
                    );
                    const isSelected = assignModalData.selectedOfficerId === officer.id;

                    return (
                      <div
                        key={officer.id}
                        onClick={() =>
                          setAssignModalData((prev) =>
                            prev ? { ...prev, selectedOfficerId: officer.id } : null
                          )
                        }
                        className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 border border-slate-200 overflow-hidden shrink-0">
                            {officer.photoUrl ? (
                              <img src={officer.photoUrl} alt={officer.name} className="w-full h-full object-cover" />
                            ) : (
                              officer.name.charAt(0)
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{officer.name}</span>
                              {isAssignedToThis && (
                                <span className="text-[9.5px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <span className="text-[10.5px] text-slate-500 font-mono">
                              {officerBrgys.length} barangay{officerBrgys.length !== 1 ? 's' : ''} assigned
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Option to Unassign */}
                  <div
                    onClick={() =>
                      setAssignModalData((prev) =>
                        prev ? { ...prev, selectedOfficerId: '' } : null
                      )
                    }
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      assignModalData.selectedOfficerId === ''
                        ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          Leave Unassigned / Vacant
                        </div>
                        <span className="text-[10.5px] text-slate-500">
                          Mark this barangay as unassigned territory
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {assignModalData.selectedOfficerId === '' ? (
                        <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAssignModalData(null);
                    handleOpenAdd();
                  }}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Enroll New LFT</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignModalData(null)}
                    className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleAssignBarangayConfirm(
                        assignModalData.selectedOfficerId,
                        assignModalData.barangay
                      )
                    }
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Confirm Assignment</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CENTRAL ADMIN PROFILE & SECURITY SETTINGS */}
      <AdminProfileModal
        isOpen={isAdminProfileModalOpen}
        onClose={() => setIsAdminProfileModalOpen(false)}
      />
    </div>
  );
};
