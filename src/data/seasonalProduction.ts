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

  const recWet2026: SeasonalProductionRecord = {
    id: `PROD-${parcel.tagNumber}-2026WS`,
    parcelTag: parcel.tagNumber,
    season: 'Wet Season (WS) 2026 (June – Nov 2026)',
    seedVariety: variety,
    seedType,
    plantingDate: ws2026Planting,
    estimatedHarvestDate: ws2026HarvestEst,
    actualHarvestDate: isMatured ? ws2026HarvestEst : undefined,
    actualProductionVolumeMt: ws2026Volume,
    actualProductionBags: Math.round(ws2026Volume * 20),
    yieldMtPerHa: computeYieldMtPerHa(ws2026Volume, area),
    productionStatus: isMatured ? 'Harvest Completed' : 'Standing Crop',
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

  const recDry2026: SeasonalProductionRecord = {
    id: `PROD-${parcel.tagNumber}-2026DS`,
    parcelTag: parcel.tagNumber,
    season: 'Dry Season (DS) 2026 (Dec 2025 – May 2026)',
    seedVariety: variety,
    seedType,
    plantingDate: ds2026Planting,
    estimatedHarvestDate: ds2026HarvestEst,
    actualHarvestDate: '2026-05-02',
    actualProductionVolumeMt: ds2026Volume,
    actualProductionBags: Math.round(ds2026Volume * 20),
    yieldMtPerHa: computeYieldMtPerHa(ds2026Volume, area),
    productionStatus: 'Harvest Completed',
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

  const recWet2025: SeasonalProductionRecord = {
    id: `PROD-${parcel.tagNumber}-2025WS`,
    parcelTag: parcel.tagNumber,
    season: 'Wet Season (WS) 2025 (June – Nov 2025)',
    seedVariety: variety,
    seedType,
    plantingDate: ws2025Planting,
    estimatedHarvestDate: ws2025HarvestEst,
    actualHarvestDate: '2025-11-12',
    actualProductionVolumeMt: ws2025Volume,
    actualProductionBags: Math.round(ws2025Volume * 20),
    yieldMtPerHa: computeYieldMtPerHa(ws2025Volume, area),
    productionStatus: 'Harvest Completed',
    growthStage: 'Harvested',
    elapsedDas: 115,
    maturityPercentage: 100,
    lftOfficerName: parcel.focalPerson || getAssignedLftForBarangay(parcel.barangay).name,
    recordedAt: '2025-11-15T09:00:00Z',
    remarks: 'Slight monsoon lodging noted in field perimeter, overall good grain fill.'
  };

  return [recWet2026, recDry2026, recWet2025];
}
