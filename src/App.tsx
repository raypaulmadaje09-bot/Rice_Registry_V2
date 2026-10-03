import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { SignInToast } from './components/SignInToast';
import { ParcelDetailModal } from './components/ParcelDetailModal';
import { BarangayDetailModal } from './components/BarangayDetailModal';
import { AddParcelModal } from './components/AddParcelModal';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, OfficialSealsTrio } from './components/Seals';
import { DashboardView } from './views/DashboardView';
import { LftDashboardView } from './views/LftDashboardView';
import { MapView } from './views/MapView';
import { DatabaseView } from './views/DatabaseView';
import { ReportsView } from './views/ReportsView';
import { AccountsView } from './views/AccountsView';
import { PhotosView } from './views/PhotosView';
import { SettingsView } from './views/SettingsView';
import { FarmParcel, Barangay, PortalTab, User } from './types';
import { BARANGAYS } from './data/barangays';
import { AdminProfileModal } from './components/AdminProfileModal';
import { LftAccountSettingsModal } from './components/LftAccountSettingsModal';
import { UnifiedSidebarNav } from './components/UnifiedSidebarNav';
import { AgriGisChatbot } from './components/AgriGisChatbot';
import { SafeImage } from './components/SafeImage';
import { supabase } from './supabase';
import { isAccountActive } from './types';
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
  Settings,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ExternalLink
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
    bgPhotoUrl,
    bgOpacity,
    bgBlur,
    bgActive,
    adminProfile,
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

  // Primary view: landing page or portal (persisted with user session)
  const [viewMode, setViewMode] = useState<'landing' | 'portal'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored =
          localStorage.getItem('silago_rice_auth_user') ||
          localStorage.getItem('silago_rice_user_session') ||
          localStorage.getItem('silago_rice_auth_session') ||
          localStorage.getItem('rice_registry_user_session') ||
          localStorage.getItem('silago_current_user');
        if (stored) return 'portal';
      }
    } catch {}
    return currentUser ? 'portal' : 'landing';
  });

  // Keep viewMode synced with user session
  useEffect(() => {
    if (currentUser) {
      setViewMode('portal');
    }
  }, [currentUser]);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modal states
  const [selectedParcel, setSelectedParcel] = useState<FarmParcel | null>(null);
  const [selectedBarangay, setSelectedBarangay] = useState<Barangay | null>(null);
  const [isAddParcelOpen, setIsAddParcelOpen] = useState(false);
  const [editingParcel, setEditingParcel] = useState<FarmParcel | null>(null);
  const [initialCoordsForAdd, setInitialCoordsForAdd] = useState<{
    lat: number;
    lng: number;
    boundaryCoords?: [number, number][];
    areaHa?: number;
    barangay?: string;
  } | null>(null);
  const [focusBarangayForMap, setFocusBarangayForMap] = useState<Barangay | null>(null);
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

  // Clean up any external OAuth error URL parameters on initial load to maintain a pristine preview
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
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
          const userEmail = session.user.email.toLowerCase();
          const isAdmin =
            userEmail === (adminProfile?.email || '').toLowerCase() ||
            userEmail.includes('admin') ||
            userEmail.includes('coordinator');

          const matchedLft = lftAccounts.find((acc) => {
            const em = (acc.email || '').toLowerCase();
            const u = acc.username.toLowerCase();
            return em === userEmail || userEmail.startsWith(u + '@');
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
            // Authorized municipal / field user session - do not auto sign out
            const staffUser: User = {
              username: userEmail.split('@')[0],
              role: 'Central Admin',
              name: session.user.user_metadata?.full_name || userEmail.split('@')[0],
              title: 'Municipal Agriculture Administrator',
              email: userEmail,
              photoUrl: session.user.user_metadata?.avatar_url || ''
            };
            setCurrentUser(staffUser);
            setViewMode('portal');
            setActiveTab('dashboard');
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

  // Enforce access boundaries: LFTs can access lft_dashboard, map, eartags, reports, settings
  useEffect(() => {
    if (currentUser && !isCentralAdmin) {
      if (activeTab === 'dashboard' || activeTab === 'accounts' || activeTab === 'photos') {
        setActiveTab('lft_dashboard');
      }
    }
  }, [currentUser, isCentralAdmin, activeTab]);

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
    try {
      localStorage.removeItem('silago_rice_auth_user');
      localStorage.removeItem('silago_rice_user_session');
      localStorage.removeItem('silago_rice_auth_session');
      localStorage.removeItem('rice_registry_user_session');
      localStorage.removeItem('silago_current_user');
      localStorage.removeItem('silago_active_tab');
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
    subTab?: 'profile' | 'municipal' | 'featured_card' | 'display'
  ) => {
    if (tab === 'dashboard' && currentUser?.role !== 'Central Admin') {
      setActiveTab('lft_dashboard');
    } else {
      setActiveTab(tab);
    }
    if (subTab) {
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
        return 'Executive Dashboard';
      case 'lft_dashboard':
        return 'LFT Field Dashboard';
      case 'map':
        return 'GIS Rice Farm Map & Georeferenced Polygons';
      case 'eartags':
        return 'Rice Farm Records Database';
      case 'reports':
        return 'Official Rice Farm Registry Reports';
      case 'accounts':
        return 'LFT Accounts & Settings';
      case 'photos':
        return 'Photo, Media & Municipal Seals Settings';
      case 'settings':
        return isCentralAdmin ? 'System & Admin Settings' : 'LFT Account Settings';
      default:
        return 'Rice Farm Registry and Georeferencing';
    }
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
    <div className="min-h-screen bg-slate-100 text-slate-900 relative selection:bg-blue-600 selection:text-white">
      {/* Dynamic Background Image Layer */}
      {bgActive && (
        <div
          className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-700"
          style={{
            backgroundImage: `url(${bgPhotoUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            opacity: bgOpacity > 1 ? bgOpacity / 100 : bgOpacity,
            filter: `blur(${bgBlur}px)`
          }}
        />
      )}

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
        <div className="relative z-10 flex min-h-screen bg-[#f8fafc]">
          {/* Mobile Sidebar Backdrop */}
          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
            />
          )}

          {/* Left Dark Navy Sidebar matching System Specs */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 bg-[#0c2340] text-white flex flex-col justify-between border-r border-slate-800 shadow-xl transition-all duration-300 lg:translate-x-0 lg:static lg:h-screen shrink-0 ${
              mobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
            } ${isSidebarCollapsed ? 'lg:w-[74px]' : 'lg:w-72'}`}
          >
            {/* Top Branding & Seals */}
            {!isSidebarCollapsed ? (
              <div className="p-3.5 border-b border-white/10 space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <OfficialSealsTrio />
                  <div className="flex items-center gap-1">
                    {/* Desktop Sidebar Collapse Button */}
                    <button
                      type="button"
                      onClick={() => setIsSidebarCollapsed(true)}
                      className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                      title="Collapse sidebar to icon view"
                    >
                      <PanelLeftClose className="w-4 h-4" />
                    </button>
                    {/* Mobile Sidebar Close Button */}
                    <button
                      type="button"
                      onClick={() => setMobileSidebarOpen(false)}
                      className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-sky-500/20 text-[#38bdf8] border border-sky-400/30 uppercase tracking-wider inline-block">
                      {isCentralAdmin ? 'CENTRAL ADMIN' : permissions.isLftOfficer ? 'LFT FIELD OPERATOR' : 'PUBLIC VISITOR'}
                    </span>
                    {!isOnline ? (
                      <button
                        type="button"
                        onClick={() => syncOfflineQueue()}
                        className="flex items-center gap-1 text-[9.5px] font-bold text-amber-300 hover:text-amber-200 transition cursor-pointer"
                        title="Click to attempt synchronization"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Offline ({offlineQueueCount} record{offlineQueueCount === 1 ? '' : 's'} queued)</span>
                      </button>
                    ) : offlineQueueCount > 0 ? (
                      <button
                        type="button"
                        onClick={() => syncOfflineQueue()}
                        className="flex items-center gap-1 text-[9.5px] font-bold text-sky-300 hover:text-white transition cursor-pointer"
                        title="Records queued offline. Click to upload now."
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                        <span>Syncing ({offlineQueueCount} queued)</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-[9.5px] font-bold text-emerald-400" title="Connected to Supabase Realtime">
                        <span className={`w-1.5 h-1.5 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                        <span>{realtimeStatus === 'connected' ? 'Live Synced' : realtimeStatus}</span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-white block leading-snug mt-1">
                    Rice Farm Registry &amp; GIS
                  </span>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Municipality of Silago • DA-MAO
                  </p>
                </div>

                {/* User Profile Card */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden border border-white/20">
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
                    <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#0c2340] ${currentUser ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-white block truncate leading-tight">
                      {currentUser?.name || (isCentralAdmin ? adminProfile.name : 'Public Visitor')}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate leading-tight mt-0.5">
                      {currentUser?.title || (isCentralAdmin ? adminProfile.title : 'Read-Only Mode')}
                    </span>
                  </div>
                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (isCentralAdmin) {
                          setIsAdminProfileOpen(true);
                        } else {
                          setIsLftAccountModalOpen(true);
                        }
                      }}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
                      title={isCentralAdmin ? 'Profile & Password Settings' : 'LFT Account Settings'}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition cursor-pointer shrink-0"
                    >
                      Login
                    </button>
                  )}
                </div>

                {/* Action Button: + Add Rice Farm Registration */}
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
                  className="w-full py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md hover:shadow-blue-500/20 active:scale-[0.98]"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-blue-200" />
                  <span>{permissions.isPublicVisitor ? '+ Add (Staff Login Required)' : '+ Add Rice Farm Registration'}</span>
                </button>
              </div>
            ) : (
              /* Collapsed Mini Header for Desktop */
              <div className="p-2.5 border-b border-white/10 flex flex-col items-center space-y-2.5 shrink-0">
                <SilagoSeal size={28} />
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="w-4 h-4 text-blue-400" />
                </button>

                {/* Mini Profile Trigger */}
                <div
                  onClick={() => {
                    if (isCentralAdmin) {
                      setIsAdminProfileOpen(true);
                    } else {
                      setIsLftAccountModalOpen(true);
                    }
                  }}
                  className="relative cursor-pointer group"
                  title={`${currentUser?.name || (isCentralAdmin ? adminProfile.name : 'Authorized LFT')} - Settings`}
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs overflow-hidden border border-white/20">
                    {(currentUser?.photoUrl || (isCentralAdmin && adminProfile.photoUrl)) ? (
                      <SafeImage
                        src={currentUser?.photoUrl || (isCentralAdmin ? adminProfile.photoUrl : '')}
                        alt="User Avatar"
                        fallbackType="farmer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{currentUser?.name ? currentUser.name.charAt(0) : (isCentralAdmin ? 'A' : 'L')}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-[#0c2340]" />
                </div>

                {/* Mini + Button */}
                <button
                  type="button"
                  onClick={() => {
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                  }}
                  className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition shadow-sm cursor-pointer"
                  title="Add Rice Farm Registration"
                >
                  <PlusCircle className="w-4 h-4 text-white" />
                </button>
              </div>
            )}

            {/* Unified Accordion Sidebar Navigation Component */}
            <UnifiedSidebarNav
              activeTab={activeTab}
              onNavigateTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
              onOpenPublicPortal={() => {
                setViewMode('landing');
                setMobileSidebarOpen(false);
              }}
              onOpenAddParcel={() => {
                setEditingParcel(null);
                setIsAddParcelOpen(true);
                setMobileSidebarOpen(false);
              }}
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
                  <div className="flex items-center bg-white/5 p-0.5 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => setLanguage('EN')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        language === 'EN' ? 'bg-[#2563eb] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('CEB')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                        language === 'CEB' ? 'bg-[#2563eb] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Cebuano
                    </button>
                  </div>
                </div>

                {/* Status Row */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span className="text-white font-medium">Online</span>
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
            {/* Top Header Bar */}
            <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
              <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Mobile sidebar toggle button */}
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                  title="Open Navigation Menu"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Desktop sidebar collapse/expand toggle button */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="hidden lg:flex p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                  title={isSidebarCollapsed ? "Expand Sidebar (Full labels)" : "Collapse Sidebar (Icon rail)"}
                >
                  {isSidebarCollapsed ? (
                    <PanelLeftOpen className="w-5 h-5 text-blue-600" />
                  ) : (
                    <PanelLeftClose className="w-5 h-5" />
                  )}
                </button>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Rice Farm Registry and Georeferencing
                  </span>
                  <h1 className="font-serif font-black text-xl sm:text-2xl text-[#0b2545] tracking-tight leading-tight">
                    {getHeaderTitle()}
                  </h1>
                </div>
              </div>

              {/* Public Interface Button */}
              <button
                type="button"
                onClick={() => setViewMode('landing')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-blue-600 font-semibold text-xs transition shadow-2xs cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Public Interface</span>
              </button>
            </header>

            {/* Body View Area */}
            <main className="flex-1 p-4 sm:p-6 bg-[#f8fafc]">
              {activeTab === 'dashboard' && (
                <DashboardView
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onSelectParcel={(p) => setSelectedParcel(p)}
                  onOpenAddParcel={() => {
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                  }}
                  onSelectBarangay={(b) => setSelectedBarangay(b)}
                />
              )}

              {activeTab === 'lft_dashboard' && (
                <LftDashboardView
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  onSelectParcel={(p) => setSelectedParcel(p)}
                  onOpenAddParcel={() => {
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
                  }}
                  onSelectBarangay={(b) => setSelectedBarangay(b)}
                />
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

              {activeTab === 'eartags' && (
                <DatabaseView
                  initialSearchQuery={databaseSearchFilter}
                  onSelectParcel={(p) => setSelectedParcel(p)}
                  onEditParcel={(p) => {
                    setEditingParcel(p);
                    setIsAddParcelOpen(true);
                  }}
                  onOpenAddParcel={() => {
                    setEditingParcel(null);
                    setIsAddParcelOpen(true);
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

              {activeTab === 'reports' && <ReportsView initialBarangay={reportBarangayFilter} />}

              {activeTab === 'accounts' && isCentralAdmin && <AccountsView />}

              {activeTab === 'photos' && isCentralAdmin && (
                <PhotosView onNavigateToSettings={() => setActiveTab('settings')} />
              )}

              {activeTab === 'settings' && (
                <SettingsView onNavigateToLanding={() => setViewMode('landing')} />
              )}
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
      <AgriGisChatbot
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
