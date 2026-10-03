import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BARANGAYS } from '../data/barangays';
import { FarmParcel, Barangay, PortalTab } from '../types';
import { SeasonalCropCalendar } from '../components/SeasonalCropCalendar';
import {
  Wheat,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Compass,
  Printer,
  Search,
  Filter,
  Layers,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Building2,
  Eye,
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface LftDashboardViewProps {
  onNavigateToTab: (tab: PortalTab) => void;
  onSelectParcel: (parcel: FarmParcel) => void;
  onOpenAddParcel: () => void;
  onSelectBarangay?: (barangay: Barangay) => void;
}

export const LftDashboardView: React.FC<LftDashboardViewProps> = ({
  onNavigateToTab,
  onSelectParcel,
  onOpenAddParcel,
  onSelectBarangay
}) => {
  const { parcels, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('Wet Season (WS) 2026');

  // Filter parcels assigned to this LFT's barangays
  const assignedBarangayList = useMemo(() => {
    if (!currentUser) return BARANGAYS.map((b) => b.name);
    if (currentUser.role === 'Central Admin') return BARANGAYS.map((b) => b.name);
    if (currentUser.assignedBarangays && currentUser.assignedBarangays.length > 0) {
      return currentUser.assignedBarangays;
    }
    if (currentUser.barangay) {
      return currentUser.barangay.split(',').map((s) => s.trim());
    }
    return ['Salvacion', 'Laguna', 'Pob. 2', 'Pob. 1', 'Hingatungan'];
  }, [currentUser]);

  const lftParcels = useMemo(() => {
    return parcels.filter((p) => {
      // If admin, show all; otherwise check assigned barangay match
      if (currentUser?.role === 'Central Admin') return true;
      return assignedBarangayList.some(
        (ab) =>
          p.barangay.toLowerCase().includes(ab.toLowerCase()) ||
          ab.toLowerCase().includes(p.barangay.toLowerCase())
      );
    });
  }, [parcels, assignedBarangayList, currentUser]);

  // Derived metrics
  const metrics = useMemo(() => {
    const totalFarmers = new Set(lftParcels.map((p) => p.raiserName.trim().toLowerCase())).size;
    const totalAreaHa = lftParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
    const validatedCount = lftParcels.filter(
      (p) =>
        (p.biosecurityScore && p.biosecurityScore.toLowerCase().includes('georeferenced')) ||
        p.syncStatus === 'SYNCED'
    ).length;
    const pendingValidation = lftParcels.length - validatedCount;
    const targetSubmissions = 45; // Season target for assigned zone
    const targetProgressPct = Math.min(100, Math.round((lftParcels.length / targetSubmissions) * 100));

    return {
      totalFarmers,
      totalParcels: lftParcels.length,
      totalAreaHa: parseFloat(totalAreaHa.toFixed(2)),
      validatedCount,
      pendingValidation: Math.max(0, pendingValidation),
      targetSubmissions,
      targetProgressPct
    };
  }, [lftParcels]);

  // Barangay coverage data for the table
  const barangayCoverage = useMemo(() => {
    return assignedBarangayList.map((brgyName) => {
      const match = BARANGAYS.find((b) => b.name.toLowerCase().includes(brgyName.toLowerCase()));
      const brgyParcels = lftParcels.filter(
        (p) =>
          p.barangay.toLowerCase().includes(brgyName.toLowerCase()) ||
          brgyName.toLowerCase().includes(p.barangay.toLowerCase())
      );
      const totalHa = brgyParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
      const targetFarmers = match?.registeredRaisers || 15;
      const actualFarmers = new Set(brgyParcels.map((p) => p.raiserName.trim())).size;
      const progress = Math.min(100, Math.round((actualFarmers / targetFarmers) * 100));

      return {
        name: match?.name || brgyName,
        terrain: match?.terrain || 'Inland Valley',
        actualFarmers,
        targetFarmers,
        actualParcels: brgyParcels.length,
        totalHa: parseFloat(totalHa.toFixed(2)),
        progress,
        status: progress >= 80 ? 'Optimal' : progress >= 40 ? 'Ongoing' : 'Needs Field Survey',
        rawBarangay: match
      };
    });
  }, [assignedBarangayList, lftParcels]);

  // Filtered recent field submissions
  const recentSubmissions = useMemo(() => {
    return lftParcels
      .filter((p) => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        return (
          p.raiserName.toLowerCase().includes(q) ||
          p.tagNumber.toLowerCase().includes(q) ||
          p.swineNameOrId.toLowerCase().includes(q) ||
          p.barangay.toLowerCase().includes(q) ||
          p.breed.toLowerCase().includes(q)
        );
      })
      .slice(0, 8);
  }, [lftParcels, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-[#0b2545] text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
        {/* Subtle background decorative shapes */}
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-10 w-48 h-48 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                LFT Field Officer Operations
              </span>
              <span className="text-xs text-slate-300">
                {currentUser?.name || 'Local Farmer Technician'} · {currentUser?.title || 'LFT Field Officer'}
              </span>
            </div>

            <h1 className="font-serif font-black text-2xl sm:text-3xl text-white tracking-tight">
              Rice Farm Registry &amp; Georeferencing
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl font-normal leading-relaxed">
              Field jurisdiction covering {assignedBarangayList.length} assigned barangays in Silago, Southern Leyte. Track RSBSA farmer registration, GPS polygon georeferencing, and seasonal cropping milestones.
            </p>
          </div>

          {/* Cropping Season Selector & Fast Masterlist Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-2 rounded-2xl flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="text-left">
                <span className="text-[9px] font-bold text-slate-300 uppercase block leading-none">Target Cropping Season</span>
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(e.target.value)}
                  className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-1"
                >
                  <option value="Wet Season (WS) 2026" className="text-slate-900">Wet Season (WS) 2026</option>
                  <option value="Dry Season (DS) 2026" className="text-slate-900">Dry Season (DS) 2026</option>
                  <option value="Wet Season (WS) 2025" className="text-slate-900">Wet Season (WS) 2025</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Barangay Masterlist</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Farmers */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Assigned Rice Farmers
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wheat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-serif text-slate-900">
              {metrics.totalFarmers}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              in {metrics.totalParcels} farm lots
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>RSBSA Enrolled in assigned barangays</span>
          </div>
        </div>

        {/* Card 2: Total Area Mapped */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Area Georeferenced
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-serif text-emerald-700">
              {metrics.totalAreaHa}
            </span>
            <span className="text-xs text-slate-500 font-bold uppercase">
              Hectares (ha)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>GPS Polygon Coordinates mapped</span>
          </div>
        </div>

        {/* Card 3: Pending Field Validations */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pending Validations
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-serif text-amber-600">
              {metrics.pendingValidation}
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              parcels queued
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Ready for on-site verification</span>
          </div>
        </div>

        {/* Card 4: Target Season Progress */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Season Target
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-serif text-purple-700">
              {metrics.targetProgressPct}%
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              ({metrics.totalParcels}/{metrics.targetSubmissions} lots)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${metrics.targetProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Fast-Action Toolbar */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Quick Actions:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onOpenAddParcel}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register New Rice Farmer</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('map')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Map Field Coordinates</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateToTab('eartags')}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Farm Records Database</span>
          </button>
        </div>
      </div>

      {/* 2-Column Grid: Barangay Coverage Jurisdiction & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Barangay Jurisdiction Table (7 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Assigned Barangay Jurisdiction
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Target vs. validated palay landholdings per community
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                {assignedBarangayList.length} Barangays
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Barangay</th>
                    <th className="py-2.5 px-3 text-center">Farmers</th>
                    <th className="py-2.5 px-3 text-center">Total Area</th>
                    <th className="py-2.5 px-3">Completion</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {barangayCoverage.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3">
                        <strong className="font-bold text-slate-900 block">
                          {item.name}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {item.terrain}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span className="font-bold text-slate-900">{item.actualFarmers}</span>
                        <span className="text-slate-400">/{item.targetFarmers}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        {item.totalHa} ha
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                item.progress >= 75
                                  ? 'bg-emerald-600'
                                  : item.progress >= 40
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-600">
                            {item.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {item.rawBarangay && onSelectBarangay && (
                          <button
                            type="button"
                            onClick={() => onSelectBarangay(item.rawBarangay!)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                            title="View Barangay Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Recent Field Submissions (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white/90 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900">
                  Recent Field Submissions
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest georeferenced farm parcels in your coverage area
                </p>
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter farmer / lot..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Farmer &amp; RSBSA</th>
                    <th className="py-2.5 px-3">Location &amp; Variety</th>
                    <th className="py-2.5 px-3 text-center">Area</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSubmissions.length > 0 ? (
                    recentSubmissions.map((parcel) => (
                      <tr key={parcel.tagNumber} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3">
                          <strong className="font-bold text-slate-900 block">
                            {parcel.raiserName}
                          </strong>
                          <span className="text-[10px] font-mono text-slate-500">
                            {parcel.swineNameOrId || parcel.tagNumber}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-slate-800 block font-medium">
                            {parcel.barangay}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {parcel.breed}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-800">
                          {parcel.weightKg} ha
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectParcel(parcel)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <p className="text-xs font-semibold text-slate-600">
                            Walay nakit-ang basakan. Palihug pagdugang og bag-ong rekord.
                          </p>
                          <p className="text-[11px] text-slate-400">
                            No submissions recorded for this assigned sector.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">
                Showing {recentSubmissions.length} of {lftParcels.length} assigned parcels
              </span>
              <button
                type="button"
                onClick={() => onNavigateToTab('eartags')}
                className="font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Database</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Crop Calendar for LFT Advisory Field Work */}
      <SeasonalCropCalendar />
    </div>
  );
};
