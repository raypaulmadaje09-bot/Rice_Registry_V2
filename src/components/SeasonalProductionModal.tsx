import React, { useState, useEffect, useMemo } from 'react';
import { FarmParcel, SeasonalProductionRecord } from '../types';
import { useApp } from '../context/AppContext';
import { computeEstimatedHarvestDate, computeYieldMtPerHa, CROPPING_SEASONS } from '../data/seasonalProduction';
import { getAssignedLftForBarangay } from '../data/barangays';
import { calculateCropGrowthStage } from '../data/riceVarieties';
import {
  X,
  Save,
  Calendar,
  Wheat,
  Scale,
  Sparkles,
  AlertCircle,
  Clock,
  User,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface SeasonalProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  farmer: FarmParcel;
  existingRecord?: SeasonalProductionRecord | null;
  defaultSeason?: string;
}

export const SeasonalProductionModal: React.FC<SeasonalProductionModalProps> = ({
  isOpen,
  onClose,
  farmer,
  existingRecord,
  defaultSeason
}) => {
  const {
    varieties,
    seasons,
    activeSeason,
    addSeasonalRecord,
    updateSeasonalRecord,
    deleteSeasonalRecord,
    currentUser
  } = useApp();

  const [selectedSeason, setSelectedSeason] = useState<string>(
    defaultSeason || existingRecord?.season || activeSeason
  );
  const [seedVariety, setSeedVariety] = useState<string>(
    existingRecord?.seedVariety || farmer.breed || 'NSIC Rc 222'
  );
  const [seedType, setSeedType] = useState<'INBRED' | 'HYBRID' | 'UNKNOWN'>(
    existingRecord?.seedType || (farmer.seedType as any) || 'INBRED'
  );
  const [plantingDate, setPlantingDate] = useState<string>(
    existingRecord?.plantingDate || farmer.plantingDate || new Date().toISOString().split('T')[0]
  );
  const [estimatedHarvestDate, setEstimatedHarvestDate] = useState<string>(
    existingRecord?.estimatedHarvestDate || ''
  );
  const [actualHarvestDate, setActualHarvestDate] = useState<string>(
    existingRecord?.actualHarvestDate || ''
  );
  const [actualVolumeMt, setActualVolumeMt] = useState<number>(
    existingRecord?.actualProductionVolumeMt || Number(((farmer.weightKg || 1) * 4.8).toFixed(2))
  );
  const [productionStatus, setProductionStatus] = useState<
    'Standing Crop' | 'Harvest Completed' | 'Crop Failure / Damaged'
  >(existingRecord?.productionStatus || 'Standing Crop');
  const [lftOfficerName, setLftOfficerName] = useState<string>(
    existingRecord?.lftOfficerName ||
      currentUser?.name ||
      farmer.focalPerson ||
      getAssignedLftForBarangay(farmer.barangay).name
  );
  const [remarks, setRemarks] = useState<string>(
    existingRecord?.remarks || 'Communal irrigation operational; nitrogen top-dress applied.'
  );

  // When seed variety changes, sync seed type and re-estimate harvest date
  const handleVarietyChange = (vName: string) => {
    setSeedVariety(vName);
    const matched = varieties.find((v) => v.name.toLowerCase() === vName.toLowerCase());
    if (matched) {
      setSeedType(matched.seedType);
      if (plantingDate) {
        setEstimatedHarvestDate(computeEstimatedHarvestDate(plantingDate, vName));
      }
    }
  };

  // When planting date changes, auto-compute estimated harvest date
  useEffect(() => {
    if (plantingDate && seedVariety) {
      const autoHarvest = computeEstimatedHarvestDate(plantingDate, seedVariety);
      if (!existingRecord || !existingRecord.estimatedHarvestDate) {
        setEstimatedHarvestDate(autoHarvest);
      }
    }
  }, [plantingDate, seedVariety]);

  // Live growth stage calculation
  const growth = useMemo(() => {
    return calculateCropGrowthStage(plantingDate, seedVariety);
  }, [plantingDate, seedVariety]);

  // Computed Yield in MT/ha
  const computedYield = useMemo(() => {
    return computeYieldMtPerHa(actualVolumeMt, farmer.weightKg || 1);
  }, [actualVolumeMt, farmer.weightKg]);

  // Computed 50-kg cavan / bags
  const computedBags = useMemo(() => {
    return Math.round(actualVolumeMt * 20);
  }, [actualVolumeMt]);

  // Sync state if existingRecord changes
  useEffect(() => {
    if (existingRecord) {
      setSelectedSeason(existingRecord.season);
      setSeedVariety(existingRecord.seedVariety);
      setSeedType(existingRecord.seedType);
      setPlantingDate(existingRecord.plantingDate);
      setEstimatedHarvestDate(existingRecord.estimatedHarvestDate);
      setActualHarvestDate(existingRecord.actualHarvestDate || '');
      setActualVolumeMt(existingRecord.actualProductionVolumeMt);
      setProductionStatus(existingRecord.productionStatus);
      setLftOfficerName(existingRecord.lftOfficerName);
      setRemarks(existingRecord.remarks || '');
    } else {
      setSelectedSeason(defaultSeason || activeSeason);
      const defVariety = farmer.breed || varieties[0]?.name || 'NSIC Rc 222';
      setSeedVariety(defVariety);
      const matched = varieties.find((v) => v.name.toLowerCase() === defVariety.toLowerCase());
      setSeedType(matched ? matched.seedType : 'INBRED');
      const defPlanting = farmer.plantingDate || new Date().toISOString().split('T')[0];
      setPlantingDate(defPlanting);
      setEstimatedHarvestDate(computeEstimatedHarvestDate(defPlanting, defVariety));
      setActualVolumeMt(Number(((farmer.weightKg || 1) * 4.8).toFixed(2)));
      setProductionStatus('Standing Crop');
      setRemarks('Communal irrigation operational; crop in healthy condition.');
    }
  }, [existingRecord, farmer, defaultSeason, activeSeason, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const recordPayload = {
      season: selectedSeason,
      seedVariety,
      seedType,
      plantingDate,
      estimatedHarvestDate: estimatedHarvestDate || computeEstimatedHarvestDate(plantingDate, seedVariety),
      actualHarvestDate: actualHarvestDate || undefined,
      actualProductionVolumeMt: Number(actualVolumeMt) || 0,
      actualProductionBags: computedBags,
      yieldMtPerHa: computedYield,
      productionStatus,
      growthStage: growth.stage,
      elapsedDas: growth.dap,
      maturityPercentage: growth.percentageMaturity,
      lftOfficerName,
      remarks
    };

    if (existingRecord) {
      updateSeasonalRecord(farmer.tagNumber, existingRecord.id, recordPayload);
    } else {
      addSeasonalRecord(farmer.tagNumber, recordPayload);
    }

    onClose();
  };

  const handleDelete = () => {
    if (existingRecord && confirm(`Delete seasonal record for ${existingRecord.season}?`)) {
      deleteSeasonalRecord(farmer.tagNumber, existingRecord.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
        {/* Header */}
        <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700/80 flex items-center justify-center text-amber-300">
              <Wheat className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                LFT Seasonal Production Table • Master-Detail Entry
              </span>
              <h3 className="text-sm sm:text-base font-black leading-tight">
                {existingRecord ? 'Update Seasonal Production Record' : 'Record Seasonal Rice Production'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-emerald-700 text-emerald-200 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Farmer Master Profile Summary Card */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            <span className="text-[10.5px] text-slate-500 font-bold block">FARMER PROFILE (MASTER)</span>
            <span className="font-extrabold text-slate-900 text-sm">{farmer.raiserName}</span>
            <span className="text-slate-500 text-[11px] ml-1.5 font-mono">({farmer.swineNameOrId || farmer.tagNumber})</span>
          </div>
          <div className="flex items-center gap-2 font-medium text-slate-600">
            <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-bold text-slate-800">
              Brgy. {farmer.barangay}
            </span>
            <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md font-bold">
              {farmer.weightKg} Hectares
            </span>
            <span className="bg-sky-50 text-sky-800 px-2 py-0.5 rounded-md border border-sky-200 font-medium">
              {farmer.sex || 'Owner-Cultivator'}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* 1. Cropping Season Selector (Twice a Year) */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>Active Rice Cropping Season (Twice a Year)</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs text-slate-900 font-black focus:ring-2 focus:ring-emerald-600 cursor-pointer shadow-2xs"
              >
                {CROPPING_SEASONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Seed Variety & Seed Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Seed Variety Planted <span className="text-red-500">*</span>
                </label>
                <select
                  value={seedVariety}
                  onChange={(e) => handleVarietyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  {varieties.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.seedType} • {v.maturityDays} DAS)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Seed Category</label>
                <select
                  value={seedType}
                  onChange={(e) => setSeedType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="INBRED">INBRED (Certified Inbred Seeds)</option>
                  <option value="HYBRID">HYBRID (Hybrid F1 Commercial)</option>
                  <option value="UNKNOWN">UNKNOWN / Farmer-Saved Seeds</option>
                </select>
              </div>
            </div>

            {/* 3. Planting Date & Estimated Harvest Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Date of Planting / Sowing <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={plantingDate}
                  onChange={(e) => setPlantingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-700">
                    Estimated Harvest Date
                  </label>
                  <span className="text-[10px] text-emerald-700 font-semibold">Auto-Computed</span>
                </div>
                <input
                  type="date"
                  value={estimatedHarvestDate}
                  onChange={(e) => setEstimatedHarvestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Live Phenology Banner */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 text-xs flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">Growth Stage: </span>
                  <span className="font-extrabold text-emerald-800">{growth.stage}</span>
                </div>
              </div>
              <div className="font-mono text-[11px] text-slate-600">
                <strong>{growth.dap} DAS</strong> ({growth.percentageMaturity}% Maturity)
              </div>
            </div>

            {/* 4. Actual Production Volume & Yield Computation */}
            <div className="bg-amber-50/50 border border-amber-200/90 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200/70">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-950">
                  <Scale className="w-3.5 h-3.5 text-amber-700" />
                  <span>Production Harvest &amp; Yield Metrics</span>
                </div>
                <span className="text-[10.5px] font-bold text-amber-800">
                  Parcel Hectarage: <strong>{farmer.weightKg} ha</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Actual Volume (Metric Tons) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={actualVolumeMt}
                    onChange={(e) => setActualVolumeMt(Number(e.target.value))}
                    placeholder="e.g. 5.80"
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-xs text-slate-900 font-extrabold focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Equivalent in 50-kg Bags
                  </label>
                  <input
                    type="text"
                    disabled
                    value={`${computedBags} Bags (Cavans)`}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono font-bold cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700">
                    Calculated Yield (MT/ha)
                  </label>
                  <div className="w-full px-3 py-2 bg-emerald-100/70 border border-emerald-300 rounded-xl text-xs text-emerald-950 font-black font-mono">
                    {computedYield} MT / ha
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Production Status & Actual Harvest Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">Production Status</label>
                <select
                  value={productionStatus}
                  onChange={(e) => setProductionStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="Standing Crop">Standing Crop (Active Tillering / Maturing)</option>
                  <option value="Harvest Completed">Harvest Completed (Yield Recorded)</option>
                  <option value="Crop Failure / Damaged">Crop Failure / Damaged (Flood / Pests)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Actual Harvest Date (If Completed)
                </label>
                <input
                  type="date"
                  value={actualHarvestDate}
                  onChange={(e) => setActualHarvestDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* 6. LFT Officer & Remarks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Recording LFT Technician
                </label>
                <input
                  type="text"
                  value={lftOfficerName}
                  onChange={(e) => setLftOfficerName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Seasonal Agronomic Remarks
                </label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Good irrigation, minimal leaf folder"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-white px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div>
              {existingRecord && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Record</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Save Seasonal Record</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
