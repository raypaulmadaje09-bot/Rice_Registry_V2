import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BARANGAYS } from '../data/barangays';
import { Barangay, FarmParcel, PortalTab } from '../types';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, SlsuBadge, OfficialSealsTrio } from './Seals';
import { BarangayDetailModal } from './BarangayDetailModal';
import { ParcelDetailModal } from './ParcelDetailModal';
import {
  ArrowRight,
  FileText,
  Shield,
  Building2,
  Printer,
  Globe,
  Phone,
  Smartphone,
  Mail,
  Clock,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Compass,
  GraduationCap,
  BookOpen,
  Wheat,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  onOpenLogin: () => void;
  onNavigateToPortalTab: (
    tab: PortalTab,
    subTab?: 'profile' | 'municipal' | 'featured_card' | 'display'
  ) => void;
  onSelectBarangayForMap?: (barangay: Barangay) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onNavigateToPortalTab,
  onSelectBarangayForMap
}) => {
  const { currentUser, setCurrentUser, parcels, language, setLanguage, officeContactInfo } = useApp();

  const [selectedBarangayModal, setSelectedBarangayModal] = useState<Barangay | null>(null);
  const [selectedParcelModal, setSelectedParcelModal] = useState<FarmParcel | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic statistics from live parcels state
  const registeredParcelsCount = parcels.length;
  const uniqueFarmersCount = useMemo(() => {
    const set = new Set<string>();
    parcels.forEach((p) => {
      const name = p.raiserName || (p as any).farmerName || (p as any).ownerName;
      if (name && name.trim()) set.add(name.trim().toLowerCase());
    });
    return set.size;
  }, [parcels]);

  const coveredBarangaysCount = useMemo(() => {
    const set = new Set<string>();
    parcels.forEach((p) => {
      if (p.barangay && p.barangay.trim()) set.add(p.barangay.trim().toLowerCase());
    });
    return set.size;
  }, [parcels]);

  // Quick Temporary Access Handlers
  const handleQuickTempAdmin = () => {
    const adminUser = {
      username: 'temp_admin',
      role: 'Central Admin' as const,
      name: 'Temporary Administrator',
      title: 'Municipal Agriculture Administrator (Temporary Session)',
      email: 'admin@silago.gov.ph',
      contactNumber: '',
      office: 'Silago Municipal Agriculture Office (DA-MAO)',
      photoUrl: ''
    };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('silago_rice_auth_user', JSON.stringify(adminUser));
      }
    } catch {}
    setCurrentUser(adminUser);
    onNavigateToPortalTab('dashboard');
  };

  const handleQuickTempLft = () => {
    const lftUser = {
      username: 'temp_lft',
      role: 'Barangay Focal Person' as const,
      name: 'Temporary LFT Officer',
      barangay: 'Poblacion District 1',
      assignedBarangays: [
        'Salvacion',
        'Laguma',
        'Pd2',
        'Pd1',
        'Sap-ang',
        'Mercedes',
        'Katipunan',
        'Puntana',
        'Hingatungan',
        'Brando'
      ],
      title: 'Local Farmer Technician (LFT - Temporary Session)',
      contactNumber: '',
      email: 'lft@silago.gov.ph',
      photoUrl: ''
    };
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('silago_rice_auth_user', JSON.stringify(lftUser));
      }
    } catch {}
    setCurrentUser(lftUser);
    onNavigateToPortalTab('lft_dashboard');
  };

  // Barangay filter: ALL, COASTAL, INLAND
  const [barangayFilter, setBarangayFilter] = useState<'ALL' | 'COASTAL' | 'INLAND'>('ALL');

  const filteredBarangays = useMemo(() => {
    if (barangayFilter === 'COASTAL') {
      return BARANGAYS.filter((b) => b.terrain.toLowerCase().includes('coastal'));
    }
    if (barangayFilter === 'INLAND') {
      return BARANGAYS.filter((b) => !b.terrain.toLowerCase().includes('coastal'));
    }
    return BARANGAYS;
  }, [barangayFilter]);

  // Scroll to section helper
  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar matching Image 1 */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Left: 3 Official Seals and Titles */}
          <div className="flex items-center gap-3.5">
            <OfficialSealsTrio className="shrink-0" />
            <div>
              <h1 className="font-serif font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Municipal Agriculture Office - Silago
              </h1>
              <p className="text-[11px] text-slate-500 leading-tight">
                Rice Farm Registry and Georeferencing
              </p>
            </div>
          </div>

          {/* Right: Nav Links and Actions */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
            {/* Anchor Links */}
            <div className="hidden lg:flex items-center gap-5 text-slate-600">
              <button
                type="button"
                onClick={() => scrollToSection('programs-section')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Programs &amp; Services
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about-section')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                About Office
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('barangays-section')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                15 Barangays
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact-section')}
                className="hover:text-blue-600 transition cursor-pointer"
              >
                Contact &amp; Support
              </button>
            </div>

            {/* EN / CEB Language Switcher */}
            <div className="hidden sm:flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-2 py-1 text-[11px] font-bold rounded transition cursor-pointer ${
                  language === 'EN'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('CEB')}
                className={`px-2 py-1 text-[11px] font-bold rounded transition cursor-pointer ${
                  language === 'CEB'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 bg-transparent'
                }`}
              >
                CEB
              </button>
            </div>

            {/* Sign In / Return to Portal Button */}
            {currentUser ? (
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="text-left leading-none">
                    <span className="text-[9px] font-black text-emerald-800 uppercase block">Signed In</span>
                    <span className="text-[11px] font-bold text-slate-800 max-w-[130px] truncate block">{currentUser.name}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateToPortalTab(currentUser.role === 'Central Admin' ? 'dashboard' : 'map')}
                  className="bg-[#1d4ed8] hover:bg-blue-700 text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap text-xs"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Return to Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickTempAdmin}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Temporary Admin Access"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Temp Admin</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuickTempLft}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                  title="Temporary LFT Access"
                >
                  <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Temp LFT</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenLogin}
                  className="bg-[#1d4ed8] hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap text-xs"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-3 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Language Selection
              </span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-slate-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setLanguage('EN')}
                  className={`px-3 py-1 text-xs font-bold rounded transition ${
                    language === 'EN'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  English (EN)
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('CEB')}
                  className={`px-3 py-1 text-xs font-bold rounded transition ${
                    language === 'CEB'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600'
                  }`}
                >
                  Cebuano (CEB)
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => scrollToSection('programs-section')}
                className="text-left py-2 px-3 rounded-xl hover:bg-slate-100 transition"
              >
                Programs &amp; Services
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('about-section')}
                className="text-left py-2 px-3 rounded-xl hover:bg-slate-100 transition"
              >
                About Municipal Office
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('barangays-section')}
                className="text-left py-2 px-3 rounded-xl hover:bg-slate-100 transition"
              >
                15 Rice Barangays
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact-section')}
                className="text-left py-2 px-3 rounded-xl hover:bg-slate-100 transition"
              >
                Contact &amp; Support
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigateToPortalTab(currentUser.role === 'Central Admin' ? 'dashboard' : 'map');
                  }}
                  className="w-full bg-[#1d4ed8] hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs"
                >
                  <Shield className="w-4 h-4" />
                  <span>Return to Staff Portal ({currentUser.name})</span>
                </button>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleQuickTempAdmin();
                      }}
                      className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Temp Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleQuickTempLft();
                      }}
                      className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs"
                    >
                      <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Temp LFT</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full bg-[#1d4ed8] hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs"
                  >
                    <span>Sign In with Credentials</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section matching Image 1 */}
      <section className="bg-white border-b border-slate-200 py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-900 border border-blue-200/80 px-3.5 py-1 rounded-full text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
              <span>Office of the Municipal Agriculturist · Silago</span>
            </div>

            {/* Big Headline */}
            <h1 className="font-serif font-black text-4xl sm:text-5xl lg:text-6xl text-[#0b2545] tracking-tight leading-tight">
              Rice Farm Registry and Georeferencing
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg font-normal">
              Municipal Agriculture Office · Bag-ong Silago Geographic Information System
            </p>

            {/* LFT Login or Return to Portal Button */}
            <div className="pt-2">
              {currentUser ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToPortalTab(currentUser.role === 'Central Admin' ? 'dashboard' : 'map')}
                    className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition inline-flex items-center gap-2.5 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Return to {currentUser.role === 'Central Admin' ? 'Executive Dashboard' : 'LFT Field Portal'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                    Logged in as <strong className="text-slate-700">{currentUser.name}</strong> ({currentUser.role})
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Sign In to System</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickTempAdmin}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Temporary Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleQuickTempLft}
                    className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Wheat className="w-4 h-4 text-emerald-600" />
                    <span>Temporary LFT</span>
                  </button>
                </div>
              )}
            </div>

            {/* Horizontal Line */}
            <div className="border-b border-slate-200 pt-6" />

            {/* 4 Stats in a row (Dynamic based on Parcels) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div>
                <span className="font-serif font-black text-2xl sm:text-3xl text-slate-900 block">
                  {registeredParcelsCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                  REGISTERED PARCELS
                </span>
              </div>
              <div>
                <span className="font-serif font-black text-2xl sm:text-3xl text-slate-900 block">
                  {coveredBarangaysCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                  BARANGAYS COVERED
                </span>
              </div>
              <div>
                <span className="font-serif font-black text-2xl sm:text-3xl text-slate-900 block">
                  {uniqueFarmersCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                  REGISTERED FARMERS
                </span>
              </div>
              <div>
                <span className="font-serif font-black text-2xl sm:text-3xl text-slate-900 block">
                  {registeredParcelsCount}
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5">
                  THIS MONTH
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Dark SLSU Demonstration Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <SlsuBadge previewOnly />
            </div>
          </div>
        </div>
      </section>

      {/* Dark Navy Stats Bar directly below Hero matching Image 1 */}
      <section className="bg-[#071d38] text-white py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-white/10 text-center">
          <div className="pt-2 md:pt-0">
            <span className="font-serif font-black text-2xl sm:text-3xl text-white block">
              {registeredParcelsCount}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider block mt-1">
              TOTAL REGISTERED PARCELS
            </span>
          </div>

          <div className="pt-2 md:pt-0">
            <span className="font-serif font-black text-2xl sm:text-3xl text-white block">
              {uniqueFarmersCount}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider block mt-1">
              REGISTERED FARMERS
            </span>
          </div>

          <div className="pt-2 md:pt-0">
            <span className="font-serif font-black text-2xl sm:text-3xl text-white block">
              {coveredBarangaysCount} / 15
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider block mt-1">
              BARANGAYS WITH RECORDS
            </span>
          </div>

          <div className="pt-2 md:pt-0">
            <span className="font-serif font-black text-2xl sm:text-3xl text-white block">
              {registeredParcelsCount}
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 uppercase tracking-wider block mt-1">
              LOGGED THIS MONTH
            </span>
          </div>
        </div>
      </section>

      {/* Section: "WHAT THE OFFICE RUNS" matching Image 2 */}
      <section id="programs-section" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
            WHAT THE OFFICE RUNS
          </span>
          <h2 className="font-serif font-black text-2xl sm:text-4xl text-[#0b2545] tracking-tight">
            Field-tested agricultural programs for Silago's rice farmers.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Coordinated assistance from Poblacion's central municipal office to our irrigated and upland communities.
          </p>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Georeferenced Parcel Registry */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
                  POPUP MASTERLIST
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                Georeferenced Parcel Registry
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Every rice farm parcel is registered with an official parcel ID, RSBSA number, and GPS boundaries.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToPortalTab('eartags')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-5 cursor-pointer"
            >
              <span>View Rice Parcel Registry</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Irrigation & Crop Monitoring */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                  POPUP GIS MAP
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                Irrigation &amp; Crop Monitoring
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Barangay-level NIA irrigation status, pest surveillance, and yield estimation.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToPortalTab('map')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-5 cursor-pointer"
            >
              <span>Launch Crop &amp; Irrigation Map</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3: 15 Barangay Decentralization */}
          <div className="bg-white border-2 border-purple-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition group ring-2 ring-purple-50">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 uppercase">
                  POPUP DIRECTORY
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition">
                15 Barangay Decentralization
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Assigned Local Farm Technicians (LFT) in each barangay manage localized parcel records directly from the field.
              </p>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('barangays-section')}
              className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 mt-5 cursor-pointer"
            >
              <span>15 Barangays Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 4: Official Printable Reports */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                  POPUP REPORTS
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                Official Printable Reports
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Standardized municipal agricultural documents and barangay reports ready for validation and LGU allocations.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToPortalTab('reports')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-5 cursor-pointer"
            >
              <span>View &amp; Print Reports</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Section: "FULL MUNICIPALITY COVERAGE" - All 15 Barangays matching Image 3 */}
      <section id="barangays-section" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">
              FULL MUNICIPALITY COVERAGE
            </span>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#0b2545] tracking-tight mt-1">
              All 15 Barangays of Silago
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Each barangay operates its own scoped Local Farm Technician (LFT) account for decentralized registration.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-full shadow-2xs">
            <button
              type="button"
              onClick={() => setBarangayFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                barangayFilter === 'ALL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              All (15)
            </button>
            <button
              type="button"
              onClick={() => setBarangayFilter('COASTAL')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                barangayFilter === 'COASTAL'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Coastal Sectors
            </button>
            <button
              type="button"
              onClick={() => setBarangayFilter('INLAND')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                barangayFilter === 'INLAND'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 bg-transparent'
              }`}
            >
              Inland &amp; Irrigated
            </button>
          </div>
        </div>

        {/* 15 Barangay Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredBarangays.map((b) => {
            return (
              <div
                key={b.name}
                onClick={() => setSelectedBarangayModal(b)}
                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-blue-400 transition cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                {/* Top: Name & Blue Status Dot */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition">
                    {b.name.startsWith('Poblacion') ? b.name : b.name}
                  </h4>
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                </div>

                {/* Bottom: Puroks & Terrain Pill */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                  <span className="text-slate-500 font-medium">
                    {b.puroks ?? (b as any).purokCount ?? 7} Puroks
                  </span>
                  <span className="text-[10px] font-medium text-blue-700 bg-blue-50/80 border border-blue-200 px-2 py-0.5 rounded-full">
                    {b.terrain}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LGU Silago Field Operations CTA Banner matching Image 4 & 5 */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto w-full my-6">
        <div className="bg-[#0c2340] rounded-3xl p-8 sm:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1.5">
            <span className="text-blue-400 font-bold text-xs uppercase tracking-wider block">
              LGU SILAGO FIELD OPERATIONS
            </span>
            <h3 className="font-serif font-black text-2xl sm:text-3xl text-white">
              Are you an assigned Local Farm Technician (LFT)?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Log in to record today's parcel registrations, check irrigation buffers, and print your barangay rice reports.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenLogin}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-md whitespace-nowrap cursor-pointer shrink-0"
          >
            Sign In to Staff Portal &rarr;
          </button>
        </div>
      </section>

      {/* Three Information Columns matching Image 4 & 5 */}
      <section id="about-section" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Municipal Mandate */}
          <div className="space-y-2">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider block">
              MUNICIPAL MANDATE
            </span>
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#0b2545]">
              Rice Production &amp; Sustainable Farm Security
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Silago's rice industry is governed under modern agricultural initiatives, providing farm mechanization, certified inbred/hybrid palay seed distribution, and continuous field crop health audits.
            </p>
          </div>

          {/* Column 2: Academic Partnership */}
          <div className="space-y-2">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider block">
              ACADEMIC PARTNERSHIP
            </span>
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#0b2545]">
              SLSU - Agricultural Extension
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Developed in coordination with Southern Leyte State University Agricultural Extension, this GIS geospatial registry empowers LFT technicians and barangay coordinators with real-time field mapping.
            </p>
          </div>

          {/* Column 3: Surveillance Zoning */}
          <div className="space-y-2">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-wider block">
              SURVEILLANCE ZONING
            </span>
            <h3 className="font-serif font-bold text-base sm:text-lg text-[#0b2545]">
              DA RFO-VIII Priority Rice Zone
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Silago maintains continuous agricultural monitoring, NIA communal irrigation management, and field assistance checkpoints ensuring food security and high palay yields for all residents.
            </p>
          </div>
        </div>
      </section>

      {/* Footer matching System Specifications & Central Admin Dynamics */}
      <footer id="contact-section" className="bg-[#07152b] text-slate-300 pt-12 pb-8 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/10 text-xs">
          {/* Column 1: Seals & Address */}
          <div className="space-y-3">
            <OfficialSealsTrio />
            <div>
              <strong className="text-white text-sm font-bold block">Silago DA Office</strong>
              <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block">
                MUNICIPAL AGRICULTURE
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Office of the Municipal Agriculturist, Silago Municipal Hall Complex, Southern Leyte, Philippines 6607.
            </p>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              QUICK NAVIGATION
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('programs-section')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Programs &amp; Services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('about-section')}
                  className="hover:text-white transition cursor-pointer"
                >
                  About the Office
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('barangays-section')}
                  className="hover:text-white transition cursor-pointer"
                >
                  15 Barangays Directory
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Office Hours & Hotline (Dynamic Central Admin Link) */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              OFFICE HOURS &amp; HOTLINE
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                <span>{officeContactInfo?.schedule || 'Monday – Friday: 8:00 AM – 5:00 PM'}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Hotline: <strong className="text-slate-200">{officeContactInfo?.hotline || '(053) 572-8812'}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Mobile: <strong className="text-slate-200">{officeContactInfo?.mobile || '0917-822-4911'}</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <a
                  href={`mailto:${officeContactInfo?.email || 'agri.silago@southernleyte.gov.ph'}`}
                  className="hover:text-white transition truncate text-slate-300 hover:underline"
                >
                  {officeContactInfo?.email || 'agri.silago@southernleyte.gov.ph'}
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Portal Access */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              PORTAL ACCESS
            </h4>
            <p className="text-slate-400 leading-relaxed">
              Restricted to authorized Municipal Agriculture Office staff and designated Local Farm Technicians (LFT).
            </p>
            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigateToPortalTab(currentUser.role === 'Central Admin' ? 'dashboard' : 'map')}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs w-full py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Return to Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs w-full py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <span>Sign In to System</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>&copy; 2026 Municipality of Silago · Office of the Municipal Agriculturist</span>
          <span>Municipal Agriculture Office - Silago · Rice Farm Registry</span>
        </div>
      </footer>

      {/* Floating Active User Session Banner */}
      {currentUser && (
        <div className="fixed bottom-5 right-5 z-40 bg-[#071728]/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-left leading-tight">
              <span className="text-[9px] uppercase font-black text-emerald-400 tracking-wider block">
                Session Active ({currentUser.role})
              </span>
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[140px] sm:max-w-[200px]">
                {currentUser.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToPortalTab(currentUser.role === 'Central Admin' ? 'dashboard' : 'map')}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer whitespace-nowrap"
          >
            <span>Go to Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      <BarangayDetailModal
        barangay={selectedBarangayModal}
        parcels={parcels}
        onClose={() => setSelectedBarangayModal(null)}
        onSelectParcel={(p) => setSelectedParcelModal(p)}
        onViewOnMap={(b) => {
          if (onSelectBarangayForMap) onSelectBarangayForMap(b);
          onNavigateToPortalTab('map');
        }}
      />

      <ParcelDetailModal
        parcel={selectedParcelModal}
        onClose={() => setSelectedParcelModal(null)}
      />
    </div>
  );
};
