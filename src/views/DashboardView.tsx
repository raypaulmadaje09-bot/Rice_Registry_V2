import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { BARANGAYS, matchBarangay } from '../data/barangays';
import { calculateCropGrowthStage } from '../data/riceVarieties';
import { FarmParcel, Barangay, PortalTab } from '../types';
import { OfficeKpiStrip, OfficePanel } from '../components/OfficeFormPrimitives';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  MapPin,
  MapPinned,
  Plus,
  Sprout,
  Users,
  Wheat
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateToTab: (tab: PortalTab) => void;
  onSelectParcel: (parcel: FarmParcel) => void;
  onOpenAddParcel: () => void;
  onOpenCropPlanting?: () => void;
  onSelectBarangay: (barangay: Barangay) => void;
}

type DashboardMetric = 'ecosystem' | 'barangay' | 'crop' | 'yield' | 'gps';
type ChartStyle = 'pie' | 'donut' | 'bar' | 'rank' | 'area' | 'line';
type Segment = { name: string; value: number; color: string; description: string };

const PALETTE = ['#1b4332', '#2563eb', '#b45309', '#4f46e5', '#0e7490', '#be185d', '#4d7c0f', '#c2410c'];

const areaOf = (parcel: FarmParcel) => Number(parcel.areaHa || parcel.weightKg || 0);
const validGps = (parcel: FarmParcel) =>
  Number.isFinite(Number(parcel.lat)) &&
  Number.isFinite(Number(parcel.lng)) &&
  Number(parcel.lat) !== 0 &&
  Number(parcel.lng) !== 0;
const parseDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

function cropStage(parcel: FarmParcel) {
  if (parcel.plantingDate) {
    return calculateCropGrowthStage(parcel.plantingDate, parcel.variety || parcel.breed).stage;
  }
  return parcel.standingCropStage || parcel.healthStatus || '';
}

function harvestInfo(parcel: FarmParcel) {
  const stageText = `${parcel.standingCropStage || ''} ${parcel.healthStatus || ''}`.toLowerCase();
  if (/harvested|post.harvest|harvest completed/.test(stageText)) return null;
  const growth = parcel.plantingDate
    ? calculateCropGrowthStage(parcel.plantingDate, parcel.variety || parcel.breed)
    : null;
  const explicitReady = /harvest ready|ripening|maturity|harvesting/.test(stageText);
  const scheduledDate = parseDate(parcel.harvestDate || '');
  const daysUntilScheduledHarvest = scheduledDate
    ? Math.ceil((scheduledDate.getTime() - Date.now()) / 86400000)
    : null;
  const withinHarvestWindow =
    daysUntilScheduledHarvest !== null &&
    daysUntilScheduledHarvest >= -14 &&
    daysUntilScheduledHarvest <= 45;
  const maturity = Math.max(
    growth?.percentageMaturity || 0,
    explicitReady ? 90 : 0,
    withinHarvestWindow ? 85 : 0
  );
  if (maturity < 70) return null;
  return {
    maturity: Math.min(100, maturity),
    estimatedDate: parcel.harvestDate || growth?.estimatedHarvestDate || '',
    stage: growth?.stage || cropStage(parcel) || 'Approaching maturity'
  };
}

function getSegments(metric: DashboardMetric, parcels: FarmParcel[]): Segment[] {
  if (metric === 'barangay') {
    return BARANGAYS.map((barangay, index) => {
      const rows = parcels.filter((parcel) => matchBarangay(parcel.barangay, barangay.name));
      return {
        name: barangay.name,
        value: rows.length,
        color: PALETTE[index % PALETTE.length],
        description: `${rows.reduce((sum, parcel) => sum + areaOf(parcel), 0).toFixed(2)} ha mapped`
      };
    })
      .filter((segment) => segment.value > 0)
      .sort((a, b) => b.value - a.value);
  }
  if (metric === 'gps') {
    const mapped = parcels.filter(validGps).length;
    return [
      {
        name: 'GPS Verified',
        value: mapped,
        color: '#1b4332',
        description: 'Records with valid coordinates'
      },
      {
        name: 'Pending GPS Review',
        value: parcels.length - mapped,
        color: '#b45309',
        description: 'Records requiring coordinates'
      }
    ].filter((segment) => segment.value > 0);
  }
  if (metric === 'yield') {
    return BARANGAYS.map((barangay, index) => {
      const rows = parcels.filter((parcel) => matchBarangay(parcel.barangay, barangay.name));
      return {
        name: barangay.name,
        value: rows.reduce((sum, parcel) => sum + Number(parcel.targetYieldMt || 0), 0),
        color: PALETTE[index % PALETTE.length],
        description: `${rows.length} registered farm${rows.length === 1 ? '' : 's'}`
      };
    })
      .filter((segment) => segment.value > 0)
      .sort((a, b) => b.value - a.value);
  }
  if (metric === 'crop') {
    const groups = [
      { name: 'Vegetative', color: '#2563eb', description: 'Establishment and tillering' },
      { name: 'Reproductive', color: '#4f46e5', description: 'Panicle initiation through flowering' },
      { name: 'Ripening', color: '#b45309', description: 'Grain filling and harvest window' },
      { name: 'Fallow / Other', color: '#64748b', description: 'Fallow or other stage' }
    ];
    const classify = (parcel: FarmParcel) => {
      const stage = cropStage(parcel);
      if (/seedling|vegetative|tillering/i.test(stage)) return 'Vegetative';
      if (/reproductive|panicle|flowering/i.test(stage)) return 'Reproductive';
      if (/ripening|maturity|harvest/i.test(stage)) return 'Ripening';
      if (/fallow|other/i.test(stage)) return 'Fallow / Other';
      return '';
    };
    const result = groups.map((group) => ({
      name: group.name,
      value: parcels.filter((parcel) => classify(parcel) === group.name).length,
      color: group.color,
      description: group.description
    }));
    const recorded = result.reduce((sum, row) => sum + row.value, 0);
    const missing = Math.max(0, parcels.length - recorded);
    if (missing > 0) {
      result.push({
        name: 'Pending Crop Entry',
        value: missing,
        color: '#94a3b8',
        description: 'Planting record not yet assigned'
      });
    }
    return result.filter((segment) => segment.value > 0);
  }
  const categories = [
    { name: 'Irrigated Lowland', color: '#1b4332', description: 'Irrigation-supported rice farms' },
    { name: 'Hybrid Rice', color: '#4f46e5', description: 'Hybrid seed production' },
    { name: 'Upland Rice', color: '#b45309', description: 'Upland agro-ecosystem' },
    { name: 'Rainfed Lowland', color: '#0e7490', description: 'Rainfed rice production' }
  ];
  const classify = (parcel: FarmParcel) => {
    const profile = `${parcel.purpose || ''} ${parcel.ecosystem || ''} ${parcel.seedType || ''}`;
    if (/hybrid/i.test(profile)) return 'Hybrid Rice';
    if (/upland/i.test(profile)) return 'Upland Rice';
    if (/irrigat|nia|communal/i.test(profile)) return 'Irrigated Lowland';
    return 'Rainfed Lowland';
  };
  return categories
    .map((category) => ({
      name: category.name,
      value: parcels.filter((parcel) => classify(parcel) === category.name).length,
      color: category.color,
      description: category.description
    }))
    .filter((segment) => segment.value > 0);
}

/**
 * Formal Municipal Agriculture Office executive dashboard for monitoring
 * farmer registration, rice area, GPS coverage, and upcoming harvests.
 */
export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTab,
  onSelectParcel,
  onOpenAddParcel,
  onOpenCropPlanting,
  onSelectBarangay
}) => {
  const { parcels, lftAccounts, permissions } = useApp();
  const [selectedBarangay, setSelectedBarangay] = useState('ALL');
  const [metric, setMetric] = useState<DashboardMetric>('ecosystem');
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');

  const visibleParcels = useMemo(
    () =>
      selectedBarangay === 'ALL'
        ? parcels
        : parcels.filter((parcel) => matchBarangay(parcel.barangay, selectedBarangay)),
    [parcels, selectedBarangay]
  );

  const segments = useMemo(() => getSegments(metric, visibleParcels), [metric, visibleParcels]);
  const segmentTotal = segments.reduce((sum, segment) => sum + segment.value, 0);
  const totalArea = visibleParcels.reduce((sum, parcel) => sum + areaOf(parcel), 0);
  const totalYield = visibleParcels.reduce((sum, parcel) => sum + Number(parcel.targetYieldMt || 0), 0);
  const mappedCount = visibleParcels.filter(validGps).length;
  const farmerCount = new Set(
    visibleParcels.map((parcel) => parcel.raiserName.trim().toLowerCase()).filter(Boolean)
  ).size;
  const today = new Date();
  const todayCount = visibleParcels.filter((parcel) => {
    const date = parseDate(parcel.registrationDate);
    return date?.toDateString() === today.toDateString();
  }).length;
  const activeLfts = lftAccounts.filter(
    (account) => !account.status || account.status.toLowerCase().includes('active')
  ).length;

  const barangayStats = BARANGAYS.map((barangay) => {
    const rows = visibleParcels.filter((parcel) => matchBarangay(parcel.barangay, barangay.name));
    return {
      barangay,
      count: rows.length,
      area: rows.reduce((sum, parcel) => sum + areaOf(parcel), 0)
    };
  })
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count || b.area - a.area);

  const harvestQueue = visibleParcels
    .map((parcel) => ({ parcel, harvest: harvestInfo(parcel) }))
    .filter(
      (
        row
      ): row is { parcel: FarmParcel; harvest: NonNullable<ReturnType<typeof harvestInfo>> } =>
        Boolean(row.harvest)
    )
    .sort((a, b) =>
      (a.harvest.estimatedDate || '9999').localeCompare(b.harvest.estimatedDate || '9999')
    );

  const gpsRate = visibleParcels.length ? Math.round((mappedCount / visibleParcels.length) * 100) : 0;

  const kpiItems = [
    {
      label: 'Registered Farms',
      value: visibleParcels.length.toLocaleString(),
      note: 'Active farm parcel records',
      icon: Wheat
    },
    {
      label: 'Incoming Harvest',
      value: harvestQueue.length.toLocaleString(),
      note: 'At least 70% crop maturity',
      icon: Sprout
    },
    {
      label: 'Registered Farmers',
      value: farmerCount.toLocaleString(),
      note: 'Unique farmer profiles',
      icon: Users
    },
    {
      label: 'Mapped Rice Area',
      value: `${totalArea.toFixed(2)} ha`,
      note: `${mappedCount} parcels with GPS`,
      icon: MapPinned
    },
    {
      label: 'GPS Verification',
      value: `${gpsRate}%`,
      note: `${visibleParcels.length - mappedCount} needing review`,
      icon: CheckCircle2,
      valueToneClass: gpsRate === 100 ? 'text-emerald-800' : 'text-slate-900'
    }
  ];

  const metricOptions: { key: DashboardMetric; label: string }[] = [
    { key: 'ecosystem', label: 'Rice Ecosystem & Seed Type' },
    { key: 'barangay', label: 'Barangay Distribution' },
    { key: 'crop', label: 'Crop Stage Breakdown' },
    { key: 'yield', label: 'Projected Yield by Barangay' },
    { key: 'gps', label: 'GPS Verification Status' }
  ];

  const chartOptions: { key: ChartStyle; label: string }[] = [
    { key: 'bar', label: 'Bar' },
    { key: 'rank', label: 'Rank' },
    { key: 'pie', label: 'Pie' },
    { key: 'donut', label: 'Donut' },
    { key: 'area', label: 'Area' },
    { key: 'line', label: 'Line' }
  ];

  const selectedName = selectedBarangay === 'ALL' ? 'All 15 Barangays' : `Brgy. ${selectedBarangay}`;

  const exportMasterlist = () => {
    const headers = [
      'Registry ID',
      'RSBSA Reference',
      'Farmer',
      'Barangay',
      'Rice Variety',
      'Farm Area (ha)',
      'Crop Stage',
      'Target Yield (MT)',
      'Latitude',
      'Longitude',
      'Registration Date'
    ];
    const rows = visibleParcels.map((parcel) => [
      parcel.tagNumber,
      parcel.swineNameOrId,
      parcel.raiserName,
      parcel.barangay,
      parcel.variety || parcel.breed,
      areaOf(parcel),
      cropStage(parcel),
      parcel.targetYieldMt,
      parcel.lat,
      parcel.lng,
      parcel.registrationDate
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `silago-rice-masterlist-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4">
      {/* Official Office Header & Action Toolbar */}
      <header className="bg-white border border-gov-line border-t-2 border-t-gov-forest rounded overflow-hidden">
        <div className="px-5 py-4">
          <p className="gov-eyebrow">
            Republic of the Philippines &bull; Municipality of Silago &bull; Municipal Agriculture Office
          </p>
          <h1 className="gov-heading mt-1 text-lg sm:text-xl">
            Municipal Rice Registry Dashboard
          </h1>
          <p className="mt-0.5 text-xs text-gov-muted">
            Production monitoring, georeferencing verification, and seasonal harvest schedule across 15 barangays.
          </p>
        </div>

        <div className="bg-gov-canvas/70 border-t border-gov-line px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 rounded border border-gov-line-strong bg-white px-2.5 py-1.5 text-xs text-gov-ink">
              <MapPin className="h-3.5 w-3.5 text-gov-muted shrink-0" />
              <span className="font-semibold">Scope:</span>
              <select
                value={selectedBarangay}
                onChange={(event) => setSelectedBarangay(event.target.value)}
                className="max-w-48 cursor-pointer border-0 bg-transparent text-xs font-semibold text-gov-ink outline-none py-0"
                style={{ minHeight: 'unset' }}
              >
                <option value="ALL">All 15 Barangays</option>
                {BARANGAYS.map((barangay) => (
                  <option key={barangay.name} value={barangay.name}>
                    Brgy. {barangay.name}
                  </option>
                ))}
              </select>
            </label>

            {permissions.canExportDatabase && (
              <button
                type="button"
                onClick={exportMasterlist}
                className="gov-btn gov-btn-secondary"
              >
                <Download className="h-3.5 w-3.5 text-gov-muted" />
                <span>Export CSV</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {permissions.canAddParcels && (
              <button
                type="button"
                onClick={onOpenAddParcel}
                className="gov-btn gov-btn-secondary"
              >
                <Plus className="h-3.5 w-3.5 text-gov-green" />
                <span>Register Farmer &amp; Farm</span>
              </button>
            )}

            {permissions.canAddParcels && onOpenCropPlanting && (
              <button
                type="button"
                onClick={onOpenCropPlanting}
                className="gov-btn gov-btn-secondary"
              >
                <Wheat className="h-3.5 w-3.5 text-gov-gold" />
                <span>Crop &amp; Planting Form</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigateToTab('map')}
              className="gov-btn gov-btn-primary"
            >
              <MapPinned className="h-3.5 w-3.5" />
              <span>Open GIS Map</span>
            </button>
          </div>
        </div>
      </header>

      {/* Primary KPI Summary Strip */}
      <OfficeKpiStrip items={kpiItems} />

      {/* Compact Registry Operations Status Line */}
      <section className="bg-white border border-gov-line rounded px-4 py-2 text-[11px] flex flex-wrap items-center justify-between gap-2 text-gov-muted">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            <strong className="text-gov-ink">Coverage:</strong> {selectedName}
          </span>
          <span>
            <strong className="text-gov-ink">Projected Yield:</strong> {totalYield.toFixed(2)} MT
          </span>
          <span>
            <strong className="text-gov-ink">Registered Today:</strong> {todayCount}
          </span>
          <span>
            <strong className="text-gov-ink">Active LFT Officers:</strong> {activeLfts}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateToTab('eartags')}
            className="font-semibold text-gov-green hover:underline cursor-pointer"
          >
            View Masterlist &rarr;
          </button>
          <button
            type="button"
            onClick={() => onNavigateToTab('reports')}
            className="font-semibold text-gov-green hover:underline cursor-pointer"
          >
            Print Official Reports &rarr;
          </button>
        </div>
      </section>

      {/* Registry Analytics & Distribution Panel */}
      <OfficePanel
        title="Registry Analytics & Distribution"
        subtitle="Filter municipal agricultural metrics and inspect category totals."
        rightContent={
          <>
            <select
              value={metric}
              onChange={(event) => setMetric(event.target.value as DashboardMetric)}
              className="cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 outline-none"
            >
              {metricOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 p-0.5">
              {chartOptions.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChartStyle(key)}
                  className={`rounded-sm px-2.5 py-1 text-[11px] font-semibold transition cursor-pointer ${
                    chartStyle === key
                      ? 'bg-white text-slate-900 border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900 border border-transparent'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        }
      >
        <div className="grid items-start gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 border border-slate-200 rounded-md bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between text-xs border-b border-slate-200 pb-2">
              <span className="font-semibold text-slate-800">
                {metricOptions.find((option) => option.key === metric)?.label}
              </span>
              <span className="font-semibold text-slate-600 tabular-nums">
                {metric === 'yield'
                  ? `${segmentTotal.toFixed(2)} MT projected`
                  : `${segmentTotal} total farms`}
              </span>
            </div>
            <Chart
              segments={segments}
              total={segmentTotal}
              style={chartStyle}
              unit={metric === 'yield' ? 'MT' : 'farms'}
            />
          </div>

          <div className="lg:col-span-5 border border-slate-200 rounded-md overflow-hidden">
            <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-[11px]">
              <span className="font-bold uppercase tracking-wide text-slate-700">
                Distribution Ledger
              </span>
              <span className="font-medium text-slate-500">{segments.length} groups</span>
            </div>
            {segments.length ? (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-200 bg-white">
                {segments.map((segment) => {
                  const percent = segmentTotal ? Math.round((segment.value / segmentTotal) * 100) : 0;
                  return (
                    <div
                      key={segment.name}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-xs"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">{segment.name}</p>
                          <p className="truncate text-[11px] text-slate-500">{segment.description}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right tabular-nums">
                        <p className="font-bold text-slate-900">
                          {metric === 'yield'
                            ? `${segment.value.toFixed(2)} MT`
                            : `${segment.value} ${segment.value === 1 ? 'farm' : 'farms'}`}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500">{percent}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState text="No records match this metric yet." />
            )}
          </div>
        </div>
      </OfficePanel>

      {/* Operational Breakdown Row */}
      <section className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <OfficePanel
            title="Rice Crop Stage Summary"
            subtitle="Registered farm count grouped by crop growth stage"
            rightContent={
              <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                {visibleParcels.length} farms
              </span>
            }
          >
            <div className="space-y-3 text-xs">
              {getSegments('crop', visibleParcels).map((stage) => {
                const pct = visibleParcels.length
                  ? Math.round((stage.value / visibleParcels.length) * 100)
                  : 0;
                return (
                  <div key={stage.name}>
                    <div className="mb-1 flex justify-between gap-3 font-medium text-slate-700">
                      <span>{stage.name}</span>
                      <span className="shrink-0 font-semibold text-slate-900 tabular-nums">
                        {stage.value} farms ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-xs bg-slate-100 border border-slate-200/70">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${visibleParcels.length ? (stage.value / visibleParcels.length) * 100 : 0}%`,
                          backgroundColor: stage.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {visibleParcels.length === 0 && (
                <EmptyState text="Crop stage distribution will appear as farm records are added." />
              )}
            </div>
          </OfficePanel>
        </div>

        <div className="lg:col-span-6">
          <OfficePanel
            title="Barangay Coverage Ranking"
            subtitle="Leading barangays by registered farms and mapped rice area"
            rightContent={
              <button
                type="button"
                onClick={() => onNavigateToTab('map')}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
              >
                <span>Open Map</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            }
          >
            {barangayStats.length ? (
              <div className="space-y-2.5 text-xs">
                {barangayStats.slice(0, 6).map((row, index) => (
                  <button
                    key={row.barangay.name}
                    type="button"
                    onClick={() => onSelectBarangay(row.barangay)}
                    className="flex w-full items-center gap-3 text-left hover:bg-slate-50 p-1 rounded-md transition cursor-pointer"
                  >
                    <span className="w-6 text-right text-[11px] font-semibold text-slate-500 tabular-nums">
                      {index + 1}.
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="mb-1 flex justify-between gap-2 font-medium text-slate-800">
                        <span className="truncate font-semibold">Brgy. {row.barangay.name}</span>
                        <span className="shrink-0 font-semibold text-slate-700 tabular-nums">
                          {row.count} farms &middot; {row.area.toFixed(2)} ha
                        </span>
                      </span>
                      <span className="block h-2 overflow-hidden rounded-xs bg-slate-100 border border-slate-200/70">
                        <span
                          className="block h-full bg-emerald-800"
                          style={{
                            width: `${Math.max(4, (row.area / Math.max(1, barangayStats[0].area)) * 100)}%`
                          }}
                        />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState text="Barangay totals will appear as farm records are added." />
            )}
          </OfficePanel>
        </div>
      </section>

      {/* Official Harvest Schedule Table */}
      <OfficePanel
        title="Incoming Rice Harvest Schedule"
        subtitle="Fields at 70% crop maturity or later, ordered by estimated harvest date"
        noPadding
        rightContent={
          <button
            type="button"
            onClick={() => onNavigateToTab('eartags')}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
          >
            <span>View Full Masterlist</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-xs border-collapse">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10.5px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-2.5">Registry ID</th>
                <th className="px-4 py-2.5">Farmer &amp; Contact</th>
                <th className="px-4 py-2.5">Barangay</th>
                <th className="px-4 py-2.5">Rice Variety</th>
                <th className="px-4 py-2.5 text-right">Area (ha)</th>
                <th className="px-4 py-2.5 text-right">Target Yield</th>
                <th className="px-4 py-2.5">Crop Stage</th>
                <th className="px-4 py-2.5">Est. Harvest</th>
                <th className="px-4 py-2.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {harvestQueue.length ? (
                harvestQueue.slice(0, 8).map(({ parcel, harvest }) => (
                  <tr key={parcel.tagNumber} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-900">
                      {parcel.tagNumber}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-semibold text-slate-900">{parcel.raiserName}</div>
                      <div className="text-[10.5px] text-slate-500">
                        {parcel.contactNumber || 'No contact recorded'}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">Brgy. {parcel.barangay}</td>
                    <td className="px-4 py-2.5 text-slate-700">
                      {parcel.variety || parcel.breed || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900 tabular-nums">
                      {areaOf(parcel).toFixed(2)} ha
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-700 tabular-nums">
                      {Number(parcel.targetYieldMt || 0).toFixed(2)} MT
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">{harvest.stage}</div>
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-xs bg-slate-200">
                        <div
                          className="h-full bg-amber-600"
                          style={{ width: `${harvest.maturity}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-medium text-slate-800 tabular-nums">
                      {parseDate(harvest.estimatedDate)?.toLocaleDateString() || 'Not estimated'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onSelectParcel(parcel)}
                        className="rounded-md border border-slate-300 bg-white hover:bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 cursor-pointer"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-500">
                    No fields are currently approaching harvest for {selectedName}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </OfficePanel>
    </main>
  );
};

function Chart({
  segments,
  total,
  style,
  unit
}: {
  segments: Segment[];
  total: number;
  style: ChartStyle;
  unit: 'farms' | 'MT';
}) {
  if (!segments.length || total === 0) {
    return <EmptyState text="Add rice farm records to generate distribution charts." />;
  }

  if (style === 'pie' || style === 'donut') {
    const gradient = `conic-gradient(${segments
      .reduce<{ css: string; cursor: number }>(
        (state, segment) => {
          const start = state.cursor;
          const end = start + (segment.value / total) * 100;
          return { css: `${state.css}${segment.color} ${start}% ${end}%,`, cursor: end };
        },
        { css: '', cursor: 0 }
      )
      .css.slice(0, -1)})`;

    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-5 sm:flex-row">
        <div
          className={`relative h-44 w-44 shrink-0 rounded-full ${
            style === 'donut' ? 'border border-slate-200' : ''
          }`}
          style={{ background: gradient }}
        >
          {style === 'donut' && (
            <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white text-center border border-slate-200">
              <strong className="text-xl font-bold text-slate-900 tabular-nums">
                {unit === 'MT' ? total.toFixed(1) : total}
              </strong>
              <span className="text-[10px] font-semibold uppercase text-slate-500">{unit}</span>
            </div>
          )}
        </div>
        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2 text-[11px] sm:max-w-xs">
          {segments.map((segment) => (
            <div key={segment.name} className="flex min-w-0 items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-xs"
                style={{ backgroundColor: segment.color }}
              />
              <span className="truncate text-slate-700">{segment.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (style === 'rank') {
    return (
      <div className="flex min-h-64 flex-col justify-center gap-2.5">
        {[...segments]
          .sort((a, b) => b.value - a.value)
          .slice(0, 9)
          .map((segment, index) => (
            <div
              key={segment.name}
              className="grid grid-cols-[24px_minmax(100px,1fr)_minmax(80px,2fr)_48px] items-center gap-2 text-[11px]"
            >
              <span className="text-right font-semibold text-slate-500 tabular-nums">{index + 1}</span>
              <span className="truncate font-medium text-slate-800">{segment.name}</span>
              <span className="h-2.5 overflow-hidden rounded-xs bg-slate-200">
                <span
                  className="block h-full"
                  style={{
                    width: `${(segment.value / Math.max(...segments.map((row) => row.value), 1)) * 100}%`,
                    backgroundColor: segment.color
                  }}
                />
              </span>
              <span className="text-right font-bold text-slate-900 tabular-nums">{segment.value}</span>
            </div>
          ))}
      </div>
    );
  }

  if (style === 'bar') {
    return (
      <div className="flex min-h-64 items-end justify-around gap-3 overflow-x-auto border-b border-slate-300 px-2 pb-1 pt-4">
        {segments.slice(0, 12).map((segment) => (
          <div key={segment.name} className="flex h-56 min-w-10 flex-col items-center justify-end gap-1.5">
            <span className="text-[10px] font-semibold text-slate-700 tabular-nums">{segment.value}</span>
            <div
              className="w-8 rounded-t-xs transition-all"
              style={{
                height: `${Math.max(4, (segment.value / Math.max(...segments.map((row) => row.value), 1)) * 80)}%`,
                backgroundColor: segment.color
              }}
            />
            <span className="max-w-16 truncate text-[10px] text-slate-600" title={segment.name}>
              {segment.name}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const points = segments.slice(0, 12).map((segment, index) => ({
    x: 20 + index * (360 / Math.max(Math.min(segments.length, 12) - 1, 1)),
    y: 120 - (segment.value / Math.max(...segments.map((row) => row.value), 1)) * 100
  }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points.at(-1)?.x || 380} 132 L ${points[0]?.x || 20} 132 Z`;

  return (
    <div className="min-h-64 pt-4">
      <svg viewBox="0 0 400 150" className="h-56 w-full" role="img" aria-label="Registry category comparison">
        <defs>
          <linearGradient id="rice-chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1b4332" stopOpacity=".28" />
            <stop offset="100%" stopColor="#1b4332" stopOpacity=".02" />
          </linearGradient>
        </defs>
        {[30, 75, 120].map((y) => (
          <line key={y} x1="12" x2="390" y1={y} y2={y} stroke="#cbd5e1" strokeDasharray="3 4" />
        ))}
        {style === 'area' && <path d={area} fill="url(#rice-chart-fill)" />}
        <path
          d={line}
          fill="none"
          stroke="#1b4332"
          strokeWidth={style === 'line' ? 2.5 : 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, index) => (
          <g key={segments[index].name}>
            <circle cx={point.x} cy={point.y} r="3.5" fill="white" stroke="#1b4332" strokeWidth="2" />
            <text x={point.x} y="146" textAnchor="middle" fontSize="8" fill="#475569">
              {segments[index].name.slice(0, 11)}
            </text>
            <title>
              {segments[index].name}: {segments[index].value}
            </title>
          </g>
        ))}
      </svg>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center bg-white px-4 py-6 text-center text-xs text-slate-500">
      {text}
    </div>
  );
}
