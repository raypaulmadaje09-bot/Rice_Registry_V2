import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { SilagoSeal, DaLogo, BagOngSilagoLogo, SlsuBadge, OfficialSealsTrio } from '../components/Seals';
import { PhotosView } from './PhotosView';
import { HeroBackgroundEditor, HeroBgPatch } from '../components/HeroBackgroundEditor';
import { SLSU_EXTENSION_PRESETS, DEFAULT_SLSU_PHOTO } from '../data/photos';
import { uploadFarmPhoto, supabaseDb } from '../utils/supabaseClient';
import { LandingPageConfig, MandateCardItem } from '../types';
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
  Users,
  Compass,
  Sparkles,
  ExternalLink,
  Check,
  Layout,
  Globe,
  Clock,
  Trash2,
  Plus,
  Edit3,
  Layers
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
    language,
    setLanguage,
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
    resetOfficeContactInfo,
    municipalBranding,
    updateMunicipalBranding,
    resetMunicipalBranding,
    landingPageConfig,
    updateLandingPageConfig,
    resetLandingPageConfig,
    addMandateCard,
    updateMandateCard,
    deleteMandateCard
  } = useApp();

  const isCentralAdmin = currentUser?.role === 'Central Admin';

  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'municipal' | 'featured_card' | 'display' | 'media' | 'landing'>(() => {
    return settingsActiveSubTab === 'featured_card' || settingsActiveSubTab === 'profile' ? 'media' : settingsActiveSubTab || 'landing';
  });

  useEffect(() => {
    if (settingsActiveSubTab && settingsActiveSubTab !== 'featured_card' && settingsActiveSubTab !== 'profile') {
      setActiveSubTab(settingsActiveSubTab);
    }
  }, [settingsActiveSubTab]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [mediaAssetTab, setMediaAssetTab] = useState<'all' | 'background' | 'slsu' | 'seals'>('background');

  // Landing Page Configuration Form State
  const [landingForm, setLandingForm] = useState<LandingPageConfig>(() => ({
    ...landingPageConfig
  }));

  useEffect(() => {
    if (landingPageConfig) {
      setLandingForm({
        ...landingPageConfig,
        mandateCards: Array.isArray(landingPageConfig.mandateCards) ? [...landingPageConfig.mandateCards] : []
      });
    }
  }, [landingPageConfig]);

  const handleSaveLandingPage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateLandingPageConfig(landingForm);
    showToast('success', 'Landing Page badges, headline, portal cards, and mandate cards saved successfully!');
  };

  const handleResetLandingPage = () => {
    if (window.confirm('Reset all landing page badges, headlines, portals, and mandate cards to default municipal settings?')) {
      resetLandingPageConfig();
      showToast('success', 'Landing Page content restored to municipal defaults.');
    }
  };

  const handleAddLocalMandateCard = () => {
    const newCard: MandateCardItem = {
      id: `mandate-${Date.now()}`,
      tag: 'NEW MUNICIPAL INITIATIVE',
      title: 'Title of Project or Program',
      description: 'Detailed description of the municipal initiative, agricultural decree, or research partnership.'
    };
    setLandingForm((prev) => ({
      ...prev,
      mandateCards: [...prev.mandateCards, newCard]
    }));
  };

  const handleUpdateLocalMandateCard = (id: string, field: keyof MandateCardItem, value: string) => {
    setLandingForm((prev) => ({
      ...prev,
      mandateCards: prev.mandateCards.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    }));
  };

  const handleDeleteLocalMandateCard = (id: string) => {
    setLandingForm((prev) => ({
      ...prev,
      mandateCards: prev.mandateCards.filter((c) => c.id !== id)
    }));
  };

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

  // Municipal Identity & Registry System Branding Form State
  const [brandingForm, setBrandingForm] = useState({
    municipalityName: municipalBranding?.municipalityName || 'Municipality of Silago',
    registryTitle: municipalBranding?.registryTitle || 'Rice Farm Registry',
    officeName: municipalBranding?.officeName || 'Municipal Agriculture Office',
    republicText: municipalBranding?.republicText || 'Republic of the Philippines',
    provinceText: municipalBranding?.provinceText || 'Province of Southern Leyte',
    mayorName: municipalBranding?.mayorName || 'Hon. Lemuel P. Honor',
    silagoSealUrl: municipalBranding?.silagoSealUrl || null,
    bagOngSilagoLogoUrl: municipalBranding?.bagOngSilagoLogoUrl || null,
    daLogoUrl: municipalBranding?.daLogoUrl || null
  });

  const [sealUrlInput, setSealUrlInput] = useState('');
  const [bagOngUrlInput, setBagOngUrlInput] = useState('');
  const sealFileInputRef = useRef<HTMLInputElement | null>(null);
  const bagOngFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (municipalBranding) {
      setBrandingForm({
        municipalityName: municipalBranding.municipalityName,
        registryTitle: municipalBranding.registryTitle,
        officeName: municipalBranding.officeName,
        republicText: municipalBranding.republicText,
        provinceText: municipalBranding.provinceText,
        mayorName: municipalBranding.mayorName,
        silagoSealUrl: municipalBranding.silagoSealUrl,
        bagOngSilagoLogoUrl: municipalBranding.bagOngSilagoLogoUrl,
        daLogoUrl: municipalBranding.daLogoUrl
      });
    }
  }, [municipalBranding]);

  // Sync with global subtab if changed from outside
  useEffect(() => {
    if (settingsActiveSubTab) {
      const nextTab = settingsActiveSubTab === 'featured_card' || settingsActiveSubTab === 'profile' ? 'media' : settingsActiveSubTab;
      setActiveSubTab(nextTab);
      if (nextTab !== settingsActiveSubTab) setSettingsActiveSubTab(nextTab);
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

  const handleSealFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBrandingForm((prev) => ({ ...prev, silagoSealUrl: result }));
      showToast('success', 'Municipality of Silago Seal loaded. Click "Save Branding Adjustments" to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleBagOngFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setBrandingForm((prev) => ({ ...prev, bagOngSilagoLogoUrl: result }));
      showToast('success', 'Bag-ong Silago Logo loaded. Click "Save Branding Adjustments" to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleApplySealUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sealUrlInput.trim()) {
      showToast('error', 'Please enter a valid image URL.');
      return;
    }
    setBrandingForm((prev) => ({ ...prev, silagoSealUrl: sealUrlInput.trim() }));
    setSealUrlInput('');
    showToast('success', 'Seal URL applied to preview. Click "Save Branding Adjustments" to persist.');
  };

  const handleApplyBagOngUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bagOngUrlInput.trim()) {
      showToast('error', 'Please enter a valid image URL.');
      return;
    }
    setBrandingForm((prev) => ({ ...prev, bagOngSilagoLogoUrl: bagOngUrlInput.trim() }));
    setBagOngUrlInput('');
    showToast('success', 'Bag-ong Silago URL applied to preview. Click "Save Branding Adjustments" to persist.');
  };

  const handleSaveBranding = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateMunicipalBranding(brandingForm);
    setMunicipalInfo((prev) => ({
      ...prev,
      municipality: brandingForm.municipalityName,
      office: brandingForm.officeName,
      republic: brandingForm.republicText,
      province: brandingForm.provinceText,
      mayor: brandingForm.mayorName
    }));
    supabaseDb.setSetting('silago_municipal_settings', {
      ...municipalInfo,
      municipality: brandingForm.municipalityName,
      office: brandingForm.officeName,
      republic: brandingForm.republicText,
      province: brandingForm.provinceText,
      mayor: brandingForm.mayorName
    });
    showToast('success', 'Municipal Identity & Registry System Branding saved successfully to cloud database.');
  };

  const handleResetBranding = () => {
    if (window.confirm('Reset all Municipal Branding (Municipality Seal, Bag-ong Silago Logo, and System Titles) to official Silago defaults?')) {
      resetMunicipalBranding();
      setBrandingForm({
        municipalityName: 'Municipality of Silago',
        registryTitle: 'Rice Farm Registry',
        officeName: 'Municipal Agriculture Office',
        republicText: 'Republic of the Philippines',
        provinceText: 'Province of Southern Leyte',
        mayorName: 'Hon. Lemuel P. Honor',
        silagoSealUrl: null,
        bagOngSilagoLogoUrl: null,
        daLogoUrl: null
      });
      setSealUrlInput('');
      setBagOngUrlInput('');
      showToast('success', 'Branding reset to official municipal defaults.');
    }
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
      showToast('error', 'Current password is incorrect.');
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 ring-1 ring-emerald-100">
                <Shield className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                    AUTHORIZED LFT ACCOUNT
                  </span>
                  <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                    Field Technician
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  LFT Account &amp; Profile Settings
                </h2>
                <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                  Manage your personal technician profile, official contact phone, security password, and review your assigned territorial jurisdiction.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Logged in as: <strong className="text-slate-900 font-bold">{currentUser?.name || 'Local Farmer Technician'}</strong>
              </div>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
            <button
              type="button"
              onClick={() => setLftSubTab('profile')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                lftSubTab === 'profile'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Language</span>
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
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
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
                    placeholder="Enter your current password"
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
                <span className="text-[11px] text-slate-400 mt-1 block">Use the unique password assigned to your account.</span>
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
              <h3 className="text-lg font-bold text-slate-800">Language Preferences</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose the language used on your field tablet or desktop.
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
                      language === 'EN' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
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
                      language === 'CEB' ? 'bg-emerald-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Cebuano
                  </button>
                </div>
              </div>
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
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 ring-1 ring-emerald-100">
              <SettingsIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-100 px-2.5 py-0.5 rounded-md">
                  ADMINISTRATION &amp; SECURITY
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  Active Central Authority
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  Settings
              </h2>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                Manage registry details, media and branding, and language preferences.
              </p>
            </div>
          </div>

        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-200 flex-wrap">
          {isCentralAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('landing');
                setSettingsActiveSubTab('landing');
              }}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'landing'
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layout className="w-4 h-4 text-lime-400" />
              <span>Landing Page &amp; Portals</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('municipal');
              setSettingsActiveSubTab('municipal');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'municipal'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Municipal Registry &amp; Office Setup</span>
          </button>

          {isCentralAdmin && ([
            { id: 'background', label: 'Portal Background Wallpapers' },
            { id: 'slsu', label: 'SLSU Extension Center' },
            { id: 'seals', label: 'Official 3-Seal Logos' }
          ] as const).map((asset) => (
            <button
              key={asset.id}
              type="button"
              onClick={() => {
                setMediaAssetTab(asset.id);
                setActiveSubTab('media');
                setSettingsActiveSubTab('media');
              }}
              className={`rounded-xl px-3 py-2.5 text-left text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'media' && mediaAssetTab === asset.id
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {asset.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('display');
              setSettingsActiveSubTab('display');
            }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'display'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Language</span>
          </button>
        </div>
      </div>

      {/* 2. Content Tabs */}
      {activeSubTab === 'media' && isCentralAdmin && <PhotosView initialTab={mediaAssetTab} />}
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
                <div className="w-28 h-28 rounded-3xl bg-emerald-700 text-white font-black text-3xl flex items-center justify-center overflow-hidden border-4 border-slate-100 shadow-md">
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
                  className="absolute bottom-0 right-0 p-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-lg border-2 border-white transition cursor-pointer"
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
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
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
      {/* SUB-TAB: LANDING PAGE CONTENT & PORTALS CUSTOMIZER           */}
      {/* ============================================================ */}
      {activeSubTab === 'landing' && (
        <div className="space-y-6">
          {/* Header Action Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center shrink-0 shadow-md">
                <Layout className="w-6 h-6 text-lime-300" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-md">
                    Central Admin Customizer
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Synchronized
                  </span>
                </div>
                <h3 className="font-serif font-black text-lg sm:text-xl text-slate-900">
                  Landing Page Content &amp; Portals Customizer
                </h3>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Configure all public landing page copy, announcement banners, hero headlines, role access cards, and add custom mandate/partnership cards.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleResetLandingPage}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-rose-600 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                title="Restore default landing page copy"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>

              {onNavigateToLanding && (
                <button
                  type="button"
                  onClick={onNavigateToLanding}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-blue-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-sky-600" />
                  <span>View Landing Page</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleSaveLandingPage()}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSaveLandingPage} className="space-y-6">
            {/* CARD 1: Announcement Notice Bar & Hero Headlines */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">1. Hero Section: Background, Badges, Headline &amp; Narrative</h4>
                  <p className="text-xs text-slate-500">Configure the hero banner background, top announcement banner, official badges, main headline, and action buttons.</p>
                </div>
              </div>

              {/* Hero Showcase Background Customizer (Inside the Hero Box & Logo Card) */}
              <HeroBackgroundEditor
                heroBgColor={landingForm.heroBgColor}
                heroBgImageUrl={landingForm.heroBgImageUrl}
                heroBgOpacity={landingForm.heroBgOpacity}
                heroBgBlur={landingForm.heroBgBlur}
                heroBgOverlayOpacity={landingForm.heroBgOverlayOpacity}
                heroCardBgColor={landingForm.heroCardBgColor}
                heroCardBgImageUrl={landingForm.heroCardBgImageUrl}
                heroCardBgOpacity={landingForm.heroCardBgOpacity}
                heroCardBgBlur={landingForm.heroCardBgBlur}
                heroCardBgOverlayOpacity={landingForm.heroCardBgOverlayOpacity}
                heroLogoBackingColor={landingForm.heroLogoBackingColor}
                heroCardTextTheme={landingForm.heroCardTextTheme}
                heroHeadline={landingForm.heroHeadline}
                onChange={(patch: HeroBgPatch) =>
                  setLandingForm((prev) => ({ ...prev, ...patch }))
                }
                onSave={() => handleSaveLandingPage()}
                saveLabel="Save Background & Landing"
                onNotify={showToast}
              />

              {/* Announcement Banner */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Top Announcement Ticker
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Notice Tag</label>
                    <input
                      type="text"
                      value={landingForm.topNoticeTag}
                      onChange={(e) => setLandingForm({ ...landingForm, topNoticeTag: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Official Notice"
                    />
                  </div>
                  <div className="sm:col-span-6 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Notice Announcement Text</label>
                    <input
                      type="text"
                      value={landingForm.topNoticeText}
                      onChange={(e) => setLandingForm({ ...landingForm, topNoticeText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="2026 Wet Season RSBSA Georeferencing & Palay Monitoring active across all 15 Silago Barangays."
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Link Button Label</label>
                    <input
                      type="text"
                      value={landingForm.topNoticeLinkText}
                      onChange={(e) => setLandingForm({ ...landingForm, topNoticeLinkText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Explore 15 Barangays →"
                    />
                  </div>
                </div>
              </div>

              {/* Badges & Headlines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Official Municipal Badge (Top Left)</label>
                  <input
                    type="text"
                    value={landingForm.heroBadge}
                    onChange={(e) => setLandingForm({ ...landingForm, heroBadge: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="OFFICIAL MUNICIPAL RICE FARM REGISTRY · SILAGO"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">PWA Offline Access Status Badge</label>
                  <input
                    type="text"
                    value={landingForm.heroPwaBadge}
                    onChange={(e) => setLandingForm({ ...landingForm, heroPwaBadge: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="100% Offline PWA Field Access Ready"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Main Hero Headline</label>
                <input
                  type="text"
                  value={landingForm.heroHeadline}
                  onChange={(e) => setLandingForm({ ...landingForm, heroHeadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-serif font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="A clearer view of every rice farm in Silago."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Hero Subtitle / Descriptive Paragraph</label>
                <textarea
                  rows={2}
                  value={landingForm.heroDescription}
                  onChange={(e) => setLandingForm({ ...landingForm, heroDescription: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs font-normal text-slate-700 leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="The Municipal Agriculture Office registry brings farmer records, georeferenced parcels, and field services together in one place."
                />
              </div>

              {/* Action Buttons Labels */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Hero Action Button Labels
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[11px]">Return Button (Admin)</label>
                    <input
                      type="text"
                      value={landingForm.heroReturnBtnText}
                      onChange={(e) => setLandingForm({ ...landingForm, heroReturnBtnText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Return to Executive Dashboard"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[11px]">Return Button (LFT)</label>
                    <input
                      type="text"
                      value={landingForm.heroReturnLftBtnText}
                      onChange={(e) => setLandingForm({ ...landingForm, heroReturnLftBtnText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Return to LFT Field Portal"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[11px]">Sign In Button</label>
                    <input
                      type="text"
                      value={landingForm.heroSignInBtnText}
                      onChange={(e) => setLandingForm({ ...landingForm, heroSignInBtnText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Sign In as Central Admin"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-600 text-[11px]">Explore GIS Map Button</label>
                    <input
                      type="text"
                      value={landingForm.heroGisBtnText}
                      onChange={(e) => setLandingForm({ ...landingForm, heroGisBtnText: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Explore GIS Map"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Live Statistics Registry Snapshot Labels */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">2. Live Registry Snapshot Labels</h4>
                  <p className="text-xs text-slate-500">Configure metric labels and active cropping season displayed below the hero banner.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Parcels Metric Label</label>
                  <input
                    type="text"
                    value={landingForm.statLabelParcels}
                    onChange={(e) => setLandingForm({ ...landingForm, statLabelParcels: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="TOTAL REGISTERED PARCELS"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Farmers Metric Label</label>
                  <input
                    type="text"
                    value={landingForm.statLabelFarmers}
                    onChange={(e) => setLandingForm({ ...landingForm, statLabelFarmers: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="REGISTERED FARMERS"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Barangays Metric Label</label>
                  <input
                    type="text"
                    value={landingForm.statLabelBarangays}
                    onChange={(e) => setLandingForm({ ...landingForm, statLabelBarangays: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="BARANGAYS WITH RECORDS"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Season Year</label>
                  <input
                    type="text"
                    value={landingForm.seasonYear}
                    onChange={(e) => setLandingForm({ ...landingForm, seasonYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="2026"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Season Badge Label</label>
                  <input
                    type="text"
                    value={landingForm.seasonLabel}
                    onChange={(e) => setLandingForm({ ...landingForm, seasonLabel: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="WET SEASON REGISTRY"
                  />
                </div>
              </div>
            </div>

            {/* CARD 3: Coverage Section & LGU Operations Banner */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">3. Coverage Directory &amp; LGU Staff Banner</h4>
                  <p className="text-xs text-slate-500">Configure barangay coverage section headings, filter pills, and LGU field operations call-to-action.</p>
                </div>
              </div>

              {/* Coverage section headers */}
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Municipality Coverage Section Headings
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Section Tag</label>
                    <input
                      type="text"
                      value={landingForm.coverageTag}
                      onChange={(e) => setLandingForm({ ...landingForm, coverageTag: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="FULL MUNICIPALITY COVERAGE"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Section Title</label>
                    <input
                      type="text"
                      value={landingForm.coverageTitle}
                      onChange={(e) => setLandingForm({ ...landingForm, coverageTitle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="All 15 Barangays of Silago"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Subtext Description</label>
                  <input
                    type="text"
                    value={landingForm.coverageDesc}
                    onChange={(e) => setLandingForm({ ...landingForm, coverageDesc: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700"
                    placeholder="Each barangay operates its own scoped Local Farm Technician (LFT) account for decentralized registration."
                  />
                </div>
                {/* Filter Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Filter 1 Label (All)</label>
                    <input
                      type="text"
                      value={landingForm.filterAllLabel}
                      onChange={(e) => setLandingForm({ ...landingForm, filterAllLabel: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="All (15)"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Filter 2 Label (Coastal)</label>
                    <input
                      type="text"
                      value={landingForm.filterCoastalLabel}
                      onChange={(e) => setLandingForm({ ...landingForm, filterCoastalLabel: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Coastal Sectors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600">Filter 3 Label (Inland)</label>
                    <input
                      type="text"
                      value={landingForm.filterInlandLabel}
                      onChange={(e) => setLandingForm({ ...landingForm, filterInlandLabel: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Inland & Irrigated"
                    />
                  </div>
                </div>
              </div>

              {/* LGU Silago Field Operations CTA */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-4">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  LGU Silago Field Operations CTA Banner
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Banner Tag</label>
                    <input
                      type="text"
                      value={landingForm.lftBannerTag}
                      onChange={(e) => setLandingForm({ ...landingForm, lftBannerTag: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="LGU SILAGO FIELD OPERATIONS"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Banner Title</label>
                    <input
                      type="text"
                      value={landingForm.lftBannerTitle}
                      onChange={(e) => setLandingForm({ ...landingForm, lftBannerTitle: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Are you an assigned Local Farm Technician (LFT)?"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-8 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Banner Description</label>
                    <input
                      type="text"
                      value={landingForm.lftBannerDesc}
                      onChange={(e) => setLandingForm({ ...landingForm, lftBannerDesc: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                      placeholder="Log in to record today's parcel registrations, check irrigation buffers..."
                    />
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Banner Button Text</label>
                    <input
                      type="text"
                      value={landingForm.lftBannerBtn}
                      onChange={(e) => setLandingForm({ ...landingForm, lftBannerBtn: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                      placeholder="Sign In to Staff Portal →"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 5: Dynamic Mandate, Academic Partnership & Surveillance Zoning Cards (Add & Edit!) */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900">
                        5. Municipal Mandate, Academic Partnerships &amp; Zoning Cards
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {landingForm.mandateCards.length} Cards
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Edit existing mandate and partnership cards, or add new informational cards dynamically.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddLocalMandateCard}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Card</span>
                </button>
              </div>

              {/* Cards List */}
              <div className="space-y-4">
                {landingForm.mandateCards.map((card, idx) => (
                  <div key={card.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-700">
                          {card.tag || `Mandate Card #${idx + 1}`}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLocalMandateCard(card.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Delete this card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Card Tag (Upper Pill)</label>
                        <input
                          type="text"
                          value={card.tag}
                          onChange={(e) => handleUpdateLocalMandateCard(card.id, 'tag', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-800"
                          placeholder="e.g. MUNICIPAL MANDATE"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Card Title</label>
                        <input
                          type="text"
                          value={card.title}
                          onChange={(e) => handleUpdateLocalMandateCard(card.id, 'title', e.target.value)}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-serif font-bold text-slate-900"
                          placeholder="e.g. Rice Production & Sustainable Farm Security"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Card Description</label>
                      <textarea
                        rows={2}
                        value={card.description}
                        onChange={(e) => handleUpdateLocalMandateCard(card.id, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-normal text-slate-700 leading-relaxed"
                        placeholder="Detailed description of initiatives..."
                      />
                    </div>
                  </div>
                ))}

                {landingForm.mandateCards.length === 0 && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-500 font-medium">No mandate cards yet.</p>
                    <button
                      type="button"
                      onClick={handleAddLocalMandateCard}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add First Mandate Card</span>
                    </button>
                  </div>
                )}
              </div>

              {landingForm.mandateCards.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddLocalMandateCard}
                  className="w-full py-2.5 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Mandate / Partnership Card</span>
                </button>
              )}
            </div>

            {/* CARD 6: Footer Contact & Legal Notice */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">6. Footer Contact &amp; Public Disclaimer</h4>
                  <p className="text-xs text-slate-500">Configure agriculture office name, physical address, quick links, and copyright text.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Office Title</label>
                  <input
                    type="text"
                    value={landingForm.footerOfficeName}
                    onChange={(e) => setLandingForm({ ...landingForm, footerOfficeName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="Silago DA Office"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Office Subtitle</label>
                  <input
                    type="text"
                    value={landingForm.footerOfficeSubtitle}
                    onChange={(e) => setLandingForm({ ...landingForm, footerOfficeSubtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="MUNICIPAL AGRICULTURE"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Physical Office Address</label>
                <input
                  type="text"
                  value={landingForm.footerOfficeAddress}
                  onChange={(e) => setLandingForm({ ...landingForm, footerOfficeAddress: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  placeholder="Office of the Municipal Agriculturist, Silago Municipal Hall Complex, Southern Leyte, Philippines 6607."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Quick Navigation Title</label>
                  <input
                    type="text"
                    value={landingForm.footerNavTitle}
                    onChange={(e) => setLandingForm({ ...landingForm, footerNavTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="QUICK NAVIGATION"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Link 1 Label</label>
                  <input
                    type="text"
                    value={landingForm.footerNavAbout}
                    onChange={(e) => setLandingForm({ ...landingForm, footerNavAbout: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="About the Office"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Link 2 Label</label>
                  <input
                    type="text"
                    value={landingForm.footerNavDirectory}
                    onChange={(e) => setLandingForm({ ...landingForm, footerNavDirectory: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="15 Barangays Directory"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Portal Access Title</label>
                  <input
                    type="text"
                    value={landingForm.footerPortalAccessTitle}
                    onChange={(e) => setLandingForm({ ...landingForm, footerPortalAccessTitle: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    placeholder="PORTAL ACCESS"
                  />
                </div>
                <div className="sm:col-span-8 space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">Portal Access Description</label>
                  <input
                    type="text"
                    value={landingForm.footerPortalAccessDesc}
                    onChange={(e) => setLandingForm({ ...landingForm, footerPortalAccessDesc: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-normal text-slate-700"
                    placeholder="Restricted to authorized Municipal Agriculture Office staff..."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Copyright Line</label>
                <input
                  type="text"
                  value={landingForm.footerCopyright}
                  onChange={(e) => setLandingForm({ ...landingForm, footerCopyright: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                  placeholder="© 2026 Municipality of Silago · Office of the Municipal Agriculturist"
                />
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
              <span className="text-xs text-slate-500 font-medium">
                Changes will sync across devices and update the landing page immediately upon saving.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetLandingPage}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Reset Defaults
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Save All Landing Page Changes</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-TAB 2: MUNICIPAL REGISTRY & OFFICE SETUP                 */}
      {/* ============================================================ */}
      {activeSubTab === 'municipal' && (
        <div className="space-y-6">
          {/* ============================================================ */}
          {/* CARD 1: OFFICIAL MUNICIPAL IDENTITY & REGISTRY SYSTEM BRANDING */}
          {/* ============================================================ */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-200">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-slate-900">
                      Municipal Identity &amp; Registry Branding
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Central Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Adjust the Municipality Seal, Bag-ong Silago Logo, Municipality Name, Registry Title, and Agriculture Office across the system.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetBranding}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                title="Reset branding seals and text to official Silago defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Defaults</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Controls (7 cols) */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. Municipality of Silago Seal & 2. Bag-ong Silago Logo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Item 1: Municipality of Silago Seal */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Municipality of Silago Seal</span>
                      {brandingForm.silagoSealUrl && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Custom</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <SilagoSeal size={56} customUrl={brandingForm.silagoSealUrl || undefined} />
                      </div>
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <input
                          type="file"
                          ref={sealFileInputRef}
                          accept="image/*"
                          onChange={handleSealFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => sealFileInputRef.current?.click()}
                          className="w-full px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload Seal File</span>
                        </button>
                        {brandingForm.silagoSealUrl && (
                          <button
                            type="button"
                            onClick={() => setBrandingForm((p) => ({ ...p, silagoSealUrl: null }))}
                            className="text-[10.5px] font-semibold text-rose-600 hover:underline block text-center w-full"
                          >
                            Restore default seal
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Seal URL */}
                    <form onSubmit={handleApplySealUrl} className="flex gap-1.5 pt-1">
                      <input
                        type="url"
                        value={sealUrlInput}
                        onChange={(e) => setSealUrlInput(e.target.value)}
                        placeholder="Or paste Seal image URL..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Set
                      </button>
                    </form>
                  </div>

                  {/* Item 2: Bag-ong Silago Logo */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Bag-ong Silago Logo</span>
                      {brandingForm.bagOngSilagoLogoUrl && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Custom</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-xs">
                        <BagOngSilagoLogo size={56} customUrl={brandingForm.bagOngSilagoLogoUrl || undefined} />
                      </div>
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <input
                          type="file"
                          ref={bagOngFileInputRef}
                          accept="image/*"
                          onChange={handleBagOngFileUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => bagOngFileInputRef.current?.click()}
                          className="w-full px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 text-slate-500" />
                          <span>Upload Logo File</span>
                        </button>
                        {brandingForm.bagOngSilagoLogoUrl && (
                          <button
                            type="button"
                            onClick={() => setBrandingForm((p) => ({ ...p, bagOngSilagoLogoUrl: null }))}
                            className="text-[10.5px] font-semibold text-rose-600 hover:underline block text-center w-full"
                          >
                            Restore default logo
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Direct Bag-ong Silago URL */}
                    <form onSubmit={handleApplyBagOngUrl} className="flex gap-1.5 pt-1">
                      <input
                        type="url"
                        value={bagOngUrlInput}
                        onChange={(e) => setBagOngUrlInput(e.target.value)}
                        placeholder="Or paste Logo image URL..."
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        Set
                      </button>
                    </form>
                  </div>
                </div>

                {/* 3 Text Adjustment Fields */}
                <div className="space-y-3.5">
                  {/* Item 3: Municipality Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Municipality Name</span>
                      <span className="text-[10.5px] text-slate-400 font-normal">(e.g. Municipality of Silago)</span>
                    </label>
                    <input
                      type="text"
                      value={brandingForm.municipalityName}
                      onChange={(e) => setBrandingForm({ ...brandingForm, municipalityName: e.target.value })}
                      placeholder="Municipality of Silago"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <p className="text-[10.5px] text-slate-400">
                      Official local government unit name shown on portal masthead, sidebar, and reports.
                    </p>
                  </div>

                  {/* Item 4: Registry Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Rice Farm Registry Title</span>
                      <span className="text-[10.5px] text-slate-400 font-normal">(e.g. Rice Farm Registry)</span>
                    </label>
                    <input
                      type="text"
                      value={brandingForm.registryTitle}
                      onChange={(e) => setBrandingForm({ ...brandingForm, registryTitle: e.target.value })}
                      placeholder="Rice Farm Registry"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <p className="text-[10.5px] text-slate-400">
                      Primary registry title shown across portal mastheads, sidebar brand, and document headers.
                    </p>
                  </div>

                  {/* Item 5: Office Name */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Municipal Agriculture Office</span>
                      <span className="text-[10.5px] text-slate-400 font-normal">(e.g. Municipal Agriculture Office)</span>
                    </label>
                    <input
                      type="text"
                      value={brandingForm.officeName}
                      onChange={(e) => setBrandingForm({ ...brandingForm, officeName: e.target.value })}
                      placeholder="Municipal Agriculture Office"
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <p className="text-[10.5px] text-slate-400">
                      Agriculture department or DA unit administering this registry.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-500">
                    Saves to municipal central database and syncs across all devices.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSaveBranding()}
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <Save size={14} />
                    <span>Save Branding Adjustments</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Visual Preview Card (5 cols) */}
              <div className="lg:col-span-5 flex flex-col justify-start">
                <div className="w-full text-center mb-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                    Live Preview (Landing Card Representation)
                  </span>
                </div>

                <div className="w-full relative flex min-h-[300px] flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-emerald-900/30 bg-gradient-to-b from-[#0f3d2a] to-[#072418] p-6 text-center shadow-xl">
                  {/* Decorative background border */}
                  <div className="pointer-events-none absolute inset-3 rounded-[1.5rem] border border-white/10" />

                  {/* Silago Seal Preview */}
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white p-3 shadow-xl ring-6 ring-white/10">
                    <SilagoSeal size={100} customUrl={brandingForm.silagoSealUrl || undefined} />
                  </div>

                  {/* Bag-ong Silago Logo + 3 texts */}
                  <div className="relative mt-4 flex items-center justify-center gap-3">
                    <BagOngSilagoLogo size={46} customUrl={brandingForm.bagOngSilagoLogoUrl || undefined} />
                    <div className="text-left">
                      <span className="block text-[9.5px] font-bold uppercase tracking-[0.18em] text-lime-200">
                        {brandingForm.municipalityName || 'Municipality of Silago'}
                      </span>
                      <span className="mt-0.5 block font-serif text-base font-bold leading-tight text-white">
                        {brandingForm.registryTitle || 'Rice Farm Registry'}
                      </span>
                      <span className="mt-0.5 block text-[10.5px] text-emerald-50/70">
                        {brandingForm.officeName || 'Municipal Agriculture Office'}
                      </span>
                    </div>
                  </div>

                  {/* Sidebar Header Snippet Preview */}
                  <div className="mt-4 w-full bg-black/30 rounded-xl p-2.5 border border-white/10 text-left">
                    <span className="text-[9px] uppercase tracking-wider text-emerald-400 font-bold block">
                      Sidebar Masthead:
                    </span>
                    <span className="text-xs font-bold text-white block mt-0.5 truncate">
                      {brandingForm.registryTitle || 'Rice Farm Registry'}
                    </span>
                    <span className="text-[10px] text-slate-300 block truncate">
                      {brandingForm.municipalityName} • {brandingForm.officeName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: JURISDICTION & LETTERHEAD */}
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
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
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
                        className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
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
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
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

      {/* Language preferences */}
      {activeSubTab === 'display' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Interface Language</h3>
              <p className="text-xs text-slate-500">Choose the language used for prompts, forms, and report summaries.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <button type="button" onClick={() => setLanguage('EN')} className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${language === 'EN' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}>
              English (Default)
            </button>
            <button type="button" onClick={() => setLanguage('CEB')} className={`p-3 rounded-xl border text-center font-bold text-xs transition cursor-pointer ${language === 'CEB' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'}`}>
              Cebuano (Bisaya)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
