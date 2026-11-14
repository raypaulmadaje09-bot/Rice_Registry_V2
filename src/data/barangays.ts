import { Barangay, User } from '../types';
import rawBarangays from '../data_barangays.json';

// Official 15 Barangays of Silago, Southern Leyte
export const OFFICIAL_15_BARANGAYS = [
  'Balagawan',
  'Catmon',
  'Calubian',
  'Hingatungan',
  'Imelda',
  'Katipunan',
  'Laguna',
  'Mercedes',
  'Poblacion District 1',
  'Poblacion District 2',
  'Puntana',
  'Salvacion',
  'San Isidro',
  'San Roque',
  'Sap-ang'
] as const;

export type OfficialBarangay = typeof OFFICIAL_15_BARANGAYS[number];

// Alias for compatibility across codebase
export const ASSIGNED_10_BARANGAYS = OFFICIAL_15_BARANGAYS;
export type AssignedBarangay = typeof OFFICIAL_15_BARANGAYS[number];

// Official 2 Assigned Local Farmer Technicians (LFTs)
export const WELLA_ASSIGNED_BARANGAYS = [
  'Salvacion',
  'Laguna',
  'Poblacion District 2',
  'Poblacion District 1',
  'Sap-ang'
] as const;

export const BRANDO_ASSIGNED_BARANGAYS = [
  'Mercedes',
  'Katipunan',
  'Puntana',
  'Hingatungan',
  'Balagawan'
] as const;

export const LFT_OFFICERS_INFO = {
  default: {
    name: 'Assigned LFT Officer',
    title: 'Local Farmer Technician (LFT)',
    role: 'Barangay Focal Person' as const,
    username: 'lft',
    contactNumber: '',
    email: '',
    assignedBarangays: [...ASSIGNED_10_BARANGAYS]
  }
};

/**
 * Returns the assigned LFT officer for a given barangay.
 */
export function getAssignedLftForBarangay(_barangayName: string) {
  return LFT_OFFICERS_INFO.default;
}

const OFFICIAL_BARANGAY_METADATA: Record<OfficialBarangay, { puroks: number; terrain: string; lat: number; lng: number }> = {
  'Balagawan': { puroks: 5, terrain: 'Coastal Plains', lat: 10.518, lng: 125.172 },
  'Catmon': { puroks: 4, terrain: 'River Basin Irrigated', lat: 10.525, lng: 125.158 },
  'Calubian': { puroks: 4, terrain: 'Upland & River Basin', lat: 10.530, lng: 125.150 },
  'Hingatungan': { puroks: 6, terrain: 'Lowland Alluvial', lat: 10.562, lng: 125.168 },
  'Imelda': { puroks: 4, terrain: 'Upland Terrace', lat: 10.495, lng: 125.155 },
  'Katipunan': { puroks: 4, terrain: 'Upland Terrace', lat: 10.510, lng: 125.138 },
  'Laguna': { puroks: 5, terrain: 'Lowland Alluvial', lat: 10.548, lng: 125.160 },
  'Mercedes': { puroks: 4, terrain: 'Lowland Alluvial', lat: 10.512, lng: 125.155 },
  'Poblacion District 1': { puroks: 5, terrain: 'River Basin Irrigated', lat: 10.5335, lng: 125.162 },
  'Poblacion District 2': { puroks: 4, terrain: 'River Basin Irrigated', lat: 10.5365, lng: 125.165 },
  'Puntana': { puroks: 4, terrain: 'Lowland Alluvial', lat: 10.555, lng: 125.152 },
  'Salvacion': { puroks: 4, terrain: 'Upland Terrace', lat: 10.528, lng: 125.148 },
  'San Isidro': { puroks: 5, terrain: 'Lowland Alluvial', lat: 10.575, lng: 125.162 },
  'San Roque': { puroks: 4, terrain: 'Lowland Alluvial & Coast', lat: 10.535, lng: 125.170 },
  'Sap-ang': { puroks: 4, terrain: 'Lowland Alluvial & Coastal', lat: 10.522, lng: 125.163 }
};

export const BARANGAYS: Barangay[] = OFFICIAL_15_BARANGAYS.map((name) => {
  const meta = OFFICIAL_BARANGAY_METADATA[name];
  return {
    name,
    puroks: meta.puroks,
    terrain: meta.terrain,
    registeredSwine: 0,
    registeredRaisers: 0,
    totalAreaHa: 0,
    irrigatedAreaHa: 0,
    rainfedAreaHa: 0,
    focalPerson: '',
    contactNumber: '',
    username: '',
    lat: meta.lat,
    lng: meta.lng,
    asfStatus: 'Registered Sector'
  };
});

export const TOTAL_SILAGO_STATS = {
  totalBarangays: 15,
  assignedBarangaysCount: 15,
  registeredParcels: 0,
  totalFarmers: 0,
  totalAreaHa: 0,
  irrigatedAreaHa: 0,
  rainfedAreaHa: 0,
  municipalAgriculturist: 'Municipal Agriculturist',
  municipalMayor: 'Municipal Mayor',
  centerCoordinates: { lat: 10.542, lng: 125.175 }
};

/**
 * Matches a database record's barangay string to an assigned barangay query.
 * Handles abbreviations (e.g. Pd1 -> Poblacion District 1, etc.)
 */
export function matchBarangay(recordBarangay: string, targetBarangay: string): boolean {
  if (!recordBarangay || !targetBarangay) return false;
  if (targetBarangay === 'ALL' || targetBarangay === 'ASSIGNED_10') return true;

  const rec = recordBarangay.trim().toLowerCase();
  const tgt = targetBarangay.trim().toLowerCase();

  if (rec === tgt) return true;

  // Pd1 / Poblacion District 1 mapping
  if ((tgt === 'pd1' || tgt === 'poblacion district 1' || tgt === 'pob1' || tgt === 'poblacion 1') &&
      (rec === 'pd1' || rec.includes('poblacion district 1') || rec === 'pob1' || rec === 'poblacion 1')) {
    return true;
  }

  // Pd2 / Poblacion District 2 mapping
  if ((tgt === 'pd2' || tgt === 'poblacion district 2' || tgt === 'pob2' || tgt === 'poblacion 2') &&
      (rec === 'pd2' || rec.includes('poblacion district 2') || rec === 'pob2' || rec === 'poblacion 2')) {
    return true;
  }

  // Laguna / Laguma mapping
  if ((tgt === 'laguna' || tgt === 'laguma') && (rec === 'laguna' || rec === 'laguma' || rec.includes('lagu'))) {
    return true;
  }

  // Sap-ang mapping
  if ((tgt === 'sap-ang' || tgt === 'sapang') &&
      (rec === 'sap-ang' || rec === 'sapang' || rec.includes('sap-ang'))) {
    return true;
  }

  // Salvacion
  if (tgt.includes('salvacion') && rec.includes('salvacion')) return true;
  // Mercedes
  if (tgt.includes('mercedes') && rec.includes('mercedes')) return true;
  // Katipunan
  if (tgt.includes('katipunan') && rec.includes('katipunan')) return true;
  // Puntana
  if (tgt.includes('puntana') && rec.includes('puntana')) return true;
  // Hingatungan
  if (tgt.includes('hingatungan') && rec.includes('hingatungan')) return true;
  // Balagawan
  if (tgt.includes('balagawan') && rec.includes('balagawan')) return true;
  // Catmon
  if (tgt.includes('catmon') && rec.includes('catmon')) return true;
  // Calubian
  if (tgt.includes('calubian') && rec.includes('calubian')) return true;
  // Imelda
  if (tgt.includes('imelda') && rec.includes('imelda')) return true;
  // San Isidro
  if (tgt.includes('san isidro') && rec.includes('san isidro')) return true;
  // San Roque
  if (tgt.includes('san roque') && rec.includes('san roque')) return true;

  return rec.includes(tgt) || tgt.includes(rec);
}

/**
 * Normalizes any barangay name to its standard assigned label if applicable
 */
export function getDisplayBarangay(name: string): string {
  if (!name) return '';
  const clean = name.trim();
  const lower = clean.toLowerCase();
  if (lower === 'pd1' || lower.includes('poblacion district 1') || lower === 'pob1' || lower === 'poblacion 1') return 'Poblacion District 1';
  if (lower === 'pd2' || lower.includes('poblacion district 2') || lower === 'pob2' || lower === 'poblacion 2') return 'Poblacion District 2';
  if (lower === 'sap-ang' || lower === 'sapang' || lower.includes('sap-ang')) return 'Sap-ang';
  if (lower.includes('salvacion')) return 'Salvacion';
  if (lower === 'laguma' || lower.includes('laguna') || lower.includes('lagu')) return 'Laguna';
  if (lower.includes('mercedes')) return 'Mercedes';
  if (lower.includes('katipunan')) return 'Katipunan';
  if (lower.includes('puntana')) return 'Puntana';
  if (lower.includes('hingatungan')) return 'Hingatungan';
  if (lower.includes('balagawan')) return 'Balagawan';
  if (lower.includes('catmon')) return 'Catmon';
  if (lower.includes('calubian')) return 'Calubian';
  if (lower.includes('imelda')) return 'Imelda';
  if (lower.includes('san isidro')) return 'San Isidro';
  if (lower.includes('san roque')) return 'San Roque';
  return clean;
}

/**
 * Returns the specific list of assigned barangays for an LFT officer,
 * or null if the user is a Central Admin with full municipal jurisdiction.
 */
export function getUserAssignedBarangays(user: User | null | undefined): string[] | null {
  if (!user || user.role === 'Central Admin') {
    return null; // All barangays permitted
  }
  if (user.role === 'Barangay Focal Person') {
    if (user.assignedBarangays && user.assignedBarangays.length > 0) {
      return user.assignedBarangays;
    }
    if (user.barangay) {
      return [user.barangay];
    }
    return [...ASSIGNED_10_BARANGAYS];
  }
  return [];
}

/**
 * Validates whether a user (LFT officer or Admin) is authorized
 * to create, edit, or delete a farm parcel in the specified barangay.
 */
export function isUserAuthorizedForBarangay(user: User | null | undefined, barangayName: string): boolean {
  if (!user) return false;
  if (user.role === 'Central Admin') return true;
  const assigned = getUserAssignedBarangays(user);
  if (!assigned) return true; // Admin
  return assigned.some((b) => matchBarangay(barangayName, b));
}

