import React, { useState, useEffect } from 'react';
import { PortalTab } from '../types';
import {
  LayoutDashboard,
  Activity,
  Compass,
  Wheat,
  Printer,
  Users,
  Image,
  Settings,
  Globe,
  PlusCircle,
  ChevronDown,
  ExternalLink,
  Layers,
  Database,
  Sliders,
  Sparkles
} from 'lucide-react';

interface UnifiedSidebarNavProps {
  activeTab: PortalTab;
  onNavigateTab: (tab: PortalTab) => void;
  onOpenPublicPortal: () => void;
  onOpenAddParcel: () => void;
  isCentralAdmin: boolean;
  isSidebarCollapsed: boolean;
  parcelsCount: number;
}

export const UnifiedSidebarNav: React.FC<UnifiedSidebarNavProps> = ({
  activeTab,
  onNavigateTab,
  onOpenPublicPortal,
  onOpenAddParcel,
  isCentralAdmin,
  isSidebarCollapsed,
  parcelsCount
}) => {
  // Accordion open/collapse states
  const [openSections, setOpenSections] = useState<{
    operations: boolean;
    registry: boolean;
    management: boolean;
  }>({
    operations: true,
    registry: true,
    management: true
  });

  // Ensure active tab's section is open whenever activeTab changes
  useEffect(() => {
    if (activeTab === 'dashboard' || activeTab === 'lft_dashboard') {
      setOpenSections((prev) => ({ ...prev, operations: true }));
    } else if (activeTab === 'map' || activeTab === 'eartags' || activeTab === 'reports') {
      setOpenSections((prev) => ({ ...prev, registry: true }));
    } else if (activeTab === 'accounts' || activeTab === 'photos' || activeTab === 'settings') {
      setOpenSections((prev) => ({ ...prev, management: true }));
    }
  }, [activeTab]);

  const toggleSection = (section: 'operations' | 'registry' | 'management') => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // If sidebar is collapsed into icon-rail mode (w-[74px])
  if (isSidebarCollapsed) {
    return (
      <div className="flex-1 overflow-y-auto sidebar-scroll py-3 px-2 space-y-2 flex flex-col items-center">
        {/* OPERATIONS GROUP (Icon View) */}
        <div className="w-full flex flex-col items-center space-y-1">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest py-0.5">OPS</div>
          {isCentralAdmin ? (
            <button
              type="button"
              onClick={() => onNavigateTab('dashboard')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Operations: Executive Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigateTab('lft_dashboard')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
                activeTab === 'lft_dashboard'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Operations: LFT Field Dashboard"
            >
              <Activity className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="w-6 border-b border-white/10 my-1" />

        {/* REGISTRY GROUP (Icon View) */}
        <div className="w-full flex flex-col items-center space-y-1">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest py-0.5">REG</div>
          <button
            type="button"
            onClick={() => onNavigateTab('map')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
              activeTab === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Registry: GIS Rice Map & Polygons"
          >
            <Compass className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('eartags')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
              activeTab === 'eartags'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={`Registry: Rice Farm Records (${parcelsCount} lots)`}
          >
            <Wheat className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Registry: Official Farm Reports"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>

        <div className="w-6 border-b border-white/10 my-1" />

        {/* MANAGEMENT GROUP (Icon View) */}
        <div className="w-full flex flex-col items-center space-y-1">
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest py-0.5">MGT</div>
          {isCentralAdmin && (
            <button
              type="button"
              onClick={() => onNavigateTab('accounts')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
                activeTab === 'accounts'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Management: LFT Field Accounts"
            >
              <Users className="w-4 h-4" />
            </button>
          )}

          {isCentralAdmin && (
            <button
              type="button"
              onClick={() => onNavigateTab('photos')}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
                activeTab === 'photos'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
              title="Management: Photo, Media & Municipal Seals"
            >
              <Image className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition cursor-pointer relative ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title={isCentralAdmin ? 'Management: System Settings' : 'Management: Account Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <div className="w-6 border-b border-white/10 my-1" />

        {/* PUBLIC PORTAL (Icon View) */}
        <button
          type="button"
          onClick={onOpenPublicPortal}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          title="Public Web Portal"
        >
          <Globe className="w-4 h-4 text-sky-400" />
        </button>
      </div>
    );
  }

  // Full Expanded Sidebar Navigation Menu with Accordions
  const isOperationsActive = activeTab === 'dashboard' || activeTab === 'lft_dashboard';
  const isRegistryActive = activeTab === 'map' || activeTab === 'eartags' || activeTab === 'reports';
  const isManagementActive = activeTab === 'accounts' || activeTab === 'photos' || activeTab === 'settings';

  const operationsCount = 1;
  const registryCount = 3;
  const managementCount = isCentralAdmin ? 3 : 1;

  return (
    <div className="flex-1 overflow-y-auto sidebar-scroll px-3 py-2 space-y-3">
      {/* ============================================================ */}
      {/* 1. OPERATIONS ACCORDION SECTION                              */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('operations')}
          className="w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-white/5 transition cursor-pointer group"
          aria-expanded={openSections.operations}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1 rounded-md transition ${
              isOperationsActive ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-slate-400 group-hover:text-white'
            }`}>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black text-slate-200 tracking-wider uppercase group-hover:text-white">
              Operations
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 group-hover:text-slate-300 border border-white/5">
              {operationsCount}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                openSections.operations ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </button>

        {openSections.operations && (
          <div className="px-1.5 pb-2 pt-0.5 space-y-1">
            {/* Executive Dashboard (Central Admin Only) */}
            {isCentralAdmin ? (
              <button
                type="button"
                onClick={() => onNavigateTab('dashboard')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-300" />
                  <span className="truncate">Executive Dashboard</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    activeTab === 'dashboard' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Admin
                </span>
              </button>
            ) : (
              /* LFT Field Dashboard (LFTs Only) */
              <button
                type="button"
                onClick={() => onNavigateTab('lft_dashboard')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'lft_dashboard'
                    ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-4 h-4 shrink-0 text-slate-300" />
                  <span className="truncate">LFT Field Dashboard</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    activeTab === 'lft_dashboard' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Field
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. REGISTRY ACCORDION SECTION                                */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('registry')}
          className="w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-white/5 transition cursor-pointer group"
          aria-expanded={openSections.registry}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1 rounded-md transition ${
              isRegistryActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 group-hover:text-white'
            }`}>
              <Database className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black text-slate-200 tracking-wider uppercase group-hover:text-white">
              Registry
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 group-hover:text-slate-300 border border-white/5">
              {registryCount}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                openSections.registry ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </button>

        {openSections.registry && (
          <div className="px-1.5 pb-2 pt-0.5 space-y-1">
            {/* GIS Rice Map & Polygons */}
            <button
              type="button"
              onClick={() => onNavigateTab('map')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Compass className="w-4 h-4 shrink-0 text-slate-300" />
                <span className="truncate">GIS Rice Map &amp; Polygons</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${
                  activeTab === 'map' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                GIS
              </span>
            </button>

            {/* Rice Farm Records Database */}
            <button
              type="button"
              onClick={() => onNavigateTab('eartags')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                activeTab === 'eartags'
                  ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Wheat className="w-4 h-4 shrink-0 text-slate-300" />
                <span className="truncate">Rice Farm Records</span>
              </div>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'eartags' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {parcelsCount}
              </span>
            </button>

            {/* Print Official Reports */}
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Printer className="w-4 h-4 shrink-0 text-slate-300" />
                <span className="truncate">Print Official Reports</span>
              </div>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  activeTab === 'reports' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                Reports
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 3. MANAGEMENT ACCORDION SECTION                              */}
      {/* ============================================================ */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden transition-all duration-200">
        <button
          type="button"
          onClick={() => toggleSection('management')}
          className="w-full flex items-center justify-between px-2.5 py-2 text-left hover:bg-white/5 transition cursor-pointer group"
          aria-expanded={openSections.management}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1 rounded-md transition ${
              isManagementActive ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-slate-400 group-hover:text-white'
            }`}>
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-black text-slate-200 tracking-wider uppercase group-hover:text-white">
              Management
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 group-hover:text-slate-300 border border-white/5">
              {managementCount}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                openSections.management ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </div>
        </button>

        {openSections.management && (
          <div className="px-1.5 pb-2 pt-0.5 space-y-1">
            {/* LFT Field Accounts (Central Admin ONLY) */}
            {isCentralAdmin && (
              <button
                type="button"
                onClick={() => onNavigateTab('accounts')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'accounts'
                    ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Users className="w-4 h-4 shrink-0 text-slate-300" />
                  <span className="truncate">LFT Field Accounts</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    activeTab === 'accounts' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Staff
                </span>
              </button>
            )}

            {/* Photo, Media & Municipal Seals (Central Admin ONLY) */}
            {isCentralAdmin && (
              <button
                type="button"
                onClick={() => onNavigateTab('photos')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                  activeTab === 'photos'
                    ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Image className="w-4 h-4 shrink-0 text-slate-300" />
                  <span className="truncate">Photo &amp; Media</span>
                </div>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                    activeTab === 'photos' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  Media
                </span>
              </button>
            )}

            {/* System / Account Settings */}
            <button
              type="button"
              onClick={() => onNavigateTab('settings')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-[#2563eb] text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <Settings className="w-4 h-4 shrink-0 text-slate-300" />
                <span className="truncate">{isCentralAdmin ? 'System Settings' : 'Account Settings'}</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. PUBLIC PORTAL & QUICK ACTIONS                             */}
      {/* ============================================================ */}
      <div className="pt-1 space-y-1.5">
        <button
          type="button"
          onClick={onOpenPublicPortal}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 font-medium transition cursor-pointer border border-white/10 group bg-white/[0.01]"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-sky-400 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">Public Web Portal</span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
};
