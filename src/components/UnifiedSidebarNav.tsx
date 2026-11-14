import React, { useState } from 'react';
import { PortalTab } from '../types';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Activity,
  Compass,
  Wheat,
  Printer,
  Users,
  Settings,
  Globe,
  Sliders,
  ClipboardCheck,
  FileText,
  Search,
  MessageSquare,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
  Sprout
} from 'lucide-react';

interface UnifiedSidebarNavProps {
  activeTab: PortalTab;
  onNavigateTab: (tab: PortalTab) => void;
  onOpenPublicPortal: () => void;
  onOpenAddParcel: () => void;
  onOpenAccount?: () => void;
  isAuthenticated?: boolean;
  isCentralAdmin: boolean;
  isSidebarCollapsed: boolean;
  parcelsCount: number;
}

export const UnifiedSidebarNav: React.FC<UnifiedSidebarNavProps> = ({
  activeTab,
  onNavigateTab,
  onOpenPublicPortal,
  onOpenAddParcel,
  onOpenAccount,
  isAuthenticated = false,
  isCentralAdmin,
  isSidebarCollapsed,
  parcelsCount
}) => {
  const { t } = useApp();
  const [navSearchQuery, setNavSearchQuery] = useState('');

  // Main menu items filtered strictly by authentication & role
  const primaryMenuItems = [
    ...(isAuthenticated
      ? [
          {
            id: isCentralAdmin ? 'dashboard' : 'lft_dashboard',
            tab: (isCentralAdmin ? 'dashboard' : 'lft_dashboard') as PortalTab,
            label: 'Dashboard',
            icon: isCentralAdmin ? LayoutDashboard : Activity,
          },
        ]
      : []),
    {
      id: 'map',
      tab: 'map' as PortalTab,
      label: 'GIS Rice Map',
      icon: Compass,
    },
    {
      id: 'eartags',
      tab: 'eartags' as PortalTab,
      label: 'Rice Records',
      icon: Wheat,
      badge: parcelsCount > 0 ? parcelsCount : undefined
    },
    ...(isAuthenticated
      ? [
          {
            id: 'subsidies',
            tab: 'subsidies' as PortalTab,
            label: t('nav.subsidies', 'Seed & Fertilizer Claims'),
            icon: Sprout,
          }
        ]
      : []),
    {
      id: 'reports',
      tab: 'reports' as PortalTab,
      label: 'Print Official Reports',
      icon: Printer,
    },
    {
      id: 'evaluation',
      tab: 'evaluation' as PortalTab,
      label: 'Quality & Evaluation (ISO 25010)',
      icon: ClipboardCheck,
    },
    ...(isCentralAdmin
      ? [
          {
            id: 'barangays',
            tab: 'barangays' as PortalTab,
            label: 'Manage Barangay',
            icon: Layers,
          }
        ]
      : []),
    {
      id: 'legal_decrees',
      tab: 'legal_decrees' as PortalTab,
      label: 'Rice Legal Decrees',
      icon: FileText,
    },
    ...(isAuthenticated
      ? [
          {
            id: 'account',
            tab: 'account' as PortalTab,
            label: 'My Account',
            icon: Users,
          }
        ]
      : [])
  ];

  // Admin section items (Settings placed last below User Accounts)
  const adminMenuItems = [
    {
      id: 'registry_form',
      tab: 'registry_form' as PortalTab,
      label: 'Form Customization',
      icon: Sliders,
    },
    {
      id: 'accounts',
      tab: 'accounts' as PortalTab,
      label: 'User Accounts',
      icon: Users,
    },
    {
      id: 'settings',
      tab: 'settings' as PortalTab,
      label: 'Settings',
      icon: Settings,
    }
  ];

  // Filter items by nav search query
  const q = navSearchQuery.toLowerCase().trim();
  const filteredPrimary = primaryMenuItems.filter(item =>
    !q || item.label.toLowerCase().includes(q)
  );
  const filteredAdmin = adminMenuItems.filter(item =>
    !q || item.label.toLowerCase().includes(q)
  );

  // Collapsed icon-rail mode
  if (isSidebarCollapsed) {
    return (
      <div className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-1.5 flex flex-col items-center">
        {primaryMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateTab(item.tab)}
              className={`w-9 h-9 rounded-md flex items-center justify-center transition cursor-pointer relative ${
                isActive
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title={item.label}
            >
              <Icon className="w-4 h-4" />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-1 px-1 py-0.2 bg-emerald-500 text-white text-[9px] font-bold rounded-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {isCentralAdmin && (
          <>
            <div className="w-6 border-b border-white/15 my-1" />
            {adminMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab(item.tab)}
                  className={`w-9 h-9 rounded-md flex items-center justify-center transition cursor-pointer relative ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </>
        )}

        {/* PUBLIC PORTAL (Icon View) */}
        <button
          type="button"
          onClick={onOpenPublicPortal}
          className="w-9 h-9 rounded-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title={t('nav.portal', 'Public Web Portal')}
        >
          <Globe className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    );
  }

  // Expanded formal office sidebar navigation
  return (
    <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-2.5 space-y-3">
      {/* Live Page Filter */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/45 pointer-events-none" />
        <input
          type="text"
          value={navSearchQuery}
          onChange={(e) => setNavSearchQuery(e.target.value)}
          placeholder="Filter menu..."
          className="w-full pl-8 pr-3 py-1.5 rounded bg-white/5 border border-white/15 text-xs text-white placeholder:text-white/45 focus:outline-hidden focus:border-white/40 focus:bg-white/10 transition"
        />
        {navSearchQuery && (
          <button
            type="button"
            onClick={() => setNavSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Primary Navigation */}
      <div className="space-y-0.5">
        <div className="px-2.5 pb-1 text-[10px] font-semibold text-white/45 uppercase tracking-widest">
          Registry &amp; Operations
        </div>
        {filteredPrimary.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigateTab(item.tab)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition cursor-pointer border-l-2 ${
                isActive
                  ? 'bg-white/12 text-white font-semibold border-gov-gold'
                  : 'text-white/80 hover:text-white hover:bg-white/8 font-medium border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/55'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-white/80'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Administration */}
      {isCentralAdmin && (
        <div className="pt-2.5 border-t border-white/10">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-white/45 uppercase tracking-widest">
            System Administration
          </div>
          <div className="space-y-0.5 mt-1">
            {filteredAdmin.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab(item.tab)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition cursor-pointer border-l-2 ${
                    isActive
                      ? 'bg-white/12 text-white font-semibold border-gov-gold'
                      : 'text-white/80 hover:text-white hover:bg-white/8 font-medium border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/55'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Public Web Portal Link */}
      <div className="pt-2.5 border-t border-white/10">
        <button
          type="button"
          onClick={onOpenPublicPortal}
          className="w-full flex items-center justify-between px-2.5 py-2 rounded text-xs text-white/85 hover:text-white hover:bg-white/10 font-medium transition cursor-pointer border border-white/15 bg-white/[0.04]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe className="w-4 h-4 text-slate-300 shrink-0" />
            <span className="truncate">{t('nav.portal', 'Public Web Portal')}</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </button>
      </div>
    </div>
  );
};
