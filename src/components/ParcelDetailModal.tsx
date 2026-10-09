import React, { useState, useMemo } from 'react';
import { FarmParcel, SeasonalProductionRecord } from '../types';
import { getFarmerPhoto, getLandPhoto } from '../data/photos';
import { calculateCropGrowthStage } from '../data/riceVarieties';
import { SafeImage } from './SafeImage';
import {
  X,
  MapPin,
  User,
  Wheat,
  Droplets,
  Calendar,
  ShieldCheck,
  Printer,
  Edit2,
  Share2,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  PlusCircle,
  TrendingUp,
  Scale,
  History,
  Coins
} from 'lucide-react';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, OfficialSealsTrio } from './Seals';
import { SeasonalProductionModal } from './SeasonalProductionModal';

export type ParcelModalTab = 'profile' | 'harvest_history' | 'certificate';

interface ParcelDetailModalProps {
  parcel: FarmParcel | null;
  initialTab?: ParcelModalTab;
  onClose: () => void;
  onEdit?: (parcel: FarmParcel) => void;
  onDelete?: (tagNumber: string) => void;
}

export const ParcelDetailModal: React.FC<ParcelDetailModalProps> = ({
  parcel,
  initialTab = 'profile',
  onClose,
  onEdit,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<ParcelModalTab>(initialTab);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [seasonalModalOpen, setSeasonalModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SeasonalProductionRecord | null>(null);

  if (!parcel) return null;

  const farmerPhoto = getFarmerPhoto(parcel);
  const landPhoto = getLandPhoto(parcel);

  const seasonalRecords = parcel.seasonalRecords || [];

  // Summary harvest stats calculations across all cropping seasons
  const totalHarvestMt = useMemo(() => {
    return seasonalRecords.reduce((sum, r) => sum + (r.actualProductionVolumeMt || r.yieldMetricTons || 0), 0);
  }, [seasonalRecords]);

  const totalHarvestBags = useMemo(() => {
    return seasonalRecords.reduce((sum, r) => {
      const bags = r.yieldBags ?? r.actualProductionBags ?? Math.round((r.actualProductionVolumeMt || 0) * 20);
      return sum + bags;
    }, 0);
  }, [seasonalRecords]);

  const avgYieldMt = useMemo(() => {
    if (seasonalRecords.length === 0) return parcel.targetYieldMt || 0;
    const totalYield = seasonalRecords.reduce((sum, r) => sum + (r.yieldMtPerHa || r.yieldMetricTons || 0), 0);
    return Number((totalYield / seasonalRecords.length).toFixed(2));
  }, [seasonalRecords, parcel.targetYieldMt]);

  const totalGrossIncome = useMemo(() => {
    return seasonalRecords.reduce((sum, r) => {
      const bags = r.yieldBags ?? r.actualProductionBags ?? Math.round((r.actualProductionVolumeMt || 0) * 20);
      return sum + (r.grossIncome ?? (bags * 1150));
    }, 0);
  }, [seasonalRecords]);

  // Automatically calculate crop growth stage, elapsed days (DAP), and maturity percentage
  const growthCalc = calculateCropGrowthStage(parcel.plantingDate || '', parcel.breed);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="bg-[#0B1E38] text-white p-5 relative shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-md">
                  {parcel.tagNumber}
                </span>
                <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                  {parcel.swineNameOrId}
                </span>
                <span className="text-[10px] font-bold text-cyan-300">
                  {parcel.syncStatus}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-1.5">
                {parcel.raiserName}
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {parcel.address}
              </p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 sm:px-6 pt-2 bg-[#0B1E38] border-t border-slate-700/60 overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-2 font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>Profile &amp; Land Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('harvest_history')}
            className={`px-3.5 py-2 font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
              activeTab === 'harvest_history'
                ? 'bg-white text-emerald-950 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Wheat className="w-3.5 h-3.5 text-emerald-500" />
            <span>🌾 Seasonal Harvest History</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
              activeTab === 'harvest_history' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-700 text-slate-300'
            }`}>
              {seasonalRecords.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('certificate')}
            className={`px-3.5 py-2 font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
              activeTab === 'certificate'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>📜 Certificate</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Certificate View */}
          {activeTab === 'certificate' ? (
            <div className="p-6 bg-[#FCFBF7] border-2 border-amber-300/80 rounded-2xl space-y-5 text-center shadow-inner relative">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-800 underline font-sans cursor-pointer"
              >
                Back to Dossier
              </button>

              <OfficialSealsTrio className="justify-center" />

              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-sans font-bold">
                  MUNICIPALITY OF SILAGO • DEPARTMENT OF AGRICULTURE
                </p>
                <h3 className="text-lg font-serif font-bold text-[#0B2545] uppercase tracking-wide mt-0.5">
                  Official Certificate of Rice Parcel Georeferencing
                </h3>
                <p className="text-[11px] text-slate-500 italic">
                  Registry System for Basic Sectors in Agriculture (RSBSA) Validation
                </p>
              </div>

              <div className="border-t border-b border-amber-200/80 py-4 text-left text-xs space-y-2 font-sans">
                <p>
                  This certifies that the palay cultivation parcel designated under Tag ID{' '}
                  <strong className="font-mono text-emerald-800">{parcel.tagNumber}</strong>,
                  registered to farmer-tiller <strong className="text-slate-900">{parcel.raiserName}</strong>,
                  located at <strong>{parcel.address}</strong>, has been officially georeferenced and field-surveyed.
                </p>
                <div className="grid grid-cols-2 gap-2 bg-white/70 p-3 rounded-xl border border-amber-200">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Cultivated Rice Variety:</span>
                    <strong className="text-slate-800">{parcel.breed}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Surveyed Hectarage:</span>
                    <strong className="text-emerald-700">{parcel.weightKg} Hectares</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Tenurial Classification:</span>
                    <strong className="text-slate-800">{parcel.sex}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Agro-Ecosystem / NIA:</span>
                    <strong className="text-slate-800">{parcel.purpose}</strong>
                  </div>
                  {parcel.irrigationAssociation && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500 block">Irrigation Association (IA):</span>
                      <strong className="text-teal-800">{parcel.irrigationAssociation}</strong>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] text-slate-500 block">Survey Coordinates:</span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {parcel.lat.toFixed(5)}, {parcel.lng.toFixed(5)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Insurance Status:</span>
                    <strong className="text-blue-700">{parcel.vaccinationStatus}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-around pt-2 text-[11px]">
                <div className="text-center">
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <strong className="block text-slate-800">{parcel.focalPerson}</strong>
                  <span className="text-slate-500 text-[10px]">Assigned Barangay LFT Officer</span>
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-700 mx-auto mb-1"></div>
                  <strong className="block text-slate-800">Engr. Arnaldo M. Valdez</strong>
                  <span className="text-slate-500 text-[10px]">Municipal Agriculturist / MAO Silago</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Official Certificate
                </button>
              </div>
            </div>
          ) : activeTab === 'harvest_history' ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-linear-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      <History className="w-4 h-4" />
                    </span>
                    <h3 className="text-base font-bold text-white">
                      🌾 Seasonal Harvest History &amp; Records
                    </h3>
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    Kasaysayan sa mga nakalabayng ani, barayti sa binhi, ug abot (yield) ni <strong>{parcel.raiserName}</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRecord(null);
                    setSeasonalModalOpen(true);
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-md hover:shadow-lg shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Log Harvest for this Season</span>
                </button>
              </div>

              {/* Cumulative Metrics Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                    Total Harvest
                  </span>
                  <div className="text-base font-extrabold font-mono text-emerald-950 mt-0.5">
                    {totalHarvestBags.toLocaleString()} <span className="text-[11px] font-sans font-medium text-emerald-700">Cavans</span>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-mono">
                    {totalHarvestMt.toFixed(2)} MT total
                  </span>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block tracking-wider">
                    Total Volume
                  </span>
                  <div className="text-base font-extrabold font-mono text-blue-950 mt-0.5">
                    {totalHarvestMt.toFixed(2)} <span className="text-[11px] font-sans font-medium text-blue-700">MT</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-mono">
                    {parcel.weightKg ? (totalHarvestMt / parcel.weightKg).toFixed(1) : 0} MT/ha total
                  </span>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block tracking-wider">
                    Average Yield
                  </span>
                  <div className="text-base font-extrabold font-mono text-amber-950 mt-0.5">
                    {avgYieldMt.toFixed(2)} <span className="text-[11px] font-sans font-medium text-amber-700">MT/ha</span>
                  </div>
                  <span className="text-[10px] text-amber-700">
                    Across {seasonalRecords.length} recorded season{seasonalRecords.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="bg-purple-50/80 border border-purple-200 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-purple-800 uppercase block tracking-wider">
                    Gross Income (Est.)
                  </span>
                  <div className="text-base font-extrabold font-mono text-purple-950 mt-0.5">
                    ₱{totalGrossIncome.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-purple-700">
                    @ ₱1,150 / 50kg bag
                  </span>
                </div>
              </div>

              {/* Breakdown Table */}
              {seasonalRecords.length === 0 ? (
                <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3">
                  <Wheat className="w-10 h-10 text-slate-400 mx-auto" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-700">Walay Narekord nga Ani / No Harvest Records Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      Wala pay nalista nga record sa ani para niining mag-uuma. I-click ang buton sa ubos aron magdugang og bag-ong seasonal harvest record.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRecord(null);
                      setSeasonalModalOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Log Harvest for this Season</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-3.5 py-3">Cropping Season</th>
                        <th className="px-3.5 py-3">Seed Variety Planted</th>
                        <th className="px-3.5 py-3">Harvest Date</th>
                        <th className="px-3.5 py-3 text-right">Yield (Cavans &amp; MT)</th>
                        <th className="px-3.5 py-3 text-right">Yield / Ha</th>
                        <th className="px-3.5 py-3 text-right">Gross Income</th>
                        <th className="px-3.5 py-3 text-center">Status</th>
                        <th className="px-3.5 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {seasonalRecords.map((rec) => {
                        const seasonLabel = rec.seasonName || rec.season.split('(')[0].trim();
                        const bags = rec.yieldBags ?? rec.actualProductionBags ?? Math.round((rec.actualProductionVolumeMt || 0) * 20);
                        const volumeMt = rec.actualProductionVolumeMt || (rec.yieldMetricTons ? rec.yieldMetricTons * (parcel.weightKg || 1) : 0);
                        const yieldMt = rec.yieldMtPerHa ?? rec.yieldMetricTons ?? (parcel.weightKg ? volumeMt / parcel.weightKg : 0);
                        const income = rec.grossIncome ?? (bags * 1150);
                        const dateLabel = rec.harvestDate || rec.actualHarvestDate || rec.estimatedHarvestDate || '-';
                        const statusVal = rec.status || (rec.productionStatus === 'Standing Crop' ? 'Ongoing' : rec.productionStatus === 'Crop Failure / Damaged' ? 'Damaged' : 'Harvested');

                        return (
                          <tr key={rec.id} className="hover:bg-emerald-50/40 transition">
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span className="font-bold text-slate-900 block">{seasonLabel}</span>
                              <span className="text-[10px] text-slate-500 font-mono">LFT: {rec.lftOfficerName || 'MAO Assigned'}</span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap">
                              <span className="font-bold text-emerald-950 block">{rec.varietyPlanted || rec.seedVariety}</span>
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 font-mono text-slate-600">
                                {rec.seedType || 'INBRED'}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap text-[11px] font-mono text-slate-700">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                <span>{dateLabel}</span>
                              </div>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap text-right font-mono">
                              <span className="font-extrabold text-slate-900 block">{bags} Bags</span>
                              <span className="text-[10.5px] text-slate-500">({volumeMt.toFixed(2)} MT)</span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap text-right font-mono">
                              <span className="font-black text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                                {yieldMt.toFixed(2)} MT/ha
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap text-right font-mono">
                              <span className="font-bold text-slate-900">₱{income.toLocaleString()}</span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap text-center">
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                  statusVal === 'Harvested' || rec.productionStatus === 'Harvest Completed'
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : statusVal === 'Damaged' || rec.productionStatus === 'Crop Failure / Damaged'
                                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                                    : 'bg-amber-100 text-amber-900 border-amber-300'
                                }`}
                              >
                                {statusVal}
                              </span>
                            </td>
                            <td className="px-3.5 py-3 whitespace-nowrap text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingRecord(rec);
                                  setSeasonalModalOpen(true);
                                }}
                                className="px-2.5 py-1 text-slate-700 hover:text-emerald-800 hover:bg-slate-100 rounded-md text-[11px] font-bold transition cursor-pointer border border-slate-200"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Dual Photo Gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
                  <div className="relative h-44 bg-slate-200">
                    <SafeImage
                      src={landPhoto}
                      alt="Rice Farm Parcel Plot"
                      fallbackType="field"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                      Field Parcel Survey
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Agro-Ecosystem Plot
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">{parcel.purpose}</h5>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
                  <div className="relative h-44 bg-slate-200">
                    <SafeImage
                      src={farmerPhoto}
                      alt="Farmer Tiller"
                      fallbackType="farmer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md font-mono">
                      Farmer-Tiller Identity
                    </span>
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Registered Tiller / Tenurial Status
                    </span>
                    <h5 className="text-xs font-bold text-slate-800">{parcel.sex}</h5>
                  </div>
                </div>
              </div>

              {/* Grid of Key Properties */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Rice Variety</span>
                  <strong className="text-sm font-bold text-emerald-800 block truncate">
                    {parcel.breed}
                  </strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Surveyed Area</span>
                  <strong className="text-sm font-bold text-slate-900 block">
                    {parcel.weightKg} Hectares
                  </strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Projected Yield</span>
                  <strong className="text-sm font-bold text-slate-900 block">
                    {parcel.targetYieldMt} MT/ha
                  </strong>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Crop Stage</span>
                  <span className="text-xs font-bold text-amber-700 block truncate">
                    {parcel.healthStatus} ({parcel.ageMonths} days)
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Insurance</span>
                  <span className="text-xs font-semibold text-blue-700 block truncate">
                    {parcel.vaccinationStatus}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned LFT</span>
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {parcel.focalPerson}
                  </span>
                </div>
                {parcel.irrigationAssociation && (
                  <div className="bg-teal-50/70 border border-teal-200 p-3 rounded-xl sm:col-span-3">
                    <span className="text-[10px] uppercase font-bold text-teal-800 block">Irrigation Association (IA)</span>
                    <span className="text-xs font-bold text-teal-950 block">
                      {parcel.irrigationAssociation}
                    </span>
                  </div>
                )}
              </div>

              {/* AUTOMATED PHENOLOGY & MATURITY CARD */}
              <div className="p-4 bg-amber-50/60 border border-amber-300 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      ⚡
                    </span>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                        Automated Crop Stage &amp; Maturity Detection
                      </h4>
                      <p className="text-[11px] text-amber-800">
                        Calculated from seed variety <strong>{parcel.breed}</strong> and planting date <strong>{parcel.plantingDate || '2026-08-10'}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 self-start sm:self-auto">
                    Live Calculation
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Elapsed Days</span>
                    <span className="text-sm font-black font-mono text-emerald-800">
                      {growthCalc.dap >= 0 ? `${growthCalc.dap} Days (DAP)` : `${Math.abs(growthCalc.dap)}d to Sowing`}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Maturity Status</span>
                    <span className="text-sm font-black font-mono text-amber-900">
                      {growthCalc.percentageMaturity}% ({growthCalc.dap > 0 ? growthCalc.dap : 0}/{growthCalc.maturityDays}d)
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Est. Harvest</span>
                    <span className="text-sm font-black font-mono text-indigo-900">
                      {growthCalc.estimatedHarvestDate}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between text-[10.5px] font-bold text-slate-600 mb-1">
                    <span>Stage: <span className="text-emerald-800 font-extrabold">{growthCalc.stage}</span></span>
                    <span>{growthCalc.percentageMaturity}% of {growthCalc.maturityDays} days maturity</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${growthCalc.percentageMaturity}%` }}
                    />
                  </div>
                </div>

                <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${growthCalc.colorClass}`}>
                  <strong>Agronomic Phase:</strong> {growthCalc.phase} — {growthCalc.description}
                </div>
              </div>

              {/* Seasonal Production Summary Preview */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Wheat className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-950">
                        Seasonal Harvest History ({seasonalRecords.length} Cropping Seasons)
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Total Recorded: <strong>{totalHarvestBags.toLocaleString()} Cavans</strong> ({totalHarvestMt.toFixed(2)} MT) &bull; Avg Yield: <strong>{avgYieldMt.toFixed(2)} MT/ha</strong>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('harvest_history')}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>View Full Harvest History</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingRecord(null);
                        setSeasonalModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>+ Log Harvest</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* GPS Coordinates Bar */}
              <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Lat: {parcel.lat.toFixed(5)}, Lng: {parcel.lng.toFixed(5)}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 uppercase bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {parcel.biosecurityScore}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Delete Confirmation Banner inside Modal */}
        {confirmDelete && (
          <div className="bg-rose-50 border-t border-b border-rose-200 p-4 shrink-0 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-rose-900">
                  Confirm Delete Farm Registration
                </h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  Are you sure you want to permanently delete registration <strong>{parcel.tagNumber}</strong> for <strong>{parcel.raiserName}</strong>? This action cannot be undone.
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDelete?.(parcel.tagNumber);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition cursor-pointer shadow-xs"
                  >
                    Yes, Delete Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {activeTab !== 'harvest_history' && (
              <button
                type="button"
                onClick={() => setActiveTab('harvest_history')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Wheat className="w-4 h-4" />
                Harvest History ({seasonalRecords.length})
              </button>
            )}
            {activeTab !== 'certificate' && (
              <button
                type="button"
                onClick={() => setActiveTab('certificate')}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                View Certificate
              </button>
            )}
            {activeTab !== 'profile' && (
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-3.5 h-3.5 text-blue-600" />
                Profile Details
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(parcel);
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                Edit Registration
              </button>
            )}
            {onDelete && !confirmDelete && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                title="Delete this farm registration"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Delete Registration
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* LFT Seasonal Production Modal */}
      {seasonalModalOpen && (
        <SeasonalProductionModal
          isOpen={seasonalModalOpen}
          onClose={() => {
            setSeasonalModalOpen(false);
            setEditingRecord(null);
          }}
          farmer={parcel}
          existingRecord={editingRecord}
        />
      )}
    </div>
  );
};
