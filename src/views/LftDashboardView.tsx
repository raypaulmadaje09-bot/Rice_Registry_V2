import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BARANGAYS } from '../data/barangays';
import { FarmParcel, Barangay, PortalTab } from '../types';
import { SeasonalCropCalendar } from '../components/SeasonalCropCalendar';
import { OfficeKpiStrip, OfficePanel } from '../components/OfficeFormPrimitives';
import {
  Wheat,
  MapPin,
  Clock,
  Plus,
  Compass,
  Printer,
  Search,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  Eye
} from 'lucide-react';

interface LftDashboardViewProps {
  onNavigateToTab: (tab: PortalTab) => void;
  onSelectParcel: (parcel: FarmParcel) => void;
  onOpenAddParcel: () => void;
  onOpenCropPlanting?: () => void;
  onSelectBarangay?: (barangay: Barangay) => void;
}

/**
 * Municipal Agriculture Office workstation view for Local Farmer Technicians (LFTs).
 */
export const LftDashboardView: React.FC<LftDashboardViewProps> = ({
  onNavigateToTab,
  onSelectParcel,
  onOpenAddParcel,
  onOpenCropPlanting,
  onSelectBarangay
}) => {
  const { parcels, currentUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('Wet Season (WS) 2026');

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
      if (currentUser?.role === 'Central Admin') return true;
      return assignedBarangayList.some(
        (ab) =>
          p.barangay.toLowerCase().includes(ab.toLowerCase()) ||
          ab.toLowerCase().includes(p.barangay.toLowerCase())
      );
    });
  }, [parcels, assignedBarangayList, currentUser]);

  const metrics = useMemo(() => {
    const totalFarmers = new Set(lftParcels.map((p) => p.raiserName.trim().toLowerCase())).size;
    const totalAreaHa = lftParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
    const validatedCount = lftParcels.filter(
      (p) =>
        (p.biosecurityScore && p.biosecurityScore.toLowerCase().includes('georeferenced')) ||
        p.syncStatus === 'SYNCED'
    ).length;
    const pendingValidation = Math.max(0, lftParcels.length - validatedCount);
    const targetSubmissions = 45;
    const targetProgressPct = Math.min(
      100,
      Math.round((lftParcels.length / targetSubmissions) * 100)
    );

    return {
      totalFarmers,
      totalParcels: lftParcels.length,
      totalAreaHa: parseFloat(totalAreaHa.toFixed(2)),
      validatedCount,
      pendingValidation,
      targetSubmissions,
      targetProgressPct
    };
  }, [lftParcels]);

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
        rawBarangay: match
      };
    });
  }, [assignedBarangayList, lftParcels]);

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

  const kpiItems = [
    {
      label: 'Assigned Farmers',
      value: metrics.totalFarmers,
      note: `${metrics.totalParcels} registered farm lots`,
      icon: Wheat
    },
    {
      label: 'Georeferenced Area',
      value: `${metrics.totalAreaHa} ha`,
      note: 'GPS polygon mapped hectares',
      icon: MapPin,
      valueToneClass: 'text-emerald-800'
    },
    {
      label: 'Pending Validations',
      value: metrics.pendingValidation,
      note: 'Parcels queued for verification',
      icon: Clock
    },
    {
      label: 'Season Target',
      value: `${metrics.targetProgressPct}%`,
      note: `${metrics.totalParcels} / ${metrics.targetSubmissions} target lots`,
      icon: TrendingUp
    }
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4">
      {/* Official Office LFT Header */}
      <header className="bg-white border border-gov-line border-t-2 border-t-gov-forest rounded overflow-hidden">
        <div className="px-5 py-4">
          <p className="gov-eyebrow">
            LFT Field Operations &bull; {currentUser?.name || 'Local Farmer Technician'} &bull;{' '}
            {currentUser?.title || 'Field Officer'}
          </p>
          <h1 className="gov-heading mt-1 text-lg sm:text-xl">
            Sector Rice Farm Registry &amp; Georeferencing
          </h1>
          <p className="mt-0.5 text-xs text-gov-muted">
            Covering {assignedBarangayList.length} assigned barangay
            {assignedBarangayList.length === 1 ? '' : 's'} in Silago, Southern Leyte.
          </p>
        </div>

        <div className="bg-gov-canvas/70 border-t border-gov-line px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <label className="inline-flex items-center gap-1.5 rounded border border-gov-line-strong bg-white px-2.5 py-1.5 text-xs text-gov-ink">
            <Calendar className="w-3.5 h-3.5 text-gov-muted shrink-0" />
            <span className="font-semibold">Season:</span>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-transparent text-xs font-semibold text-gov-ink outline-none cursor-pointer border-0 py-0"
              style={{ minHeight: 'unset' }}
            >
              <option value="Wet Season (WS) 2026">Wet Season (WS) 2026</option>
              <option value="Dry Season (DS) 2026">Dry Season (DS) 2026</option>
              <option value="Wet Season (WS) 2025">Wet Season (WS) 2025</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddParcel}
              className="gov-btn gov-btn-secondary"
            >
              <Plus className="w-3.5 h-3.5 text-gov-green" />
              <span>Register Farmer &amp; Farm</span>
            </button>

            {onOpenCropPlanting && (
              <button
                type="button"
                onClick={onOpenCropPlanting}
                className="gov-btn gov-btn-secondary"
              >
                <Wheat className="w-3.5 h-3.5 text-gov-gold" />
                <span>Crop &amp; Planting Form</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToTab('map')}
              className="gov-btn gov-btn-secondary"
            >
              <Compass className="w-3.5 h-3.5 text-gov-muted" />
              <span>GIS Map</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('reports')}
              className="gov-btn gov-btn-primary"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Barangay Masterlist</span>
            </button>
          </div>
        </div>
      </header>

      {/* 4-Column LFT Summary Strip */}
      <OfficeKpiStrip items={kpiItems} />

      {/* Quick Database Navigation Bar */}
      <div className="bg-white border border-gov-line rounded px-4 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2 text-gov-muted">
        <span>
          <strong className="text-gov-ink">Assigned Barangays:</strong>{' '}
          {assignedBarangayList.join(', ')}
        </span>
        <button
          type="button"
          onClick={() => onNavigateToTab('eartags')}
          className="inline-flex items-center gap-1.5 font-semibold text-gov-green hover:underline cursor-pointer"
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Open Farm Records Database &rarr;</span>
        </button>
      </div>

      {/* 2-Column Operational Ledger Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6">
          <OfficePanel
            title="Assigned Barangay Jurisdiction"
            subtitle="Registered farmers and mapped area per sector barangay"
            noPadding
            rightContent={
              <span className="text-[11px] font-semibold text-slate-600">
                {assignedBarangayList.length} Barangays
              </span>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-3">Barangay</th>
                    <th className="py-2.5 px-3 text-center">Farmers</th>
                    <th className="py-2.5 px-3 text-center">Total Area</th>
                    <th className="py-2.5 px-3">Completion</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {barangayCoverage.map((item) => (
                    <tr key={item.name} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3">
                        <strong className="font-semibold text-slate-900 block">{item.name}</strong>
                        <span className="text-[10.5px] text-slate-500">{item.terrain}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                        <span className="font-semibold text-slate-900">{item.actualFarmers}</span>
                        <span className="text-slate-400">/{item.targetFarmers}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-800 tabular-nums">
                        {item.totalHa} ha
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-200 rounded-xs h-1.5 overflow-hidden">
                            <div
                              className="h-1.5 bg-emerald-800"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[10.5px] font-mono font-semibold text-slate-600 tabular-nums">
                            {item.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {item.rawBarangay && onSelectBarangay && (
                          <button
                            type="button"
                            onClick={() => onSelectBarangay(item.rawBarangay!)}
                            className="p-1 rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer inline-flex items-center justify-center"
                            title="View Barangay Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </OfficePanel>
        </div>

        <div className="lg:col-span-6">
          <OfficePanel
            title="Recent Field Submissions"
            subtitle="Latest farm parcels recorded in assigned sector"
            noPadding
            rightContent={
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter farmer / lot..."
                  className="pl-8 pr-3 py-1 bg-white border border-slate-300 rounded-md text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-700"
                />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-3">Farmer &amp; RSBSA</th>
                    <th className="py-2.5 px-3">Barangay &amp; Variety</th>
                    <th className="py-2.5 px-3 text-right">Area</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentSubmissions.length > 0 ? (
                    recentSubmissions.map((parcel) => (
                      <tr key={parcel.tagNumber} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <strong className="font-semibold text-slate-900 block">
                            {parcel.raiserName}
                          </strong>
                          <span className="text-[10.5px] font-mono text-slate-500">
                            {parcel.swineNameOrId || parcel.tagNumber}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-slate-800 block font-medium">
                            {parcel.barangay}
                          </span>
                          <span className="text-[10.5px] text-slate-500 block">{parcel.breed}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-800 tabular-nums">
                          {parcel.weightKg} ha
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-sm bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold">
                            Verified
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectParcel(parcel)}
                            className="px-2.5 py-1 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 cursor-pointer"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-slate-500">
                        No farm parcel submissions recorded in this sector.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px]">
              <span className="text-slate-600">
                Showing {recentSubmissions.length} of {lftParcels.length} assigned parcels
              </span>
              <button
                type="button"
                onClick={() => onNavigateToTab('eartags')}
                className="font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                View Full Database &rarr;
              </button>
            </div>
          </OfficePanel>
        </div>
      </div>

      {/* Seasonal Crop Calendar for LFT Advisory Field Work */}
      <SeasonalCropCalendar />
    </div>
  );
};
