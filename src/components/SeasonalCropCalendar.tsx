import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Printer,
  Sparkles,
  Wheat,
  Thermometer,
  ShieldCheck,
  Compass,
  Info,
  Clock,
  Layers,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { FarmParcel } from '../types';

export type CropSeason = 'WET_SEASON' | 'DRY_SEASON' | 'ANNUAL_TIMELINE';
export type EcosystemFilter = 'ALL' | 'IRRIGATED' | 'RAINFED' | 'HYBRID' | 'UPLAND';

interface StageDetail {
  id: string;
  name: string;
  stageNameTagalog: string;
  durationDays: string;
  calendarPeriod: string;
  activeMonths: number[]; // 1-12 (Jan=1, Dec=12)
  status: 'COMPLETED' | 'ACTIVE_NOW' | 'UPCOMING' | 'CRITICAL';
  waterManagement: string;
  fertilizerAction: string;
  pestRiskAdvisory: string;
  lftRecommendation: string;
}

interface ClimateMonthData {
  month: string;
  monthNum: number;
  rainfallMm: number; // monthly mm
  sunshineHrs: number; // avg daily sunshine hrs
  tempC: number;
  typhoonRisk: 'Low' | 'Moderate' | 'High' | 'Very High';
  farmingFocus: string;
  seasonCategory: 'Wet' | 'Transition' | 'Dry-Cool' | 'Peak Monsoon';
}

const SILAGO_CLIMATE_DATA: ClimateMonthData[] = [
  { month: 'Jan', monthNum: 1, rainfallMm: 480, sunshineHrs: 4.2, tempC: 26.8, typhoonRisk: 'High', farmingFocus: 'DS Transplanting / Flood Drainage', seasonCategory: 'Peak Monsoon' },
  { month: 'Feb', monthNum: 2, rainfallMm: 310, sunshineHrs: 5.4, tempC: 27.2, typhoonRisk: 'Moderate', farmingFocus: 'DS Vegetative Tillering & Topdress', seasonCategory: 'Dry-Cool' },
  { month: 'Mar', monthNum: 3, rainfallMm: 220, sunshineHrs: 6.8, tempC: 28.5, typhoonRisk: 'Low', farmingFocus: 'DS Panicle Initiation & Water AWD', seasonCategory: 'Dry-Cool' },
  { month: 'Apr', monthNum: 4, rainfallMm: 160, sunshineHrs: 7.9, tempC: 29.6, typhoonRisk: 'Low', farmingFocus: 'DS Grain Ripening & Main Harvest', seasonCategory: 'Dry-Cool' },
  { month: 'May', monthNum: 5, rainfallMm: 190, sunshineHrs: 7.2, tempC: 30.1, typhoonRisk: 'Low', farmingFocus: 'WS Land Prep & Seed Selection', seasonCategory: 'Transition' },
  { month: 'Jun', monthNum: 6, rainfallMm: 260, sunshineHrs: 6.1, tempC: 29.2, typhoonRisk: 'Moderate', farmingFocus: 'WS Seedbed Nursery & Sowing', seasonCategory: 'Wet' },
  { month: 'Jul', monthNum: 7, rainfallMm: 280, sunshineHrs: 5.8, tempC: 28.7, typhoonRisk: 'Moderate', farmingFocus: 'WS Transplanting & Basal NPK', seasonCategory: 'Wet' },
  { month: 'Aug', monthNum: 8, rainfallMm: 240, sunshineHrs: 6.3, tempC: 28.9, typhoonRisk: 'Moderate', farmingFocus: 'WS Active Tillering & Weed Mgt', seasonCategory: 'Wet' },
  { month: 'Sep', monthNum: 9, rainfallMm: 290, sunshineHrs: 5.9, tempC: 28.5, typhoonRisk: 'Moderate', farmingFocus: 'WS Panicle Booting & Heading (Current)', seasonCategory: 'Wet' },
  { month: 'Oct', monthNum: 10, rainfallMm: 360, sunshineHrs: 5.1, tempC: 27.9, typhoonRisk: 'High', farmingFocus: 'WS Grain Filling & Early Harvest', seasonCategory: 'Wet' },
  { month: 'Nov', monthNum: 11, rainfallMm: 520, sunshineHrs: 4.0, tempC: 27.1, typhoonRisk: 'Very High', farmingFocus: 'WS Final Harvest / Pre-monsoon drying', seasonCategory: 'Peak Monsoon' },
  { month: 'Dec', monthNum: 12, rainfallMm: 610, sunshineHrs: 3.6, tempC: 26.5, typhoonRisk: 'Very High', farmingFocus: 'DS Seedbed Prep (Flood drainage)', seasonCategory: 'Peak Monsoon' },
];

const WET_SEASON_STAGES: StageDetail[] = [
  {
    id: 'ws_landprep',
    name: '1. Land Preparation & Seed Soaking',
    stageNameTagalog: 'Paghahanda ng Lupa at Pagbababad ng Binhi',
    durationDays: '21 – 25 Days',
    calendarPeriod: 'May 15 – June 10',
    activeMonths: [5, 6],
    status: 'COMPLETED',
    waterManagement: 'Puddle and level thoroughly. Maintain 2-3 cm standing water for weed suppression.',
    fertilizerAction: 'Incorporate well-decomposed organic matter and 14-14-14 basal fertilizer.',
    pestRiskAdvisory: 'Monitor Golden Apple Snail (GAS) during initial field flooding. Install wire screens at irrigation inlets.',
    lftRecommendation: 'Ensure certified seed source from DA-RFO8 depot. Test germination rate (>85%).'
  },
  {
    id: 'ws_nursery',
    name: '2. Seedling Nursery (Dapog / Wet Bed)',
    stageNameTagalog: 'Pangangalaga ng Punla sa Punlaan',
    durationDays: '15 – 21 Days',
    calendarPeriod: 'June 10 – July 05',
    activeMonths: [6, 7],
    status: 'COMPLETED',
    waterManagement: 'Keep nursery bed moist. Drain gently in the morning if excessive rainfall occurs.',
    fertilizerAction: 'Apply complete fertilizer 10 days after sowing if seedlings show yellowing.',
    pestRiskAdvisory: 'Scout for armyworms and leaf folders at the seedbed margin.',
    lftRecommendation: 'Transplant young seedlings at 18-21 days old for faster root recovery.'
  },
  {
    id: 'ws_transplant',
    name: '3. Pulling & Field Transplanting',
    stageNameTagalog: 'Pagtatanim at Paglilipat ng Punla',
    durationDays: '7 – 10 Days',
    calendarPeriod: 'July 05 – July 20',
    activeMonths: [7],
    status: 'COMPLETED',
    waterManagement: 'Maintain shallow water (1-2 cm) during planting to avoid submerging fragile seedlings.',
    fertilizerAction: 'Apply basal Nitrogen and Phosphorus within 0-5 days after transplanting (DAT).',
    pestRiskAdvisory: 'Protect roots from crab burrowing along coastal and riverbank paddies in Balagawan and Catmon.',
    lftRecommendation: 'Plant 1-2 seedlings per hill at 20cm x 20cm spacing for optimal tillering.'
  },
  {
    id: 'ws_vegetative',
    name: '4. Active Tillering & Vegetative Phase',
    stageNameTagalog: 'Pagpapatubo at Pagsasanga ng Palay',
    durationDays: '30 – 35 Days',
    calendarPeriod: 'July 20 – August 25',
    activeMonths: [7, 8],
    status: 'COMPLETED',
    waterManagement: 'Practice Alternate Wetting and Drying (AWD). Allow water to drop 15cm below soil surface before re-irrigating.',
    fertilizerAction: 'Apply 1st topdress: Urea / Ammonium Sulfate at 21-25 DAT (early tillering).',
    pestRiskAdvisory: 'Low to moderate Brown Planthopper (BPH) risk; avoid excessive chemical spraying.',
    lftRecommendation: 'Inspect field water tubes (Observation Wells) twice weekly with farmer groups.'
  },
  {
    id: 'ws_panicle',
    name: '5. Panicle Initiation & Booting (CURRENT)',
    stageNameTagalog: 'Paglilihi at Pagsisimula ng Uhay',
    durationDays: '20 – 25 Days',
    calendarPeriod: 'August 25 – September 30',
    activeMonths: [9],
    status: 'ACTIVE_NOW',
    waterManagement: 'CRITICAL: Maintain continuous 3-5 cm water depth. Water stress now causes spikelet sterility.',
    fertilizerAction: 'Apply 2nd topdress: Muriate of Potash (0-0-60) and Urea at 45-50 DAT to increase grain weight.',
    pestRiskAdvisory: 'High risk of Rice Stem Borer (Deadheart/Whitehead) and Bacterial Leaf Blight (BLB) due to monsoon rains.',
    lftRecommendation: 'ADVISORY ALERT: Ensure NIA canal gates are unobstructed to prevent sudden flood stagnation during September squalls.'
  },
  {
    id: 'ws_ripening',
    name: '6. Grain Filling & Heading',
    stageNameTagalog: 'Pamumulaklak at Paggulang ng Butil',
    durationDays: '25 – 30 Days',
    calendarPeriod: 'October 01 – October 25',
    activeMonths: [10],
    status: 'UPCOMING',
    waterManagement: 'Maintain shallow water until dough stage. Begin terminal drainage 10-14 days before harvest.',
    fertilizerAction: 'Foliar micronutrients (Zinc/Boron) if deficiency noticed; cease ground nitrogen.',
    pestRiskAdvisory: 'Guarding against rice birds (Maya) and rodents. Set up eco-friendly reflective flags.',
    lftRecommendation: 'Advise farmers to arrange mechanical harvester booking with MAO Machinery Pool early.'
  },
  {
    id: 'ws_harvest',
    name: '7. Main Crop Harvesting & Solar/Mechanical Drying',
    stageNameTagalog: 'Pag-aani at Pagpapatuyo ng Palay',
    durationDays: '15 – 20 Days',
    calendarPeriod: 'October 25 – November 20',
    activeMonths: [10, 11],
    status: 'CRITICAL',
    waterManagement: 'Fields completely dry for firm soil footing and combine harvester transit.',
    fertilizerAction: 'Post-harvest straw incorporation to recycle potassium and organic carbon.',
    pestRiskAdvisory: 'Store palay in hermetic bags to prevent storage weevil and mold infestation before heavy Nov rains.',
    lftRecommendation: 'URGENT: Coordinate with LGU Central Mechanical Grain Dryer Facility before peak December rainfall.'
  }
];

const DRY_SEASON_STAGES: StageDetail[] = [
  {
    id: 'ds_landprep',
    name: '1. DS Land Preparation & Nursery Sowing',
    stageNameTagalog: 'Paghahanda ng Lupa at Punlaan sa Tag-araw',
    durationDays: '21 – 25 Days',
    calendarPeriod: 'December 01 – December 25',
    activeMonths: [12],
    status: 'UPCOMING',
    waterManagement: 'Drain excess monsoon water through field peripheral ditches.',
    fertilizerAction: 'Apply decomposed compost and basal 14-14-14.',
    pestRiskAdvisory: 'Protect nurseries against intense December rains using transparent plastic rain-shelters.',
    lftRecommendation: 'Use certified inbred NSIC Rc 222 or hybrid Mestiso 20 for maximum dry season solar yield.'
  },
  {
    id: 'ds_transplant',
    name: '2. DS Transplanting & Early Establishment',
    stageNameTagalog: 'Paglilipat-Tanim at Unang Patubig',
    durationDays: '10 – 15 Days',
    calendarPeriod: 'December 26 – January 15',
    activeMonths: [12, 1],
    status: 'UPCOMING',
    waterManagement: 'Ensure adequate drainage during heavy Amihan rains; prevent seedling washout.',
    fertilizerAction: 'Basal fertilizer application at planting.',
    pestRiskAdvisory: 'Monitor snail migration from swollen irrigation canals.',
    lftRecommendation: 'Stagger planting synchronously within each NIA irrigation cluster.'
  },
  {
    id: 'ds_vegetative',
    name: '3. DS Vegetative Tillering & Nitrogen Management',
    stageNameTagalog: 'Yugto ng Pagsasanga at Paglalagay ng Pataba',
    durationDays: '30 – 35 Days',
    calendarPeriod: 'January 15 – February 20',
    activeMonths: [1, 2],
    status: 'UPCOMING',
    waterManagement: 'Shift to Alternate Wetting and Drying (AWD) as weather shifts to sunnier days.',
    fertilizerAction: 'First topdress Urea + Ammonium Sulfate at 21 DAT.',
    pestRiskAdvisory: 'Inspect for Rice Blast in cooler dawn hours.',
    lftRecommendation: 'High solar radiation in February boosts photosynthetic efficiency.'
  },
  {
    id: 'ds_reproductive',
    name: '4. DS Panicle Initiation & Flowering',
    stageNameTagalog: 'Pagbubuntis at Pamumulaklak',
    durationDays: '25 – 30 Days',
    calendarPeriod: 'February 20 – March 20',
    activeMonths: [2, 3],
    status: 'UPCOMING',
    waterManagement: 'Keep continuous 3-5 cm ponded water depth for flower pollination.',
    fertilizerAction: 'Muriate of Potash (0-0-60) topdress at early booting.',
    pestRiskAdvisory: 'Monitor for Green Leafhopper (GLH) and Tungro virus vectors.',
    lftRecommendation: 'Optimal temperature and clear sunny days give potential >6.0 MT/ha.'
  },
  {
    id: 'ds_harvest',
    name: '5. DS Grain Ripening & Golden Harvest',
    stageNameTagalog: 'Pag-aani sa Tag-araw at Pagpapatuyo sa Araw',
    durationDays: '20 – 25 Days',
    calendarPeriod: 'March 20 – April 25',
    activeMonths: [3, 4],
    status: 'UPCOMING',
    waterManagement: 'Terminal drainage 10 days before harvest.',
    fertilizerAction: 'None. Field cleaning and straw management.',
    pestRiskAdvisory: 'Low pest risk. Excellent sunshine for multi-day solar pavement drying.',
    lftRecommendation: 'Highest grain milling recovery (68-70%) achieved during this harvest window.'
  }
];

export const SeasonalCropCalendar: React.FC = () => {
  const [selectedSeason, setSelectedSeason] = useState<CropSeason>('WET_SEASON');
  const [selectedEcosystem, setSelectedEcosystem] = useState<EcosystemFilter>('ALL');
  const [selectedStageId, setSelectedStageId] = useState<string>('ws_panicle');
  const [showPrintModal, setShowPrintModal] = useState(false);

  const currentMonthNum = 9; // September (2026-09)
  const currentMonthName = 'September';

  const activeStages = useMemo(() => {
    if (selectedSeason === 'WET_SEASON') return WET_SEASON_STAGES;
    if (selectedSeason === 'DRY_SEASON') return DRY_SEASON_STAGES;
    return [...WET_SEASON_STAGES, ...DRY_SEASON_STAGES];
  }, [selectedSeason]);

  const selectedStage = useMemo(() => {
    return (
      activeStages.find((s) => s.id === selectedStageId) ||
      activeStages[0] ||
      WET_SEASON_STAGES[4]
    );
  }, [activeStages, selectedStageId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6 text-slate-800">
      {/* 1. Header Banner & Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10.5px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Municipal Agro-Climate Advisory</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10.5px] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Current Cycle: September 2026 (Wet Season)</span>
            </span>
          </div>

          <h3 className="font-serif font-black text-xl sm:text-2xl text-slate-900 tracking-tight flex items-center gap-2">
            <span>Seasonal Crop Calendar &amp; Planting Cycles</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
            Synchronized rice cropping schedules calibrated against Silago's Type II/IV climate data. Enables Local Farmer Technicians (LFTs) and MAO officers to advise farmers on optimal sowing, nutrient timing, and flood risk mitigation.
          </p>
        </div>

        {/* Action button & Season switcher */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSelectedSeason('WET_SEASON');
                setSelectedStageId('ws_panicle');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedSeason === 'WET_SEASON'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Wet Season (Main)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedSeason('DRY_SEASON');
                setSelectedStageId('ds_landprep');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedSeason === 'DRY_SEASON'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dry Season (2nd)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSeason('ANNUAL_TIMELINE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedSeason === 'ANNUAL_TIMELINE'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12-Mo Timeline
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Print Municipal Crop Calendar Advisory for farmer distribution"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Print Advisory</span>
          </button>
        </div>
      </div>

      {/* 2. Municipal Climate Matrix (Rainfall & Sunshine Bar Chart Overlay) */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <CloudRain className="w-4 h-4 text-blue-600" />
              <span>Silago Monthly Precipitation &amp; Solar Radiation Profile</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Average 10-year meteorological telemetry from Silago AWS station (Region VIII)
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-600 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 bg-blue-500 rounded-sm inline-block" />
              <span>Rainfall (mm)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2.5 bg-amber-400 rounded-sm inline-block" />
              <span>Daily Sun (hrs)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-rose-500 rounded-full inline-block animate-ping" />
              <span className="font-bold text-rose-700">Monsoon Alert</span>
            </span>
          </div>
        </div>

        {/* 12-Month Interactive Matrix Bars */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2">
          {SILAGO_CLIMATE_DATA.map((item) => {
            const isCurrentMonth = item.monthNum === currentMonthNum;
            const heightPct = Math.min(100, Math.round((item.rainfallMm / 610) * 100));

            return (
              <div
                key={item.month}
                className={`flex flex-col items-center justify-between p-2 rounded-xl transition border text-center ${
                  isCurrentMonth
                    ? 'bg-blue-100/90 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Month Name */}
                <span
                  className={`text-[11px] font-black uppercase ${
                    isCurrentMonth ? 'text-blue-700 font-extrabold' : 'text-slate-700'
                  }`}
                >
                  {item.month}
                </span>

                {/* Vertical Bar representation */}
                <div className="w-full h-16 bg-slate-100 rounded-lg flex flex-col justify-end p-0.5 my-1.5 relative overflow-hidden">
                  <div
                    className={`w-full rounded-md transition-all duration-300 ${
                      item.rainfallMm > 450
                        ? 'bg-indigo-600'
                        : item.rainfallMm > 300
                        ? 'bg-blue-500'
                        : 'bg-sky-400'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${item.month}: ${item.rainfallMm}mm rainfall`}
                  />
                  {isCurrentMonth && (
                    <div className="absolute inset-0 border-2 border-blue-600 rounded-lg pointer-events-none" />
                  )}
                </div>

                {/* Rainfall & Sunshine details */}
                <span className="text-[10px] font-mono font-bold text-slate-800 leading-none">
                  {item.rainfallMm}mm
                </span>
                <span className="text-[9.5px] text-amber-600 font-semibold mt-0.5 flex items-center gap-0.5 justify-center">
                  <Sun className="w-2.5 h-2.5" />
                  <span>{item.sunshineHrs}h</span>
                </span>

                {/* Risk Tag */}
                <span
                  className={`text-[8.5px] font-extrabold px-1 rounded mt-1 block truncate w-full ${
                    item.typhoonRisk === 'Very High'
                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                      : item.typhoonRisk === 'High'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.typhoonRisk === 'Very High' ? 'Flood' : item.typhoonRisk}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Crop Growth Stages Interactive Timeline */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Wheat className="w-4 h-4 text-emerald-600" />
              <span>
                {selectedSeason === 'WET_SEASON'
                  ? 'Main Wet Season Rice Stages (May – November)'
                  : selectedSeason === 'DRY_SEASON'
                  ? 'Dry Season Rice Stages (December – April)'
                  : 'Complete 12-Month Agro-Ecological Timeline'}
              </span>
            </h4>
            <p className="text-xs text-slate-500">
              Click any stage below to inspect technical agronomic protocols, nutrient splits, and LFT guidance.
            </p>
          </div>

          {/* Ecosystem Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Ecosystem:</span>
            <select
              value={selectedEcosystem}
              onChange={(e) => setSelectedEcosystem(e.target.value as EcosystemFilter)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">🌱 All Rice Ecosystems</option>
              <option value="IRRIGATED">💧 Irrigated Lowland (NIA)</option>
              <option value="RAINFED">🌧️ Rainfed Lowland</option>
              <option value="HYBRID">✨ Hybrid Seed Fields</option>
              <option value="UPLAND">⛰️ Upland Traditional</option>
            </select>
          </div>
        </div>

        {/* Stage Timeline Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {activeStages.map((stage, idx) => {
            const isSelected = selectedStage.id === stage.id;
            const isCurrent = stage.status === 'ACTIVE_NOW';
            const isCritical = stage.status === 'CRITICAL';

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer relative flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/30 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <span className="font-bold text-xs text-slate-900 leading-snug">
                    {stage.name}
                  </span>
                  {isCurrent ? (
                    <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white font-extrabold text-[9px] uppercase tracking-wider animate-pulse shrink-0">
                      Active
                    </span>
                  ) : isCritical ? (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-extrabold text-[9px] uppercase tracking-wider shrink-0">
                      Critical
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      #{idx + 1}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    🗓️ {stage.calendarPeriod}
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans italic">
                    {stage.stageNameTagalog}
                  </span>
                </div>

                <div className="pt-1 flex items-center justify-between border-t border-slate-100 text-[10.5px]">
                  <span className="text-slate-500 font-medium">{stage.durationDays}</span>
                  <span className="text-blue-600 font-bold flex items-center gap-0.5">
                    <span>Inspect</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Deep-Dive Stage Detail & LFT Technical Advisory Card */}
      {selectedStage && (
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3.5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-400/20 text-blue-200 border border-blue-400/30 text-[10px] font-extrabold uppercase">
                  Technical LFT Protocol
                </span>
                <span className="text-xs text-blue-200 font-medium">
                  {selectedStage.calendarPeriod} ({selectedStage.durationDays})
                </span>
              </div>
              <h4 className="font-serif font-black text-lg sm:text-xl text-white mt-1">
                {selectedStage.name}
              </h4>
              <p className="text-xs text-blue-100 italic">
                {selectedStage.stageNameTagalog}
              </p>
            </div>

            <div className="bg-white/10 border border-white/15 px-3 py-2 rounded-xl shrink-0 text-center">
              <span className="text-[10px] text-blue-200 block uppercase font-bold">Recommended Variety</span>
              <span className="text-xs font-black text-amber-300">
                NSIC Rc 222 / Rc 182 Submarino
              </span>
            </div>
          </div>

          {/* 4 Technical Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Box 1: Water Level & Irrigation */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px] uppercase tracking-wider">
                <Droplets className="w-3.5 h-3.5" />
                <span>Water Management (AWD)</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {selectedStage.waterManagement}
              </p>
            </div>

            {/* Box 2: Fertilizer & Nutrient Timing */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-[11px] uppercase tracking-wider">
                <Wheat className="w-3.5 h-3.5" />
                <span>Fertilizer Split Application</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {selectedStage.fertilizerAction}
              </p>
            </div>

            {/* Box 3: Pest & Disease Surveillance */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold text-[11px] uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Pest &amp; Disease Warning</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed">
                {selectedStage.pestRiskAdvisory}
              </p>
            </div>

            {/* Box 4: LFT Barangay Action Guidance */}
            <div className="bg-white/10 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 space-y-1.5">
              <div className="flex items-center gap-1.5 text-amber-300 font-bold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>LFT Field Action Plan</span>
              </div>
              <p className="text-slate-200 text-xs leading-relaxed font-medium">
                {selectedStage.lftRecommendation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 5. Recommended Palay Seed Varieties for Silago Agro-Ecological Zones */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>DA Recommended Certified Rice Varieties for Silago</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Approved varieties based on Southern Leyte climate resilience and grain quality
            </p>
          </div>
          <span className="text-[10.5px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg">
            PhilRice RFO-8
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold text-[10.5px] uppercase">
                <th className="py-2 px-2.5">Variety Name</th>
                <th className="py-2 px-2.5">Ecosystem &amp; Maturity</th>
                <th className="py-2 px-2.5">Avg Yield (MT/ha)</th>
                <th className="py-2 px-2.5">Climate Resilience Traits</th>
                <th className="py-2 px-2.5">Target Silago Barangays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              <tr className="hover:bg-white transition">
                <td className="py-2.5 px-2.5 font-bold text-blue-700">NSIC Rc 222 (Tubigan 21)</td>
                <td className="py-2.5 px-2.5">Irrigated / Rainfed · 106-114 days</td>
                <td className="py-2.5 px-2.5 font-mono font-bold text-emerald-600">6.1 – 10.0 MT</td>
                <td className="py-2.5 px-2.5">High lodging resistance, moderate BLB tolerance</td>
                <td className="py-2.5 px-2.5 text-slate-600">Poblacion 1 &amp; 2, Hingatungan, Lagoma</td>
              </tr>
              <tr className="hover:bg-white transition">
                <td className="py-2.5 px-2.5 font-bold text-blue-700">NSIC Rc 182 (Submarino 1)</td>
                <td className="py-2.5 px-2.5">Flood-prone Lowland · 118 days</td>
                <td className="py-2.5 px-2.5 font-mono font-bold text-emerald-600">4.8 – 7.2 MT</td>
                <td className="py-2.5 px-2.5 text-blue-600 font-semibold">Withstands 14 days complete submerged flooding</td>
                <td className="py-2.5 px-2.5 text-slate-600">Balagawan, Catmon, Sap-ang, Tuba-on</td>
              </tr>
              <tr className="hover:bg-white transition">
                <td className="py-2.5 px-2.5 font-bold text-blue-700">Mestiso 20 (M20 Hybrid)</td>
                <td className="py-2.5 px-2.5">Intensive Irrigated · 110 days</td>
                <td className="py-2.5 px-2.5 font-mono font-bold text-emerald-600">7.5 – 11.2 MT</td>
                <td className="py-2.5 px-2.5">High tillering, superior milling &amp; eating quality</td>
                <td className="py-2.5 px-2.5 text-slate-600">San Isidro, Sutrina, Poblacion District 1</td>
              </tr>
              <tr className="hover:bg-white transition">
                <td className="py-2.5 px-2.5 font-bold text-blue-700">NSIC Rc 480 (Upland)</td>
                <td className="py-2.5 px-2.5">Upland / Terrace · 105 days</td>
                <td className="py-2.5 px-2.5 font-mono font-bold text-emerald-600">3.5 – 5.0 MT</td>
                <td className="py-2.5 px-2.5">Drought-tolerant, adapted to sloping acidic soils</td>
                <td className="py-2.5 px-2.5 text-slate-600">Salvacion, Katipunan, Tubod, Imelda</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
