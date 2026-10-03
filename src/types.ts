export interface Barangay {
  name: string;
  puroks: number;
  terrain: string;
  registeredSwine: number; // registered farm parcels
  registeredRaisers: number; // registered farmers
  totalAreaHa: number;
  irrigatedAreaHa: number;
  rainfedAreaHa: number;
  focalPerson: string;
  contactNumber: string;
  username: string;
  lat: number;
  lng: number;
  asfStatus: string; // Agro-Ecosystem zone / Irrigation Sector
}

export interface SeasonalProductionRecord {
  id: string; // Unique seasonal record ID e.g. "PROD-2026WS-001"
  parcelTag: string; // Foreign key linking to FarmParcel.tagNumber
  season: string; // e.g. "Wet Season (WS) 2026", "Dry Season (DS) 2026"
  seedVariety: string; // e.g. "NSIC Rc 222", "NSIC Rc 488H"
  seedType: 'INBRED' | 'HYBRID' | 'UNKNOWN';
  plantingDate: string; // YYYY-MM-DD
  estimatedHarvestDate: string; // YYYY-MM-DD (calculated based on variety maturity)
  actualHarvestDate?: string; // YYYY-MM-DD
  actualProductionVolumeMt: number; // in Metric Tons (MT)
  actualProductionBags?: number; // in 50-kg cavans/bags (= MT * 20)
  yieldMtPerHa: number; // MT per hectare = actualProductionVolumeMt / weightKg
  productionStatus: 'Standing Crop' | 'Harvest Completed' | 'Crop Failure / Damaged';
  growthStage?: string; // e.g. "Tillering (Vegetative)", "Panicle Initiation"
  elapsedDas?: number; // Days after sowing
  maturityPercentage?: number; // % maturity
  lftOfficerName: string; // LFT Technician who recorded/updated
  recordedAt: string; // ISO date timestamp
  remarks?: string; // Irrigation condition, fertilizer, pest advisory
}

export interface FarmParcel {
  tagNumber: string; // e.g. SLG-POB1-101
  swineNameOrId: string; // RSBSA reference number, e.g. RSBSA-08-64-15-001
  raiserName: string; // Farmer / Tiller Name
  barangay: string;
  purok: string;
  address: string;
  contactNumber: string;
  breed: string; // Rice Variety, e.g. NSIC Rc 222 (Tubigan 18)
  variety?: string; // Variety alias
  ecosystem?: string; // Ecosystem alias
  tenure?: string; // Tenurial status alias
  standingCropStage?: string;
  harvestDate?: string;
  waterSource?: string;
  gpsAccuracyMeters?: number;
  polygonCoords?: any;
  sex: string; // Tenurial Status: Owner-Cultivator, Tenant, ARB Beneficiary, Leaseholder
  ageMonths: number; // Cropping Days / Days after Sowing
  weightKg: number; // Farm Area in Hectares (ha)
  areaHa?: number; // Farm Area in Hectares (ha alias)
  scale: string; // Farm Scale: Smallholder (<2 ha), Medium Farm (2-5 ha), Commercial (>5 ha)
  purpose: string; // Agro-Ecosystem: Irrigated Lowland (NIA), Rainfed Lowland, Hybrid Seed Production, Upland Rice
  vaccinationStatus: string; // Insurance & RSBSA status: RSBSA Enrolled & PCIC Insured, etc.
  healthStatus: string; // Crop Stage: Seedling, Tillering, Panicle Initiation, Flowering, Harvesting, Fallow
  biosecurityScore: string; // GIS status: Georeferenced (GPS Polygon Mapped)
  registrationDate: string;
  focalPerson: string; // Assigned LFT Officer
  lat: number;
  lng: number;
  syncStatus: string;
  targetYieldMt: number; // Projected yield in Metric Tons
  boundaryCoords?: [number, number][]; // GPS polygon boundary vertices [[lat, lng], ...]
  plantingDate?: string; // Date of Planting / Transplanting (e.g. 2026-08-10)
  croppingSeason?: string; // e.g. Wet Season (WS) 2026 (June – Nov 2026)
  irrigationAssociation?: string; // e.g. Balagawan Communal Irrigators Association (BCIA)
  farmerFamilyName?: string; // e.g. ALAS
  farmerGivenName?: string; // e.g. MARIO
  farmerMiddleName?: string; // e.g. CABUG-OS
  birthday?: string; // e.g. 1949-05-16
  farmLocation?: string; // e.g. BALAGAWAN or HINUNDAYAN
  seedType?: string; // INBRED / HYBRID / UNKNOWN
  commodity?: string; // Rice
  pestAdvisoryNotice?: string; // Pest & Disease observations
  farmerPhotoUrl?: string;
  landPhotoUrl?: string;
  photoUrl?: string; // Farmer ID Photo
  fieldPhotoUrl?: string; // Farm Field Photo
  photo_url?: string; // Supabase database column alias
  field_photo_url?: string; // Supabase database column alias
  rsbsa_no?: string; // Supabase rice_farm_records column alias
  residential_address?: string; // Supabase rice_farm_records column alias
  farm_area_ha?: number; // Supabase rice_farm_records column alias
  commodity_planted?: string; // Supabase rice_farm_records column alias
  season?: string; // Supabase rice_farm_records column alias
  gps_coordinates?: string; // Supabase rice_farm_records column alias
  is_pending_sync?: boolean; // Offline queue pending sync status
  isPendingSync?: boolean; // Offline queue pending sync status alias
  seasonalRecords?: SeasonalProductionRecord[]; // Master-Detail: Production records twice a year
}

export interface User {
  username: string;
  role: 'Central Admin' | 'Barangay Focal Person';
  name: string;
  title: string;
  barangay?: string;
  assignedBarangays?: string[];
  photoUrl?: string;
  email?: string;
  contactNumber?: string;
  office?: string;
  scope?: string;
  status?: string;
}

export interface OfficialSignatory {
  id: string;
  roleLabel: string; // e.g. "Prepared & Verified by:", "Reviewed & Certified by:", "Noted & Approved by:", etc.
  name: string;
  title: string;
}

export interface LftAccount {
  id: string;
  name: string;
  barangay: string;
  assignedBarangays?: string[];
  username: string;
  contactNumber: string;
  terrain: string;
  areaHa: number;
  status: string;
  email?: string;
  puroks?: number;
  photoUrl?: string;
}

export const isAccountActive = (status?: string): boolean => {
  if (!status) return true;
  const s = status.trim().toLowerCase();
  if (
    s.includes('inactive') ||
    s.includes('disabled') ||
    s.includes('pending') ||
    s.includes('deactivated') ||
    s.includes('suspended') ||
    s.includes('revoked') ||
    s === 'off'
  ) {
    return false;
  }
  return true;
};

export type Language = 'EN' | 'CEB';

export type PortalTab = 'dashboard' | 'lft_dashboard' | 'brgy_dashboard' | 'map' | 'eartags' | 'reports' | 'accounts' | 'photos' | 'settings';

export interface BackgroundPreset {
  id: string;
  url: string;
  name: string;
  timestamp: string;
  source: 'preset' | 'upload';
}

export interface ReportConfig {
  reportType: string;
  selectedBarangay: string;
  paperSize: 'a4' | 'long' | 'letter';
  orientation: 'portrait' | 'landscape';
  memoRef: string;
  subject: string;
  date: string;
  signatoryPrepared: string;
  signatoryPreparedTitle: string;
  signatoryReviewed: string;
  signatoryReviewedTitle: string;
  signatoryApproved: string;
  signatoryApprovedTitle: string;
}

export interface OfficeContactInfo {
  schedule: string;
  hotline: string;
  mobile: string;
  email: string;
}

