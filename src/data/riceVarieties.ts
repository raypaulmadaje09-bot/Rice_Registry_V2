export interface RiceVariety {
  name: string;
  code: string;
  seedType: 'INBRED' | 'HYBRID' | 'UNKNOWN';
  category: 'Certified_Seeds' | 'Hybrid_Seeds' | 'Good_Seeds' | 'Farmers_Home_Save_Seeds';
  newlyPlantedDays: number; // 7 DAS
  vegetativeMaturityNet: number; // DAS
  reproductiveMaturityDas: number; // DAS
  maturityDays: number; // MATURITY (DAS)
  ecosystem: string;
  aveYieldMt: number;
  potentialYieldMt: number;
  eatingQuality?: string;
  grainType?: string;
  recommendedSeason?: string;
}

export const RICE_VARIETIES: RiceVariety[] = [
  // ==========================================
  // CERTIFIED SEEDS (INBRED)
  // ==========================================
  {
    name: 'NSIC Rc 222',
    code: 'Rc222',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 49,
    reproductiveMaturityDas: 84,
    maturityDays: 114,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 6.1,
    potentialYieldMt: 10.0,
    eatingQuality: 'Fair / Firm (Standard Inbred)',
    grainType: 'Long & Slender',
    recommendedSeason: 'Dry & Wet Season'
  },
  {
    name: 'NSIC Rc 400',
    code: 'Rc400',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 55,
    reproductiveMaturityDas: 90,
    maturityDays: 120,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 5.8,
    potentialYieldMt: 9.2,
    eatingQuality: 'Soft to Medium',
    grainType: 'Slender',
    recommendedSeason: 'All Seasons'
  },
  {
    name: 'NSIC Rc 508',
    code: 'Rc508',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 45,
    reproductiveMaturityDas: 80,
    maturityDays: 110,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 6.2,
    potentialYieldMt: 9.8,
    eatingQuality: 'Medium Soft',
    grainType: 'Long Grain',
    recommendedSeason: 'Wet Season'
  },
  {
    name: 'NSIC Rc 402',
    code: 'Rc402',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 42,
    reproductiveMaturityDas: 77,
    maturityDays: 107,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 5.5,
    potentialYieldMt: 8.7,
    eatingQuality: 'Soft',
    grainType: 'Slender',
    recommendedSeason: 'Early Maturity Season'
  },
  {
    name: 'NSIC Rc 358',
    code: 'Rc358',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 49,
    reproductiveMaturityDas: 84,
    maturityDays: 114,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 5.9,
    potentialYieldMt: 9.4,
    eatingQuality: 'Medium Soft',
    grainType: 'Slender',
    recommendedSeason: 'All Seasons'
  },
  {
    name: 'NSIC Rc 506',
    code: 'Rc506',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 46,
    reproductiveMaturityDas: 81,
    maturityDays: 111,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 6.0,
    potentialYieldMt: 9.5,
    eatingQuality: 'Soft',
    grainType: 'Long Slender',
    recommendedSeason: 'Wet Season Preferred'
  },
  {
    name: 'NSIC Rc 216',
    code: 'Rc216',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 47,
    reproductiveMaturityDas: 82,
    maturityDays: 112,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 6.0,
    potentialYieldMt: 9.7,
    eatingQuality: 'Medium Soft',
    grainType: 'Slender',
    recommendedSeason: 'Wet Season Preferred'
  },
  {
    name: 'NSIC Rc 480',
    code: 'Rc480',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 42,
    reproductiveMaturityDas: 77,
    maturityDays: 107,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 5.4,
    potentialYieldMt: 8.5,
    eatingQuality: 'Soft',
    grainType: 'Slender',
    recommendedSeason: 'Dry & Wet Season'
  },
  {
    name: 'PSB Rc 18',
    code: 'Rc18',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 58,
    reproductiveMaturityDas: 93,
    maturityDays: 123,
    ecosystem: 'Rainfed Lowland',
    aveYieldMt: 5.1,
    potentialYieldMt: 7.5,
    eatingQuality: 'Firm',
    grainType: 'Intermediate',
    recommendedSeason: 'Wet Season Rainfed'
  },
  {
    name: 'NSIC Rc 160',
    code: 'Rc160',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 42,
    reproductiveMaturityDas: 77,
    maturityDays: 107,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 5.6,
    potentialYieldMt: 8.2,
    eatingQuality: 'Soft / Premium Dining Quality',
    grainType: 'Long & Translucent',
    recommendedSeason: 'Dry & Wet Season'
  },
  {
    name: 'NSIC Rc 226',
    code: 'Rc226',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 47,
    reproductiveMaturityDas: 82,
    maturityDays: 112,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 5.7,
    potentialYieldMt: 8.9,
    eatingQuality: 'Medium',
    grainType: 'Slender',
    recommendedSeason: 'All Seasons'
  },
  {
    name: 'NSIC Rc 442',
    code: 'Rc442',
    seedType: 'INBRED',
    category: 'Certified_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 48,
    reproductiveMaturityDas: 83,
    maturityDays: 113,
    ecosystem: 'Irrigated Lowland (NIA)',
    aveYieldMt: 5.8,
    potentialYieldMt: 9.1,
    eatingQuality: 'Soft',
    grainType: 'Long Slender',
    recommendedSeason: 'All Seasons'
  },

  // ==========================================
  // HYBRID SEEDS (HYBRID)
  // ==========================================
  {
    name: 'NSIC Rc 522 (Biorice 453)',
    code: 'Rc522',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 48,
    reproductiveMaturityDas: 83,
    maturityDays: 113,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.4,
    potentialYieldMt: 11.2,
    eatingQuality: 'Soft & Translucent',
    grainType: 'Slender',
    recommendedSeason: 'Dry & Wet Season High Input'
  },
  {
    name: 'BIGANTE',
    code: 'BIGANTE',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 53,
    reproductiveMaturityDas: 88,
    maturityDays: 118,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.2,
    potentialYieldMt: 10.8,
    eatingQuality: 'Soft & Aromatic',
    grainType: 'Premium Slender',
    recommendedSeason: 'High Irrigation Sector'
  },
  {
    name: 'NSIC Rc 488H (SL-19H)',
    code: 'Rc488H',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 48,
    reproductiveMaturityDas: 83,
    maturityDays: 113,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.6,
    potentialYieldMt: 11.5,
    eatingQuality: 'Soft',
    grainType: 'Long Slender',
    recommendedSeason: 'Dry Season Maximum Input'
  },
  {
    name: 'NSIC Rc 540H (SL-20H)',
    code: 'Rc540H',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 45,
    reproductiveMaturityDas: 80,
    maturityDays: 110,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.3,
    potentialYieldMt: 11.0,
    eatingQuality: 'Soft',
    grainType: 'Slender',
    recommendedSeason: 'All Seasons'
  },
  {
    name: 'NSIC Rc 486H (LP 534)',
    code: 'Rc486H',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 48,
    reproductiveMaturityDas: 83,
    maturityDays: 113,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.5,
    potentialYieldMt: 11.2,
    eatingQuality: 'Medium Soft',
    grainType: 'Slender',
    recommendedSeason: 'Dry Season'
  },
  {
    name: 'NSIC Rc 456H (LP 937)',
    code: 'Rc456H',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 47,
    reproductiveMaturityDas: 82,
    maturityDays: 112,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.1,
    potentialYieldMt: 10.6,
    eatingQuality: 'Soft',
    grainType: 'Slender',
    recommendedSeason: 'All Seasons'
  },
  {
    name: 'NSIC 666H (Jackpot 102)',
    code: 'Rc666H',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 47,
    reproductiveMaturityDas: 82,
    maturityDays: 112,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.8,
    potentialYieldMt: 11.8,
    eatingQuality: 'Soft & High Milling Recovery',
    grainType: 'Long Slender',
    recommendedSeason: 'High Irrigation Sector'
  },
  {
    name: 'NSIC Rc 490H (Dinorado)',
    code: 'Rc490H',
    seedType: 'HYBRID',
    category: 'Hybrid_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 49,
    reproductiveMaturityDas: 84,
    maturityDays: 114,
    ecosystem: 'Hybrid Seed Production',
    aveYieldMt: 7.0,
    potentialYieldMt: 10.5,
    eatingQuality: 'Very Soft & Aromatic',
    grainType: 'Medium Aromatic',
    recommendedSeason: 'Wet Season'
  },

  // ==========================================
  // GOOD SEEDS / FARMERS HOME SAVED / UNKNOWN
  // ==========================================
  {
    name: 'UNKNOWN / Traditional',
    code: 'UNKNOWN',
    seedType: 'UNKNOWN',
    category: 'Farmers_Home_Save_Seeds',
    newlyPlantedDays: 7,
    vegetativeMaturityNet: 50,
    reproductiveMaturityDas: 85,
    maturityDays: 115,
    ecosystem: 'Rainfed Lowland',
    aveYieldMt: 4.2,
    potentialYieldMt: 6.0,
    eatingQuality: 'Traditional Local Taste',
    grainType: 'Mixed / Intermediate',
    recommendedSeason: 'Wet Season Local'
  }
];

export interface CropGrowthStageCalc {
  stage: string;
  phase: string;
  dap: number; // Days After Sowing / Days After Planting
  newlyPlantedDays: number;
  vegetativeNet: number;
  reproductiveDas: number;
  maturityDays: number;
  description: string;
  percentageMaturity: number;
  colorClass: string;
  estimatedHarvestDate: string;
  seedType: 'INBRED' | 'HYBRID' | 'UNKNOWN';
}

/**
 * Calculates Crop Growth Stage and Phenology using the exact DAS thresholds from the Silago Field Guide:
 * - 0 to 7 DAS: Newly Planted (Seedling Establishment)
 * - 8 to [vegetativeMaturityNet] DAS: Vegetative Maturity (Active Tillering)
 * - ([vegetativeMaturityNet] + 1) to [reproductiveMaturityDas] DAS: Reproductive Maturity (Panicle Initiation & Flowering)
 * - ([reproductiveMaturityDas] + 1) to [maturityDays] DAS: Ripening / Grain Filling Maturity
 * - > [maturityDays] DAS: Harvest Ready / Harvested
 */
export function calculateCropGrowthStage(
  plantingDateStr: string,
  varietyName: string,
  referenceDate?: Date
): CropGrowthStageCalc {
  const refDate = referenceDate ? new Date(referenceDate) : new Date();

  // Find selected variety or fallback
  const cleaned = (varietyName || '').toLowerCase().trim();
  const variety =
    RICE_VARIETIES.find((v) => v.name.toLowerCase() === cleaned) ||
    RICE_VARIETIES.find((v) => cleaned.includes(v.code.toLowerCase())) ||
    RICE_VARIETIES.find((v) => v.name.toLowerCase().includes(cleaned)) ||
    RICE_VARIETIES[0];

  const maturity = variety.maturityDays;
  const vegNet = variety.vegetativeMaturityNet;
  const repDas = variety.reproductiveMaturityDas;
  const newlyPlanted = variety.newlyPlantedDays || 7;

  // If no date provided
  if (!plantingDateStr) {
    const defaultHarvest = new Date(refDate);
    defaultHarvest.setDate(defaultHarvest.getDate() + maturity);
    return {
      stage: 'Newly Planted',
      phase: 'Seedling Establishment',
      dap: 5,
      newlyPlantedDays: newlyPlanted,
      vegetativeNet: vegNet,
      reproductiveDas: repDas,
      maturityDays: maturity,
      description: `Newly planted crop (${variety.seedType}). Seedlings acclimatizing to field conditions.`,
      percentageMaturity: Math.round((5 / maturity) * 100),
      colorClass: 'bg-lime-100 text-lime-800 border-lime-300',
      estimatedHarvestDate: defaultHarvest.toISOString().split('T')[0],
      seedType: variety.seedType
    };
  }

  const pDate = new Date(plantingDateStr);
  const diffTime = refDate.getTime() - pDate.getTime();
  const dap = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const harvestDate = new Date(pDate);
  harvestDate.setDate(harvestDate.getDate() + maturity);
  const estimatedHarvestDate = harvestDate.toISOString().split('T')[0];

  const pct = Math.max(0, Math.min(100, Math.round((dap / maturity) * 100)));

  // 1. Newly Planted (0 to 7 DAS)
  if (dap <= newlyPlanted) {
    return {
      stage: 'Newly Planted',
      phase: 'Seedling Establishment (0–7 DAS)',
      dap,
      newlyPlantedDays: newlyPlanted,
      vegetativeNet: vegNet,
      reproductiveDas: repDas,
      maturityDays: maturity,
      description: `Newly planted (${dap} DAS). Root anchoring and seedling recovery in progress. Maintain shallow water depth (2-3 cm).`,
      percentageMaturity: pct,
      colorClass: 'bg-lime-100 text-lime-800 border-lime-300',
      estimatedHarvestDate,
      seedType: variety.seedType
    };
  }

  // 2. Vegetative Maturity Net (8 to vegNet DAS)
  if (dap <= vegNet) {
    return {
      stage: 'Vegetative Stage',
      phase: `Vegetative Maturity (8–${vegNet} DAS)`,
      dap,
      newlyPlantedDays: newlyPlanted,
      vegetativeNet: vegNet,
      reproductiveDas: repDas,
      maturityDays: maturity,
      description: `Active tillering & stem elongation (${dap} DAS / target ${vegNet} DAS). Prime window for nitrogen top-dressing and weed control.`,
      percentageMaturity: pct,
      colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      estimatedHarvestDate,
      seedType: variety.seedType
    };
  }

  // 3. Reproductive Maturity (vegNet + 1 to repDas DAS)
  if (dap <= repDas) {
    return {
      stage: 'Reproductive Stage',
      phase: `Reproductive Maturity (${vegNet + 1}–${repDas} DAS)`,
      dap,
      newlyPlantedDays: newlyPlanted,
      vegetativeNet: vegNet,
      reproductiveDas: repDas,
      maturityDays: maturity,
      description: `Panicle initiation to heading & flowering (${dap} DAS / target ${repDas} DAS). Critical water requirement; maintain continuous irrigation.`,
      percentageMaturity: pct,
      colorClass: 'bg-sky-100 text-sky-800 border-sky-300',
      estimatedHarvestDate,
      seedType: variety.seedType
    };
  }

  // 4. Ripening / Maturity Stage (repDas + 1 to maturity DAS)
  if (dap <= maturity) {
    return {
      stage: 'Ripening / Maturity Stage',
      phase: `Grain Ripening (${repDas + 1}–${maturity} DAS)`,
      dap,
      newlyPlantedDays: newlyPlanted,
      vegetativeNet: vegNet,
      reproductiveDas: repDas,
      maturityDays: maturity,
      description: `Grain filling from milk to hard dough (${dap} DAS / full maturity ${maturity} DAS). Terminal drainage advised 1-2 weeks before harvest.`,
      percentageMaturity: pct,
      colorClass: 'bg-amber-100 text-amber-800 border-amber-300 font-semibold',
      estimatedHarvestDate,
      seedType: variety.seedType
    };
  }

  // 5. Harvest Ready / Harvested (> maturity DAS)
  return {
    stage: 'Harvest Ready / Post-Harvest',
    phase: `Physiological Maturity (${maturity} DAS reached)`,
    dap,
    newlyPlantedDays: newlyPlanted,
    vegetativeNet: vegNet,
    reproductiveDas: repDas,
    maturityDays: maturity,
    description: `Target harvest window reached (${dap} DAS vs ${maturity} DAS maturity). Golden grains ready for harvest or already threshed.`,
    percentageMaturity: 100,
    colorClass: 'bg-orange-100 text-orange-900 border-orange-400 font-bold',
    estimatedHarvestDate,
    seedType: variety.seedType
  };
}
