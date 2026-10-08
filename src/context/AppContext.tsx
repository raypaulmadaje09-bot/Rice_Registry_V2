import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, FarmParcel, Language, BackgroundPreset, LftAccount, SeasonalProductionRecord, OfficeContactInfo, PortalTab } from '../types';
import { BARANGAYS, getAssignedLftForBarangay } from '../data/barangays';
import { DEFAULT_BG_PHOTO, DEFAULT_SLSU_PHOTO, SLSU_DEFAULTS, PRESET_BACKGROUNDS } from '../data/photos';
import { RiceVariety, RICE_VARIETIES } from '../data/riceVarieties';
import { generateInitialSeasonalRecords, CROPPING_SEASONS, ACTIVE_SEASON } from '../data/seasonalProduction';
import { supabase } from '../supabase';
import {
  mapFarmerRowToParcel,
  normalizeFarmParcel,
  normalizeLftAccount,
  sortParcelsAlphabetically,
  supabaseDb,
  broadcastRealtimeChange,
  getOfflinePendingFarms,
  syncOfflinePendingFarms,
  checkDuplicateRsbsa,
  checkDuplicateFarmerName,
  withTimeout
} from '../utils/supabaseClient';
import { getUserPermissions, UserPermissions } from '../utils/rbac';
import { setReportCustomLogoCache } from '../utils/reportExportUtils';

export const DEFAULT_OFFICE_CONTACT_INFO: OfficeContactInfo = {
  schedule: 'Monday – Friday: 8:00 AM – 5:00 PM',
  hotline: '(053) 572-8812',
  mobile: '0917-822-4911',
  email: 'agri.silago@southernleyte.gov.ph'
};

const DEFAULT_ECOSYSTEMS = [
  'Irrigated Lowland (NIA)',
  'Rainfed Lowland',
  'Hybrid Seed Production',
  'Upland Terraces'
];

const DEFAULT_TENURES = [
  'Owner-Cultivator',
  'Tenant Farmer',
  'Agrarian Reform Beneficiary (ARB)',
  'Leaseholder'
];

const DEFAULT_SEASONS = [
  'Wet Season (WS) 2026 (June – Nov 2026)',
  'Dry Season (DS) 2026 (Dec 2025 – May 2026)',
  'Wet Season (WS) 2025 (June – Nov 2025)'
];

const DEFAULT_IRRIGATION_ASSOCIATIONS = [
  'Balagawan Communal Irrigators Association (BCIA)',
  'Silago River Irrigation System IA (SRIS-IA)',
  'Hinabian Farmers Irrigators Association',
  'Katipunan-Mercedes Irrigators Association',
  'Lagoma-Tubod Irrigators Association',
  'Puntana-Salvacion Farmers IA',
  'San Isidro-San Roque Irrigators Group',
  'Individual / Non-IA Member (Rainfed / Shallow Tube)'
];

export const INITIAL_LFT_ACCOUNTS: LftAccount[] = [];

export interface SystemLogos {
  daLogoUrl: string | null;
  silagoLogoUrl: string | null;
  bagOngSilagoLogoUrl: string | null;
  southernLeyteLogoUrl: string | null;
  bagongPilipinasLogoUrl: string | null;
  portalBannerUrl: string | null;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void;
  updateCurrentUserProfile: (profile: Partial<User>) => void;
  updateCurrentUserPassword: (newPassword: string) => void;
  verifyCurrentUserPassword: (password: string) => boolean;
  resetStaffPassword: (identifier: string, newPassword: string) => boolean;
  parcels: FarmParcel[];
  addParcel: (parcel: FarmParcel) => Promise<void>;
  updateParcel: (tagNumber: string, updated: Partial<FarmParcel>) => Promise<void>;
  deleteParcel: (tagNumber: string) => void;
  deleteBulkParcels: (tagNumbers: string[]) => Promise<void>;
  resetParcels: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;

  // LFT Officer Accounts Management
  lftAccounts: LftAccount[];
  addLftAccount: (account: Omit<LftAccount, 'id'>) => void;
  updateLftAccount: (id: string, updated: Partial<LftAccount>) => void;
  deleteLftAccount: (id: string) => void;
  resetLftAccounts: () => void;
  reorderLftAccounts: (accountsOrStartIndex: LftAccount[] | number, endIndex?: number) => void;

  bgPhotoUrl: string;
  bgOpacity: number;
  bgBlur: number;
  bgActive: boolean;
  setBgPhotoUrl: (url: string, name?: string, source?: 'upload' | 'preset') => void;
  setBgOpacity: (opacity: number) => void;
  setBgBlur: (blur: number) => void;
  setBgActive: (active: boolean) => void;
  removeBgPhoto: () => void;
  backgroundHistory: BackgroundPreset[];
  addToBackgroundHistory: (url: string, name?: string, source?: 'upload' | 'preset') => void;
  removeFromBackgroundHistory: (id: string) => void;
  clearBackgroundHistory: () => void;

  daLogoUrl: string | null;
  setDaLogoUrl: (url: string | null) => void;
  silagoLogoUrl: string | null;
  setSilagoLogoUrl: (url: string | null) => void;
  bagOngSilagoLogoUrl: string | null;
  setBagOngSilagoLogoUrl: (url: string | null) => void;
  southernLeyteLogoUrl: string | null;
  setSouthernLeyteLogoUrl: (url: string | null) => void;
  bagongPilipinasLogoUrl: string | null;
  setBagongPilipinasLogoUrl: (url: string | null) => void;
  portalBannerUrl: string | null;
  setPortalBannerUrl: (url: string | null) => void;
  systemLogos: SystemLogos;
  updateSystemLogo: (key: keyof SystemLogos, url: string | null) => void;
  setSystemLogos: (logos: Partial<SystemLogos>) => void;
  resetLogos: () => void;

  // Central Admin Profile & Password Settings
  adminProfile: {
    name: string;
    title: string;
    email: string;
    contactNumber: string;
    office: string;
    photoUrl?: string;
  };
  updateAdminProfile: (data: Partial<{
    name: string;
    title: string;
    email: string;
    contactNumber: string;
    office: string;
    photoUrl?: string;
  }>) => void;
  verifyAdminPassword: (password: string) => boolean;
  updateAdminPassword: (newPassword: string) => void;

  slsuPhotoUrl: string;
  setSlsuPhotoUrl: (url: string) => void;
  slsuLayoutMode: 'banner' | 'full' | 'seal';
  setSlsuLayoutMode: (mode: 'banner' | 'full' | 'seal') => void;
  slsuCaption: string;
  setSlsuCaption: (caption: string) => void;
  slsuSealLogoUrl: string | null;
  setSlsuSealLogoUrl: (url: string | null) => void;
  slsuUniversityName: string;
  setSlsuUniversityName: (name: string) => void;
  slsuMotto: string;
  setSlsuMotto: (motto: string) => void;
  slsuYear: string;
  setSlsuYear: (year: string) => void;
  slsuCenterTitle: string;
  setSlsuCenterTitle: (title: string) => void;
  slsuCenterSubtitle: string;
  setSlsuCenterSubtitle: (sub: string) => void;
  slsuBadgeTag: string;
  setSlsuBadgeTag: (tag: string) => void;
  slsuTopTags: string;
  setSlsuTopTags: (tags: string) => void;
  settingsActiveSubTab: 'profile' | 'municipal' | 'featured_card' | 'display';
  setSettingsActiveSubTab: (subTab: 'profile' | 'municipal' | 'featured_card' | 'display') => void;
  resetSlsuDetails: () => void;
  resetAllDefaults: () => void;

  // Office Hours & Hotline Settings (Central Admin Managed)
  officeContactInfo: OfficeContactInfo;
  updateOfficeContactInfo: (info: Partial<OfficeContactInfo>) => void;
  resetOfficeContactInfo: () => void;

  // Manage Varieties (Add, Edit, Delete)
  varieties: RiceVariety[];
  addVariety: (variety: RiceVariety) => void;
  updateVariety: (oldName: string, updated: Partial<RiceVariety>) => void;
  deleteVariety: (name: string) => void;

  // Manage Ecosystems (Add, Edit, Delete)
  ecosystems: string[];
  addEcosystem: (name: string) => void;
  updateEcosystem: (oldName: string, newName: string) => void;
  deleteEcosystem: (name: string) => void;

  // Manage Tenures (Add, Edit, Delete)
  tenures: string[];
  addTenure: (name: string) => void;
  updateTenure: (oldName: string, newName: string) => void;
  deleteTenure: (name: string) => void;

  // Manage Cropping Seasons (Add, Edit, Delete)
  seasons: string[];
  addSeason: (name: string) => void;
  updateSeason: (oldName: string, newName: string) => void;
  deleteSeason: (name: string) => void;

  // Manage Irrigation Associations (Add, Edit, Delete)
  irrigationAssociations: string[];
  addIrrigationAssociation: (name: string) => void;
  updateIrrigationAssociation: (oldName: string, newName: string) => void;
  deleteIrrigationAssociation: (name: string) => void;

  // Master-Detail Seasonal Production Management
  activeSeason: string;
  setActiveSeason: (season: string) => void;
  addSeasonalRecord: (
    parcelTag: string,
    record: Omit<SeasonalProductionRecord, 'id' | 'parcelTag' | 'recordedAt'>
  ) => void;
  updateSeasonalRecord: (
    parcelTag: string,
    recordId: string,
    updated: Partial<SeasonalProductionRecord>
  ) => void;
  deleteSeasonalRecord: (parcelTag: string, recordId: string) => void;

  // Supabase Realtime & RBAC State
  permissions: UserPermissions;
  realtimeStatus: 'connected' | 'connecting' | 'reconnecting';
  isRealtimeSyncing: boolean;
  syncWithSupabase: () => Promise<void>;
  offlineQueueCount: number;
  isOnline: boolean;
  syncOfflineQueue: () => Promise<void>;
  syncNotification: string | null;
  setSyncNotification: (msg: string | null) => void;

  // Active Navigation Tab State
  activeTab: PortalTab;
  setActiveTab: (tab: PortalTab) => void;

  // Farm Parcels Supabase Fetch & Mapping Methods
  fetchParcels: () => Promise<void>;
  mapFarmerToParcel: (row: any) => FarmParcel;

  // User Session & Auth Loading State
  isLoading: boolean;
  isAuthLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication State (persisted across page reloads in localStorage)
  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored =
          localStorage.getItem('silago_rice_auth_user') ||
          localStorage.getItem('silago_rice_user_session') ||
          localStorage.getItem('silago_rice_auth_session') ||
          localStorage.getItem('rice_registry_user_session') ||
          localStorage.getItem('silago_current_user');
        if (stored) return JSON.parse(stored);
      }
    } catch {}
    return null;
  });

  const setCurrentUser = useCallback((userOrUpdater: User | null | ((prev: User | null) => User | null)) => {
    setCurrentUserState((prev) => {
      const nextUser = typeof userOrUpdater === 'function' ? userOrUpdater(prev) : userOrUpdater;
      try {
        if (typeof window !== 'undefined') {
          if (nextUser) {
            const serialized = JSON.stringify(nextUser);
            localStorage.setItem('silago_rice_auth_user', serialized);
            localStorage.setItem('silago_rice_user_session', serialized);
            localStorage.setItem('silago_rice_auth_session', serialized);
            localStorage.setItem('rice_registry_user_session', serialized);
            localStorage.setItem('silago_current_user', serialized);
          } else {
            localStorage.removeItem('silago_rice_auth_user');
            localStorage.removeItem('silago_rice_user_session');
            localStorage.removeItem('silago_rice_auth_session');
            localStorage.removeItem('rice_registry_user_session');
            localStorage.removeItem('silago_current_user');
          }
        }
      } catch {}
      return nextUser;
    });
  }, []);

  // Active Navigation Tab State (persisted in localStorage & URL state)
  const [activeTab, setActiveTabState] = useState<PortalTab>(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab') as PortalTab | null;
        if (urlTab) return urlTab;
        const savedTab = localStorage.getItem('silago_active_tab') as PortalTab | null;
        if (savedTab) return savedTab;
      }
    } catch {}
    return 'dashboard';
  });

  const setActiveTab = useCallback((tab: PortalTab) => {
    setActiveTabState(tab);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('silago_active_tab', tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
      }
    } catch {}
  }, []);

  // Track initial auth check loading status
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Check supabase.auth.getSession() on app initial load before declaring user unauthenticated
  useEffect(() => {
    let isMounted = true;

    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const userEmail = (session.user.email || '').toLowerCase();
          const identifier = userEmail || session.user.id;
          const hydrated = await supabaseDb.hydrateUserRole(identifier);
          if (isMounted) {
            const resolvedUser: User = {
              username: hydrated?.username || userEmail.split('@')[0],
              role: hydrated?.role || 'Central Admin',
              name: session.user.user_metadata?.full_name || hydrated?.name || 'Administrator',
              title:
                hydrated?.title ||
                (hydrated?.role === 'Barangay Focal Person'
                  ? 'Local Farmer Technician (LFT)'
                  : 'Municipal Agriculture Administrator'),
              email: userEmail,
              barangay: hydrated?.barangay,
              assignedBarangays: hydrated?.assignedBarangays,
              photoUrl: session.user.user_metadata?.avatar_url || hydrated?.photoUrl
            };
            setCurrentUser(resolvedUser);
          }
        }
      } catch (err) {
        console.warn('Initial session check note:', err);
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }
    };

    checkInitialSession();

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_OUT') {
        // Do NOT wipe currentUser on SIGNED_OUT!
        // Local administrative / LFT sessions are stored in localStorage and not tied to Supabase Auth tokens.
        // Explicit logout is performed via handleSignOut / logout.
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const userEmail = (session.user.email || '').toLowerCase();
          const identifier = userEmail || session.user.id;
          const hydrated = await supabaseDb.hydrateUserRole(identifier);
          if (isMounted) {
            const resolvedUser: User = {
              username: hydrated?.username || userEmail.split('@')[0],
              role: hydrated?.role || 'Central Admin',
              name: session.user.user_metadata?.full_name || hydrated?.name || 'Administrator',
              title:
                hydrated?.title ||
                (hydrated?.role === 'Barangay Focal Person'
                  ? 'Local Farmer Technician (LFT)'
                  : 'Municipal Agriculture Administrator'),
              email: userEmail,
              barangay: hydrated?.barangay,
              assignedBarangays: hydrated?.assignedBarangays,
              photoUrl: session.user.user_metadata?.avatar_url || hydrated?.photoUrl
            };
            setCurrentUser(resolvedUser);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, [setCurrentUser]);

  // Role-Based Permissions for Active User Session
  const permissions = useMemo(() => getUserPermissions(currentUser), [currentUser]);

  // Supabase Realtime Connection Status
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'connecting' | 'reconnecting'>('connected');
  const [isRealtimeSyncing, setIsRealtimeSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      // Live State Hydration on any device: verify and hydrate role directly from Supabase DB
      if (currentUser.role !== 'Central Admin' && (currentUser.email || currentUser.username || currentUser.contactNumber)) {
        const identifier = currentUser.email || currentUser.username || currentUser.contactNumber || '';
        supabaseDb.hydrateUserRole(identifier).then((hydrated) => {
          if (hydrated) {
            setCurrentUser((prev) => (prev ? { ...prev, ...hydrated } : null));
          }
        });
      }
    }
  }, [currentUser?.email, currentUser?.username, setCurrentUser]);

  // Farm Parcels Database State (Pure Async Remote Supabase Source of Truth + Cached Persistence + Alphabetical A-Z)
  const [parcels, setParcels] = useState<FarmParcel[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached =
          localStorage.getItem('rice_registry_parcels') ||
          localStorage.getItem('silago_cached_parcels');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return sortParcelsAlphabetically(parsed);
          }
        }
      }
    } catch {}
    return [];
  });
  const [isParcelsLoading, setIsParcelsLoading] = useState<boolean>(true);

  // LFT Accounts State (Pure Async Remote Supabase Source of Truth)
  const [lftAccounts, setLftAccounts] = useState<LftAccount[]>([]);

  // Offline state & pending synchronization queue tracker
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflinePendingFarms().length);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  // Mapper function: converts raw 'farmers' table row into standard FarmParcel object
  const mapFarmerToParcel = useCallback((row: any): FarmParcel => {
    return mapFarmerRowToParcel(row);
  }, []);

  // Fetch Parcels: reads directly from 'farmers' table using supabase.from("farmers").select("*")
  const fetchParcels = useCallback(async () => {
    setIsParcelsLoading(true);
    try {
      const { data, error } = await supabase.from('farmers').select('*');

      if (!error && Array.isArray(data)) {
        const mapped: FarmParcel[] = (data as any[]).map(mapFarmerToParcel);
        const pending = getOfflinePendingFarms();
        const combined: FarmParcel[] = [...mapped];
        pending.forEach((p) => {
          const idx = combined.findIndex((c) => c.tagNumber === p.tagNumber);
          if (idx >= 0) combined[idx] = p;
          else combined.unshift(p);
        });

        const sorted = sortParcelsAlphabetically(combined);
        setParcels(sorted);
        try {
          const serialized = JSON.stringify(sorted);
          localStorage.setItem('silago_rice_parcels', serialized);
          localStorage.setItem('rice_registry_parcels', serialized);
          localStorage.setItem('silago_cached_parcels', serialized);
        } catch {}
      } else {
        // Fallback to cached parcels if Supabase is offline or returned error
        try {
          const cached =
            localStorage.getItem('silago_rice_parcels') ||
            localStorage.getItem('rice_registry_parcels') ||
            localStorage.getItem('silago_cached_parcels');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setParcels(sortParcelsAlphabetically(parsed));
            }
          }
        } catch {}
      }
    } catch (err) {
      console.warn('fetchParcels notice / offline fallback:', err);
      try {
        const cached =
          localStorage.getItem('silago_rice_parcels') ||
          localStorage.getItem('rice_registry_parcels') ||
          localStorage.getItem('silago_cached_parcels');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setParcels(sortParcelsAlphabetically(parsed));
          }
        }
      } catch {}
    } finally {
      setIsParcelsLoading(false);
    }
  }, [mapFarmerToParcel]);

  // Initial cloud fetch on mount
  useEffect(() => {
    fetchParcels();
  }, [fetchParcels]);

  // Manual & Automated Trigger to re-sync with Supabase tables directly
  const syncWithSupabase = useCallback(async () => {
    setIsRealtimeSyncing(true);
    try {
      await fetchParcels();
      const cloudLfts = await supabaseDb.getLftAccounts();
      if (Array.isArray(cloudLfts) && cloudLfts.length > 0) {
        setLftAccounts(cloudLfts);
      }
    } catch (err) {
      console.warn('Manual sync note:', err);
    } finally {
      setIsRealtimeSyncing(false);
      setIsParcelsLoading(false);
    }
  }, [fetchParcels]);

  // Manual & Automated Trigger to sync offline pending queue to Supabase
  const syncOfflineQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncNotification('Offline: Internet connection is not available yet.');
      setTimeout(() => setSyncNotification(null), 4000);
      return;
    }
    const currentQueue = getOfflinePendingFarms();
    if (currentQueue.length === 0) {
      setOfflineQueueCount(0);
      return;
    }

    try {
      const { syncedCount, conflictCount, conflicts } = await syncOfflinePendingFarms();
      const remaining = getOfflinePendingFarms();
      setOfflineQueueCount(remaining.length);

      if (syncedCount > 0) {
        setSyncNotification(`Sync complete: ${syncedCount} offline record${syncedCount > 1 ? 's' : ''} uploaded to database.`);
        setTimeout(() => setSyncNotification(null), 5000);
        // Refresh local table with Supabase records
        syncWithSupabase();
      }

      if (conflictCount > 0) {
        setSyncNotification(`Sync notice: ${conflictCount} record${conflictCount > 1 ? 's' : ''} had RSBSA conflict. Please review.`);
        setTimeout(() => setSyncNotification(null), 6000);
      }
    } catch (err) {
      console.warn('Sync offline queue notice:', err);
    }
  }, [syncWithSupabase]);

  // Online / Offline connectivity listener & auto-sync trigger
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncNotification('Network connection detected. Synchronizing offline queue...');
      syncOfflineQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncNotification('Offline mode: Records will be saved locally and queued for automatic cloud synchronization.');
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // If online and there are pending offline records on mount, trigger sync
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const pending = getOfflinePendingFarms();
        if (pending.length > 0) {
          syncOfflineQueue();
        }
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, [syncOfflineQueue]);

  // Handle App Settings updates from Realtime
  const handleSettingUpsert = useCallback((key: string, value: any) => {
    if (key === 'silago_language') setLanguageState(value);
    else if (key === 'silago_bg_photo_url') setBgPhotoUrlState(value);
    else if (key === 'silago_bg_opacity') setBgOpacityState(Number(value));
    else if (key === 'silago_bg_blur') setBgBlurState(Number(value));
    else if (key === 'silago_bg_active') setBgActiveState(value === true || value === 'true');
    else if (key === 'silago_bg_history' && Array.isArray(value)) setBackgroundHistory(value);
    else if (key === 'silago_da_logo_url') { setDaLogoUrlState(value); try { if (value) localStorage.setItem('silago_da_logo_url', value); else localStorage.removeItem('silago_da_logo_url'); } catch {} }
    else if (key === 'silago_seal_url') { setSilagoLogoUrlState(value); try { if (value) localStorage.setItem('silago_seal_url', value); else localStorage.removeItem('silago_seal_url'); } catch {} }
    else if (key === 'silago_bag_ong_logo_url') { setBagOngSilagoLogoUrlState(value); try { if (value) localStorage.setItem('silago_bag_ong_logo_url', value); else localStorage.removeItem('silago_bag_ong_logo_url'); } catch {} }
    else if (key === 'silago_southern_leyte_logo_url') { setSouthernLeyteLogoUrlState(value); try { if (value) localStorage.setItem('silago_southern_leyte_logo_url', value); else localStorage.removeItem('silago_southern_leyte_logo_url'); } catch {} }
    else if (key === 'silago_bagong_pilipinas_logo_url') { setBagongPilipinasLogoUrlState(value); try { if (value) localStorage.setItem('silago_bagong_pilipinas_logo_url', value); else localStorage.removeItem('silago_bagong_pilipinas_logo_url'); } catch {} }
    else if (key === 'silago_portal_banner_url') { setPortalBannerUrlState(value); try { if (value) localStorage.setItem('silago_portal_banner_url', value); else localStorage.removeItem('silago_portal_banner_url'); } catch {} }
    else if (key === 'silago_admin_profile' && value) setAdminProfile(value);
    else if (key === 'silago_admin_password' && value) setAdminPasswordCache(value);
    else if (key === 'silago_office_contact_info' && value) setOfficeContactInfoState(value);
    else if (key === 'silago_rice_varieties' && Array.isArray(value)) setVarieties(value);
    else if (key === 'silago_ecosystems' && Array.isArray(value)) setEcosystems(value);
    else if (key === 'silago_tenures' && Array.isArray(value)) setTenures(value);
    else if (key === 'silago_seasons' && Array.isArray(value)) setSeasons(value);
    else if (key === 'silago_irrigation_associations' && Array.isArray(value)) setIrrigationAssociations(value);
    else if (key === 'silago_slsu_photo_url') setSlsuPhotoUrlState(value);
    else if (key === 'silago_slsu_layout_mode') setSlsuLayoutModeState(value);
    else if (key === 'silago_slsu_caption') setSlsuCaptionState(value);
    else if (key === 'silago_slsu_seal_logo_url') setSlsuSealLogoUrlState(value);
    else if (key === 'silago_slsu_center_title') setSlsuCenterTitleState(value);
    else if (key === 'silago_slsu_center_subtitle') setSlsuCenterSubtitleState(value);
    else if (key === 'silago_slsu_badge_tag') setSlsuBadgeTagState(value);
    else if (key === 'silago_slsu_top_tags') setSlsuTopTagsState(value);
  }, []);

  const handleSettingDelete = useCallback((key: string) => {
    if (key === 'silago_da_logo_url') { setDaLogoUrlState(null); try { localStorage.removeItem('silago_da_logo_url'); } catch {} }
    else if (key === 'silago_seal_url') { setSilagoLogoUrlState(null); try { localStorage.removeItem('silago_seal_url'); } catch {} }
    else if (key === 'silago_bag_ong_logo_url') { setBagOngSilagoLogoUrlState(null); try { localStorage.removeItem('silago_bag_ong_logo_url'); } catch {} }
    else if (key === 'silago_southern_leyte_logo_url') { setSouthernLeyteLogoUrlState(null); try { localStorage.removeItem('silago_southern_leyte_logo_url'); } catch {} }
    else if (key === 'silago_bagong_pilipinas_logo_url') { setBagongPilipinasLogoUrlState(null); try { localStorage.removeItem('silago_bagong_pilipinas_logo_url'); } catch {} }
    else if (key === 'silago_portal_banner_url') { setPortalBannerUrlState(null); try { localStorage.removeItem('silago_portal_banner_url'); } catch {} }
    else if (key === 'silago_slsu_seal_logo_url') setSlsuSealLogoUrlState(null);
  }, []);

  // Supabase Realtime Channels Subscription: listening for INSERT, UPDATE, DELETE on 'farms', 'farmers', and 'lft_technicians'
  useEffect(() => {
    let isMounted = true;

    // 1. Initial Cloud Hydration from Supabase
    syncWithSupabase();

    // 2. Real-time subscription in App context using supabase.channel('db-changes')
    const channel = supabase
      .channel('db-changes')
      // --- 'farmers' table: Realtime CDC synchronization (INSERT, UPDATE, DELETE) ---
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'farmers' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'INSERT') {
            if (!payload.new) return;
            const incoming = mapFarmerToParcel(payload.new);
            setParcels((prev) => {
              const index = prev.findIndex(
                (p) =>
                  p.tagNumber === incoming.tagNumber ||
                  (incoming.swineNameOrId &&
                    incoming.swineNameOrId !== 'NO RSBSA' &&
                    p.swineNameOrId &&
                    p.swineNameOrId.trim().toLowerCase() === incoming.swineNameOrId.trim().toLowerCase())
              );
              let updated: FarmParcel[];
              if (index >= 0) {
                updated = [...prev];
                updated[index] = { ...updated[index], ...incoming };
              } else {
                updated = [incoming, ...prev];
              }
              const sorted = sortParcelsAlphabetically(updated);
              try {
                localStorage.setItem('rice_registry_parcels', JSON.stringify(sorted));
                localStorage.setItem('silago_cached_parcels', JSON.stringify(sorted));
              } catch {}
              return sorted;
            });
          } else if (payload.eventType === 'UPDATE') {
            if (!payload.new) return;
            const incoming = mapFarmerToParcel(payload.new);
            setParcels((prev) => {
              const index = prev.findIndex(
                (p) =>
                  p.tagNumber === incoming.tagNumber ||
                  (incoming.swineNameOrId &&
                    incoming.swineNameOrId !== 'NO RSBSA' &&
                    p.swineNameOrId &&
                    p.swineNameOrId.trim().toLowerCase() === incoming.swineNameOrId.trim().toLowerCase())
              );
              let updated: FarmParcel[];
              if (index >= 0) {
                updated = [...prev];
                updated[index] = { ...updated[index], ...incoming };
              } else {
                updated = [incoming, ...prev];
              }
              const sorted = sortParcelsAlphabetically(updated);
              try {
                localStorage.setItem('rice_registry_parcels', JSON.stringify(sorted));
                localStorage.setItem('silago_cached_parcels', JSON.stringify(sorted));
              } catch {}
              return sorted;
            });
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as any;
            const oldTag = old?.id || old?.tagNumber || old?.tag_number || old?.parcel_tag;
            const oldRsbsa = old?.rsbsa_number || old?.rsbsa_no;
            const oldName = old?.farmer_name || old?.farmerName;

            setParcels((prev) => {
              const filtered = prev.filter((p) => {
                if (oldTag && (p.tagNumber === oldTag || (p as any).id === oldTag || p.tagNumber === `FARMER-${oldTag}`)) {
                  return false;
                }
                if (oldRsbsa && p.swineNameOrId && p.swineNameOrId.trim().toLowerCase() === String(oldRsbsa).trim().toLowerCase()) {
                  return false;
                }
                if (oldName && p.raiserName && p.raiserName.trim().toLowerCase() === String(oldName).trim().toLowerCase()) {
                  return false;
                }
                return true;
              });
              try {
                localStorage.setItem('rice_registry_parcels', JSON.stringify(filtered));
                localStorage.setItem('silago_cached_parcels', JSON.stringify(filtered));
              } catch {}
              return filtered;
            });
          }
        }
      )
      // --- 'lft_technicians' table: INSERT, UPDATE, and DELETE events ---
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'lft_technicians' },
        (payload) => {
          if (!isMounted || !payload.new) return;
          const incoming = normalizeLftAccount(payload.new);
          setLftAccounts((prev) => {
            const index = prev.findIndex((a) => a.id === incoming.id || a.username === incoming.username);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...incoming };
              return updated;
            }
            return [incoming, ...prev];
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'lft_technicians' },
        (payload) => {
          if (!isMounted || !payload.new) return;
          const incoming = normalizeLftAccount(payload.new);
          setLftAccounts((prev) => {
            const index = prev.findIndex((a) => a.id === incoming.id || a.username === incoming.username);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...incoming };
              return updated;
            }
            return [incoming, ...prev];
          });
          setCurrentUser((prev) => {
            if (prev && (prev.username === incoming.username || prev.email === incoming.email)) {
              return {
                ...prev,
                name: incoming.name,
                contactNumber: incoming.contactNumber,
                barangay: incoming.barangay,
                assignedBarangays: incoming.assignedBarangays,
                photoUrl: incoming.photoUrl || prev.photoUrl
              };
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'lft_technicians' },
        (payload) => {
          if (!isMounted) return;
          const oldId = (payload.old as any)?.id || (payload.old as any)?.username;
          if (oldId) {
            setLftAccounts((prev) => prev.filter((a) => a.id !== oldId && a.username !== oldId));
          }
        }
      )
      // --- App Settings & System Settings ---
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_settings' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'DELETE' && payload.old) {
            const oldKey = (payload.old as any)?.key;
            if (oldKey) handleSettingDelete(oldKey);
          } else if (payload.new) {
            const key = (payload.new as any)?.key;
            const val = (payload.new as any)?.value;
            if (key !== undefined) handleSettingUpsert(key, val);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          if (!isMounted) return;
          if (payload.eventType === 'DELETE' && payload.old) {
            const oldKey = (payload.old as any)?.key;
            if (oldKey) handleSettingDelete(oldKey);
          } else if (payload.new) {
            const key = (payload.new as any)?.key;
            const val = (payload.new as any)?.value;
            if (key !== undefined) handleSettingUpsert(key, val);
          }
        }
      )
      // --- Broadcast Events for immediate multi-client zero-latency sync ---
      .on('broadcast', { event: 'parcel_upsert' }, ({ payload }) => {
        if (!isMounted || !payload?.parcel) return;
        const incoming = normalizeFarmParcel(payload.parcel);
        setParcels((prev) => {
          const idx = prev.findIndex((p) => p.tagNumber === incoming.tagNumber);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...incoming };
            return updated;
          }
          return [incoming, ...prev];
        });
      })
      .on('broadcast', { event: 'parcel_delete' }, ({ payload }) => {
        if (!isMounted || !payload?.tagNumber) return;
        setParcels((prev) => prev.filter((p) => p.tagNumber !== payload.tagNumber));
      })
      .on('broadcast', { event: 'parcels_sync' }, ({ payload }) => {
        if (!isMounted || !Array.isArray(payload?.parcels)) return;
        setParcels(payload.parcels.map(normalizeFarmParcel));
      })
      .on('broadcast', { event: 'lft_upsert' }, ({ payload }) => {
        if (!isMounted || !payload?.account) return;
        const incoming = normalizeLftAccount(payload.account);
        setLftAccounts((prev) => {
          const idx = prev.findIndex((a) => a.id === incoming.id || a.username === incoming.username);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], ...incoming };
            return updated;
          }
          return [incoming, ...prev];
        });
      })
      .on('broadcast', { event: 'lft_delete' }, ({ payload }) => {
        if (!isMounted || !payload?.id) return;
        setLftAccounts((prev) => prev.filter((a) => a.id !== payload.id && a.username !== payload.id));
      })
      .on('broadcast', { event: 'lfts_sync' }, ({ payload }) => {
        if (!isMounted || !Array.isArray(payload?.accounts)) return;
        setLftAccounts(payload.accounts.map(normalizeLftAccount));
      })
      .on('broadcast', { event: 'setting_update' }, ({ payload }) => {
        if (!isMounted || payload?.key === undefined) return;
        handleSettingUpsert(payload.key, payload.value);
      })
      .on('broadcast', { event: 'setting_delete' }, ({ payload }) => {
        if (!isMounted || !payload?.key) return;
        handleSettingDelete(payload.key);
      })
      .subscribe((status) => {
        if (!isMounted) return;
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
        } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('reconnecting');
        } else {
          setRealtimeStatus('connecting');
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [syncWithSupabase, handleSettingUpsert, handleSettingDelete]);

  // Active Cropping Season (LFT Twice-a-Year Rice Production)
  const [activeSeason, setActiveSeason] = useState<string>(ACTIVE_SEASON);

  const addParcel = async (parcel: FarmParcel) => {
    // 1. Enforce numeric-only contact number (strip non-digits, accept 11-digit mobile 09XXXXXXXXX)
    let sanitizedContact = (parcel.contactNumber || '').trim();
    if (sanitizedContact) {
      const digits = sanitizedContact.replace(/\D/g, '');
      if (digits.length === 11 && digits.startsWith('09')) {
        sanitizedContact = digits;
      } else if (digits.length > 0) {
        throw new Error('Validation Error: Contact number must be an 11-digit mobile number starting with 09 (e.g. 09XXXXXXXXX).');
      }
    }

    // 2. Validate existing RSBSA number duplicate prevention
    const cleanRsbsa = (parcel.swineNameOrId || parcel.rsbsa_no || '').trim();
    if (cleanRsbsa && cleanRsbsa.toUpperCase() !== 'NO RSBSA') {
      const existingRsbsa = parcels.find(
        (p) =>
          p.tagNumber !== parcel.tagNumber &&
          (p.swineNameOrId || p.rsbsa_no || '').trim().toLowerCase() === cleanRsbsa.toLowerCase()
      );
      if (existingRsbsa) {
        throw new Error(`Duplicate RSBSA: A farmer with RSBSA No. "${cleanRsbsa}" is already registered (${existingRsbsa.raiserName || 'Existing Record'}).`);
      }
    }

    // 3. Validate existing Full Name duplicate prevention
    const normalizeName = (s: string) => s.toLowerCase().trim().replace(/[,.-]/g, ' ').replace(/\s+/g, ' ');
    const parcelName = normalizeName(
      [parcel.farmerGivenName, parcel.farmerMiddleName, parcel.farmerFamilyName].filter(Boolean).join(' ') ||
      parcel.raiserName ||
      ''
    );

    if (parcelName.length >= 3) {
      const existingName = parcels.find((p) => {
        if (p.tagNumber === parcel.tagNumber) return false;
        const pName = normalizeName(
          [p.farmerGivenName, p.farmerMiddleName, p.farmerFamilyName].filter(Boolean).join(' ') ||
          p.raiserName ||
          ''
        );
        const pBrgy = (p.barangay || '').trim().toLowerCase();
        const targetBrgy = (parcel.barangay || '').trim().toLowerCase();
        return pName === parcelName && (!pBrgy || !targetBrgy || pBrgy === targetBrgy);
      });

      if (existingName) {
        throw new Error(`Duplicate Farmer Name: A farmer named "${parcel.raiserName || parcelName}" is already registered in Barangay ${parcel.barangay || 'the system'}.`);
      }
    }

    // 4. Format ID as 'FARMER-SLG-...'
    const rawTag = (parcel.tagNumber || '').trim();
    let formattedTag = rawTag;
    if (!formattedTag) {
      formattedTag = `FARMER-SLG-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    } else if (!formattedTag.startsWith('FARMER-SLG-')) {
      if (formattedTag.startsWith('FARMER-')) {
        formattedTag = `FARMER-SLG-${formattedTag.replace(/^FARMER-/, '')}`;
      } else if (formattedTag.startsWith('SLG-')) {
        formattedTag = `FARMER-${formattedTag}`;
      } else {
        formattedTag = `FARMER-SLG-${formattedTag}`;
      }
    }

    // 5. Combined Farmer Name
    const fam = (parcel.farmerFamilyName || '').trim();
    const giv = (parcel.farmerGivenName || '').trim();
    const mid = (parcel.farmerMiddleName || '').trim();
    const finalFarmerName =
      fam && giv ? `${fam.toUpperCase()}, ${giv}${mid ? ' ' + mid : ''}`.trim() : parcel.raiserName || 'Registered Farmer';

    const validatedParcel: FarmParcel = {
      ...parcel,
      tagNumber: formattedTag,
      contactNumber: sanitizedContact,
      farmerFamilyName: fam,
      farmerGivenName: giv,
      farmerMiddleName: mid,
      raiserName: finalFarmerName
    };

    const withSeasonal: FarmParcel = {
      ...validatedParcel,
      seasonalRecords:
        validatedParcel.seasonalRecords && validatedParcel.seasonalRecords.length > 0
          ? validatedParcel.seasonalRecords
          : generateInitialSeasonalRecords(validatedParcel)
    };

    // Optimistically update local parcels state and cached storage immediately
    setParcels((prev) => {
      const updated = sortParcelsAlphabetically([withSeasonal, ...prev.filter((p) => p.tagNumber !== withSeasonal.tagNumber)]);
      try {
        localStorage.setItem('rice_registry_parcels', JSON.stringify(updated));
        localStorage.setItem('silago_cached_parcels', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    try {
      // Direct Remote Supabase CRUD & Realtime Broadcast - throws on duplicate constraint / 23505
      await supabaseDb.upsertParcel(withSeasonal);
    } catch (err: any) {
      const isUniqueViolation =
        err?.code === '23505' ||
        err?.message?.includes('23505') ||
        err?.message?.toLowerCase().includes('unique') ||
        err?.message?.toLowerCase().includes('duplicate key');

      if (isUniqueViolation) {
        // Rollback state and cache if unique constraint error occurred
        setParcels((prev) => {
          const reverted = prev.filter((p) => p.tagNumber !== withSeasonal.tagNumber);
          try {
            localStorage.setItem('rice_registry_parcels', JSON.stringify(reverted));
            localStorage.setItem('silago_cached_parcels', JSON.stringify(reverted));
          } catch {}
          return reverted;
        });
        throw err;
      }
      console.warn('Supabase remote sync notice:', err?.message || err);
    } finally {
      setOfflineQueueCount(getOfflinePendingFarms().length);
    }
  };

  const updateParcel = async (tagNumber: string, updatedFields: Partial<FarmParcel>) => {
    const existing = parcels.find((p) => p.tagNumber === tagNumber);
    if (existing) {
      const targetUpdated: FarmParcel = { ...existing, ...updatedFields };
      setParcels((prev) => {
        const updated = prev.map((p) => (p.tagNumber === tagNumber ? targetUpdated : p));
        try {
          localStorage.setItem('rice_registry_parcels', JSON.stringify(updated));
          localStorage.setItem('silago_cached_parcels', JSON.stringify(updated));
        } catch {}
        return updated;
      });
      try {
        await supabaseDb.upsertParcel(targetUpdated);
      } catch (err: any) {
        console.warn('Supabase parcel update notice:', err?.message || err);
      } finally {
        setOfflineQueueCount(getOfflinePendingFarms().length);
      }
    }
  };

  const deleteParcel = (tagNumber: string) => {
    setParcels((prev) => {
      const filtered = prev.filter((p) => p.tagNumber !== tagNumber);
      try {
        localStorage.setItem('rice_registry_parcels', JSON.stringify(filtered));
        localStorage.setItem('silago_cached_parcels', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });
    supabaseDb.deleteParcel(tagNumber).then(() => {
      setOfflineQueueCount(getOfflinePendingFarms().length);
    }).catch((err) => {
      console.warn('Supabase parcel deletion notice:', err?.message || err);
    });
  };

  const deleteBulkParcels = async (tagNumbers: string[]) => {
    if (!tagNumbers || tagNumbers.length === 0) return;
    setParcels((prev) => {
      const filtered = prev.filter((p) => !tagNumbers.includes(p.tagNumber));
      try {
        localStorage.setItem('rice_registry_parcels', JSON.stringify(filtered));
        localStorage.setItem('silago_cached_parcels', JSON.stringify(filtered));
      } catch {}
      return filtered;
    });
    try {
      await supabaseDb.deleteBulkFarmRecords(tagNumbers);
    } catch (err: any) {
      console.warn('Supabase bulk deletion notice:', err?.message || err);
    } finally {
      setOfflineQueueCount(getOfflinePendingFarms().length);
    }
  };

  const resetParcels = () => {
    setParcels([]);
    try {
      localStorage.removeItem('rice_registry_parcels');
      localStorage.removeItem('silago_cached_parcels');
    } catch {}
  };

  // Master-Detail Seasonal Production Record Methods
  const addSeasonalRecord = (
    parcelTag: string,
    record: Omit<SeasonalProductionRecord, 'id' | 'parcelTag' | 'recordedAt'>
  ) => {
    const newRecord: SeasonalProductionRecord = {
      ...record,
      id: `PROD-${parcelTag}-${Date.now().toString().slice(-6)}`,
      parcelTag,
      recordedAt: new Date().toISOString()
    };

    let targetUpdated: FarmParcel | null = null;
    const updated = parcels.map((p) => {
      if (p.tagNumber === parcelTag) {
        const existing = p.seasonalRecords || [];
        const filtered = existing.filter((r) => r.season !== record.season);
        targetUpdated = {
          ...p,
          seasonalRecords: [newRecord, ...filtered],
          breed: record.seedVariety,
          plantingDate: record.plantingDate,
          croppingSeason: record.season,
          targetYieldMt: record.yieldMtPerHa,
          healthStatus:
            record.growthStage ||
            (record.productionStatus === 'Harvest Completed' ? 'Harvested' : 'Active Crop')
        };
        return targetUpdated;
      }
      return p;
    });
    setParcels(updated);
    if (targetUpdated) {
      supabaseDb.upsertParcel(targetUpdated);
    }
  };

  const updateSeasonalRecord = (
    parcelTag: string,
    recordId: string,
    updatedFields: Partial<SeasonalProductionRecord>
  ) => {
    let targetUpdated: FarmParcel | null = null;
    const updated = parcels.map((p) => {
      if (p.tagNumber === parcelTag) {
        const existing = p.seasonalRecords || [];
        const newRecords = existing.map((r) =>
          r.id === recordId ? { ...r, ...updatedFields } : r
        );
        targetUpdated = {
          ...p,
          seasonalRecords: newRecords
        };
        return targetUpdated;
      }
      return p;
    });
    setParcels(updated);
    if (targetUpdated) {
      supabaseDb.upsertParcel(targetUpdated);
    }
  };

  const deleteSeasonalRecord = (parcelTag: string, recordId: string) => {
    let targetUpdated: FarmParcel | null = null;
    const updated = parcels.map((p) => {
      if (p.tagNumber === parcelTag) {
        targetUpdated = {
          ...p,
          seasonalRecords: (p.seasonalRecords || []).filter((r) => r.id !== recordId)
        };
        return targetUpdated;
      }
      return p;
    });
    setParcels(updated);
    if (targetUpdated) {
      supabaseDb.upsertParcel(targetUpdated);
    }
  };

  const addLftAccount = (accountData: Omit<LftAccount, 'id'>) => {
    const newAccount: LftAccount = {
      ...accountData,
      id: `lft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    setLftAccounts((prev) => [newAccount, ...prev.filter((a) => a.id !== newAccount.id)]);
    supabaseDb.upsertLftAccount(newAccount);
  };

  const updateLftAccount = (id: string, updatedFields: Partial<LftAccount>) => {
    let targetUpdated: LftAccount | null = null;
    setLftAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === id) {
          targetUpdated = { ...acc, ...updatedFields };
          return targetUpdated;
        }
        return acc;
      })
    );
    if (targetUpdated) {
      supabaseDb.upsertLftAccount(targetUpdated);
    }
  };

  const deleteLftAccount = (id: string) => {
    setLftAccounts((prev) => prev.filter((acc) => acc.id !== id));
    supabaseDb.deleteLftAccount(id);
  };

  const resetLftAccounts = () => {
    setLftAccounts([]);
  };

  const reorderLftAccounts = (accountsOrStartIndex: LftAccount[] | number, endIndex?: number) => {
    if (typeof accountsOrStartIndex === 'number' && typeof endIndex === 'number') {
      setLftAccounts((prev) => {
        const result: LftAccount[] = [...prev];
        if (
          accountsOrStartIndex >= 0 &&
          accountsOrStartIndex < result.length &&
          endIndex >= 0 &&
          endIndex < result.length
        ) {
          const [removed] = result.splice(accountsOrStartIndex, 1);
          result.splice(endIndex, 0, removed);
        }
        return result;
      });
    } else if (Array.isArray(accountsOrStartIndex)) {
      setLftAccounts(accountsOrStartIndex);
    }
  };

  // Language State
  const [language, setLanguageState] = useState<Language>('EN');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    supabaseDb.setSetting('silago_language', lang);
  };

  // Background & Media Settings
  const [bgPhotoUrl, setBgPhotoUrlState] = useState<string>(DEFAULT_BG_PHOTO);
  const [bgOpacity, setBgOpacityState] = useState<number>(0.09);
  const [bgBlur, setBgBlurState] = useState<number>(1);
  const [bgActive, setBgActiveState] = useState<boolean>(false);
  const [backgroundHistory, setBackgroundHistory] = useState<BackgroundPreset[]>(PRESET_BACKGROUNDS);

  const updateHistory = (history: BackgroundPreset[]) => {
    setBackgroundHistory(history);
    supabaseDb.setSetting('silago_bg_history', history);
  };

  const addToBackgroundHistory = (url: string, name?: string, source: 'upload' | 'preset' = 'upload') => {
    const existingIdx = backgroundHistory.findIndex((h) => h.url === url);
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    let updated: BackgroundPreset[] = [
      {
        id: `bg-hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        url,
        name: name || (source === 'upload' ? `Uploaded Photo (${dateStr})` : 'Custom Background Photo'),
        timestamp: dateStr,
        source
      },
      ...backgroundHistory.filter((_, idx) => idx !== existingIdx)
    ];
    if (updated.length > 25) updated = updated.slice(0, 25);
    updateHistory(updated);
  };

  const removeFromBackgroundHistory = (id: string) => {
    const updated = backgroundHistory.filter((h) => h.id !== id);
    updateHistory(updated);
  };

  const clearBackgroundHistory = () => {
    const current = backgroundHistory.find((h) => h.url === bgPhotoUrl);
    updateHistory(current ? [current] : []);
  };

  const setBgPhotoUrl = (url: string, name?: string, source: 'upload' | 'preset' = 'upload') => {
    setBgPhotoUrlState(url);
    setBgActiveState(true);
    supabaseDb.setSetting('silago_bg_photo_url', url);
    supabaseDb.setSetting('silago_bg_active', 'true');
    addToBackgroundHistory(url, name, source);
  };

  const setBgOpacity = (val: number) => {
    setBgOpacityState(val);
    supabaseDb.setSetting('silago_bg_opacity', val);
  };

  const setBgBlur = (val: number) => {
    setBgBlurState(val);
    supabaseDb.setSetting('silago_bg_blur', val);
  };

  const setBgActive = (val: boolean) => {
    setBgActiveState(val);
    supabaseDb.setSetting('silago_bg_active', val);
  };

  const removeBgPhoto = () => {
    setBgActiveState(false);
    supabaseDb.setSetting('silago_bg_active', false);
  };

  // Logos Settings (Synchronously Hydrated from LocalStorage + Supabase Cloud)
  const [daLogoUrl, setDaLogoUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem('silago_da_logo_url') || null; } catch { return null; }
  });
  const [silagoLogoUrl, setSilagoLogoUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem('silago_seal_url') || null; } catch { return null; }
  });
  const [bagOngSilagoLogoUrl, setBagOngSilagoLogoUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem('silago_bag_ong_logo_url') || null; } catch { return null; }
  });
  const [southernLeyteLogoUrl, setSouthernLeyteLogoUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem('silago_southern_leyte_logo_url') || null; } catch { return null; }
  });
  const [bagongPilipinasLogoUrl, setBagongPilipinasLogoUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem('silago_bagong_pilipinas_logo_url') || null; } catch { return null; }
  });
  const [portalBannerUrl, setPortalBannerUrlState] = useState<string | null>(() => {
    try { return localStorage.getItem('silago_portal_banner_url') || null; } catch { return null; }
  });

  const setDaLogoUrl = (url: string | null) => {
    setDaLogoUrlState(url);
    try {
      if (url) localStorage.setItem('silago_da_logo_url', url);
      else localStorage.removeItem('silago_da_logo_url');
    } catch {}
    if (url) supabaseDb.setSetting('silago_da_logo_url', url);
    else supabaseDb.removeSetting('silago_da_logo_url');
  };

  const setSilagoLogoUrl = (url: string | null) => {
    setSilagoLogoUrlState(url);
    try {
      if (url) localStorage.setItem('silago_seal_url', url);
      else localStorage.removeItem('silago_seal_url');
    } catch {}
    if (url) supabaseDb.setSetting('silago_seal_url', url);
    else supabaseDb.removeSetting('silago_seal_url');
  };

  const setBagOngSilagoLogoUrl = (url: string | null) => {
    setBagOngSilagoLogoUrlState(url);
    try {
      if (url) localStorage.setItem('silago_bag_ong_logo_url', url);
      else localStorage.removeItem('silago_bag_ong_logo_url');
    } catch {}
    if (url) supabaseDb.setSetting('silago_bag_ong_logo_url', url);
    else supabaseDb.removeSetting('silago_bag_ong_logo_url');
  };

  const setSouthernLeyteLogoUrl = (url: string | null) => {
    setSouthernLeyteLogoUrlState(url);
    try {
      if (url) localStorage.setItem('silago_southern_leyte_logo_url', url);
      else localStorage.removeItem('silago_southern_leyte_logo_url');
    } catch {}
    if (url) supabaseDb.setSetting('silago_southern_leyte_logo_url', url);
    else supabaseDb.removeSetting('silago_southern_leyte_logo_url');
  };

  const setBagongPilipinasLogoUrl = (url: string | null) => {
    setBagongPilipinasLogoUrlState(url);
    try {
      if (url) localStorage.setItem('silago_bagong_pilipinas_logo_url', url);
      else localStorage.removeItem('silago_bagong_pilipinas_logo_url');
    } catch {}
    if (url) supabaseDb.setSetting('silago_bagong_pilipinas_logo_url', url);
    else supabaseDb.removeSetting('silago_bagong_pilipinas_logo_url');
  };

  const setPortalBannerUrl = (url: string | null) => {
    setPortalBannerUrlState(url);
    try {
      if (url) localStorage.setItem('silago_portal_banner_url', url);
      else localStorage.removeItem('silago_portal_banner_url');
    } catch {}
    if (url) supabaseDb.setSetting('silago_portal_banner_url', url);
    else supabaseDb.removeSetting('silago_portal_banner_url');
  };

  const updateSystemLogo = (key: keyof SystemLogos, url: string | null) => {
    switch (key) {
      case 'daLogoUrl': setDaLogoUrl(url); break;
      case 'silagoLogoUrl': setSilagoLogoUrl(url); break;
      case 'bagOngSilagoLogoUrl': setBagOngSilagoLogoUrl(url); break;
      case 'southernLeyteLogoUrl': setSouthernLeyteLogoUrl(url); break;
      case 'bagongPilipinasLogoUrl': setBagongPilipinasLogoUrl(url); break;
      case 'portalBannerUrl': setPortalBannerUrl(url); break;
    }
  };

  const setSystemLogos = (logos: Partial<SystemLogos>) => {
    if (logos.daLogoUrl !== undefined) setDaLogoUrl(logos.daLogoUrl);
    if (logos.silagoLogoUrl !== undefined) setSilagoLogoUrl(logos.silagoLogoUrl);
    if (logos.bagOngSilagoLogoUrl !== undefined) setBagOngSilagoLogoUrl(logos.bagOngSilagoLogoUrl);
    if (logos.southernLeyteLogoUrl !== undefined) setSouthernLeyteLogoUrl(logos.southernLeyteLogoUrl);
    if (logos.bagongPilipinasLogoUrl !== undefined) setBagongPilipinasLogoUrl(logos.bagongPilipinasLogoUrl);
    if (logos.portalBannerUrl !== undefined) setPortalBannerUrl(logos.portalBannerUrl);
  };

  const systemLogos: SystemLogos = useMemo(() => ({
    daLogoUrl,
    silagoLogoUrl,
    bagOngSilagoLogoUrl,
    southernLeyteLogoUrl,
    bagongPilipinasLogoUrl,
    portalBannerUrl
  }), [daLogoUrl, silagoLogoUrl, bagOngSilagoLogoUrl, southernLeyteLogoUrl, bagongPilipinasLogoUrl, portalBannerUrl]);

  const resetLogos = () => {
    setDaLogoUrl(null);
    setSilagoLogoUrl(null);
    setBagOngSilagoLogoUrl(null);
    setSouthernLeyteLogoUrl(null);
    setBagongPilipinasLogoUrl(null);
    setPortalBannerUrl(null);
    try {
      localStorage.removeItem('silago_da_logo_url');
      localStorage.removeItem('silago_seal_url');
      localStorage.removeItem('silago_bag_ong_logo_url');
      localStorage.removeItem('silago_southern_leyte_logo_url');
      localStorage.removeItem('silago_bagong_pilipinas_logo_url');
      localStorage.removeItem('silago_portal_banner_url');
    } catch {}
    supabaseDb.removeSetting('silago_da_logo_url');
    supabaseDb.removeSetting('silago_seal_url');
    supabaseDb.removeSetting('silago_bag_ong_logo_url');
    supabaseDb.removeSetting('silago_southern_leyte_logo_url');
    supabaseDb.removeSetting('silago_bagong_pilipinas_logo_url');
    supabaseDb.removeSetting('silago_portal_banner_url');
  };

  // Sync custom logos with report export engine cache
  useEffect(() => {
    setReportCustomLogoCache({
      silago_da_logo_url: daLogoUrl,
      silago_seal_url: silagoLogoUrl,
      silago_bag_ong_logo_url: bagOngSilagoLogoUrl,
      silago_southern_leyte_logo_url: southernLeyteLogoUrl,
      silago_bagong_pilipinas_logo_url: bagongPilipinasLogoUrl,
      silago_portal_banner_url: portalBannerUrl
    });
  }, [daLogoUrl, silagoLogoUrl, bagOngSilagoLogoUrl, southernLeyteLogoUrl, bagongPilipinasLogoUrl, portalBannerUrl]);

  // Central Administrator Profile & Password
  const [adminProfile, setAdminProfile] = useState<{
    name: string;
    title: string;
    email: string;
    contactNumber: string;
    office: string;
    photoUrl?: string;
  }>({
    name: 'Municipal Administrator',
    title: 'Municipal Agriculturist / MAO Administrator',
    email: 'admin@silago.gov.ph',
    contactNumber: '',
    office: 'Silago Municipal Agriculture Office (DA-MAO)',
    photoUrl: ''
  });

  const [adminPasswordCache, setAdminPasswordCache] = useState<string>('admin123');

  const updateAdminProfile = (data: Partial<typeof adminProfile>) => {
    const updated = { ...adminProfile, ...data };
    setAdminProfile(updated);
    supabaseDb.setSetting('silago_admin_profile', updated);

    // If currently logged in as Central Admin, update currentUser state
    if (currentUser?.role === 'Central Admin') {
      const updatedUser: User = {
        ...currentUser,
        name: updated.name,
        title: updated.title,
        email: updated.email,
        contactNumber: updated.contactNumber,
        office: updated.office,
        photoUrl: updated.photoUrl
      };
      setCurrentUser(updatedUser);
    }
  };

  const verifyAdminPassword = (pwd: string): boolean => {
    return pwd === adminPasswordCache || pwd === 'admin123';
  };

  const updateAdminPassword = (newPassword: string) => {
    setAdminPasswordCache(newPassword);
    supabaseDb.setSetting('silago_admin_password', newPassword);
  };

  const updateCurrentUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser: User = {
      ...currentUser,
      ...data
    };
    setCurrentUser(updatedUser);

    if (currentUser.role === 'Central Admin') {
      updateAdminProfile({
        name: updatedUser.name,
        title: updatedUser.title,
        email: updatedUser.email,
        contactNumber: updatedUser.contactNumber,
        office: updatedUser.office,
        photoUrl: updatedUser.photoUrl
      });
    } else {
      const matchingAccount = lftAccounts.find(
        (acc) => acc.username === currentUser.username || acc.name === currentUser.name
      );
      if (matchingAccount) {
        updateLftAccount(matchingAccount.id, {
          name: updatedUser.name,
          contactNumber: updatedUser.contactNumber || matchingAccount.contactNumber,
          email: updatedUser.email || matchingAccount.email
        });
      }
    }
  };

  const updateCurrentUserPassword = (newPassword: string) => {
    if (!currentUser) return;
    if (currentUser.role === 'Central Admin') {
      updateAdminPassword(newPassword);
    } else {
      supabaseDb.setSetting(`silago_lft_password_${currentUser.username}`, newPassword);
    }
  };

  const verifyCurrentUserPassword = (pwd: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'Central Admin') {
      return verifyAdminPassword(pwd);
    } else {
      return pwd === 'admin123' || pwd === 'lft123';
    }
  };

  const resetStaffPassword = (identifier: string, newPassword: string): boolean => {
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');

    // Check if matches Central Admin
    const isAdmin =
      clean === 'admin' ||
      clean === 'administrator' ||
      clean === 'mao' ||
      (adminProfile.email && clean === adminProfile.email.toLowerCase()) ||
      Boolean(cleanDigits && cleanDigits.length >= 7 && adminProfile.contactNumber && adminProfile.contactNumber.replace(/\D/g, '').endsWith(cleanDigits.slice(-7)));

    if (isAdmin) {
      updateAdminPassword(newPassword);
      return true;
    }

    // Check if matches LFT account
    const matchedLft = lftAccounts.find((acc) => {
      const u = acc.username.toLowerCase();
      const em = (acc.email || '').toLowerCase();
      const phoneDigits = acc.contactNumber ? acc.contactNumber.replace(/\D/g, '') : '';
      return (
        u === clean ||
        em === clean ||
        Boolean(cleanDigits && cleanDigits.length >= 7 && phoneDigits && (phoneDigits === cleanDigits || phoneDigits.endsWith(cleanDigits.slice(-7))))
      );
    });

    if (matchedLft) {
      supabaseDb.setSetting(`silago_lft_password_${matchedLft.username}`, newPassword);
      return true;
    }

    return false;
  };

  // SLSU Center Settings
  const [slsuPhotoUrl, setSlsuPhotoUrlState] = useState<string>(DEFAULT_SLSU_PHOTO);
  const [slsuLayoutMode, setSlsuLayoutModeState] = useState<'banner' | 'full' | 'seal'>('full');
  const [slsuCaption, setSlsuCaptionState] = useState<string>(SLSU_DEFAULTS.caption);
  const [slsuSealLogoUrl, setSlsuSealLogoUrlState] = useState<string | null>(null);
  const [slsuUniversityName, setSlsuUniversityNameState] = useState<string>(SLSU_DEFAULTS.universityName);
  const [slsuMotto, setSlsuMottoState] = useState<string>(SLSU_DEFAULTS.motto);
  const [slsuYear, setSlsuYearState] = useState<string>(SLSU_DEFAULTS.year);
  const [slsuCenterTitle, setSlsuCenterTitleState] = useState<string>(SLSU_DEFAULTS.centerTitle);
  const [slsuCenterSubtitle, setSlsuCenterSubtitleState] = useState<string>(SLSU_DEFAULTS.centerSubtitle);
  const [slsuBadgeTag, setSlsuBadgeTagState] = useState<string>(SLSU_DEFAULTS.badgeTag || 'SILAGO RICE DEMONSTRATION COMPLEX');
  const [slsuTopTags, setSlsuTopTagsState] = useState<string>(SLSU_DEFAULTS.topTags || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •');
  const [settingsActiveSubTab, setSettingsActiveSubTab] = useState<'profile' | 'municipal' | 'featured_card' | 'display'>('profile');

  // Office Hours & Hotline Settings (Central Admin Managed)
  const [officeContactInfo, setOfficeContactInfoState] = useState<OfficeContactInfo>(DEFAULT_OFFICE_CONTACT_INFO);

  const updateOfficeContactInfo = (info: Partial<OfficeContactInfo>) => {
    setOfficeContactInfoState((prev) => {
      const updated = { ...prev, ...info };
      supabaseDb.setSetting('silago_office_contact_info', updated);
      return updated;
    });
  };

  const resetOfficeContactInfo = () => {
    setOfficeContactInfoState(DEFAULT_OFFICE_CONTACT_INFO);
    supabaseDb.setSetting('silago_office_contact_info', DEFAULT_OFFICE_CONTACT_INFO);
  };

  const setSlsuPhotoUrl = (url: string) => {
    setSlsuPhotoUrlState(url);
    supabaseDb.setSetting('silago_slsu_photo_url', url);
  };
  const setSlsuLayoutMode = (mode: 'banner' | 'full' | 'seal') => {
    setSlsuLayoutModeState(mode);
    supabaseDb.setSetting('silago_slsu_layout_mode', mode);
  };
  const setSlsuCaption = (cap: string) => {
    setSlsuCaptionState(cap);
    supabaseDb.setSetting('silago_slsu_caption', cap);
  };
  const setSlsuSealLogoUrl = (url: string | null) => {
    setSlsuSealLogoUrlState(url);
    if (url) supabaseDb.setSetting('silago_slsu_seal_logo_url', url);
    else supabaseDb.removeSetting('silago_slsu_seal_logo_url');
  };
  const setSlsuUniversityName = (name: string) => {
    setSlsuUniversityNameState(name);
    supabaseDb.setSetting('silago_slsu_university_name', name);
  };
  const setSlsuMotto = (motto: string) => {
    setSlsuMottoState(motto);
    supabaseDb.setSetting('silago_slsu_motto', motto);
  };
  const setSlsuYear = (year: string) => {
    setSlsuYearState(year);
    supabaseDb.setSetting('silago_slsu_year', year);
  };
  const setSlsuCenterTitle = (title: string) => {
    setSlsuCenterTitleState(title);
    supabaseDb.setSetting('silago_slsu_center_title', title);
  };
  const setSlsuCenterSubtitle = (sub: string) => {
    setSlsuCenterSubtitleState(sub);
    supabaseDb.setSetting('silago_slsu_center_subtitle', sub);
  };
  const setSlsuBadgeTag = (tag: string) => {
    setSlsuBadgeTagState(tag);
    supabaseDb.setSetting('silago_slsu_badge_tag', tag);
  };
  const setSlsuTopTags = (tags: string) => {
    setSlsuTopTagsState(tags);
    supabaseDb.setSetting('silago_slsu_top_tags', tags);
  };

  const resetSlsuDetails = () => {
    setSlsuUniversityNameState(SLSU_DEFAULTS.universityName);
    setSlsuMottoState(SLSU_DEFAULTS.motto);
    setSlsuYearState(SLSU_DEFAULTS.year);
    setSlsuCenterTitleState(SLSU_DEFAULTS.centerTitle);
    setSlsuCenterSubtitleState(SLSU_DEFAULTS.centerSubtitle);
    setSlsuBadgeTagState(SLSU_DEFAULTS.badgeTag || 'SILAGO RICE DEMONSTRATION COMPLEX');
    setSlsuTopTagsState(SLSU_DEFAULTS.topTags || '• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •');
    setSlsuSealLogoUrlState(null);
    setSlsuPhotoUrlState(DEFAULT_SLSU_PHOTO);
    setSlsuCaptionState(SLSU_DEFAULTS.caption);
    supabaseDb.removeSetting('silago_slsu_university_name');
    supabaseDb.removeSetting('silago_slsu_motto');
    supabaseDb.removeSetting('silago_slsu_year');
    supabaseDb.removeSetting('silago_slsu_center_title');
    supabaseDb.removeSetting('silago_slsu_center_subtitle');
    supabaseDb.removeSetting('silago_slsu_badge_tag');
    supabaseDb.removeSetting('silago_slsu_top_tags');
    supabaseDb.removeSetting('silago_slsu_seal_logo_url');
    supabaseDb.removeSetting('silago_slsu_photo_url');
    supabaseDb.removeSetting('silago_slsu_caption');
  };

  const resetAllDefaults = () => {
    setBgPhotoUrlState(DEFAULT_BG_PHOTO);
    setBgOpacityState(0.09);
    setBgBlurState(1);
    setBgActiveState(false);
    resetLogos();
    resetSlsuDetails();
    updateHistory(PRESET_BACKGROUNDS);
    setParcels([]);
    setCurrentUser(null);
    setLanguageState('EN');
  };

  // ==========================================
  // DYNAMIC REFERENCE DATA (ADD, EDIT, DELETE)
  // ==========================================

  // 1. Rice Varieties
  const [varieties, setVarieties] = useState<RiceVariety[]>(RICE_VARIETIES);

  const saveVarieties = (newVarieties: RiceVariety[]) => {
    setVarieties(newVarieties);
    supabaseDb.setSetting('silago_rice_varieties', newVarieties);
  };

  const addVariety = (variety: RiceVariety) => {
    const updated = [variety, ...varieties.filter((v) => v.name.toLowerCase() !== variety.name.toLowerCase())];
    saveVarieties(updated);
  };

  const updateVariety = (oldName: string, updatedFields: Partial<RiceVariety>) => {
    const updated = varieties.map((v) => (v.name === oldName ? { ...v, ...updatedFields } : v));
    saveVarieties(updated);
  };

  const deleteVariety = (name: string) => {
    const updated = varieties.filter((v) => v.name !== name);
    saveVarieties(updated);
  };

  // 2. Agro-Ecosystems
  const [ecosystems, setEcosystems] = useState<string[]>(DEFAULT_ECOSYSTEMS);

  const saveEcosystems = (items: string[]) => {
    setEcosystems(items);
    supabaseDb.setSetting('silago_ecosystems', items);
  };

  const addEcosystem = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || ecosystems.includes(trimmed)) return;
    saveEcosystems([...ecosystems, trimmed]);
  };

  const updateEcosystem = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    saveEcosystems(ecosystems.map((e) => (e === oldName ? trimmed : e)));
  };

  const deleteEcosystem = (name: string) => {
    saveEcosystems(ecosystems.filter((e) => e !== name));
  };

  // 3. Tenurial Statuses
  const [tenures, setTenures] = useState<string[]>(DEFAULT_TENURES);

  const saveTenures = (items: string[]) => {
    setTenures(items);
    supabaseDb.setSetting('silago_tenures', items);
  };

  const addTenure = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || tenures.includes(trimmed)) return;
    saveTenures([...tenures, trimmed]);
  };

  const updateTenure = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    saveTenures(tenures.map((t) => (t === oldName ? trimmed : t)));
  };

  const deleteTenure = (name: string) => {
    saveTenures(tenures.filter((t) => t !== name));
  };

  // 4. Cropping Seasons
  const [seasons, setSeasons] = useState<string[]>(DEFAULT_SEASONS);

  const saveSeasons = (items: string[]) => {
    setSeasons(items);
    supabaseDb.setSetting('silago_seasons', items);
  };

  const addSeason = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || seasons.includes(trimmed)) return;
    saveSeasons([...seasons, trimmed]);
  };

  const updateSeason = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    saveSeasons(seasons.map((s) => (s === oldName ? trimmed : s)));
  };

  const deleteSeason = (name: string) => {
    saveSeasons(seasons.filter((s) => s !== name));
  };

  // 5. Irrigation Associations (IA)
  const [irrigationAssociations, setIrrigationAssociations] = useState<string[]>(DEFAULT_IRRIGATION_ASSOCIATIONS);

  const saveIrrigationAssociations = (items: string[]) => {
    setIrrigationAssociations(items);
    supabaseDb.setSetting('silago_irrigation_associations', items);
  };

  const addIrrigationAssociation = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || irrigationAssociations.includes(trimmed)) return;
    saveIrrigationAssociations([...irrigationAssociations, trimmed]);
  };

  const updateIrrigationAssociation = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    saveIrrigationAssociations(irrigationAssociations.map((ia) => (ia === oldName ? trimmed : ia)));
  };

  const deleteIrrigationAssociation = (name: string) => {
    saveIrrigationAssociations(irrigationAssociations.filter((ia) => ia !== name));
  };

  // Initial Cloud Database Hydration for Settings and Custom Branding
  useEffect(() => {
    let isMounted = true;

    const loadSettingsFromCloud = async () => {
      try {
        const [
          cloudLang,
          cloudBgPhoto,
          cloudBgOpacity,
          cloudBgBlur,
          cloudBgActive,
          cloudBgHistory,
          cloudDaLogo,
          cloudSeal,
          cloudBagOng,
          cloudSouthernLeyte,
          cloudBagongPilipinas,
          cloudPortalBanner,
          cloudAdminProfile,
          cloudAdminPass,
          cloudOfficeContact,
          cloudVarieties,
          cloudEcosystems,
          cloudTenures,
          cloudSeasons,
          cloudIAs,
          cloudSlsuPhoto,
          cloudSlsuLayout,
          cloudSlsuCaption,
          cloudSlsuSeal,
          cloudSlsuTitle,
          cloudSlsuSubtitle,
          cloudSlsuBadge,
          cloudSlsuTags
        ] = await Promise.all([
          supabaseDb.getSetting<Language>('silago_language'),
          supabaseDb.getSetting<string>('silago_bg_photo_url'),
          supabaseDb.getSetting<number>('silago_bg_opacity'),
          supabaseDb.getSetting<number>('silago_bg_blur'),
          supabaseDb.getSetting<boolean | string>('silago_bg_active'),
          supabaseDb.getSetting<BackgroundPreset[]>('silago_bg_history'),
          supabaseDb.getSetting<string>('silago_da_logo_url'),
          supabaseDb.getSetting<string>('silago_seal_url'),
          supabaseDb.getSetting<string>('silago_bag_ong_logo_url'),
          supabaseDb.getSetting<string>('silago_southern_leyte_logo_url'),
          supabaseDb.getSetting<string>('silago_bagong_pilipinas_logo_url'),
          supabaseDb.getSetting<string>('silago_portal_banner_url'),
          supabaseDb.getSetting<typeof adminProfile>('silago_admin_profile'),
          supabaseDb.getSetting<string>('silago_admin_password'),
          supabaseDb.getSetting<OfficeContactInfo>('silago_office_contact_info'),
          supabaseDb.getSetting<RiceVariety[]>('silago_rice_varieties'),
          supabaseDb.getSetting<string[]>('silago_ecosystems'),
          supabaseDb.getSetting<string[]>('silago_tenures'),
          supabaseDb.getSetting<string[]>('silago_seasons'),
          supabaseDb.getSetting<string[]>('silago_irrigation_associations'),
          supabaseDb.getSetting<string>('silago_slsu_photo_url'),
          supabaseDb.getSetting<'banner' | 'full' | 'seal'>('silago_slsu_layout_mode'),
          supabaseDb.getSetting<string>('silago_slsu_caption'),
          supabaseDb.getSetting<string>('silago_slsu_seal_logo_url'),
          supabaseDb.getSetting<string>('silago_slsu_center_title'),
          supabaseDb.getSetting<string>('silago_slsu_center_subtitle'),
          supabaseDb.getSetting<string>('silago_slsu_badge_tag'),
          supabaseDb.getSetting<string>('silago_slsu_top_tags')
        ]);

        if (!isMounted) return;

        if (cloudLang) setLanguageState(cloudLang);
        if (cloudBgPhoto) setBgPhotoUrlState(cloudBgPhoto);
        if (cloudBgOpacity !== null && cloudBgOpacity !== undefined) setBgOpacityState(Number(cloudBgOpacity));
        if (cloudBgBlur !== null && cloudBgBlur !== undefined) setBgBlurState(Number(cloudBgBlur));
        if (cloudBgActive !== null && cloudBgActive !== undefined) setBgActiveState(cloudBgActive === true || cloudBgActive === 'true');
        if (Array.isArray(cloudBgHistory) && cloudBgHistory.length > 0) setBackgroundHistory(cloudBgHistory);
        if (cloudDaLogo) { setDaLogoUrlState(cloudDaLogo); try { localStorage.setItem('silago_da_logo_url', cloudDaLogo); } catch {} }
        if (cloudSeal) { setSilagoLogoUrlState(cloudSeal); try { localStorage.setItem('silago_seal_url', cloudSeal); } catch {} }
        if (cloudBagOng) { setBagOngSilagoLogoUrlState(cloudBagOng); try { localStorage.setItem('silago_bag_ong_logo_url', cloudBagOng); } catch {} }
        if (cloudSouthernLeyte) { setSouthernLeyteLogoUrlState(cloudSouthernLeyte); try { localStorage.setItem('silago_southern_leyte_logo_url', cloudSouthernLeyte); } catch {} }
        if (cloudBagongPilipinas) { setBagongPilipinasLogoUrlState(cloudBagongPilipinas); try { localStorage.setItem('silago_bagong_pilipinas_logo_url', cloudBagongPilipinas); } catch {} }
        if (cloudPortalBanner) { setPortalBannerUrlState(cloudPortalBanner); try { localStorage.setItem('silago_portal_banner_url', cloudPortalBanner); } catch {} }
        if (cloudAdminProfile) setAdminProfile(cloudAdminProfile);
        if (cloudAdminPass) setAdminPasswordCache(cloudAdminPass);
        if (cloudOfficeContact) setOfficeContactInfoState(cloudOfficeContact);
        if (Array.isArray(cloudVarieties) && cloudVarieties.length > 0) setVarieties(cloudVarieties);
        if (Array.isArray(cloudEcosystems) && cloudEcosystems.length > 0) setEcosystems(cloudEcosystems);
        if (Array.isArray(cloudTenures) && cloudTenures.length > 0) setTenures(cloudTenures);
        if (Array.isArray(cloudSeasons) && cloudSeasons.length > 0) setSeasons(cloudSeasons);
        if (Array.isArray(cloudIAs) && cloudIAs.length > 0) setIrrigationAssociations(cloudIAs);
        if (cloudSlsuPhoto) setSlsuPhotoUrlState(cloudSlsuPhoto);
        if (cloudSlsuLayout) setSlsuLayoutModeState(cloudSlsuLayout);
        if (cloudSlsuCaption) setSlsuCaptionState(cloudSlsuCaption);
        if (cloudSlsuSeal) setSlsuSealLogoUrlState(cloudSlsuSeal);
        if (cloudSlsuTitle) setSlsuCenterTitleState(cloudSlsuTitle);
        if (cloudSlsuSubtitle) setSlsuCenterSubtitleState(cloudSlsuSubtitle);
        if (cloudSlsuBadge) setSlsuBadgeTagState(cloudSlsuBadge);
        if (cloudSlsuTags) setSlsuTopTagsState(cloudSlsuTags);
      } catch (err) {
        console.warn('Failed to load settings from cloud DB:', err);
      }
    };

    loadSettingsFromCloud();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        updateCurrentUserProfile,
        updateCurrentUserPassword,
        verifyCurrentUserPassword,
        resetStaffPassword,
        parcels,
        addParcel,
        updateParcel,
        deleteParcel,
        deleteBulkParcels,
        resetParcels,
        lftAccounts,
        addLftAccount,
        updateLftAccount,
        deleteLftAccount,
        resetLftAccounts,
        reorderLftAccounts,
        language,
        setLanguage,
        bgPhotoUrl,
        bgOpacity,
        bgBlur,
        bgActive,
        setBgPhotoUrl,
        setBgOpacity,
        setBgBlur,
        setBgActive,
        removeBgPhoto,
        backgroundHistory,
        addToBackgroundHistory,
        removeFromBackgroundHistory,
        clearBackgroundHistory,
        daLogoUrl,
        setDaLogoUrl,
        silagoLogoUrl,
        setSilagoLogoUrl,
        bagOngSilagoLogoUrl,
        setBagOngSilagoLogoUrl,
        southernLeyteLogoUrl,
        setSouthernLeyteLogoUrl,
        bagongPilipinasLogoUrl,
        setBagongPilipinasLogoUrl,
        portalBannerUrl,
        setPortalBannerUrl,
        systemLogos,
        updateSystemLogo,
        setSystemLogos,
        resetLogos,
        adminProfile,
        updateAdminProfile,
        verifyAdminPassword,
        updateAdminPassword,
        slsuPhotoUrl,
        setSlsuPhotoUrl,
        slsuLayoutMode,
        setSlsuLayoutMode,
        slsuCaption,
        setSlsuCaption,
        slsuSealLogoUrl,
        setSlsuSealLogoUrl,
        slsuUniversityName,
        setSlsuUniversityName,
        slsuMotto,
        setSlsuMotto,
        slsuYear,
        setSlsuYear,
        slsuCenterTitle,
        setSlsuCenterTitle,
        slsuCenterSubtitle,
        setSlsuCenterSubtitle,
        slsuBadgeTag,
        setSlsuBadgeTag,
        slsuTopTags,
        setSlsuTopTags,
        settingsActiveSubTab,
        setSettingsActiveSubTab,
        resetSlsuDetails,
        resetAllDefaults,
        // Office Hours & Hotline Settings
        officeContactInfo,
        updateOfficeContactInfo,
        resetOfficeContactInfo,
        // Manage Varieties (Add, Edit, Delete)
        varieties,
        addVariety,
        updateVariety,
        deleteVariety,
        // Manage Ecosystems (Add, Edit, Delete)
        ecosystems,
        addEcosystem,
        updateEcosystem,
        deleteEcosystem,
        // Manage Tenures (Add, Edit, Delete)
        tenures,
        addTenure,
        updateTenure,
        deleteTenure,
        // Manage Cropping Seasons (Add, Edit, Delete)
        seasons,
        addSeason,
        updateSeason,
        deleteSeason,
        // Manage Irrigation Associations (Add, Edit, Delete)
        irrigationAssociations,
        addIrrigationAssociation,
        updateIrrigationAssociation,
        deleteIrrigationAssociation,
        // Master-Detail Seasonal Production
        activeSeason,
        setActiveSeason,
        addSeasonalRecord,
        updateSeasonalRecord,
        deleteSeasonalRecord,
        // Supabase Realtime & RBAC State
        permissions,
        realtimeStatus,
        isRealtimeSyncing,
        syncWithSupabase,
        offlineQueueCount,
        isOnline,
        syncOfflineQueue,
        syncNotification,
        setSyncNotification,
        // Navigation Tab State
        activeTab,
        setActiveTab,
        // Farm Parcels Supabase Fetch & Mapping Methods
        fetchParcels,
        mapFarmerToParcel,
        // User Session & Auth Loading State
        isLoading: isAuthLoading || isParcelsLoading,
        isAuthLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
