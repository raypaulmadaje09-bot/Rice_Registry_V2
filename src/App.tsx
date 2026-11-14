import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { SignInToast } from './components/SignInToast';
import { ParcelDetailModal } from './components/ParcelDetailModal';
import { ParcelDetailErrorBoundary } from './components/ParcelDetailErrorBoundary';
import { BarangayDetailModal } from './components/BarangayDetailModal';
import { AddParcelModal } from './components/AddParcelModal';
import { CropPlantingModal } from './components/CropPlantingModal';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, OfficialSealsTrio } from './components/Seals';
import { DashboardView } from './views/DashboardView';
import { LftDashboardView } from './views/LftDashboardView';
import { MapView } from './views/MapView';
import { GisMeasureView } from './views/GisMeasureView';
import { DatabaseView } from './views/DatabaseView';
import { SubsidiesView } from './views/SubsidiesView';
import { ReportsView } from './views/ReportsView';
import { AccountsView } from './views/AccountsView';
import { EvaluationView } from './views/EvaluationView';
import { SettingsView } from './views/SettingsView';
import { AccountProfileView, BarangaysView, LegalDecreesView, RegistryFormCustomizationView } from './views/AdminManagementViews';
import { FarmParcel, Barangay, PortalTab, User } from './types';
import { BARANGAYS } from './data/barangays';
import { AdminProfileModal } from './components/AdminProfileModal';
import { LftAccountSettingsModal } from './components/LftAccountSettingsModal';
import { UnifiedSidebarNav } from './components/UnifiedSidebarNav';
import { RiceSsistantChat } from './components/RiceSsistantChat';
import { SafeImage } from './components/SafeImage';
import { supabase } from './supabase';
import { isAccountActive } from './types';
import {
  hasActiveSessionUser,
  clearSessionUserKeys,
  clearSessionActiveTab,
  clearLegacyLocalAuthStorage
} from './utils/sessionAuth';
import { OfflineBanner } from './components/common/OfflineBanner';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import {
  LayoutDashboard,
  Compass,
  Wheat,
  FileText,
  Users,
  Image,
  Printer,
  LogOut,
  Globe,
  PlusCircle,
  Menu,
  X,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Download,
  Shield
} from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    isAuthLoading,
    parcels,
    addParcel,
    updateParcel,
    deleteParcel,
    language,
    setLanguage,
    t,
    bgPhotoUrl,
    bgOpacity,
    bgBlur,
    bgActive,
    adminProfile,
    municipalBranding,
    lftAccounts,
    setSettingsActiveSubTab,
    permissions,
    realtimeStatus,
    offlineQueueCount,
    isOnline,
    syncOfflineQueue,
    syncNotification,
    setSyncNotification,
    activeTab,
    setActiveTab
  } = useApp();

  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [isLftAccountModalOpen, setIsLftAccountModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Role permissions check
  const isCentralAdmin = currentUser?.role === 'Central Admin';

  // Primary view: landing page or portal (session-scoped; new Chrome/tab starts at landing & requires login)
  const [viewMode, setViewMode] = useState<'landing' | 'portal'>(() => {
    return hasActiveSessionUser() || Boolean(currentUser) ? 'portal' : 'landing';
  });

  // Keep viewMode synced with user session
  useEffect(() => {
    if (currentUser) {
      setViewMode('portal');
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeTab === 'photos') {
      if (isCentralAdmin) setSettingsActiveSubTab('media');
      setActiveTab('settings');
    }
  }, [activeTab, isCentralAdmin, setActiveTab, setSettingsActiveSubTab]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal states
  const [selectedParcel, setSelectedParcel] = useState<FarmParcel | null>(null);
  const [openCertificateOnLoad, setOpenCertificateOnLoad] = useState(false);
  const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
  const [isAddParcelOpen, setIsAddParcelOpen] = useState(false);
  const [editingParcel, setEditingParcel] = useState<FarmParcel | null>(null);
  const [isCropPlantingOpen, setIsCropPlantingOpen] = useState(false);
  const [cropTargetParcel, setCropTargetParcel] = useState<FarmParcel | null>(null);
  const [initialCoordsForAdd, setInitialCoordsForAdd] = useState<{
    lat: number;
    lng: number;
    boundaryCoords?: [number, number][];
    areaHa?: number;
    barangay?: string;
  } | null>(null);
  const [focusBarangayForMap, setFocusBarangayForMap] = useState<Barangay | null>(null);
  const [measureBarangay, setMeasureBarangay] = useState<Barangay>(BARANGAYS[0]);
  const [focusParcelForMap, setFocusParcelForMap] = useState<FarmParcel | null>(null);
  const [reportBarangayFilter, setReportBarangayFilter] = useState<string>('Balagawan');
  const [databaseSearchFilter, setDatabaseSearchFilter] = useState<string>('');

  // Dynamic user name resolution for notifications & session extraction
  const resolveCurrentUserName = () => {
    if (currentUser?.name?.trim()) return currentUser.name.trim();
    if (currentUser?.role === 'Central Admin' && adminProfile?.name?.trim()) {
      return adminProfile.name.trim();
    }
    return currentUser?.role === 'Central Admin' ? 'Admin' : 'Field Officer / Ka-Agri';
  };

  // Automatic 2-second dismiss sign-in toast notification
  const [showSignInToast, setShowSignInToast] = useState(false);
  const [signInToastData, setSignInToastData] = useState<{
    name: string;
    role: string;
    station: string;
  }>({
    name: '',
    role: 'Central Admin',
    station: 'Central Office'
  });
  const hasTriggeredInitialToastRef = useRef(false);

  // Clean up any external OAuth error URL parameters on initial load and handle ?tab= deep links
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        const tabParam = url.searchParams.get('tab');
        const routeTabs: Record<string, PortalTab> = {
          '/asf_ordinance': 'legal_decrees', '/barangays': 'barangays', '/account': 'account',
          '/admin/registry-form-customization': 'registry_form', '/admin/user-accounts': 'accounts',
          '/gis-measure': 'gis_measure', '/subsidies': 'subsidies'
        };
        const routeTab = routeTabs[url.pathname.replace(/\/$/, '')];
        const publicAllowedTabs: PortalTab[] = ['map', 'eartags', 'reports', 'evaluation', 'legal_decrees'];
        const authRequiredTabs: PortalTab[] = [
          'dashboard', 'lft_dashboard', 'brgy_dashboard', 'gis_measure', 'subsidies',
          'accounts', 'photos', 'settings', 'barangays', 'account', 'registry_form'
        ];
        const sanitizeDeepLink = (target: PortalTab): PortalTab => {
          if (!currentUser && !publicAllowedTabs.includes(target)) {
            return 'map';
          }
          if (currentUser && currentUser.role !== 'Central Admin' && ['dashboard', 'accounts', 'photos', 'registry_form', 'barangays', 'gis_measure'].includes(target)) {
            return 'lft_dashboard';
          }
          return target;
        };

        if (routeTab) {
          if (!currentUser && authRequiredTabs.includes(routeTab)) {
            setIsLoginModalOpen(true);
            setViewMode('landing');
            window.history.replaceState({}, document.title, '/');
          } else {
            setActiveTab(sanitizeDeepLink(routeTab));
            setViewMode('portal');
          }
        } else if (url.pathname.replace(/\/$/, '') === '/certificate') {
          setActiveTab('eartags');
          setViewMode('portal');
          setOpenCertificateOnLoad(true);
        } else if (tabParam === 'evaluation') {
          setActiveTab('evaluation');
          setViewMode('portal');
        } else if (tabParam && ['dashboard', 'lft_dashboard', 'brgy_dashboard', 'map', 'gis_measure', 'eartags', 'subsidies', 'reports', 'accounts', 'photos', 'settings', 'legal_decrees', 'barangays', 'account', 'registry_form'].includes(tabParam)) {
          if (!currentUser && authRequiredTabs.includes(tabParam as PortalTab)) {
            setIsLoginModalOpen(true);
            setViewMode('landing');
            url.searchParams.delete('tab');
            window.history.replaceState({}, document.title, url.toString());
          } else {
            setActiveTab(sanitizeDeepLink(tabParam as PortalTab));
            setViewMode('portal');
          }
        }

        if (
          url.searchParams.has('error') ||
          url.searchParams.has('error_description') ||
          url.hash.includes('error=') ||
          url.hash.includes('error_description=')
        ) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.warn('URL cleanup notice:', e);
      }
    }
  }, []);

  // Listen for Supabase OAuth return or existing verified session
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.email && !currentUser) {
          const userEmail = session.user.email.trim().toLowerCase();
          const registeredAdminEmail = (adminProfile?.email || 'admin@gmail.com').trim().toLowerCase();
          const isAdmin = Boolean(registeredAdminEmail && userEmail === registeredAdminEmail);

          const matchedLft = lftAccounts.find((acc) => {
            const em = (acc.email || '').trim().toLowerCase();
            return Boolean(em && em === userEmail);
          });

          if (isAdmin) {
            const adminUser: User = {
              username: 'admin.google',
              role: 'Central Admin',
              name: adminProfile.name || session.user.user_metadata?.full_name || 'Administrator',
              title: adminProfile.title || 'Municipal Agriculture Administrator',
              email: userEmail,
              contactNumber: adminProfile.contactNumber || '',
              office: adminProfile.office || 'Silago Municipal Agriculture Office (DA-MAO)',
              photoUrl: session.user.user_metadata?.avatar_url || adminProfile.photoUrl || ''
            };
            setCurrentUser(adminUser);
            setViewMode('portal');
            setActiveTab('dashboard');
          } else if (matchedLft && isAccountActive(matchedLft.status)) {
            const assignedBrgys =
              matchedLft.assignedBarangays && matchedLft.assignedBarangays.length > 0
                ? matchedLft.assignedBarangays
                : matchedLft.barangay.split(',').map((s) => s.trim()).filter(Boolean);

            const lftUser: User = {
              username: matchedLft.username,
              role: 'Barangay Focal Person',
              name: matchedLft.name,
              barangay: matchedLft.barangay,
              assignedBarangays: assignedBrgys,
              title: 'Local Farmer Technician (LFT)',
              contactNumber: matchedLft.contactNumber,
              email: matchedLft.email || userEmail,
              photoUrl: session.user.user_metadata?.avatar_url || matchedLft.photoUrl
            };
            setCurrentUser(lftUser);
            setViewMode('portal');
            setActiveTab('lft_dashboard');
          } else {
            // Unregistered Google email: reject & clear session so unauthorized users cannot enter staff portal
            await supabase.auth.signOut().catch(() => {});
          }
        }
      } catch (err) {
        console.warn('OAuth session check notice:', err);
      }
    };

    checkSupabaseAuth();
  }, [adminProfile, lftAccounts, currentUser]);

  // Trigger upon initial authenticated mount or Central Admin init
  useEffect(() => {
    if (currentUser && !hasTriggeredInitialToastRef.current) {
      hasTriggeredInitialToastRef.current = true;
      const dynamicName = resolveCurrentUserName();
      setSignInToastData({
        name: dynamicName,
        role: currentUser.role || 'Central Admin',
        station: currentUser.office || (currentUser.barangay ? `Barangay ${currentUser.barangay}` : 'Central Office')
      });
      setShowSignInToast(true);
    }
  }, [currentUser, adminProfile.name]);

  // Enforce strict role-based & authentication route boundaries across all tabs
  useEffect(() => {
    if (!currentUser) {
      const publicAllowedTabs: PortalTab[] = ['map', 'eartags', 'reports', 'evaluation', 'legal_decrees'];
      if (!publicAllowedTabs.includes(activeTab)) {
        setActiveTab('map');
      }
      return;
    }
    if (!isCentralAdmin) {
      if (activeTab === 'dashboard' || activeTab === 'accounts' || activeTab === 'photos' || activeTab === 'registry_form' || activeTab === 'barangays' || activeTab === 'gis_measure') {
        setActiveTab('lft_dashboard');
      }
    }
  }, [currentUser, isCentralAdmin, activeTab, setActiveTab]);

  const handleOpenLogin = () => setIsLoginModalOpen(true);

  const handleLoginSuccess = (user?: User) => {
    setViewMode('portal');
    const active = user || currentUser;
    if (active?.role !== 'Central Admin') {
      setActiveTab('lft_dashboard');
    } else {
      setActiveTab('dashboard');
    }
    const dynamicName = user?.name?.trim() || resolveCurrentUserName();
    setSignInToastData({
      name: dynamicName,
      role: active?.role || 'Central Admin',
      station: active?.office || (active?.barangay ? `Barangay ${active.barangay}` : 'Central Office')
    });
    setShowSignInToast(true);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    setCurrentUser(null);
    clearSessionUserKeys();
    clearSessionActiveTab();
    clearLegacyLocalAuthStorage();
    try {
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('tab');
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
    setViewMode('landing');
  };

  const handleNavigateToPortalTab = (
    tab: PortalTab,
    subTab?: 'profile' | 'municipal' | 'featured_card' | 'display' | 'media' | 'landing'
  ) => {
    const adminOnlyTabs: PortalTab[] = ['dashboard', 'accounts', 'photos', 'registry_form', 'barangays', 'gis_measure'];
    const authRequiredTabs: PortalTab[] = [...adminOnlyTabs, 'subsidies', 'settings', 'account', 'lft_dashboard', 'brgy_dashboard'];

    if (!currentUser && authRequiredTabs.includes(tab)) {
      setIsLoginModalOpen(true);
      return;
    }
    if (currentUser && !isCentralAdmin && adminOnlyTabs.includes(tab)) {
      setActiveTab('lft_dashboard');
      setViewMode('portal');
      return;
    }

    if (tab === 'dashboard' && currentUser && currentUser.role !== 'Central Admin') {
      setActiveTab('lft_dashboard');
    } else {
      setActiveTab(tab);
    }
    if (subTab && isCentralAdmin) {
      setSettingsActiveSubTab(subTab);
    }
    setViewMode('portal');
  };

  const handleSaveParcel = async (parcel: FarmParcel) => {
    if (editingParcel) {
      await updateParcel(parcel.tagNumber, parcel);
      setEditingParcel(null);
    } else {
      await addParcel(parcel);
    }
  };

  // Get view title for header
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return t('nav.dashboard', 'Executive Dashboard');
      case 'lft_dashboard':
        return t('nav.lftDashboard', 'LFT Field Dashboard');
      case 'map':
        return t('nav.map', 'GIS Rice Farm Map & Georeferenced Polygons');
      case 'gis_measure':
        return 'Measure GIS: Plot & Measure Boundary';
      case 'eartags':
        return t('nav.database', 'Rice Farm Records Database');
      case 'subsidies':
        return t('nav.subsidies', 'Seed & Fertilizer Claims');
      case 'reports':
        return t('nav.reports', 'Official Rice Farm Registry Reports');
      case 'accounts':
        return 'Manage System Accounts & Access';
      case 'photos':
        return t('nav.photos', 'Photo, Media & Municipal Seals Settings');
      case 'evaluation':
        return t('nav.evaluation', 'ISO/IEC 25010 Software Quality Evaluation');
      case 'settings':
        return isCentralAdmin ? 'Settings' : t('nav.settings', 'Account Settings');
      case 'legal_decrees': return 'Legal Decrees & Ordinances Management';
      case 'barangays': return 'Manage Silago Barangays';
      case 'account': return 'My Account & Profile Settings';
      case 'registry_form': return 'Form Customization';
      default:
        return t('common.appTitle', 'Rice Farm Registry and Georeferencing');
    }
  };

  const getHeaderDescription = () => {
    const descriptions: Partial<Record<PortalTab, string>> = {
      dashboard: 'A clear overview of registry activity, coverage, and recent updates.',
      lft_dashboard: 'Your field workspace for barangay records, tasks, and local updates.',
      map: 'Explore registered farms and barangay boundaries across Silago.',
      gis_measure: 'Plot, edit, and measure an official barangay boundary.',
      eartags: 'Search, review, and maintain registered rice farm records.',
      subsidies: 'Track government free seedlings and fertilizer distributions and mark claimed riceland owners.',
      reports: 'Prepare and print official registry summaries and documents.',
      accounts: 'Create and manage accounts for Agricultural Extension Focal Persons and registry staff.',
      photos: 'Organize registry media and municipal identity assets.',
      evaluation: 'Review system quality indicators and evaluation results.',
      settings: 'Manage your account, municipal registry details, media, and display preferences.'
      , legal_decrees: 'Official law registry · Legislative database of enacted municipal ordinances and references.'
      , barangays: 'Configure all 15 barangay jurisdictions, GIS boundaries, land area, and extension worker assignments.'
      , account: 'Manage your officer profile, contact details, and account security.'
      , registry_form: 'Configure the fields displayed in the Rice Farm Registration and Crop & Planting forms.'
    };
    return descriptions[activeTab] || 'Rice Farm Registry and Georeferencing';
  };

  if (isAuthLoading && !currentUser) {
    return (
      <div className="min-h-screen bg-[#0c2340] text-white flex flex-col items-center justify-center p-6 relative">
        <div className="flex flex-col items-center max-w-sm text-center space-y-4">
          <OfficialSealsTrio />
          <div className="flex items-center gap-2.5 mt-2">
            <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold tracking-wide text-slate-200">
              Checking municipal session...
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Silago Rice Farm Registry & Georeferencing System
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 relative selection:bg-emerald-700 selection:text-white">
      {/* Dynamic Background Image Layer */}
      {bgActive && bgPhotoUrl && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url("${bgPhotoUrl}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            opacity: bgOpacity > 1 ? bgOpacity / 100 : bgOpacity,
            filter: `blur(${bgBlur}px)`
          }}
        />
      )}

      {/* Top Offline Detection & Queued Sync Banner */}
      <OfflineBanner />

      {/* View Switcher: Public Landing Page vs Authenticated / LFT Portal */}
      {viewMode === 'landing' ? (
        <div className="relative z-10">
          <LandingPage
            onOpenLogin={handleOpenLogin}
            onNavigateToPortalTab={(tab, subTab) => handleNavigateToPortalTab(tab as PortalTab, subTab)}
            onSelectBarangayForMap={(b) => setFocusBarangayForMap(b)}
          />
        </div>
      ) : (
        <div className={`app-portal relative z-10 flex min-h-screen ${bgActive && bgPhotoUrl ? 'has-portal-wallpaper bg-transparent' : 'bg-[#f4f6f1]'}`}>
          {/* Mobile Sidebar Backdrop */}
          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-slate-950/40 z-40 lg:hidden backdrop-blur-sm"
            />
          )}

          {/* Registry navigation */}
          <aside
            className={`portal-sidebar fixed inset-y-0 left-0 z-50 bg-gov-forest text-white flex flex-col justify-between border-r border-gov-forest-dark transition-all duration-300 lg:translate-x-0 lg:static lg:h-screen shrink-0 ${
              mobileSidebarOpen ? 'translate-x-0 w-68' : '-translate-x-full lg:translate-x-0'
            } ${isSidebarCollapsed ? 'lg:w-[70px]' : 'lg:w-68'}`}
          >
            {/* Top Branding & Seals */}
            {!isSidebarCollapsed ? (
              <div className="p-3.5 border-b border-white/10 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <OfficialSealsTrio />
                  <div className="flex items-center gap-1">
                    {/* Mobile Sidebar Close Button */}
                    <button
                      type="button"
                      onClick={() => setMobileSidebarOpen(false)}
                      className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded-sm bg-white/10 text-emerald-100 border border-white/15 uppercase tracking-wider inline-block">
                      {isCentralAdmin ? 'Central Admin' : permissions.isLftOfficer ? 'LFT Officer' : 'Visitor'}
                    </span>
                    {!isOnline ? (
                      <button
                        type="button"
                        onClick={() => syncOfflineQueue()}
                        className="flex items-center gap-1 text-[9.5px] font-semibold text-amber-300 hover:text-amber-200 transition cursor-pointer"
                        title="Click to attempt synchronization"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>Offline ({offlineQueueCount})</span>
                      </button>
                    ) : offlineQueueCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => syncOfflineQueue()}
                        className="flex items-center gap-1 text-[9.5px] font-semibold text-sky-300 hover:text-white transition cursor-pointer"
                        title="Records queued offline. Click to upload now."
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                        <span>Syncing ({offlineQueueCount})</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[9.5px] font-semibold text-emerald-300" title="Connected to Supabase Realtime">
                        <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                        <span>{realtimeStatus === 'connected' ? 'Live Synced' : realtimeStatus}</span>
                      </div>
                    )}
                  </div>
                  <span className="font-serif text-[13px] font-bold text-white block leading-snug mt-1.5">
                    {municipalBranding?.registryTitle || 'Rice Farm Registry & GIS'}
                  </span>
                  <p className="text-[10px] text-white/65 leading-tight">
                    {municipalBranding?.municipalityName || 'Municipality of Silago'} • {municipalBranding?.officeName || 'Municipal Agriculture Office'}
                  </p>
                </div>

                {/* User Profile Card */}
                <div className="bg-white/[0.05] border border-white/12 rounded p-2 flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded bg-gov-green text-white font-bold flex items-center justify-center text-xs overflow-hidden border border-white/20">
                      {(currentUser?.photoUrl || (isCentralAdmin && adminProfile.photoUrl)) ? (
                        <SafeImage
                          src={currentUser?.photoUrl || (isCentralAdmin ? adminProfile.photoUrl : '')}
                          alt="User Avatar"
                          fallbackType="farmer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{currentUser?.name ? currentUser.name.charAt(0) : (isCentralAdmin ? 'A' : permissions.isLftOfficer ? 'L' : 'P')}</span>
                      )}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-gov-forest ${currentUser ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-white block truncate leading-tight">
                      {currentUser?.name || (isCentralAdmin ? adminProfile.name : 'Public Visitor')}
                    </span>
                    <span className="text-[10px] text-white/65 block truncate leading-tight mt-0.5">
                      {currentUser?.title || (isCentralAdmin ? adminProfile.title : 'Read-Only Mode')}
                    </span>
                  </div>
                  {!currentUser && (
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-2 py-1 bg-gov-green hover:bg-emerald-800 text-white rounded text-[10px] font-semibold transition cursor-pointer shrink-0"
                    >
                      Login
                    </button>
                  )}
                </div>

                {/* Action Button 1: + Register Farmer & Farm */}
                <button
                  type="button"
                  onClick={() => {
                    if (permissions.isPublicVisitor) {
                      setIsLoginModalOpen(true);
                      return;
                    }
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded border border-white/20 bg-gov-green hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-200" />
                  <span>{permissions.isPublicVisitor ? '+ Register (Login Required)' : '+ Register Farmer & Farm'}</span>
                </button>

                {/* Action Button 2: Separate Crop & Planting Form */}
                {!permissions.isPublicVisitor && (
                  <button
                    type="button"
                    onClick={() => {
                      setCropTargetParcel(null);
                      setIsCropPlantingOpen(true);
                      setMobileSidebarOpen(false);
                    }}
                    className="w-full py-1.5 px-3 rounded border border-white/15 bg-white/[0.06] hover:bg-white/12 text-white/95 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Wheat className="w-3.5 h-3.5 text-amber-300" />
                    <span>Crop &amp; Planting Form</span>
                  </button>
                )}
              </div>
            ) : (
              /* Collapsed Mini Header for Desktop */
              <div className="p-2.5 border-b border-white/10 flex flex-col items-center space-y-2 shrink-0">
                <SilagoSeal size={28} />
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4 text-emerald-300" />
                </button>

                {/* Mini Profile Trigger */}
                <div
                  onClick={() => {
                    if (!currentUser) {
                      setIsLoginModalOpen(true);
                    } else if (isCentralAdmin) {
                      setIsAdminProfileOpen(true);
                    } else {
                      setIsLftAccountModalOpen(true);
                    }
                  }}
                  className="relative cursor-pointer group"
                  title={!currentUser ? 'Public Visitor - Click to Sign In' : `${currentUser?.name || (isCentralAdmin ? adminProfile.name : 'Authorized LFT')} - Settings`}
                >
                  <div className="w-8 h-8 rounded-md bg-emerald-800 text-white font-bold flex items-center justify-center text-xs overflow-hidden border border-white/20">
                    {(currentUser?.photoUrl || (isCentralAdmin && adminProfile.photoUrl)) ? (
                      <SafeImage
                        src={currentUser?.photoUrl || (isCentralAdmin ? adminProfile.photoUrl : '')}
                        alt="User Avatar"
                        fallbackType="farmer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{currentUser?.name ? currentUser.name.charAt(0) : (isCentralAdmin ? 'A' : currentUser ? 'L' : 'P')}</span>
                    )}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#163729] ${currentUser ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                </div>

                {/* Mini + Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (permissions.isPublicVisitor) {
                      setIsLoginModalOpen(true);
                      return;
                    }
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                  }}
                  className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white flex items-center justify-center transition cursor-pointer"
                  title={permissions.isPublicVisitor ? 'Sign in required to register parcels' : 'Register Farmer & Farm'}
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                </button>

                {!permissions.isPublicVisitor && (
                  <button
                    type="button"
                    onClick={() => {
                      setCropTargetParcel(null);
                      setIsCropPlantingOpen(true);
                    }}
                    className="w-8 h-8 rounded-md bg-white/5 hover:bg-white/10 border border-white/20 text-amber-300 flex items-center justify-center transition cursor-pointer"
                    title="Crop & Planting Form (Select Registered Farmer)"
                  >
                    <Wheat className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Unified Accordion Sidebar Navigation Component */}
            <UnifiedSidebarNav
              activeTab={activeTab}
              onNavigateTab={(tab) => {
                handleNavigateToPortalTab(tab);
                setMobileSidebarOpen(false);
              }}
              onOpenPublicPortal={() => {
                setViewMode('landing');
                setMobileSidebarOpen(false);
              }}
              onOpenAddParcel={() => {
                if (permissions.isPublicVisitor) {
                  setIsLoginModalOpen(true);
                } else {
                  setEditingParcel(null);
                  setIsAddParcelOpen(true);
                }
                setMobileSidebarOpen(false);
              }}
              onOpenAccount={() => {
                if (!currentUser) setIsLoginModalOpen(true);
                else if (isCentralAdmin) setIsAdminProfileOpen(true);
                else setIsLftAccountModalOpen(true);
                setMobileSidebarOpen(false);
              }}
              isAuthenticated={Boolean(currentUser)}
              isCentralAdmin={isCentralAdmin}
              isSidebarCollapsed={isSidebarCollapsed}
              parcelsCount={parcels.length}
            />

            {/* Bottom Controls */}
            {!isSidebarCollapsed ? (
              <div className="p-3 border-t border-white/10 space-y-2 text-xs shrink-0">
                {/* Language Switcher */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Language</span>
                  <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10 gap-0.5">
                    <button
                      type="button"
                      onClick={() => setLanguage('EN')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        language === 'EN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('CEB')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        language === 'CEB' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      CEB
                    </button>
                  </div>
                </div>

                {/* Status Row */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full inline-block ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    <span className="text-white font-medium">{isOnline ? 'Online' : 'Offline'}</span>
                  </div>
                  <span className="text-slate-400 font-medium">GIS Synced</span>
                </div>

                {/* Sign Out Button */}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-1.5 py-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 text-xs font-medium transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              /* Collapsed Mini Footer */
              <div className="p-2 border-t border-white/10 flex flex-col items-center space-y-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setLanguage(language === 'EN' ? 'CEB' : 'EN')}
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[10px] flex items-center justify-center transition cursor-pointer"
                  title={`Language: ${language === 'EN' ? 'English (Click for Cebuano)' : 'Cebuano (Click for English)'}`}
                >
                  {language}
                </button>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online & GIS Synced" />
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
            {/* Flush Formal Office Top Header Bar */}
            <header className="portal-topbar bg-white border-b border-gov-line px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Mobile sidebar toggle button */}
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden p-1.5 rounded border border-gov-line text-gov-muted hover:bg-gov-canvas transition cursor-pointer"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-4 h-4" />
                </button>

                {/* Desktop sidebar collapse/expand toggle button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden lg:flex p-1.5 rounded border border-gov-line text-gov-muted hover:bg-gov-canvas hover:text-gov-ink transition cursor-pointer"
                  title={isSidebarCollapsed ? "Expand Sidebar (Full labels)" : "Collapse Sidebar (Icon rail)"}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="w-4 h-4 text-gov-green" />
                  ) : (
                    <PanelLeftClose className="w-4 h-4" />
                  )}
                </button>

                <span className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gov-line bg-gov-canvas p-0.5">
                  <SilagoSeal size={28} className="h-full w-full rounded-full object-contain" />
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-serif font-bold text-[15px] text-gov-ink tracking-tight truncate">
                      {municipalBranding?.municipalityName ? municipalBranding.municipalityName.toUpperCase() : 'MUNICIPALITY OF SILAGO'}
                    </span>
                    <span className="gov-badge gov-badge-green">
                      {isCentralAdmin ? 'Admin' : permissions.isLftOfficer ? 'LFT Officer' : 'Public'}
                    </span>
                    <span className="hidden md:inline text-[10.5px] font-semibold uppercase tracking-widest text-gov-muted truncate">
                      {municipalBranding?.registryTitle ? municipalBranding.registryTitle.toUpperCase() : 'MUNICIPAL RICE REGISTRY & GEOREFERENCING'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gov-muted mt-0.5">
                    <span>Workspace</span>
                    <span>&rsaquo;</span>
                    <span className="font-semibold text-gov-ink">
                      {activeTab === 'eartags' ? 'Rice Records' : getHeaderTitle()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {currentUser?.username === 'silago.test' && (
                  <span className="hidden sm:inline-flex gov-badge gov-badge-gold uppercase tracking-wide">
                    Test Account
                  </span>
                )}
                {/* PWA Install Button */}
                <PWAInstallButton compact className="hidden sm:inline-flex" />

                {/* Clean Rectangular Office User Menu */}
                <div
                  onClick={() => {
                    if (!currentUser) setIsLoginModalOpen(true);
                    else if (isCentralAdmin) setIsAdminProfileOpen(true);
                    else setIsLftAccountModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-2.5 py-1 rounded border border-gov-line bg-white hover:bg-gov-canvas transition cursor-pointer ml-1"
                  title="User Account & Settings"
                >
                  <div className="w-7 h-7 rounded-sm bg-gov-forest text-white font-semibold flex items-center justify-center text-xs overflow-hidden">
                    {currentUser?.photoUrl || (isCentralAdmin && adminProfile.photoUrl) ? (
                      <SafeImage
                        src={currentUser?.photoUrl || (isCentralAdmin ? adminProfile.photoUrl : '')}
                        alt="Avatar"
                        fallbackType="farmer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{currentUser?.name ? currentUser.name.charAt(0) : (isCentralAdmin ? 'A' : permissions.isLftOfficer ? 'L' : 'P')}</span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-gov-ink leading-tight">
                      {currentUser?.name || 'Public Visitor'}
                    </span>
                    <span className="text-[10px] text-gov-muted leading-tight">
                      {currentUser?.title || 'Click to Sign In'}
                    </span>
                  </div>
                </div>
              </div>
            </header>

            {/* Body View Area */}
            <main className={`portal-content flex-1 p-4 sm:p-5 lg:p-6 ${bgActive && bgPhotoUrl ? 'bg-transparent' : 'bg-gov-canvas'}`}>
              {activeTab === 'dashboard' && isCentralAdmin && (
                <DashboardView
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onSelectParcel={(p) => setSelectedParcel(p)}
                  onOpenAddParcel={() => {
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                  }}
                  onOpenCropPlanting={() => {
                    setCropTargetParcel(null);
                    setIsCropPlantingOpen(true);
                  }}
                  onSelectBarangay={(b) => setSelectedBarangay(b)}
                />
              )}

              {activeTab === 'lft_dashboard' && Boolean(currentUser) && (
                <LftDashboardView
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onSelectParcel={(p) => setSelectedParcel(p)}
                  onOpenAddParcel={() => {
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                  }}
                  onOpenCropPlanting={() => {
                    setCropTargetParcel(null);
                    setIsCropPlantingOpen(true);
                  }}
                  onSelectBarangay={(b) => setSelectedBarangay(b)}
                />
              )}

              {!currentUser && !['map', 'eartags', 'reports', 'evaluation', 'legal_decrees'].includes(activeTab) && (
                <div className="max-w-lg mx-auto my-12 bg-white border border-slate-300 rounded-md p-6 text-center space-y-4">
                  <div className="w-10 h-10 rounded-md bg-slate-100 border border-slate-300 text-emerald-800 flex items-center justify-center mx-auto">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-slate-900">Sign In Required</h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Authorized Municipal Agriculture Office or LFT credentials are required to access the Dashboard.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-4 py-2 rounded-md bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold transition cursor-pointer"
                    >
                      Sign In to Portal
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('map')}
                      className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      Open GIS Rice Map
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'map' && (
                <MapView
                  onSelectParcel={(p) => setSelectedParcel(p)}
                  onOpenAddParcelWithCoords={(coords) => {
                    setEditingParcel(null);
                    setInitialCoordsForAdd(coords);
                    setIsAddParcelOpen(true);
                  }}
                  focusBarangay={focusBarangayForMap}
                  focusParcel={focusParcelForMap}
                  onOpenLogin={() => setIsLoginModalOpen(true)}
                />
              )}

              {activeTab === 'gis_measure' && isCentralAdmin && <GisMeasureView key={measureBarangay.name} barangay={measureBarangay} onSaveAndReturn={() => setActiveTab('barangays')} />}

              {activeTab === 'eartags' && (
                <DatabaseView
                  initialSearchQuery={databaseSearchFilter}
                  openCertificateOnLoad={openCertificateOnLoad}
                  onCertificateRouteHandled={() => setOpenCertificateOnLoad(false)}
                  onSelectParcel={(p) => setSelectedParcel(p)}
                  onEditParcel={(p) => {
                    setEditingParcel(p);
                    setIsAddParcelOpen(true);
                  }}
                  onOpenAddParcel={() => {
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                  }}
                  onOpenCropPlanting={(p) => {
                    setCropTargetParcel(p || null);
                    setIsCropPlantingOpen(true);
                  }}
                  onOpenPublicInterface={() => setViewMode('landing')}
                  onNavigateToReports={(b) => {
                    if (b) setReportBarangayFilter(b);
                    setActiveTab('reports');
                  }}
                  onLocateOnMap={(p) => {
                    setFocusParcelForMap(p);
                    setActiveTab('map');
                    setViewMode('portal');
                  }}
                />
              )}

              {activeTab === 'subsidies' && Boolean(currentUser) && <SubsidiesView />}

              {activeTab === 'reports' && <ReportsView initialBarangay={reportBarangayFilter} />}

              {activeTab === 'accounts' && isCentralAdmin && <AccountsView />}

              {activeTab === 'evaluation' && <EvaluationView />}

              {activeTab === 'settings' && isCentralAdmin && (
                <SettingsView
                  onNavigateToLanding={() => setViewMode('landing')}
                />
              )}
              {activeTab === 'settings' && !isCentralAdmin && (
                <div className="max-w-lg mx-auto my-12 bg-white border border-gov-line rounded p-6 text-center space-y-4">
                  <div className="w-10 h-10 rounded bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center mx-auto">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-gov-ink">Central Admin Access Only</h2>
                    <p className="text-xs text-gov-muted leading-relaxed">
                      System Settings, Portal Wallpapers, and Branding configurations are strictly restricted to Central Municipal Administrators.
                    </p>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab(currentUser?.role === 'Barangay Focal Person' ? 'lft_dashboard' : 'map')}
                      className="gov-btn gov-btn-primary"
                    >
                      Return to Dashboard
                    </button>
                  </div>
                </div>
              )}
              {activeTab === 'legal_decrees' && <LegalDecreesView />}
              {activeTab === 'barangays' && isCentralAdmin && <BarangaysView onNavigate={setActiveTab} onMeasureBarangay={(barangay) => {
                setMeasureBarangay(barangay);
                setActiveTab('gis_measure');
                setViewMode('portal');
              }} />}
              {activeTab === 'account' && currentUser && <AccountProfileView onSignOut={handleSignOut} />}
              {activeTab === 'registry_form' && isCentralAdmin && <RegistryFormCustomizationView />}
            </main>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {selectedParcel && (
        <ParcelDetailErrorBoundary onClose={() => setSelectedParcel(null)}>
          <ParcelDetailModal
            parcel={selectedParcel}
            onClose={() => setSelectedParcel(null)}
            onEdit={(p) => {
              setEditingParcel(p);
              setIsAddParcelOpen(true);
            }}
            onDelete={(tag) => {
              deleteParcel(tag);
              setSelectedParcel(null);
            }}
          />
        </ParcelDetailErrorBoundary>
      )}

      <BarangayDetailModal
        barangay={selectedBarangay}
        parcels={parcels}
        onClose={() => setSelectedBarangay(null)}
        onSelectParcel={(p) => setSelectedParcel(p)}
        onViewOnMap={(b) => {
          setFocusBarangayForMap(b);
          setActiveTab('map');
          setViewMode('portal');
        }}
      />

      <AddParcelModal
        isOpen={isAddParcelOpen}
        onClose={() => {
          setIsAddParcelOpen(false);
          setEditingParcel(null);
          setInitialCoordsForAdd(null);
        }}
        onSave={handleSaveParcel}
        onDelete={(tag) => {
          deleteParcel(tag);
          setIsAddParcelOpen(false);
          setEditingParcel(null);
        }}
        editingParcel={editingParcel}
        initialCoords={initialCoordsForAdd}
        defaultBarangay={currentUser?.barangay}
      />

      <CropPlantingModal
        isOpen={isCropPlantingOpen}
        initialParcel={cropTargetParcel}
        onClose={() => {
          setIsCropPlantingOpen(false);
          setCropTargetParcel(null);
        }}
      />

      <AdminProfileModal
        isOpen={isAdminProfileOpen}
        onClose={() => setIsAdminProfileOpen(false)}
      />

      <LftAccountSettingsModal
        isOpen={isLftAccountModalOpen}
        onClose={() => setIsLftAccountModalOpen(false)}
      />

      {/* Automatic 2-second dismiss sign-in toast notification */}
      <SignInToast
        isOpen={showSignInToast}
        name={signInToastData.name}
        role={signInToastData.role}
        station={signInToastData.station}
        onDismiss={() => setShowSignInToast(false)}
        autoDismissMs={2000}
      />

      {/* Floating Offline Sync Notification Banner */}
      {syncNotification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-[#0c2340] border-2 border-emerald-500/80 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-xs font-semibold text-emerald-100">{syncNotification}</span>
            <button
              type="button"
              onClick={() => setSyncNotification(null)}
              className="text-slate-400 hover:text-white p-1 ml-1 rounded transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating AI Chatbot Assistant (RiceSsistant - Role-restricted to Central Admin & LFT Field Officers) */}
      <RiceSsistantChat
        viewMode={viewMode}
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          handleNavigateToPortalTab(tab);
        }}
        onOpenAddParcelModal={() => {
          setEditingParcel(null);
          setInitialCoordsForAdd(null);
          setIsAddParcelOpen(true);
        }}
        onLocateParcelOnMap={(parcel) => {
          setFocusParcelForMap(parcel);
          setActiveTab('map');
          setViewMode('portal');
        }}
        onFilterRecords={(term) => {
          setDatabaseSearchFilter(term);
          setActiveTab('eartags');
          setViewMode('portal');
        }}
        onViewParcelRecord={(parcel) => {
          setSelectedParcel(parcel);
        }}
        onFilterReportBarangay={(b) => {
          setReportBarangayFilter(b);
          setActiveTab('reports');
        }}
        onFocusBarangayOnMap={(b) => {
          const matched = BARANGAYS.find((brgy) => brgy.name.toLowerCase() === b.toLowerCase());
          if (matched) {
            setFocusBarangayForMap(matched);
          }
          setActiveTab('map');
          setViewMode('portal');
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
