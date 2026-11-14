import { FarmParcel, SeasonalProductionRecord } from '../types';
import { RICE_VARIETIES, calculateCropGrowthStage } from './riceVarieties';
import { getAssignedLftForBarangay } from './barangays';

export const CROPPING_SEASONS = [
  'Wet Season (WS) 2026 (June – Nov 2026)',
  'Dry Season (DS) 2026 (Dec 2025 – May 2026)',
  'Wet Season (WS) 2025 (June – Nov 2025)',
  'Dry Season (DS) 2025 (Dec 2024 – May 2025)'
] as const;

export const ACTIVE_SEASON = 'Wet Season (WS) 2026 (June – Nov 2026)';
export const PREVIOUS_SEASON = 'Dry Season (DS) 2026 (Dec 2025 – May 2026)';

/**
 * Calculates estimated harvest date based on planting date and variety maturity days
 */
export function computeEstimatedHarvestDate(plantingDate: string, varietyName: string): string {
  if (!plantingDate) return '';
  const matched = RICE_VARIETIES.find((v) => v.name.toLowerCase() === varietyName.toLowerCase());
  const maturityDays = matched ? matched.maturityDays : 115;
  const plantTime = new Date(plantingDate).getTime();
  if (isNaN(plantTime)) return '';
  const harvestTime = plantTime + maturityDays * 24 * 60 * 60 * 1000;
  return new Date(harvestTime).toISOString().split('T')[0];
}

/**
 * Computes Yield in Metric Tons per Hectare
 */
export function computeYieldMtPerHa(actualVolumeMt: number, areaHa: number): number {
  if (!areaHa || areaHa <= 0) return 0;
  return Number((actualVolumeMt / areaHa).toFixed(2));
}

/**
 * Generates initial seasonal production records (twice a year) for a given farmer profile
 */
export function generateInitialSeasonalRecords(parcel: FarmParcel): SeasonalProductionRecord[] {
  const area = parcel.weightKg || 1.2;
  const variety = parcel.breed || 'NSIC Rc 222';
  const matchedVariety = RICE_VARIETIES.find((v) => v.name.toLowerCase() === variety.toLowerCase());
  const seedType = matchedVariety ? matchedVariety.seedType : 'INBRED';
  const baseYield = matchedVariety ? matchedVariety.aveYieldMt : 4.8;

  // 1. Current / Active Wet Season 2026
  const ws2026Planting = parcel.plantingDate || '2026-07-15';
  const ws2026HarvestEst = computeEstimatedHarvestDate(ws2026Planting, variety);
  const growth = calculateCropGrowthStage(ws2026Planting, variety);
  const isMatured = growth.percentageMaturity >= 100;
  const ws2026Volume = Number((area * (baseYield * (0.95 + (parcel.lat % 0.1) * 2))).toFixed(2));

  const recWet2026Bags = Math.round(ws2026Volume * 20);
  const recWet2026YieldMt = computeYieldMtPerHa(ws2026Volume, area);

  const recWet2026: SeasonalProductionRecord = {
    id: `PROD-${parcel.tagNumber}-2026WS`,
    parcelTag: parcel.tagNumber,
    season: 'Wet Season (WS) 2026 (June – Nov 2026)',
    seasonName: 'Wet Season (WS) 2026',
    seedVariety: variety,
    varietyPlanted: variety,
    seedType,
    plantingDate: ws2026Planting,
    estimatedHarvestDate: ws2026HarvestEst,
    actualHarvestDate: isMatured ? ws2026HarvestEst : undefined,
    harvestDate: isMatured ? ws2026HarvestEst : ws2026HarvestEst,
    actualProductionVolumeMt: ws2026Volume,
    actualProductionBags: recWet2026Bags,
    yieldBags: recWet2026Bags,
    yieldMtPerHa: recWet2026YieldMt,
    yieldMetricTons: recWet2026YieldMt,
    grossIncome: recWet2026Bags * 1150,
    productionStatus: isMatured ? 'Harvest Completed' : 'Standing Crop',
    status: isMatured ? 'Harvested' : 'Ongoing',
    growthStage: growth.stage,
    elapsedDas: growth.dap,
    maturityPercentage: growth.percentageMaturity,
    lftOfficerName: parcel.focalPerson || getAssignedLftForBarangay(parcel.barangay).name,
    recordedAt: '2026-07-20T08:00:00Z',
    remarks: 'Adequate communal irrigation water supply; basal fertilizer applied.'
  };

  // 2. Previous Dry Season 2026 (Harvest Completed)
  const ds2026Planting = '2026-01-10';
  const ds2026HarvestEst = computeEstimatedHarvestDate(ds2026Planting, variety);
  const ds2026Volume = Number((area * (baseYield * 1.08)).toFixed(2));
  const ds2026Bags = Math.round(ds2026Volume * 20);
  const ds2026YieldMt = computeYieldMtPerHa(ds2026Volume, area);

  const recDry2026: SeasonalProductionRecord = {
    id: `PROD-${parcel.tagNumber}-2026DS`,
    parcelTag: parcel.tagNumber,
    season: 'Dry Season (DS) 2026 (Dec 2025 – May 2026)',
    seasonName: 'Dry Season (DS) 2026',
    seedVariety: variety,
    varietyPlanted: variety,
    seedType,
    plantingDate: ds2026Planting,
    estimatedHarvestDate: ds2026HarvestEst,
    actualHarvestDate: '2026-05-02',
    harvestDate: '2026-05-02',
    actualProductionVolumeMt: ds2026Volume,
    actualProductionBags: ds2026Bags,
    yieldBags: ds2026Bags,
    yieldMtPerHa: ds2026YieldMt,
    yieldMetricTons: ds2026YieldMt,
    grossIncome: ds2026Bags * 1150,
    productionStatus: 'Harvest Completed',
    status: 'Harvested',
    growthStage: 'Harvested',
    elapsedDas: 118,
    maturityPercentage: 100,
    lftOfficerName: parcel.focalPerson || getAssignedLftForBarangay(parcel.barangay).name,
    recordedAt: '2026-05-05T10:30:00Z',
    remarks: 'Dry season bumper crop with high solar radiation and low blast incidence.'
  };

  // 3. Historical Wet Season 2025 (Harvest Completed)
  const ws2025Planting = '2025-07-20';
  const ws2025HarvestEst = computeEstimatedHarvestDate(ws2025Planting, variety);
  const ws2025Volume = Number((area * (baseYield * 0.92)).toFixed(2));
  const ws2025Bags = Math.round(ws2025Volume * 20);
  const ws2025YieldMt = computeYieldMtPerHa(ws2025Volume, area);

  const recWet2025: SeasonalProductionRecord = {
    id: `PROD-${parcel.tagNumber}-2025WS`,
    parcelTag: parcel.tagNumber,
    season: 'Wet Season (WS) 2025 (June – Nov 2025)',
    seasonName: 'Wet Season (WS) 2025',
    seedVariety: variety,
    varietyPlanted: variety,
    seedType,
    plantingDate: ws2025Planting,
    estimatedHarvestDate: ws2025HarvestEst,
    actualHarvestDate: '2025-11-12',
    harvestDate: '2025-11-12',
    actualProductionVolumeMt: ws2025Volume,
    actualProductionBags: ws2025Bags,
    yieldBags: ws2025Bags,
    yieldMtPerHa: ws2025YieldMt,
    yieldMetricTons: ws2025YieldMt,
    grossIncome: ws2025Bags * 1150,
    productionStatus: 'Harvest Completed',
    status: 'Harvested',
    growthStage: 'Harvested',
    elapsedDas: 115,
    maturityPercentage: 100,
    lftOfficerName: parcel.focalPerson || getAssignedLftForBarangay(parcel.barangay).name,
    recordedAt: '2025-11-15T09:00:00Z',
    remarks: 'Slight monsoon lodging noted in field perimeter, overall good grain fill.'
  };

  // 4. Historical Dry Season 2025 (Harvest Completed)
  const ds2025Planting = '2025-01-15';
  const ds2025HarvestEst = computeEstimatedHarvestDate(ds2025Planting, variety);
  const ds2025Volume = Number((area * (baseYield * 1.05)).toFixed(2));
  const ds2025Bags = Math.round(ds2025Volume * 20);
  const ds2025YieldMt = computeYieldMtPerHa(ds2025Volume, area);

  const recDry2025: SeasonalProductionRecord = {
    id: `PROD-${parcel.tagNumber}-2025DS`,
    parcelTag: parcel.tagNumber,
    season: 'Dry Season (DS) 2025 (Dec 2024 – May 2025)',
    seasonName: 'Dry Season (DS) 2025',
    seedVariety: variety,
    varietyPlanted: variety,
    seedType,
    plantingDate: ds2025Planting,
    estimatedHarvestDate: ds2025HarvestEst,
    actualHarvestDate: '2025-05-10',
    harvestDate: '2025-05-10',
    actualProductionVolumeMt: ds2025Volume,
    actualProductionBags: ds2025Bags,
    yieldBags: ds2025Bags,
    yieldMtPerHa: ds2025YieldMt,
    yieldMetricTons: ds2025YieldMt,
    grossIncome: ds2025Bags * 1150,
    productionStatus: 'Harvest Completed',
    status: 'Harvested',
    growthStage: 'Harvested',
    elapsedDas: 116,
    maturityPercentage: 100,
    lftOfficerName: parcel.focalPerson || getAssignedLftForBarangay(parcel.barangay).name,
    recordedAt: '2025-05-15T08:30:00Z',
    remarks: 'High dry matter accumulation; clean grain threshing.'
  };

  return [recWet2026, recDry2026, recWet2025, recDry2025];
}

/**
 * Returns a clean, short season name (e.g. "Wet Season (WS) 2026" or "Dry Season (DS) 2025")
 */
export function getShortSeasonName(seasonStr: string): string {
  if (!seasonStr) return '';
  if (seasonStr === 'ALL_SEASONS' || seasonStr === 'ALL') return 'All Seasons';
  return seasonStr.split('(')[0].trim() || seasonStr;
}

/**
 * Normalizes any seasonal record to ensure both primary and alias properties are populated
 */
export function normalizeSeasonalRecord(
  rec: Partial<SeasonalProductionRecord> & { parcelTag?: string },
  defaultTag = 'PARCEL-001'
): SeasonalProductionRecord {
  const parcelTag = rec.parcelTag || defaultTag;
  const season = rec.season || rec.seasonName || ACTIVE_SEASON;
  const seedVariety = rec.seedVariety || rec.varietyPlanted || 'NSIC Rc 222';
  const volumeMt = Number(rec.actualProductionVolumeMt ?? rec.yieldMetricTons ?? 0);
  const bags = Number(rec.actualProductionBags ?? rec.yieldBags ?? Math.round(volumeMt * 20));
  const yieldMt = Number(rec.yieldMtPerHa ?? rec.yieldMetricTons ?? 0);
  const harvestDate = rec.actualHarvestDate || rec.harvestDate || rec.estimatedHarvestDate || '';
  const prodStatus = rec.productionStatus || (rec.status === 'Ongoing' ? 'Standing Crop' : rec.status === 'Damaged' ? 'Crop Failure / Damaged' : 'Harvest Completed');
  const status = rec.status || (prodStatus === 'Standing Crop' ? 'Ongoing' : prodStatus === 'Crop Failure / Damaged' ? 'Damaged' : 'Harvested');

  return {
    id: rec.id || `PROD-${parcelTag}-${Date.now().toString().slice(-6)}`,
    parcelTag,
    season,
    seasonName: rec.seasonName || season,
    seedVariety,
    varietyPlanted: rec.varietyPlanted || seedVariety,
    seedType: rec.seedType || 'INBRED',
    plantingDate: rec.plantingDate || '2026-07-20',
    estimatedHarvestDate: rec.estimatedHarvestDate || harvestDate || '2026-11-15',
    actualHarvestDate: rec.actualHarvestDate || (status === 'Harvested' ? harvestDate : undefined),
    harvestDate,
    actualProductionVolumeMt: volumeMt,
    actualProductionBags: bags,
    yieldBags: bags,
    yieldMtPerHa: yieldMt,
    yieldMetricTons: yieldMt,
    grossIncome: Number(rec.grossIncome ?? (bags * 1150)),
    productionStatus: prodStatus,
    status,
    growthStage: rec.growthStage,
    elapsedDas: rec.elapsedDas,
    maturityPercentage: rec.maturityPercentage,
    lftOfficerName: rec.lftOfficerName,
    recordedAt: rec.recordedAt || new Date().toISOString(),
    remarks: rec.remarks
  };
}

/**
 * Checks if a seasonal record matches the user-selected season filter
 */
export function matchesSeasonFilter(recSeason: string | undefined, filterSeason: string): boolean {
  if (!filterSeason || filterSeason === 'ALL_SEASONS' || filterSeason === 'ALL') return true;
  if (!recSeason) return false;
  if (recSeason === filterSeason) return true;
  // Compare normalized substrings (e.g., "WS 2026" or "2026WS" or "Dry Season (DS) 2026")
  const normRec = recSeason.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normFilter = filterSeason.toLowerCase().replace(/[^a-z0-9]/g, '');
  return normRec.includes(normFilter) || normFilter.includes(normRec);
}
