import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BARANGAYS } from '../data/barangays';
import { DECREE_CATEGORIES, LegalDecree } from '../data/legalDecrees';
import { Barangay, FarmParcel, PortalTab } from '../types';
import { SilagoSeal, BagOngSilagoLogo, OfficialSealsTrio } from './Seals';
import { BarangayDetailModal } from './BarangayDetailModal';
import { ParcelDetailModal } from './ParcelDetailModal';
import { ParcelDetailErrorBoundary } from './ParcelDetailErrorBoundary';
import {
  ArrowRight,
  Shield,
  Phone,
  Smartphone,
  Mail,
  Clock,
  Menu,
  X,
  Compass,
  Megaphone,
  Download,
  Users,
  CheckCircle2,
  Sparkles,
  FileText,
  Scale,
  Search
} from 'lucide-react';
import { PWAInstallButton } from './common/PWAInstallButton';

interface LandingPageProps {
  onOpenLogin: () => void;
  onNavigateToPortalTab: (
    tab: PortalTab,
    subTab?: 'profile' | 'municipal' | 'featured_card' | 'display' | 'media' | 'landing'
  ) => void;
  onSelectBarangayForMap?: (barangay: Barangay) => void;
}

/**
 * Helper to determine badge color palette, status dot, and icon per ecosystem
 */
function getEcosystemBadgeStyle(ecosystem?: string) {
  const eco = (ecosystem || '').toLowerCase();

  // Coastal Plains / Lowland Alluvial & Coastal / Lowland Alluvial & Coast -> Cyan/Teal
  if (eco.includes('coastal') || eco.includes('coast')) {
    return {
      badgeClass: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
      dotClass: 'bg-cyan-500 ring-2 ring-cyan-100',
      icon: '🌊',
      label: ecosystem || 'Coastal Plains'
    };
  }

  // Upland Terrace / Upland & River Basin -> Amber/Orange
  if (eco.includes('upland') || eco.includes('terrace')) {
    return {
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-200',
      dotClass: 'bg-amber-500 ring-2 ring-amber-100',
      icon: '⛰️',
      label: ecosystem || 'Upland Terrace'
    };
  }

  // River Basin Irrigated -> Emerald/Green
  if (eco.includes('river basin') || eco.includes('irrigated')) {
    return {
      badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      dotClass: 'bg-emerald-500 ring-2 ring-emerald-100',
      icon: '🌾',
      label: ecosystem || 'River Basin Irrigated'
    };
  }

  // Lowland Alluvial (default) -> Sky/Blue
  return {
    badgeClass: 'bg-sky-50 text-sky-700 border border-sky-200',
    dotClass: 'bg-sky-500 ring-2 ring-sky-100',
    icon: '💧',
    label: ecosystem || 'Lowland Alluvial'
  };
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onNavigateToPortalTab,
  onSelectBarangayForMap
}) => {
  const {
    currentUser,
    parcels,
    language,
    setLanguage,
    officeContactInfo,
    municipalBranding,
    landingPageConfig,
    legalDecrees
  } = useApp();

  const [selectedBarangayModal, setSelectedBarangayModal] = useState<Barangay | null>(null);
  const [selectedParcelModal, setSelectedParcelModal] = useState<FarmParcel | null>(null);
  const [selectedDecreeModal, setSelectedDecreeModal] = useState<LegalDecree | null>(null);
  const [decreeCategory, setDecreeCategory] = useState<string>('All Documents');
  const [decreeQuery, setDecreeQuery] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredDecrees = useMemo(() => {
    const q = decreeQuery.trim().toLowerCase();
    return (legalDecrees || []).filter(
      (d) =>
        (decreeCategory === 'All Documents' || d.category === decreeCategory) &&
        (!q ||
          d.title.toLowerCase().includes(q) ||
          d.number.toLowerCase().includes(q) ||
          (d.summary || '').toLowerCase().includes(q) ||
          d.text.toLowerCase().includes(q))
    );
  }, [legalDecrees, decreeCategory, decreeQuery]);

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

  const heroBgColor = landingPageConfig?.heroBgColor || '#123b2b';
  const heroBgImageUrl = landingPageConfig?.heroBgImageUrl?.trim() || '';
  const heroBgOpacity = typeof landingPageConfig?.heroBgOpacity === 'number' ? landingPageConfig.heroBgOpacity : 45;
  const heroBgBlur = typeof landingPageConfig?.heroBgBlur === 'number' ? landingPageConfig.heroBgBlur : 0;
  const heroBgOverlayOpacity =
    typeof landingPageConfig?.heroBgOverlayOpacity === 'number' ? landingPageConfig.heroBgOverlayOpacity : 50;

  const heroCardBgColor = landingPageConfig?.heroCardBgColor?.trim() || '';
  const heroCardBgImageUrl = landingPageConfig?.heroCardBgImageUrl?.trim() || '';
  const heroCardBgOpacity =
    typeof landingPageConfig?.heroCardBgOpacity === 'number' ? landingPageConfig.heroCardBgOpacity : 75;
  const heroCardBgBlur =
    typeof landingPageConfig?.heroCardBgBlur === 'number' ? landingPageConfig.heroCardBgBlur : 0;
  const heroCardBgOverlayOpacity =
    typeof landingPageConfig?.heroCardBgOverlayOpacity === 'number' ? landingPageConfig.heroCardBgOverlayOpacity : 35;
  const heroLogoBackingColor = landingPageConfig?.heroLogoBackingColor || '#ffffff';
  const isDarkCardText = landingPageConfig?.heroCardTextTheme === 'dark';

  return (
    <div className="min-h-screen bg-gov-canvas text-gov-ink font-sans flex flex-col selection:bg-gov-forest selection:text-white">
      {/* Top Official Notice Bar */}
      <div className="bg-gov-forest-dark text-white/90 px-4 py-2 text-xs font-medium flex items-center justify-between gap-3 border-b border-white/10">
        <div className="max-w-[1500px] mx-auto w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-2 w-2 rounded-full bg-gov-gold shrink-0" />
            <span className="font-bold text-white uppercase tracking-wider text-[10px] bg-white/10 px-2 py-0.5 rounded-sm border border-white/15 shrink-0">
              {landingPageConfig?.topNoticeTag || 'Official Notice'}
            </span>
            <span className="truncate text-white/85">
              {landingPageConfig?.topNoticeText || '2026 Wet Season RSBSA Georeferencing & Palay Monitoring active across all 15 Silago Barangays.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => scrollToSection('barangays-section')}
            className="text-amber-200 hover:text-white font-semibold text-[11px] underline uppercase tracking-wider shrink-0 cursor-pointer hidden sm:inline"
          >
            {landingPageConfig?.topNoticeLinkText || 'Explore 15 Barangays →'}
          </button>
        </div>
      </div>

      {/* Official Municipal Header Bar */}
      <header className="bg-white border-b border-gov-line sticky top-0 z-40">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
          {/* Left: 3 Official Seals and Titles */}
          <div className="flex items-center gap-3.5">
            <OfficialSealsTrio className="shrink-0" />
            <div>
              <h1 className="font-serif font-bold text-gov-ink text-sm sm:text-base leading-tight">
                {municipalBranding?.officeName ? `${municipalBranding.officeName} - ${municipalBranding.municipalityName.replace('Municipality of ', '')}` : 'Municipal Agriculture Office - Silago'}
              </h1>
              <p className="text-[11px] text-gov-muted leading-tight">
                {municipalBranding?.registryTitle || 'Rice Farm Registry'} and Georeferencing
              </p>
            </div>
          </div>

          {/* Right: Nav Links and Actions */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
            {/* Anchor Links */}
            <div className="hidden lg:flex items-center gap-5 text-gov-muted">
              <button
                type="button"
                onClick={() => scrollToSection('about-section')}
                className="hover:text-gov-green transition cursor-pointer"
              >
                About Office
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('barangays-section')}
                className="hover:text-gov-green transition cursor-pointer"
              >
                15 Barangays
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('legal-decrees-section')}
                className="hover:text-gov-green transition cursor-pointer"
              >
                Legal Decrees
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('contact-section')}
                className="hover:text-gov-green transition cursor-pointer"
              >
                Contact &amp; Support
              </button>
            </div>

            {/* PWA Install Button */}
            <div className="hidden sm:block">
              <PWAInstallButton compact />
            </div>

            {/* EN / CEB Language Switcher */}
            <div className="hidden sm:flex items-center border border-gov-line rounded overflow-hidden bg-gov-canvas p-0.5">
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-2 py-1 text-[11px] font-bold rounded-sm transition cursor-pointer ${
                  language === 'EN'
                    ? 'bg-gov-forest text-white'
                    : 'text-gov-muted hover:text-gov-ink bg-transparent'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('CEB')}
                className={`px-2 py-1 text-[11px] font-bold rounded-sm transition cursor-pointer ${
                  language === 'CEB'
                    ? 'bg-gov-forest text-white'
                    : 'text-gov-muted hover:text-gov-ink bg-transparent'
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
                  className="bg-[#1d5639] hover:bg-[#17432f] text-white font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap text-xs"
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
                  onClick={onOpenLogin}
                  className="bg-[#1d5639] hover:bg-[#17432f] text-white font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer whitespace-nowrap text-xs"
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
                onClick={() => scrollToSection('legal-decrees-section')}
                className="text-left py-2 px-3 rounded-xl hover:bg-slate-100 transition"
              >
                Legal Decrees &amp; Ordinances
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
                  className="w-full bg-[#1d5639] hover:bg-[#17432f] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs"
                >
                  <Shield className="w-4 h-4" />
                  <span>Return to Staff Portal ({currentUser.name})</span>
                </button>
              ) : (
                <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full bg-[#1d5639] hover:bg-[#17432f] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs"
                  >
                    <span>Sign In with Credentials</span>
                    <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Rice registry hero */}
      <section
        className="relative isolate overflow-hidden border-b border-emerald-950/20 px-4 py-14 text-white sm:px-8 sm:py-20 transition-colors duration-300"
        style={{ backgroundColor: heroBgColor }}
      >
        {heroBgImageUrl && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat transition-all duration-500"
            style={{
              backgroundImage: `url(${heroBgImageUrl})`,
              opacity: Math.max(0, Math.min(1, heroBgOpacity / 100)),
              filter: heroBgBlur > 0 ? `blur(${heroBgBlur}px)` : undefined
            }}
          />
        )}
        {heroBgImageUrl && heroBgOverlayOpacity > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(115deg, rgba(6, 24, 17, ${Math.min(0.95, heroBgOverlayOpacity / 100)}) 0%, rgba(10, 35, 24, ${Math.min(0.85, (heroBgOverlayOpacity * 0.72) / 100)}) 55%, rgba(6, 24, 17, ${Math.min(0.9, (heroBgOverlayOpacity * 0.85) / 100)}) 100%)`
            }}
          />
        )}
        <div className="pointer-events-none absolute -right-24 -top-32 h-[28rem] w-[28rem] rounded-full border border-emerald-100/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 h-[22rem] w-[22rem] rounded-full border border-emerald-100/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_12%_20%,rgba(16,185,129,0.18),transparent_45%)]" />
        <div className="relative z-10 mx-auto grid max-w-[1500px] grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-4">
            {/* Top Official Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                <span>{landingPageConfig?.heroBadge || 'OFFICIAL MUNICIPAL RICE FARM REGISTRY · SILAGO'}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>{landingPageConfig?.heroPwaBadge || '100% Offline PWA Field Access Ready'}</span>
              </span>
            </div>

            {/* Big Headline */}
            <h1 className="max-w-4xl font-serif text-4xl font-bold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[54px]">
              {landingPageConfig?.heroHeadline || 'A clearer view of every rice farm in Silago.'}
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl text-base font-normal leading-relaxed text-white/80 sm:text-lg">
              {landingPageConfig?.heroDescription || 'The Municipal Agriculture Office registry brings farmer records, georeferenced parcels, and field services together in one place.'}
            </p>

            {/* Action Buttons */}
            <div className="pt-2">
              {currentUser ? (
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigateToPortalTab(currentUser.role === 'Central Admin' ? 'dashboard' : 'map')}
                    className="inline-flex cursor-pointer items-center gap-2 rounded bg-white px-5 py-2.5 text-xs font-bold text-gov-forest shadow-sm transition hover:bg-gov-green-soft sm:text-sm"
                  >
                    <Shield className="w-4 h-4" />
                    <span>
                      {currentUser.role === 'Central Admin'
                        ? (landingPageConfig?.heroReturnBtnText || 'Return to Executive Dashboard')
                        : (landingPageConfig?.heroReturnLftBtnText || 'Return to LFT Field Portal')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="rounded border border-white/20 bg-black/20 px-3 py-2 text-xs font-medium text-white/85">
                    Signed in as <strong className="text-white">{currentUser.name}</strong>
                  </span>
                  {currentUser.role === 'Central Admin' && (
                    <button
                      type="button"
                      onClick={() => onNavigateToPortalTab('settings', 'landing')}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
                      title="Open Landing Page Content Settings"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Customize Landing Page</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="inline-flex cursor-pointer items-center gap-2 rounded bg-white px-5 py-2.5 text-xs font-bold text-gov-forest shadow-sm transition hover:bg-gov-green-soft sm:text-sm"
                  >
                    <span>{landingPageConfig?.heroSignInBtnText || 'Sign In as Central Admin'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateToPortalTab('map')}
                    className="inline-flex cursor-pointer items-center gap-2 rounded border border-white/25 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/15 sm:text-sm"
                  >
                    <Compass className="h-4 w-4" /> {landingPageConfig?.heroGisBtnText || 'Explore GIS Map'}
                  </button>
                  <PWAInstallButton />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Municipal Registry Logo */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div
              className={`relative flex min-h-[340px] w-full max-w-md flex-col items-center justify-center overflow-hidden rounded-[2rem] border px-8 py-9 text-center shadow-2xl shadow-black/15 transition-colors duration-300 ${
                heroCardBgColor
                  ? isDarkCardText
                    ? 'border-slate-900/15'
                    : 'border-white/15'
                  : 'border-white/15 bg-white/[0.06] backdrop-blur-sm'
              }`}
              style={heroCardBgColor ? { backgroundColor: heroCardBgColor } : undefined}
            >
              {heroCardBgImageUrl && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat transition-all duration-500"
                  style={{
                    backgroundImage: `url(${heroCardBgImageUrl})`,
                    opacity: Math.max(0, Math.min(1, heroCardBgOpacity / 100)),
                    filter: heroCardBgBlur > 0 ? `blur(${heroCardBgBlur}px)` : undefined
                  }}
                />
              )}
              {heroCardBgImageUrl && heroCardBgOverlayOpacity > 0 && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: isDarkCardText
                      ? `linear-gradient(155deg, rgba(255, 255, 255, ${Math.min(0.92, heroCardBgOverlayOpacity / 100)}) 0%, rgba(248, 250, 252, ${Math.min(0.85, (heroCardBgOverlayOpacity * 0.8) / 100)}) 100%)`
                      : `linear-gradient(155deg, rgba(6, 24, 17, ${Math.min(0.95, heroCardBgOverlayOpacity / 100)}) 0%, rgba(10, 35, 24, ${Math.min(0.85, (heroCardBgOverlayOpacity * 0.75) / 100)}) 100%)`
                  }}
                />
              )}
              <div
                className={`pointer-events-none absolute inset-4 rounded-[1.5rem] border ${
                  isDarkCardText ? 'border-slate-900/10' : 'border-white/10'
                }`}
              />
              <div
                className={`relative z-10 flex h-48 w-48 items-center justify-center rounded-full p-4 transition-colors duration-300 ${
                  heroLogoBackingColor === 'transparent'
                    ? 'bg-transparent'
                    : 'shadow-xl shadow-black/20 ring-8 ring-white/10'
                }`}
                style={
                  heroLogoBackingColor !== 'transparent'
                    ? { backgroundColor: heroLogoBackingColor }
                    : undefined
                }
              >
                <SilagoSeal size={160} customUrl={municipalBranding?.silagoSealUrl || undefined} />
              </div>
              <div className="relative z-10 mt-6 flex items-center justify-center gap-3">
                <BagOngSilagoLogo size={56} customUrl={municipalBranding?.bagOngSilagoLogoUrl || undefined} />
                <div className="text-left">
                  <span
                    className={`block text-[10px] font-bold uppercase tracking-[0.18em] ${
                      isDarkCardText ? 'text-emerald-800' : 'text-lime-200'
                    }`}
                  >
                    {municipalBranding?.municipalityName || 'Municipality of Silago'}
                  </span>
                  <span
                    className={`mt-1 block font-serif text-lg font-bold leading-tight ${
                      isDarkCardText ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {municipalBranding?.registryTitle || 'Rice Farm Registry'}
                  </span>
                  <span
                    className={`mt-1 block text-[11px] ${
                      isDarkCardText ? 'text-slate-600' : 'text-emerald-50/70'
                    }`}
                  >
                    {municipalBranding?.officeName || 'Municipal Agriculture Office'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live registry snapshot */}
      <section className="border-b border-gov-line bg-white px-4 py-5 sm:px-6 sm:py-6">
        <div className="mx-auto grid max-w-7xl grid-cols-2 md:grid-cols-4 border border-gov-line rounded divide-y md:divide-y-0 md:divide-x divide-gov-line bg-white">
          <div className="px-4 py-4 text-center">
            <span className="font-serif text-2xl font-bold text-gov-forest sm:text-3xl block tabular-nums">
              {registeredParcelsCount}
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-gov-muted sm:text-[11px]">
              {landingPageConfig?.statLabelParcels || 'TOTAL REGISTERED PARCELS'}
            </span>
          </div>

          <div className="px-4 py-4 text-center">
            <span className="font-serif text-2xl font-bold text-gov-forest sm:text-3xl block tabular-nums">
              {uniqueFarmersCount}
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-gov-muted sm:text-[11px]">
              {landingPageConfig?.statLabelFarmers || 'REGISTERED FARMERS'}
            </span>
          </div>

          <div className="px-4 py-4 text-center">
            <span className="font-serif text-2xl font-bold text-gov-forest sm:text-3xl block tabular-nums">
              {coveredBarangaysCount} / 15
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-gov-muted sm:text-[11px]">
              {landingPageConfig?.statLabelBarangays || 'BARANGAYS WITH RECORDS'}
            </span>
          </div>

          <div className="px-4 py-4 text-center bg-gov-green-soft/60">
            <span className="font-serif text-2xl font-bold text-gov-forest sm:text-3xl block tabular-nums">
              {landingPageConfig?.seasonYear || '2026'}
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-gov-green sm:text-[11px]">
              {landingPageConfig?.seasonLabel || 'WET SEASON REGISTRY'}
            </span>
          </div>
        </div>
      </section>

      {/* Section: "FULL MUNICIPALITY COVERAGE" - All 15 Barangays */}
      <section id="barangays-section" className="py-10 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-semibold text-gov-green uppercase tracking-widest block">
              {landingPageConfig?.coverageTag || 'FULL MUNICIPALITY COVERAGE'}
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-gov-ink tracking-tight mt-1">
              {landingPageConfig?.coverageTitle || 'All 15 Barangays of Silago'}
            </h2>
            <p className="text-xs text-gov-muted mt-1">
              {landingPageConfig?.coverageDesc || 'Each barangay operates its own scoped Local Farm Technician (LFT) account for decentralized registration.'}
            </p>
          </div>

          {/* Filter Segment */}
          <div className="flex items-center gap-1 bg-white border border-gov-line p-1 rounded">
            <button
              type="button"
              onClick={() => setBarangayFilter('ALL')}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition cursor-pointer ${
                barangayFilter === 'ALL'
                  ? 'bg-gov-forest text-white'
                  : 'text-gov-muted hover:text-gov-ink bg-transparent'
              }`}
            >
              {landingPageConfig?.filterAllLabel || 'All (15)'}
            </button>
            <button
              type="button"
              onClick={() => setBarangayFilter('COASTAL')}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition cursor-pointer ${
                barangayFilter === 'COASTAL'
                  ? 'bg-gov-forest text-white'
                  : 'text-gov-muted hover:text-gov-ink bg-transparent'
              }`}
            >
              {landingPageConfig?.filterCoastalLabel || 'Coastal Sectors'}
            </button>
            <button
              type="button"
              onClick={() => setBarangayFilter('INLAND')}
              className={`px-3 py-1.5 rounded-sm text-xs font-semibold transition cursor-pointer ${
                barangayFilter === 'INLAND'
                  ? 'bg-gov-forest text-white'
                  : 'text-gov-muted hover:text-gov-ink bg-transparent'
              }`}
            >
              {landingPageConfig?.filterInlandLabel || 'Inland & Irrigated'}
            </button>
          </div>
        </div>

        {/* 15 Barangay Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {filteredBarangays.map((b) => {
            const ecoStyle = getEcosystemBadgeStyle(b.terrain);
            return (
              <div
                key={b.name}
                onClick={() => setSelectedBarangayModal(b)}
                className="bg-white border border-gov-line rounded p-4 hover:border-gov-green transition cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                {/* Top: Name & Dynamic Ecosystem Status Dot */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-xs sm:text-sm text-gov-ink group-hover:text-gov-green transition">
                    {b.name.startsWith('Poblacion') ? b.name : b.name}
                  </h4>
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 transition-all ${ecoStyle.dotClass}`} />
                </div>

                {/* Bottom: Puroks & Dynamic Ecosystem Pill Badge */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-gov-line/60">
                  <span className="text-gov-muted font-medium">
                    {b.puroks ?? (b as any).purokCount ?? 7} Puroks
                  </span>
                  <span className={`px-2 py-0.5 rounded-sm text-[11px] font-semibold flex items-center gap-1 ${ecoStyle.badgeClass}`}>
                    <span className="text-xs leading-none">{ecoStyle.icon}</span>
                    <span>{b.terrain}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LGU Silago Field Operations CTA Banner */}
      <section className="px-4 sm:px-6 max-w-7xl mx-auto w-full my-6">
        <div className="bg-gov-forest border border-gov-forest-dark rounded p-7 sm:p-9 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-amber-300 font-semibold text-[11px] uppercase tracking-widest block">
              {landingPageConfig?.lftBannerTag || 'LGU SILAGO FIELD OPERATIONS'}
            </span>
            <h3 className="font-serif font-bold text-2xl sm:text-3xl text-white">
              {landingPageConfig?.lftBannerTitle || 'Are you an assigned Local Farm Technician (LFT)?'}
            </h3>
            <p className="text-xs sm:text-sm text-white/75 max-w-xl">
              {landingPageConfig?.lftBannerDesc || "Log in to record today's parcel registrations, check irrigation buffers, and print your barangay rice reports."}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenLogin}
            className="bg-[#1d5639] hover:bg-[#17432f] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-md whitespace-nowrap cursor-pointer shrink-0"
          >
            {landingPageConfig?.lftBannerBtn || 'Sign In to Staff Portal →'}
          </button>
        </div>
      </section>

      {/* Dynamic Information Mandate & Partnership Columns (Editable & Addable) */}
      <section id="about-section" className="py-12 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(landingPageConfig?.mandateCards || []).map((card) => (
            <div key={card.id} className="space-y-2 p-5 bg-white/70 border border-slate-200/80 rounded-2xl shadow-xs hover:border-emerald-300 transition">
              <span className="text-emerald-700 font-bold text-xs uppercase tracking-wider block">
                {card.tag}
              </span>
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#173b2c]">
                {card.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Official Legal Decrees & Rice Policies (Live synced from Central Law Registry) */}
      <section id="legal-decrees-section" className="border-t border-slate-200/80 bg-white py-12 px-4 sm:px-6 w-full">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wider">
                <Scale className="w-3.5 h-3.5" />
                <span>OFFICIAL LAW &amp; POLICY REGISTRY</span>
              </span>
              <h2 className="font-serif font-black text-2xl sm:text-3xl text-[#173b2c] tracking-tight mt-1">
                Rice Legal Decrees &amp; Ordinances
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Enacted municipal ordinances, executive orders, Sangguniang Bayan resolutions, and DA mandates governing Silago&apos;s rice farms, irrigation buffers, and certified seed programs.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={decreeQuery}
                  onChange={(e) => setDecreeQuery(e.target.value)}
                  placeholder="Search ordinance or law..."
                  className="pl-8 pr-3 py-2 w-56 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => onNavigateToPortalTab('legal_decrees')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#173b2c] hover:bg-[#123b2b] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-lime-300" />
                <span>Open Full Law Repository</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {DECREE_CATEGORIES.filter((c) => c !== 'Archive').map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setDecreeCategory(cat)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer ${
                  decreeCategory === cat
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-emerald-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Decrees Grid */}
          {filteredDecrees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecrees.map((decree) => (
                <article
                  key={decree.id}
                  onClick={() => setSelectedDecreeModal(decree)}
                  className="bg-[#f8faf7] hover:bg-white border border-slate-200/90 hover:border-emerald-400 rounded-2xl p-5 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-200 text-[10px] font-bold">
                        {decree.number || decree.category}
                      </span>
                      {decree.dateEnacted && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {decree.dateEnacted}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#173b2c] group-hover:text-emerald-700 transition leading-snug">
                      {decree.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {decree.summary || decree.text}
                    </p>
                  </div>
                  <div className="pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                    <span>{decree.category}</span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition">
                      Read Provisions <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-xs text-slate-500">
              No legal decrees match your current filter. Try selecting &ldquo;All Documents&rdquo; or clearing your search.
            </div>
          )}
        </div>
      </section>

      {/* Official Footer */}
      <footer id="contact-section" className="bg-gov-forest-dark text-white/75 pt-12 pb-8 px-4 sm:px-6 mt-auto border-t border-white/10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-white/10 text-xs">
          {/* Column 1: Seals & Address */}
          <div className="space-y-3">
            <OfficialSealsTrio />
            <div>
              <strong className="text-white text-sm font-bold block">
                {landingPageConfig?.footerOfficeName || 'Silago DA Office'}
              </strong>
              <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider block">
                {landingPageConfig?.footerOfficeSubtitle || 'MUNICIPAL AGRICULTURE'}
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              {landingPageConfig?.footerOfficeAddress || 'Office of the Municipal Agriculturist, Silago Municipal Hall Complex, Southern Leyte, Philippines 6607.'}
            </p>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              {landingPageConfig?.footerNavTitle || 'QUICK NAVIGATION'}
            </h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('about-section')}
                  className="hover:text-white transition cursor-pointer"
                >
                  {landingPageConfig?.footerNavAbout || 'About the Office'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('barangays-section')}
                  className="hover:text-white transition cursor-pointer"
                >
                  {landingPageConfig?.footerNavDirectory || '15 Barangays Directory'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('legal-decrees-section')}
                  className="hover:text-white transition cursor-pointer"
                >
                  Legal Decrees &amp; Ordinances
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Office Hours & Hotline (Dynamic Central Admin Link) */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase tracking-wider text-xs">
              {landingPageConfig?.footerHoursTitle || 'OFFICE HOURS & HOTLINE'}
            </h4>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
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
              {landingPageConfig?.footerPortalAccessTitle || 'PORTAL ACCESS'}
            </h4>
            <p className="text-slate-400 leading-relaxed">
              {landingPageConfig?.footerPortalAccessDesc || 'Restricted to authorized Municipal Agriculture Office staff and designated Local Farm Technicians (LFT).'}
            </p>
            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigateToPortalTab(currentUser.role === 'Central Admin' ? 'dashboard' : 'map')}
                className="bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-xs w-full py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>{landingPageConfig?.footerPortalAccessBtn || 'Return to Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenLogin}
                className="bg-[#1d5639] hover:bg-[#17432f] text-white font-bold text-xs w-full py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs mt-2"
              >
                <span>{landingPageConfig?.heroSignInBtnText || 'Sign In to System'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-2">
          <span>{landingPageConfig?.footerCopyright || '© 2026 Municipality of Silago · Office of the Municipal Agriculturist'}</span>
          <span>{municipalBranding?.officeName || 'Municipal Agriculture Office - Silago'} · {municipalBranding?.registryTitle || 'Rice Farm Registry'}</span>
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

      {selectedParcelModal && (
        <ParcelDetailErrorBoundary onClose={() => setSelectedParcelModal(null)}>
          <ParcelDetailModal
            parcel={selectedParcelModal}
            onClose={() => setSelectedParcelModal(null)}
          />
        </ParcelDetailErrorBoundary>
      )}

      {/* Legal Decree Full Reader Modal */}
      {selectedDecreeModal && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelectedDecreeModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
          >
            <div className="bg-[#123b2b] text-white px-6 py-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {selectedDecreeModal.number && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-800 border border-emerald-600/60 text-lime-200 text-[10px] font-bold">
                      {selectedDecreeModal.number}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-emerald-200">
                    {selectedDecreeModal.category}
                  </span>
                  {selectedDecreeModal.dateEnacted && (
                    <span className="text-[11px] text-emerald-300/80">
                      · Enacted {selectedDecreeModal.dateEnacted}
                    </span>
                  )}
                </div>
                <h3 className="font-serif font-bold text-lg text-white leading-snug">
                  {selectedDecreeModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDecreeModal(null)}
                className="p-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 cursor-pointer shrink-0"
                aria-label="Close decree dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedDecreeModal.summary && (
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 font-medium leading-relaxed">
                  {selectedDecreeModal.summary}
                </div>
              )}
              <div className="whitespace-pre-line text-xs sm:text-sm text-slate-700 leading-relaxed">
                {selectedDecreeModal.text}
              </div>
            </div>
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedDecreeModal(null);
                  onNavigateToPortalTab('legal_decrees');
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Open Law Repository in Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDecreeModal(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
