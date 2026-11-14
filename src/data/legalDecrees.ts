export interface LegalDecree {
  id: string;
  title: string;
  category: string;
  number: string;
  dateEnacted?: string;
  summary?: string;
  text: string;
}

export const DECREE_CATEGORIES = [
  'All Documents',
  'Municipal Ordinances',
  'Resolutions',
  'Executive Orders',
  'DA Memorandum Orders',
  'National Laws & References',
  'Archive'
] as const;

export const DEFAULT_LEGAL_DECREES: LegalDecree[] = [
  {
    id: 'decree-silago-ord-2025-04',
    number: 'Municipal Ordinance No. 2025-04',
    title: 'Silago Georeferenced Rice Farm Registry & Irrigable Land Protection Ordinance',
    category: 'Municipal Ordinances',
    dateEnacted: '2025-04-15',
    summary:
      'Establishes the official Digital Rice Farm Registry & GIS Parcel Mapping across all 15 barangays of Silago and designates NIA communal irrigation buffers.',
    text:
      'SECTION 1. Title. This Ordinance shall be known as the "Silago Rice Farm Georeferencing and Agricultural Registry Ordinance."\n\nSECTION 2. Mandatory Parcel & Tiller Enrollment. All irrigated lowland, rainfed, and upland rice parcels across the 15 barangays of Silago shall be mapped with verified GPS coordinates and RSBSA numbers through designated Local Farmer Technicians (LFTs) supervised by the Municipal Agriculture Office (MAO).\n\nSECTION 3. Irrigation Buffer Protection. Encroachment, unauthorized land conversion, or obstruction of National Irrigation Administration (NIA) communal canals and watershed tributaries is strictly prohibited without clearances from MAO and DA-RFO VIII.'
  },
  {
    id: 'decree-silago-eo-2026-02',
    number: 'Executive Order No. 2026-02',
    title: 'Activation of Seasonal Palay Harvest Monitoring & Certified Seed Allocation Protocol',
    category: 'Executive Orders',
    dateEnacted: '2026-01-20',
    summary:
      'Directs LFT sectors to validate Wet Season and Dry Season planting dates, crop stages, and verified certified inbred/hybrid seed allocation.',
    text:
      'SECTION 1. Seasonal Production Audit. Every Local Farmer Technician assigned to Silago\'s 15 barangays shall log Wet Season (WS) and Dry Season (DS) planting dates, variety classifications (NSIC Rc series), and actual harvested yield in metric tons (MT) and 50-kg cavans.\n\nSECTION 2. Priority Seed Distribution. Registered farmers with active RSBSA links and verified GIS boundary polygons shall receive priority allocation under municipal seed reserves and RCEF deliveries.'
  },
  {
    id: 'decree-sb-res-2026-11',
    number: 'SB Resolution No. 2026-11',
    title: 'Resolution Adopting the DA-MAO & SLSU Collaborative Agricultural GIS Portal',
    category: 'Resolutions',
    dateEnacted: '2026-02-12',
    summary:
      'Formalizes technical partnership with Southern Leyte State University (SLSU) Agricultural Extension for digital mapping, data transparency, and food security planning.',
    text:
      'WHEREAS, reliable spatial farm records improve calamity response, PCIC crop insurance validation, and municipal rice sufficiency projections;\n\nNOW THEREFORE, BE IT RESOLVED by the Sangguniang Bayan of Silago to adopt the Silago Rice Farm Registry & Georeferencing GIS System as the official municipal planning tool of the Municipal Agriculture Office.'
  },
  {
    id: 'decree-ra-11203',
    number: 'Republic Act No. 11203',
    title: 'Rice Tariffication Law & Rice Competitiveness Enhancement Fund (RCEF)',
    category: 'National Laws & References',
    dateEnacted: '2019-02-14',
    summary:
      'National statute establishing the RCEF Mechanization, Certified Inbred Seed, Credit, and Extension programs for Filipino rice farmers.',
    text:
      'Republic Act No. 11203 liberalizes rice trade policy while earmarking ₱10 billion annually under the Rice Competitiveness Enhancement Fund (RCEF) for farm mechanization (PHilMech), inbred rice seed propagation (PhilRice), expanded rice credit assistance, and extension skills training prioritized for RSBSA-enrolled rice farmers.'
  },
  {
    id: 'decree-da-rsbsa-protocol',
    number: 'DA Administrative Order No. 05',
    title: 'Registry System for Basic Sectors in Agriculture (RSBSA) Enrollment & Data Standards',
    category: 'DA Memorandum Orders',
    dateEnacted: '2024-06-01',
    summary:
      'National DA guideline requiring verified RSBSA stubs, geo-tagged farm plots, and active municipal updating for agricultural subsidy eligibility.',
    text:
      'Pursuant to Department of Agriculture guidelines, municipal registries must maintain clean, deduplicated RSBSA farmer references linked to parcel location, lot area in hectares, tenurial status, and crop variety to ensure transparent delivery of certified seeds, fertilizer vouchers, and crop insurance.'
  }
];

export function normalizeDecreeList(raw: unknown): LegalDecree[] {
  if (!Array.isArray(raw)) return DEFAULT_LEGAL_DECREES;
  const cleaned = raw.filter(
    (item): item is LegalDecree =>
      Boolean(item && typeof item === 'object' && typeof (item as any).id === 'string' && typeof (item as any).title === 'string')
  );
  return cleaned.length > 0 ? cleaned : DEFAULT_LEGAL_DECREES;
}
