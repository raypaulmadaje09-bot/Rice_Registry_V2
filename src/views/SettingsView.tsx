import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SilagoSeal, DaLogo, BagOngSilagoLogo, SlsuBadge, OfficialSealsTrio } from '../components/Seals';
import { SLSU_EXTENSION_PRESETS, DEFAULT_SLSU_PHOTO } from '../data/photos';
import { uploadFarmPhoto, supabaseDb } from '../utils/supabaseClient';
import {
  Settings as SettingsIcon,
  UserCheck,
  Lock,
  Building,
  Sliders,
  Database,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Link as LinkIcon,
  RotateCcw,
  Download,
  Image as ImageIcon,
  Key,
  Shield,
  FileSpreadsheet,
  MapPin,
  Phone,
  Mail,
  Wheat,
  User,
  Sparkles,
  ExternalLink,
  Check,
  Layout,
  Globe,
  Clock
} from 'lucide-react';

interface SettingsViewProps {
  onNavigateToLanding?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateToLanding }) => {
  const {
    currentUser,
    updateCurrentUserProfile,
    updateCurrentUserPassword,
    verifyCurrentUserPassword,
    adminProfile,
    updateAdminProfile,
    parcels,
    lftAccounts,
    bgActive,
    bgOpacity,
    bgBlur,
    setBgOpacity,
    setBgBlur,
    setBgActive,
    language,
    setLanguage,
    resetAllDefaults,
    slsuBadgeTag,
    setSlsuBadgeTag,
    slsuTopTags,
    setSlsuTopTags,
    slsuCenterTitle,
    setSlsuCenterTitle,
    slsuCenterSubtitle,
    setSlsuCenterSubtitle,
    slsuCaption,
    setSlsuCaption,
    slsuMotto,
    setSlsuMotto,
    slsuPhotoUrl,
    setSlsuPhotoUrl,
    slsuLayoutMode,
    setSlsuLayoutMode,
    resetSlsuDetails,
    settingsActiveSubTab,
    setSettingsActiveSubTab,
    officeContactInfo,
    updateOfficeContactInfo,
    resetOfficeContactInfo
  } = useApp();

  const isCentralAdmin = currentUser?.role === 'Central Admin';

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'municipal' | 'featured_card' | 'display'>(() => {
    return settingsActiveSubTab || 'profile';
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Office Hours & Hotline Form State
  const [contactForm, setContactForm] = useState({
    schedule: officeContactInfo?.schedule || 'Monday – Friday: 8:00 AM – 5:00 PM',
    hotline: officeContactInfo?.hotline || '(053) 572-8812',
    mobile: officeContactInfo?.mobile || '0917-822-4911',
    email: officeContactInfo?.email || 'agri.silago@southernleyte.gov.ph'
  });

  useEffect(() => {
    if (officeContactInfo) {
      setContactForm({
        schedule: officeContactInfo.schedule,
        hotline: officeContactInfo.hotline,
        mobile: officeContactInfo.mobile,
        email: officeContactInfo.email
      });
    }
  }, [officeContactInfo]);

  // Sync with global subtab if changed from outside
  useEffect(() => {
    if (settingsActiveSubTab) {
      setActiveSubTab(settingsActiveSubTab);
    }
  }, [settingsActiveSubTab]);

  // Featured Landing Card form state
  const [featuredCardForm, setFeaturedCardForm] = useState({
    badgeTag: slsuBadgeTag || 'SILAGO RICE DEMONSTRATION COMPLEX',
    topTags: slsuTopTags || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •',
    title: slsuCenterTitle || 'SILAGO RICE PRODUCTION & RESEARCH CENTER',
    subtitle: slsuCenterSubtitle || 'Silago Model Rice Farm & Certified Inbred Seed Complex',
    caption: slsuCaption || 'High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school',
    motto: slsuMotto || '• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •',
    photoUrl: slsuPhotoUrl,
    layoutMode: slsuLayoutMode || 'full'
  });
  const [customFeaturedUrlInput, setCustomFeaturedUrlInput] = useState('');
  const featuredPhotoFileRef = useRef<HTMLInputElement | null>(null);

  // Sync featuredCardForm when context values change
  useEffect(() => {
    setFeaturedCardForm({
      badgeTag: slsuBadgeTag || 'SILAGO RICE DEMONSTRATION COMPLEX',
      topTags: slsuTopTags || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •',
      title: slsuCenterTitle || 'SILAGO RICE PRODUCTION & RESEARCH CENTER',
      subtitle: slsuCenterSubtitle || 'Silago Model Rice Farm & Certified Inbred Seed Complex',
      caption: slsuCaption || 'High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school',
      motto: slsuMotto || '• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •',
      photoUrl: slsuPhotoUrl,
      layoutMode: slsuLayoutMode || 'full'
    });
  }, [slsuBadgeTag, slsuTopTags, slsuCenterTitle, slsuCenterSubtitle, slsuCaption, slsuMotto, slsuPhotoUrl, slsuLayoutMode]);

  // LFT specific state
  const [lftSubTab, setLftSubTab] = useState<'profile' | 'password' | 'territory' | 'display'>('profile');
  const [lftName, setLftName] = useState(currentUser?.name || 'Wella S. Bongons');
  const [lftTitle, setLftTitle] = useState(currentUser?.title || 'Local Farmer Technician (LFT)');
  const [lftContact, setLftContact] = useState(currentUser?.contactNumber || '0917-234-5678');
  const [lftEmail, setLftEmail] = useState(currentUser?.email || 'wella.bongons@silago-agriculture.gov.ph');
  const [lftPhoto, setLftPhoto] = useState(currentUser?.photoUrl || '');
  const [lftCurrentPass, setLftCurrentPass] = useState('');
  const [lftNewPass, setLftNewPass] = useState('');
  const [lftConfirmPass, setLftConfirmPass] = useState('');
  const [lftShowPass, setLftShowPass] = useState(false);
  const lftPhotoFileRef = useRef<HTMLInputElement | null>(null);

  // Sync LFT state on user change
  useEffect(() => {
    if (currentUser && currentUser.role !== 'Central Admin') {
      setLftName(currentUser.name || '');
      setLftTitle(currentUser.title || 'Local Farmer Technician (LFT)');
      setLftContact(currentUser.contactNumber || '');
      setLftEmail(currentUser.email || '');
      setLftPhoto(currentUser.photoUrl || '');
    }
  }, [currentUser]);

  // Profile Form State (Admin)
  const [profileForm, setProfileForm] = useState({
    name: adminProfile.name || 'Engr. Arnaldo M. Valdez',
    title: adminProfile.title || 'Municipal Agriculturist / Municipal LFT Coordinator',
    office: adminProfile.office || 'Office of the Municipal Agricultural Services',
    email: adminProfile.email || 'arnaldo.valdez@silago-agriculture.gov.ph',
    contactNumber: adminProfile.contactNumber || '0917-888-2345',
    photoUrl: adminProfile.photoUrl || ''
  });

  // Password Change State (Admin)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Municipal Info State (stored in Cloud Database)
  const [municipalInfo, setMunicipalInfo] = useState({
    republic: 'Republic of the Philippines',
    province: 'Province of Southern Leyte',
    municipality: 'Municipality of Silago',
    office: 'Office of the Municipal Agricultural Services',
    mayor: 'Hon. Lemuel P. Honor',
    standardBagWeightKg: 50
  });

  useEffect(() => {
    supabaseDb.getSetting<typeof municipalInfo>('silago_municipal_settings').then((saved) => {
      if (saved) {
        setMunicipalInfo(saved);
      }
    });
  }, []);

  const photoFileRef = useRef<HTMLInputElement | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      showToast('error', 'Administrator name cannot be empty.');
      return;
    }
    updateAdminProfile(profileForm);
    showToast('success', 'Central Administrator profile updated successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast('error', 'Please enter your current administrative password.');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'New password and confirmation do not match.');
      return;
    }

    // Save password to Cloud Database
    updateCurrentUserPassword(newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('success', 'Administrative security password has been changed successfully in cloud database.');
  };

  const handleSaveMunicipalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    supabaseDb.setSetting('silago_municipal_settings', municipalInfo);
    showToast('success', 'Municipal Registry & Office jurisdiction settings saved to cloud database.');
  };

  const handleSaveOfficeContact = (e: React.FormEvent) => {
    e.preventDefault();
    updateOfficeContactInfo({
      schedule: contactForm.schedule.trim() || 'Monday – Friday: 8:00 AM – 5:00 PM',
      hotline: contactForm.hotline.trim() || '(053) 572-8812',
      mobile: contactForm.mobile.trim() || '0917-822-4911',
      email: contactForm.email.trim() || 'agri.silago@southernleyte.gov.ph'
    });
    showToast('success', 'Office Hours & Public Contact Hotline settings updated successfully!');
  };

  const handleResetOfficeContact = () => {
    if (window.confirm('Reset Office Hours & Contact Hotline information to official municipal defaults?')) {
      resetOfficeContactInfo();
      setContactForm({
        schedule: 'Monday – Friday: 8:00 AM – 5:00 PM',
        hotline: '(053) 572-8812',
        mobile: '0917-822-4911',
        email: 'agri.silago@southernleyte.gov.ph'
      });
      showToast('success', 'Office Hours & Contact Hotline restored to defaults.');
    }
  };

  const handleSaveFeaturedCard = (e: React.FormEvent) => {
    e.preventDefault();
    setSlsuBadgeTag(featuredCardForm.badgeTag.trim() || 'SILAGO RICE DEMONSTRATION COMPLEX');
    setSlsuTopTags(featuredCardForm.topTags.trim() || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •');
    setSlsuCenterTitle(featuredCardForm.title.trim() || 'SILAGO RICE PRODUCTION & RESEARCH CENTER');
    setSlsuCenterSubtitle(featuredCardForm.subtitle.trim() || 'Silago Model Rice Farm & Certified Inbred Seed Complex');
    setSlsuCaption(featuredCardForm.caption.trim() || 'High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school');
    setSlsuMotto(featuredCardForm.motto.trim() || '• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •');
    setSlsuPhotoUrl(featuredCardForm.photoUrl);
    setSlsuLayoutMode(featuredCardForm.layoutMode);
    showToast('success', 'Landing page featured card content & showcase settings updated successfully!');
  };

  const handleResetFeaturedCard = () => {
    if (window.confirm('Reset featured landing card to standard municipal defaults?')) {
      resetSlsuDetails();
      setFeaturedCardForm({
        badgeTag: 'SILAGO RICE DEMONSTRATION COMPLEX',
        topTags: '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •',
        title: 'SILAGO RICE PRODUCTION & RESEARCH CENTER',
        subtitle: 'Silago Model Rice Farm & Certified Inbred Seed Complex',
        caption: 'High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school',
        motto: '• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •',
        photoUrl: DEFAULT_SLSU_PHOTO,
        layoutMode: 'full'
      });
      showToast('success', 'Featured card restored to defaults.');
    }
  };

  const handleFeaturedPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('error', 'Photo must be under 15MB.');
      return;
    }
    try {
      const publicUrl = await uploadFarmPhoto(file, 'slsu_featured_demo_card');
      setFeaturedCardForm((prev) => ({ ...prev, photoUrl: publicUrl, layoutMode: 'full' }));
      setSlsuPhotoUrl(publicUrl);
      setSlsuLayoutMode('full');
      showToast('success', 'Featured card photo uploaded to cloud storage.');
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setFeaturedCardForm((prev) => ({ ...prev, photoUrl: dataUrl, layoutMode: 'full' }));
          setSlsuPhotoUrl(dataUrl);
          setSlsuLayoutMode('full');
          showToast('success', 'Featured card photo applied.');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleApplyCustomFeaturedPhotoUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customFeaturedUrlInput.trim()) return;
    setFeaturedCardForm((prev) => ({ ...prev, photoUrl: customFeaturedUrlInput.trim(), layoutMode: 'full' }));
    setSlsuPhotoUrl(customFeaturedUrlInput.trim());
    setSlsuLayoutMode('full');
    setCustomFeaturedUrlInput('');
    showToast('success', 'Direct photo URL applied.');
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const publicUrl = await uploadFarmPhoto(file, 'admin_profile_photo');
      setProfileForm((prev) => ({ ...prev, photoUrl: publicUrl }));
      updateAdminProfile({ photoUrl: publicUrl });
      showToast('success', 'Profile photo uploaded to cloud storage.');
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setProfileForm((prev) => ({ ...prev, photoUrl: dataUrl }));
          updateAdminProfile({ photoUrl: dataUrl });
          showToast('success', 'Profile photo uploaded.');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleExportDataJson = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      parcelsCount: parcels.length,
      lftAccountsCount: lftAccounts.length,
      parcels,
      lftAccounts,
      adminProfile
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silago-rice-registry-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Full system registry exported as JSON backup.');
  };

  const handleExportParcelsCsv = () => {
    if (parcels.length === 0) {
      showToast('error', 'No farm records available to export.');
      return;
    }
    const headers = ['Tag Number', 'RSBSA ID', 'Farmer Name', 'Barangay', 'Purok', 'Variety', 'Area (Ha)', 'Tenure', 'Agro-Ecosystem', 'Status', 'Date'];
    const rows = parcels.map((p) => [
      p.tagNumber,
      `"${p.swineNameOrId || ''}"`,
      `"${p.raiserName || ''}"`,
      `"${p.barangay || ''}"`,
      `"${p.purok || ''}"`,
      `"${p.breed || ''}"`,
      p.weightKg,
      `"${p.sex || ''}"`,
      `"${p.purpose || ''}"`,
      `"${p.healthStatus || ''}"`,
      p.registrationDate
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `silago-rice-parcels-masterlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Rice farm records exported to CSV.');
  };

  // LFT specific handlers & calculations
  const handleSaveLftProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lftName.trim()) {
      showToast('error', 'Officer name cannot be empty.');
      return;
    }
    updateCurrentUserProfile({
      name: lftName.trim(),
      title: lftTitle.trim(),
      contactNumber: lftContact.trim(),
      email: lftEmail.trim(),
      photoUrl: lftPhoto
    });
    showToast('success', 'LFT Officer profile details updated successfully.');
  };

  const handleLftChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lftCurrentPass) {
      showToast('error', 'Please enter your current account password.');
      return;
    }
    if (!verifyCurrentUserPassword(lftCurrentPass)) {
      showToast('error', 'Current password is incorrect (Default is lft123).');
      return;
    }
    if (lftNewPass.length < 6) {
      showToast('error', 'New password must be at least 6 characters.');
      return;
    }
    if (lftNewPass !== lftConfirmPass) {
      showToast('error', 'New password and confirmation do not match.');
      return;
    }
    updateCurrentUserPassword(lftNewPass);
    setLftCurrentPass('');
    setLftNewPass('');
    setLftConfirmPass('');
    showToast('success', 'LFT account password updated successfully.');
  };

  const handleLftPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const cleanUsername = (currentUser?.username || currentUser?.name || 'lft_officer').replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicUrl = await uploadFarmPhoto(file, `lft_profile_${cleanUsername}`);
      setLftPhoto(publicUrl);
      updateCurrentUserProfile({ photoUrl: publicUrl });
      showToast('success', 'LFT profile photo uploaded to cloud storage.');
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          setLftPhoto(dataUrl);
          updateCurrentUserProfile({ photoUrl: dataUrl });
          showToast('success', 'LFT profile photo updated successfully.');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const assignedList = currentUser?.assignedBarangays && currentUser.assignedBarangays.length > 0
    ? currentUser.assignedBarangays
    : currentUser?.barangay
      ? currentUser.barangay.split(',').map((b) => b.trim())
      : ['Salvacion', 'Laguma', 'Pd2', 'Pd1', 'Sap-ang'];

  const lftParcels = parcels.filter((p) => assignedList.includes(p.barangay));
  const lftTotalArea = lftParcels.reduce((acc, p) => acc + (p.weightKg || 0), 0);
  const lftRsbsaCount = lftParcels.filter((p) => p.swineNameOrId && p.swineNameOrId.trim().length > 0).length;

  // Render dedicated LFT Account Settings if user is not Central Admin
  if (!isCentralAdmin) {
    return (
      <div className="space-y-6">
        {/* Hidden File Input for LFT Avatar */}
        <input
          type="file"
          ref={lftPhotoFileRef}
          accept="image/*"
          onChange={handleLftPhotoUpload}
          className="hidden"
        />

        {/* Floating Notification */}
        {notification && (
          <div
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3 ${
              notification.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : 'bg-rose-500 text-white border-rose-400'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </div>
        )}

        {/* 1. LFT Header Banner */}
        <div className="bg-[#071728] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-md">
                    AUTHORIZED LFT ACCOUNT
                  </span>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
                    Field Technician
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                  LFT Account &amp; Profile Settings
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  Manage your personal technician profile, official contact phone, security password, and review your assigned territorial jurisdiction.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-slate-200">
                Logged in as: <strong className="text-white font-bold">{currentUser?.name || 'Local Farmer Technician'}</strong>
              </div>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-wrap">
            <button
              type="button"
              onClick={() => setLftSubTab('profile')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                lftSubTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Officer Profile &amp; Contact</span>
            </button>

            <button
              type="button"
              onClick={() => setLftSubTab('password')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                lftSubTab === 'password'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Security &amp; Password</span>
            </button>

            <button
              type="button"
              onClick={() => setLftSubTab('territory')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                lftSubTab === 'territory'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Field Territory ({assignedList.length} Barangays)</span>
            </button>

            <button
              type="button"
              onClick={() => setLftSubTab('display')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                lftSubTab === 'display'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Display &amp; Language</span>
            </button>
          </div>
        </div>

        {/* 2. Sub-tab Content for LFT */}

        {/* Tab 1: Profile & Contact */}
        {lftSubTab === 'profile' && (
          <form onSubmit={handleSaveLftProfile} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Technician Profile &amp; Field Identity</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Your name and contact number appear on registered rice farm receipts and official records.
                </p>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Photo Upload Box */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center p-6 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 space-y-3 text-center">
                <div className="w-24 h-24 rounded-2xl bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-3xl overflow-hidden border-2 border-white shadow-md relative group">
                  {lftPhoto ? (
                    <img src={lftPhoto} alt="LFT Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{lftName.charAt(0) || 'L'}</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Official Officer Photo</p>
                  <p className="text-[11px] text-slate-500">JPG or PNG, max 2MB recommended</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => lftPhotoFileRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Upload</span>
                  </button>
                  {lftPhoto && (
                    <button
                      type="button"
                      onClick={() => {
                        setLftPhoto('');
                        updateCurrentUserProfile({ photoUrl: '' });
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Officer Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={lftName}
                      onChange={(e) => setLftName(e.target.value)}
                      placeholder="e.g. Wella S. Bongons"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Official Title / Designation
                    </label>
                    <input
                      type="text"
                      value={lftTitle}
                      onChange={(e) => setLftTitle(e.target.value)}
                      placeholder="e.g. Local Farmer Technician (LFT)"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile Contact Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={lftContact}
                        onChange={(e) => setLftContact(e.target.value)}
                        placeholder="e.g. 0917-234-5678"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={lftEmail}
                        onChange={(e) => setLftEmail(e.target.value)}
                        placeholder="e.g. wella.bongons@silago-agriculture.gov.ph"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Assigned Field Jurisdiction
                    </label>
                    <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 truncate">
                      {assignedList.join(', ')}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Territory assignments are configured by the Central Admin.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Password */}
        {lftSubTab === 'password' && (
          <form onSubmit={handleLftChangePassword} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Account Security &amp; Password</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your authentication credentials for logging in to the LFT Portal.
                </p>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Update Password</span>
              </button>
            </div>

            <div className="max-w-xl space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Current Account Password
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={lftShowPass ? 'text' : 'password'}
                    value={lftCurrentPass}
                    onChange={(e) => setLftCurrentPass(e.target.value)}
                    placeholder="Enter your current password (default is lft123)"
                    required
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setLftShowPass(!lftShowPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {lftShowPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">Default factory password for all LFT officers is <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-700">lft123</code></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    New Password
                  </label>
                  <input
                    type={lftShowPass ? 'text' : 'password'}
                    value={lftNewPass}
                    onChange={(e) => setLftNewPass(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={lftShowPass ? 'text' : 'password'}
                    value={lftConfirmPass}
                    onChange={(e) => setLftConfirmPass(e.target.value)}
                    placeholder="Repeat new password"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Device Security Notice</p>
                  <p className="text-amber-800">
                    Your password is encrypted and saved to this field terminal. Do not share your login credentials with unverified persons.
                  </p>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Tab 3: Territory & Jurisdiction */}
        {lftSubTab === 'territory' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Assigned Field Territory &amp; Rice Coverage</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Overview of municipal barangays assigned to your field inspection and farmer verification duties.
              </p>
            </div>

            {/* Metric Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                  Registered Rice Farms
                </span>
                <span className="text-3xl font-black text-[#0b2545] font-serif mt-1 block">
                  {lftParcels.length}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Within your assigned barangays
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Mapped Hectares (Ha)
                </span>
                <span className="text-3xl font-black text-emerald-900 font-serif mt-1 block">
                  {lftTotalArea.toFixed(2)} ha
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Total productive rice area
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                  RSBSA Verified Farmers
                </span>
                <span className="text-3xl font-black text-purple-900 font-serif mt-1 block">
                  {lftRsbsaCount}
                </span>
                <span className="text-xs text-slate-500 mt-1 block">
                  Enrolled in DA National Registry
                </span>
              </div>
            </div>

            {/* Barangay Badges */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Barangay Registry
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {assignedList.map((bg) => {
                  const bgCount = lftParcels.filter((p) => p.barangay === bg).length;
                  const bgArea = lftParcels
                    .filter((p) => p.barangay === bg)
                    .reduce((acc, p) => acc + (p.weightKg || 0), 0);
                  return (
                    <div key={bg} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-xs transition">
                      <div className="flex items-center gap-1.5 text-blue-600 mb-1">
                        <MapPin size={14} />
                        <span className="font-bold text-xs text-slate-900 truncate">{bg}</span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {bgCount} farms • {bgArea.toFixed(1)} ha
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Wheat className="w-4 h-4 text-amber-600" />
                <span>Ready to conduct on-site farm mapping or add new RSBSA registrations?</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600">
                Click "+ Add Rice Farm Registration" in the sidebar anytime.
              </span>
            </div>
          </div>
        )}

        {/* Tab 4: Display & Language */}
        {lftSubTab === 'display' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Display &amp; Language Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Customize the visual interface and local language for your field tablet or desktop.
              </p>
            </div>

            {/* Language Selection */}
            <div className="p-5 border border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Interface Language</h4>
                  <p className="text-xs text-slate-500">Switch between English and Cebuano / Bisaya terminology</p>
                </div>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('EN');
                      showToast('success', 'Language set to English.');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      language === 'EN' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLanguage('CEB');
                      showToast('success', 'Pinulongan gi-ilis sa Sinugboanon / Bisaya.');
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      language === 'CEB' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cebuano
                  </button>
                </div>
              </div>
            </div>

            {/* Background Settings */}
            <div className="p-5 border border-slate-200 rounded-2xl space-y-4 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800">Silago Landscape Background Wallpaper</h4>
                  <p className="text-xs text-slate-500">Show subtle scenic rice field backdrop</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBgActive(!bgActive)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    bgActive ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      bgActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {bgActive && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Wallpaper Opacity</span>
                      <span>{bgOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={bgOpacity}
                      onChange={(e) => setBgOpacity(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Background Blur</span>
                      <span>{bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={bgBlur}
                      onChange={(e) => setBgBlur(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={photoFileRef}
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Floating Notification */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3 ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white border-emerald-400'
              : 'bg-rose-500 text-white border-rose-400'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 1. Header Banner matching System Theme */}
      <div className="bg-[#071728] text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <SettingsIcon className="w-6 h-6 animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-md">
                  ADMINISTRATION &amp; SECURITY
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Active Central Authority
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
                System &amp; Admin Settings
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Configure central administrator credentials, profile details, municipal authority headers, display preferences, and master registry backups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all display settings, backgrounds, and official logos to defaults?')) {
                  resetAllDefaults();
                  showToast('success', 'Display & photo defaults restored.');
                }
              }}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Display Defaults</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveSubTab('profile')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'profile'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Administrator Profile &amp; Password</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('municipal');
              setSettingsActiveSubTab('municipal');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'municipal'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Municipal Registry &amp; Office Setup</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('featured_card');
              setSettingsActiveSubTab('featured_card');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'featured_card'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Landing Page Featured Card</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('display');
              setSettingsActiveSubTab('display');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'display'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Display &amp; Language</span>
          </button>
        </div>
      </div>

      {/* 2. Content Tabs */}
      {/* ============================================================ */}
      {/* SUB-TAB 1: ADMINISTRATOR PROFILE & PASSWORD                 */}
      {/* ============================================================ */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Profile Avatar Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 text-center flex flex-col items-center justify-between">
            <div className="space-y-4 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                ADMINISTRATIVE IDENTITY
              </span>

              <div className="relative group w-28 h-28 mx-auto">
                <div className="w-28 h-28 rounded-3xl bg-blue-600 text-white font-black text-3xl flex items-center justify-center overflow-hidden border-4 border-slate-100 shadow-md">
                  {profileForm.photoUrl ? (
                    <img
                      src={profileForm.photoUrl}
                      alt={profileForm.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>{profileForm.name.charAt(0)}</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoFileRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl shadow-lg border-2 border-white transition cursor-pointer"
                  title="Upload profile photo"
                >
                  <Upload size={14} />
                </button>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif">{profileForm.name}</h3>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{profileForm.title}</p>
                <p className="text-[11px] text-slate-500 mt-1">{profileForm.office}</p>
              </div>

              <div className="pt-2 border-t border-slate-100 text-left space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Account Role:</span>
                  <span className="font-bold text-slate-800 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">
                    Central Admin
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Security Level:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Full Clearance (Level 1)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Silago Jurisdiction:</span>
                  <span className="font-bold text-slate-700">15 Barangays</span>
                </div>
              </div>
            </div>

            <div className="w-full space-y-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => photoFileRef.current?.click()}
                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Upload size={14} />
                <span>Upload New Photo from Device</span>
              </button>
            </div>
          </div>

          {/* Column 2: Edit Profile Form */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Official Profile Information</h3>
              </div>
              <span className="text-[11px] text-slate-400">Displays on certificates &amp; reports</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full Name with Honorific / Title</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                    placeholder="e.g. Engr. Arnaldo M. Valdez"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Designation / Position</label>
                  <input
                    type="text"
                    value={profileForm.title}
                    onChange={(e) => setProfileForm({ ...profileForm, title: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    placeholder="e.g. Municipal Agriculturist / Coordinator"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Department / Office</label>
                <input
                  type="text"
                  value={profileForm.office}
                  onChange={(e) => setProfileForm({ ...profileForm, office: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                  placeholder="e.g. Office of the Municipal Agricultural Services"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Official Government Email</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    placeholder="officer@silago-agriculture.gov.ph"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Direct Contact Hotline</label>
                  <input
                    type="text"
                    value={profileForm.contactNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    placeholder="0917-888-2345"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Avatar Image Web Link (Optional)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={profileForm.photoUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, photoUrl: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                  />
                  {profileForm.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, photoUrl: '' })}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Profile Updates</span>
                </button>
              </div>
            </form>

            {/* Password Management Box */}
            <div className="pt-6 border-t border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-sm text-slate-900">Change Administrative Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  {showPasswords ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPasswords ? 'Hide Password' : 'Show Password'}</span>
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Current Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Current password"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 chars"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Confirm New Password</label>
                    <input
                      type={showPasswords ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-hidden font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    Default factory admin pass: <code className="font-mono font-bold text-slate-700">silago2026</code>
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Lock size={13} />
                    <span>Update Password</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 2: MUNICIPAL REGISTRY & OFFICE SETUP                 */}
      {/* ============================================================ */}
      {activeSubTab === 'municipal' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Official Municipal Jurisdiction &amp; Letterhead</h3>
                <p className="text-xs text-slate-500">Defines header text across generated endorsement letters and registry masterlists</p>
              </div>
            </div>
            <OfficialSealsTrio />
          </div>

          <form onSubmit={handleSaveMunicipalInfo} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Country Line Header</label>
                <input
                  type="text"
                  value={municipalInfo.republic}
                  onChange={(e) => setMunicipalInfo({ ...municipalInfo, republic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Province Header</label>
                <input
                  type="text"
                  value={municipalInfo.province}
                  onChange={(e) => setMunicipalInfo({ ...municipalInfo, province: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Municipality Title</label>
                <input
                  type="text"
                  value={municipalInfo.municipality}
                  onChange={(e) => setMunicipalInfo({ ...municipalInfo, municipality: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Municipal Department / Office</label>
                <input
                  type="text"
                  value={municipalInfo.office}
                  onChange={(e) => setMunicipalInfo({ ...municipalInfo, office: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Incumbent Municipal Mayor</label>
                <input
                  type="text"
                  value={municipalInfo.mayor}
                  onChange={(e) => setMunicipalInfo({ ...municipalInfo, mayor: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Standard Rice Cavan / Bag Weight (kg)</label>
                <input
                  type="number"
                  value={municipalInfo.standardBagWeightKg}
                  onChange={(e) => setMunicipalInfo({ ...municipalInfo, standardBagWeightKg: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                />
                <span className="text-[10.5px] text-slate-400 block">Standard DA conversion: 1 Metric Ton (MT) = 20 Bags (50kg each)</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Save size={14} />
                <span>Save Municipal Information</span>
              </button>
            </div>
          </form>

          {/* ============================================================ */}
          {/* OFFICE HOURS & PUBLIC CONTACT HOTLINES CONFIGURATION         */}
          {/* ============================================================ */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-900">Office Hours &amp; Public Contact Hotlines</h3>
                    <span className="text-[9.5px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Central Admin Managed
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure the official operational hours, telephone hotlines, mobile lines, and public assistance email.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetOfficeContact}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Reset to official DA Silago defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Defaults</span>
              </button>
            </div>

            <form onSubmit={handleSaveOfficeContact} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* 1. Schedule */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Official Office Schedule</span>
                  </label>
                  <input
                    type="text"
                    value={contactForm.schedule}
                    onChange={(e) => setContactForm({ ...contactForm, schedule: e.target.value })}
                    placeholder="e.g. Monday – Friday: 8:00 AM – 5:00 PM"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Regular government working hours &amp; public assistance days</span>
                </div>

                {/* 2. Landline Hotline */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    <span>Landline Hotline Number</span>
                  </label>
                  <input
                    type="text"
                    value={contactForm.hotline}
                    onChange={(e) => setContactForm({ ...contactForm, hotline: e.target.value })}
                    placeholder="e.g. (053) 572-8812"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Municipal Agriculture Office landline telephone</span>
                </div>

                {/* 3. Mobile Hotline */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Official Mobile Hotline</span>
                  </label>
                  <input
                    type="text"
                    value={contactForm.mobile}
                    onChange={(e) => setContactForm({ ...contactForm, mobile: e.target.value })}
                    placeholder="e.g. 0917-822-4911"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Emergency &amp; SMS advisory hotline for farmers</span>
                </div>

                {/* 4. Official Email */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    <span>Public Contact Email</span>
                  </label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="e.g. agri.silago@southernleyte.gov.ph"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-hidden"
                    required
                  />
                  <span className="text-[10px] text-slate-400 block">Inquiries, endorsements &amp; official correspondence</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <span className="text-[11px] text-slate-500">
                  Settings are stored in the municipal central database and synced across administrative tools.
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Office Hours &amp; Hotline</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 3: LANDING PAGE FEATURED CARD (CENTRAL ADMIN)        */}
      {/* ============================================================ */}
      {activeSubTab === 'featured_card' && (
        <div className="space-y-6">
          {/* Hidden File Input for Card Image */}
          <input
            type="file"
            ref={featuredPhotoFileRef}
            accept="image/*"
            onChange={handleFeaturedPhotoUpload}
            className="hidden"
          />

          {/* Section Header Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <Sparkles className="w-6 h-6 text-amber-100" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md">
                    PUBLIC HERO SHOWCASE
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Synchronized
                  </span>
                </div>
                <h3 className="font-serif font-black text-lg sm:text-xl text-[#0b2545]">
                  Landing Page Featured Card Configuration
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Manage the official palay research complex showcase card shown on the public landing page hero section. Changes update live across public and administrative portals.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetFeaturedCard}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                title="Restore standard DA-MAO municipal default content"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>

          {/* Two-Column Form & Real-Time Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 7 Columns: The Edit Form */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <form onSubmit={handleSaveFeaturedCard} className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Card Content &amp; Headlines</h4>
                    <p className="text-xs text-slate-500">Configure all 6 public showcase labels in exact display order</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">All fields required</span>
                </div>

                <div className="space-y-4">
                  {/* Field 1: Badge Header */}
                  <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Badge Header</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Top Pill Header
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={featuredCardForm.badgeTag}
                      onChange={(e) => setFeaturedCardForm({ ...featuredCardForm, badgeTag: e.target.value })}
                      placeholder="e.g. SILAGO RICE DEMONSTRATION COMPLEX"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-bold text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500">
                      Top-level municipal status tag shown in the glowing pill badge at the card's top left.
                    </p>
                  </div>

                  {/* Field 2: Sub-tagline (Top Tags) */}
                  <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span>Sub-tagline (Top Tags)</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Top Tags
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={featuredCardForm.topTags}
                      onChange={(e) => setFeaturedCardForm({ ...featuredCardForm, topTags: e.target.value })}
                      placeholder="e.g. • HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs font-mono font-bold text-amber-700"
                    />
                    <p className="text-[11px] text-slate-500">
                      Secondary headline tags rendered directly under the top badge with high visibility.
                    </p>
                  </div>

                  {/* Field 3: Main Facility Title */}
                  <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Main Facility Title</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Primary Title
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={featuredCardForm.title}
                      onChange={(e) => setFeaturedCardForm({ ...featuredCardForm, title: e.target.value })}
                      placeholder="e.g. SILAGO RICE PRODUCTION & RESEARCH CENTER"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs font-serif font-black uppercase tracking-wider text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500">
                      Primary golden headline displayed prominently in the center of the showcase card.
                    </p>
                  </div>

                  {/* Field 4: Complex Subtitle */}
                  <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>Complex Subtitle</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Secondary Heading
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={featuredCardForm.subtitle}
                      onChange={(e) => setFeaturedCardForm({ ...featuredCardForm, subtitle: e.target.value })}
                      placeholder="e.g. Silago Model Rice Farm & Certified Inbred Seed Complex"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs font-bold text-slate-900"
                    />
                    <p className="text-[11px] text-slate-500">
                      Defines the complex facility scope, research trials, or breeding seed nursery name.
                    </p>
                  </div>

                  {/* Field 5: Description / Subtitle Details */}
                  <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Description / Subtitle Details</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Details &amp; Summary
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={featuredCardForm.caption}
                      onChange={(e) => setFeaturedCardForm({ ...featuredCardForm, caption: e.target.value })}
                      placeholder="e.g. High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-xs font-medium text-slate-800 leading-relaxed"
                    />
                    <p className="text-[11px] text-slate-500">
                      Summary of high-yield palay demonstration plots, inbred seed repositories, and field schools.
                    </p>
                  </div>

                  {/* Field 6: Bottom Tagline / Highlights */}
                  <div className="space-y-1.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span>Bottom Tagline / Highlights</span>
                        <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        Bottom Highlights
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={featuredCardForm.motto}
                      onChange={(e) => setFeaturedCardForm({ ...featuredCardForm, motto: e.target.value })}
                      placeholder="e.g. • CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none text-xs font-mono font-bold text-amber-700"
                    />
                    <p className="text-[11px] text-slate-500">
                      Core agricultural highlights displayed at the bottom of the card with bullet formatting.
                    </p>
                  </div>
                </div>

                {/* Media & Layout Options */}
                <div className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Showcase Photography &amp; Layout Mode</h4>
                      <p className="text-[11px] text-slate-500">Select demonstration photo and visual overlay style</p>
                    </div>
                  </div>

                  {/* Layout mode switcher */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setFeaturedCardForm({ ...featuredCardForm, layoutMode: 'full' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        featuredCardForm.layoutMode === 'full'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-1 ring-amber-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Full Photo Overlay</span>
                        {featuredCardForm.layoutMode === 'full' && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal">
                        Full-bleed backdrop with dark gradient readability layer
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeaturedCardForm({ ...featuredCardForm, layoutMode: 'banner' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        featuredCardForm.layoutMode === 'banner'
                          ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Top Banner Header</span>
                        {featuredCardForm.layoutMode === 'banner' && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal">
                        Banner photo header above information card body
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFeaturedCardForm({ ...featuredCardForm, layoutMode: 'seal' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        featuredCardForm.layoutMode === 'seal'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Heraldic Seal Only</span>
                        {featuredCardForm.layoutMode === 'seal' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 font-normal">
                        Classic official heraldic seal with high-contrast background
                      </p>
                    </button>
                  </div>

                  {/* Photo Upload and URL inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <strong className="block font-bold text-slate-800 text-xs">Upload Photo File</strong>
                      <p className="text-[11px] text-slate-500">
                        Upload custom model rice farm, plot trials, or nursery photography.
                      </p>
                      <button
                        type="button"
                        onClick={() => featuredPhotoFileRef.current?.click()}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo File</span>
                      </button>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <strong className="block font-bold text-slate-800 text-xs">Direct Web Image URL</strong>
                      <p className="text-[11px] text-slate-500">
                        Or enter direct HTTPS URL to municipal image asset.
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          value={customFeaturedUrlInput}
                          onChange={(e) => setCustomFeaturedUrlInput(e.target.value)}
                          placeholder="https://example.com/photo.jpg"
                          className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCustomFeaturedPhotoUrl}
                          disabled={!customFeaturedUrlInput.trim()}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold text-xs rounded-lg cursor-pointer transition shrink-0"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="space-y-2 pt-1">
                    <label className="font-bold text-slate-800 text-xs block">
                      Quick Select Silago Agricultural Showcase Presets:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SLSU_EXTENSION_PRESETS.map((preset) => {
                        const isSelected = featuredCardForm.photoUrl === preset.url;
                        return (
                          <div
                            key={preset.id}
                            onClick={() => {
                              setFeaturedCardForm({ ...featuredCardForm, photoUrl: preset.url, layoutMode: 'full' });
                            }}
                            className={`group relative rounded-xl overflow-hidden border-2 cursor-pointer transition ${
                              isSelected ? 'border-amber-500 ring-2 ring-amber-400' : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <img
                              src={preset.url}
                              alt={preset.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-16 object-cover"
                            />
                            <div className="p-1 bg-slate-900/90 text-white">
                              <span className="text-[9px] font-bold block truncate">{preset.name}</span>
                            </div>
                            {isSelected && (
                              <div className="absolute top-1 right-1 bg-amber-500 text-white p-0.5 rounded-full shadow">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Click Save to publish changes immediately to the Landing Page.</span>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Featured Card Configuration</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right 5 Columns: Sticky Live Real-Time Preview */}
            <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Real-Time Live Card Preview</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Live Feedback
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  This preview renders the actual component matching what visitors and farmers see on the homepage.
                </p>

                {/* Preview Container */}
                <div className="p-3 bg-slate-900 rounded-2xl flex justify-center border border-slate-800">
                  <div className="w-full max-w-sm">
                    <SlsuBadge
                      overrideData={{
                        title: featuredCardForm.title,
                        subtitle: featuredCardForm.subtitle,
                        caption: featuredCardForm.caption,
                        motto: featuredCardForm.motto,
                        badgeTag: featuredCardForm.badgeTag,
                        topTags: featuredCardForm.topTags,
                        photoUrl: featuredCardForm.photoUrl,
                        layoutMode: featuredCardForm.layoutMode
                      }}
                      previewOnly
                    />
                  </div>
                </div>

                {/* Card Placement & Quick Public Link */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Card Status:</span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active &amp; Published
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="font-medium">Placement:</span>
                    <span className="font-bold text-slate-800">Landing Page Hero (Right)</span>
                  </div>

                  {onNavigateToLanding && (
                    <button
                      type="button"
                      onClick={onNavigateToLanding}
                      className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-blue-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-sky-600" />
                      <span>View on Public Landing Page</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Dynamic Storage Specification Summary */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 uppercase text-[10px] tracking-wider block">
                  Configuration Persistence Specification:
                </span>
                <ul className="space-y-1 text-[11px] text-slate-600">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <span><strong>Badge Header:</strong> Saved to silago_slsu_badge_tag</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span><strong>Sub-tagline:</strong> Saved to silago_slsu_top_tags</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span><strong>Main Facility Title:</strong> Saved to silago_slsu_center_title</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    <span><strong>Complex Subtitle:</strong> Saved to silago_slsu_center_subtitle</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span><strong>Description:</strong> Saved to silago_slsu_caption</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span><strong>Bottom Tagline:</strong> Saved to silago_slsu_motto</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 4: DISPLAY & LANGUAGE                               */}
      {/* ============================================================ */}
      {activeSubTab === 'display' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Display Language &amp; Visual Settings</h3>
                <p className="text-xs text-slate-500">Configure language localization and interface background visibility</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Language Box */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                SYSTEM INTERFACE LANGUAGE
              </span>
              <p className="text-xs text-slate-600">
                Choose the primary language dialect for prompts, agricultural forms, and report summaries.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLanguage('EN')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    language === 'EN'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  English (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('CEB')}
                  className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${
                    language === 'CEB'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  Cebuano (Bisaya)
                </button>
              </div>
            </div>

            {/* Background Tuning Box */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  BACKGROUND IMAGE VISUAL TUNING
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${bgActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                  {bgActive ? 'Active' : 'Off'}
                </span>
              </div>
              <p className="text-xs text-slate-600">
                Adjust the opacity and soft focus of the scenic Silago rice background photo.
              </p>

              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Background Opacity</span>
                    <span className="text-blue-600 font-mono">{Math.round(bgOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.30"
                    step="0.01"
                    value={bgOpacity}
                    onChange={(e) => setBgOpacity(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Soft Blur Focus</span>
                    <span className="text-blue-600 font-mono">{bgBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="1"
                    value={bgBlur}
                    onChange={(e) => setBgBlur(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
