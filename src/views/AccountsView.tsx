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
  Activity,
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
  Loader2,
  Eye,
  EyeOff
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
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');

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
    photoUrl: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Real-time security rules criteria
  const passwordCriteria = useMemo(() => {
    const pwd = formData.password || '';
    const confirm = formData.confirmPassword || '';
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      matchesConfirm: pwd.length > 0 && pwd === confirm
    };
  }, [formData.password, formData.confirmPassword]);

  const isPasswordValid = useMemo(() => {
    // If editing and password field is left empty, existing password is maintained
    if (editingAccount && !formData.password && !formData.confirmPassword) {
      return true;
    }
    return (
      passwordCriteria.minLength &&
      passwordCriteria.hasUppercase &&
      passwordCriteria.hasLowercase &&
      passwordCriteria.hasNumber &&
      passwordCriteria.matchesConfirm
    );
  }, [editingAccount, formData.password, formData.confirmPassword, passwordCriteria]);

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
    setPasswordError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      photoUrl: '',
      password: '',
      confirmPassword: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: LftAccount) => {
    setEditingAccount(acc);
    setPasswordError(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
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
      photoUrl: acc.photoUrl || '',
      password: '',
      confirmPassword: ''
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
    setPasswordError(null);

    if (!formData.name.trim()) {
      alert('Please provide the LFT Officer Full Name.');
      return;
    }
    if (!formData.barangay.trim() || parseAssignedBarangays(formData.barangay).length === 0) {
      alert('Please check at least one specific barangay that this LFT officer serves.');
      return;
    }

    // Password validation guard
    if (!editingAccount) {
      // New account creation requires full password criteria
      if (!formData.password) {
        setPasswordError('Kinahanglan magbutang og Account Password alang sa bag-ong LFT officer.');
        return;
      }
      if (!passwordCriteria.minLength) {
        setPasswordError('Ang password kinahanglan labing menos 8 ka karakter ang gitas-on.');
        return;
      }
      if (!passwordCriteria.hasUppercase) {
        setPasswordError('Ang password kinahanglan adunay labing menos usa ka UPPERCASE nga letra (A-Z).');
        return;
      }
      if (!passwordCriteria.hasLowercase) {
        setPasswordError('Ang password kinahanglan adunay labing menos usa ka lowercase nga letra (a-z).');
        return;
      }
      if (!passwordCriteria.hasNumber) {
        setPasswordError('Ang password kinahanglan adunay labing menos usa ka numero (0-9).');
        return;
      }
      if (!passwordCriteria.matchesConfirm) {
        setPasswordError('Wala motakdo ang Password ug Confirm Password.');
        return;
      }
    } else if (formData.password || formData.confirmPassword) {
      // Editing account with password change specified
      if (!passwordCriteria.minLength || !passwordCriteria.hasUppercase || !passwordCriteria.hasLowercase || !passwordCriteria.hasNumber) {
        setPasswordError('Ang bag-ong password kinahanglan labing menos 8 ka karakter, may uppercase, lowercase, ug numero.');
        return;
      }
      if (!passwordCriteria.matchesConfirm) {
        setPasswordError('Wala motakdo ang Password ug Confirm Password.');
        return;
      }
    }

    if (editingAccount) {
      const updatePayload: Partial<LftAccount> = {
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
      };
      if (formData.password) {
        updatePayload.password = formData.password;
      }
      updateLftAccount(editingAccount.id, updatePayload);
      showToast(`Malampusong na-update ang account para kang ${formData.name.trim()}!`);
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
        photoUrl: formData.photoUrl.trim() || undefined,
        password: formData.password
      });
      showToast('Malampusong nahimo ang LFT Account!');
    }

    setIsModalOpen(false);
    setEditingAccount(null);
    setPasswordError(null);
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
        acc.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acc.email && acc.email.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchSearch) return false;
      return true;
    });
  }, [lftAccounts, searchTerm]);

  const isCentralAdmin = currentUser?.role === 'Central Admin';

  const adminMatches = useMemo(() => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      'admin'.includes(term) ||
      'administrator'.includes(term) ||
      'municipal-wide'.includes(term) ||
      'admin@gmail.com'.includes(term) ||
      (currentUser?.name || '').toLowerCase().includes(term) ||
      (currentUser?.email || '').toLowerCase().includes(term)
    );
  }, [searchTerm, currentUser]);

  const totalAccountsCount = (adminMatches ? 1 : 0) + filteredAccounts.length;


  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-800 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-600 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span className="text-xs font-bold">{notification}</span>
        </div>
      )}

      {/* 1. Header Card (Matching Reference Image 5) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Manage System Accounts &amp; Access
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Create and manage accounts for Agricultural Extension Focal Persons, Rice Field Technicians, and System Administrators.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-[#15803d] hover:bg-[#166534] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>+ Add User Account</span>
        </button>
      </section>

      {/* 2. Search Bar Card (Matching Reference Image 5) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search user name, email, or role..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
          Total Accounts: {totalAccountsCount}
        </span>
      </section>

      {/* 3. Accounts Table (Matching Reference Image 5) */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-5 py-3.5">Account Name</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Assigned Jurisdiction</th>
                <th className="px-5 py-3.5">Login Email / Username</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {/* Focal Persons (LFT Officers) */}
              {filteredAccounts.map((officer) => (
                <tr key={officer.id} className="transition hover:bg-slate-50/80">
                  {/* Account Name */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900 text-xs">
                      {officer.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {officer.contactNumber || '09244030033'}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full bg-[#ecfdf5] border border-[#bbf7d0] px-2.5 py-0.5 text-[10px] font-bold text-[#15803d]">
                      FOCAL PERSON
                    </span>
                  </td>

                  {/* Assigned Jurisdiction */}
                  <td className="px-5 py-4 text-slate-700 font-medium text-xs">
                    {officer.barangay.startsWith('Brgy.') ? officer.barangay : `Brgy. ${officer.barangay}`}
                  </td>

                  {/* Login Email / Username */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900 text-xs font-mono">
                      {officer.username}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {officer.email || `${officer.username.replace('@', '')}@gmail.com`}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-0.5 text-[10px] font-bold text-[#0284c7]">
                      ACTIVE
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(officer)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit Account"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAccountId(officer.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Central Admin Account */}
              {adminMatches && (
                <tr className="transition hover:bg-slate-50/80">
                  {/* Account Name */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900 text-xs">
                      {currentUser?.name || 'Admin'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentUser?.contactNumber || 'No contact'}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full bg-[#faf5ff] border border-[#e9d5ff] px-2.5 py-0.5 text-[10px] font-bold text-[#7e22ce]">
                      ADMINISTRATOR
                    </span>
                  </td>

                  {/* Assigned Jurisdiction */}
                  <td className="px-5 py-4 text-slate-700 font-medium text-xs">
                    Municipal-Wide
                  </td>

                  {/* Login Email / Username */}
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900 text-xs font-mono">
                      {currentUser?.username || 'admin'}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {currentUser?.email || 'admin@gmail.com'}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center rounded-full bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-0.5 text-[10px] font-bold text-[#0284c7]">
                      ACTIVE
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAdminProfileModalOpen(true)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit Admin Profile"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          showToast('Central Administrator account is permanent and protected.');
                        }}
                        className="p-1.5 text-slate-300 hover:text-slate-400 rounded-lg transition cursor-not-allowed opacity-60"
                        title="Primary admin cannot be deleted"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty State */}
              {totalAccountsCount === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-xs text-slate-400">
                    No system accounts match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

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

              {/* PASSWORD & CONFIRM PASSWORD SECTION WITH LIVE VALIDATION CHECKLIST */}
              <div className="p-3.5 bg-slate-50/95 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{editingAccount ? 'Account Security & Password (Optional Update)' : 'Account Password & Security *'}</span>
                  </div>
                  {editingAccount && (
                    <span className="text-[10px] text-slate-500 italic">
                      Ibilin nga blangko kung dili usbon
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Password Input */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
                      <span>Account Password {!editingAccount && <span className="text-red-500">*</span>}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value });
                          setPasswordError(null);
                        }}
                        placeholder="Kinahanglan labing menos 8 ka karakter"
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 text-xs flex items-center justify-between">
                      <span>Confirm Password {!editingAccount && <span className="text-red-500">*</span>}</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => {
                          setFormData({ ...formData, confirmPassword: e.target.value });
                          setPasswordError(null);
                        }}
                        placeholder="I-type pag-usab ang password"
                        className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md transition cursor-pointer"
                        title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Live Visual Security Checklist */}
                {(!editingAccount || formData.password.length > 0 || formData.confirmPassword.length > 0) && (
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200/90 shadow-2xs space-y-1.5 text-[11px]">
                    <span className="font-bold text-slate-700 block text-[10.5px] uppercase tracking-wider">
                      Security Rules &amp; Live Checklist:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {/* Criteria 1: Min 8 chars */}
                      <div className={`flex items-center gap-1.5 transition-colors ${
                        passwordCriteria.minLength ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                          passwordCriteria.minLength ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {passwordCriteria.minLength ? '✓' : '•'}
                        </div>
                        <span>Labing menos 8 ka karakter</span>
                      </div>

                      {/* Criteria 2: Uppercase */}
                      <div className={`flex items-center gap-1.5 transition-colors ${
                        passwordCriteria.hasUppercase ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                          passwordCriteria.hasUppercase ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {passwordCriteria.hasUppercase ? '✓' : '•'}
                        </div>
                        <span>Adunay uppercase nga letra (A-Z)</span>
                      </div>

                      {/* Criteria 3: Number */}
                      <div className={`flex items-center gap-1.5 transition-colors ${
                        passwordCriteria.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                          passwordCriteria.hasNumber ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {passwordCriteria.hasNumber ? '✓' : '•'}
                        </div>
                        <span>Adunay numero (0-9)</span>
                      </div>

                      {/* Criteria 4: Match Confirm */}
                      <div className={`flex items-center gap-1.5 transition-colors ${
                        passwordCriteria.matchesConfirm ? 'text-emerald-700 font-bold' : 'text-slate-400'
                      }`}>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-black ${
                          passwordCriteria.matchesConfirm ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                        }`}>
                          {passwordCriteria.matchesConfirm ? '✓' : '•'}
                        </div>
                        <span>Parehas ang Password ug Confirm Password</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Password Error Alert Message */}
                {passwordError && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{passwordError}</span>
                  </div>
                )}
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
                  disabled={!isPasswordValid}
                  className={`px-5 py-2 font-bold rounded-xl shadow-xs transition cursor-pointer text-xs flex items-center gap-1.5 ${
                    isPasswordValid
                      ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed opacity-70'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{editingAccount ? 'Save Changes' : 'Create LFT Account'}</span>
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
