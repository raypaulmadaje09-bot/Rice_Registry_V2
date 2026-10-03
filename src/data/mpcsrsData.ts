import { OfficialSignatory } from '../types';
import { supabaseDb } from '../utils/supabaseClient';

export interface MpcsrsBarangayRow {
  id: string;
  barangay: string;
  validatedAreaHa: number;
  newlyPlantedHa?: number;
  vegetativeStageHa?: number;
  reproductiveStageHa?: number;
  maturingStageHa?: number;
}

export interface MpcsrsGroup {
  id: string;
  technicianName?: string;
  subtotalAreaHa?: number;
  rows: MpcsrsBarangayRow[];
}

export interface MpcsrsReportData {
  region: string;
  municipalityProvince: string;
  totalValidatedAreaHa: number;
  groups: MpcsrsGroup[];
  preparedByName: string;
  preparedByTitle: string;
  approvedByName: string;
  approvedByTitle: string;
  signatories?: OfficialSignatory[];
  footnote: string;
}

export const DEFAULT_MPCSRS_DATA: MpcsrsReportData = {
  region: 'REGION VIII',
  municipalityProvince: 'Silago, Southern Leyte',
  totalValidatedAreaHa: 0,
  groups: [],
  preparedByName: '',
  preparedByTitle: 'Signature over Printed Name / Designation',
  approvedByName: '',
  approvedByTitle: 'Municipal Agriculturist',
  footnote: '*Based from PSA-BAS Operational Definition on Monthly Palay & Corn Situation Reposting System (MPCSRS) and DA Operational Guidelines.'
};

export const MPCSRS_STORAGE_KEY = 'silago_mpcsrs_report_data';

let inMemoryMpcsrsData: MpcsrsReportData = DEFAULT_MPCSRS_DATA;

// Hydrate from Supabase cloud database
if (typeof window !== 'undefined') {
  supabaseDb.getSetting<MpcsrsReportData>('mpcsrs_report_data').then((cloudData) => {
    if (cloudData && Array.isArray(cloudData.groups)) {
      inMemoryMpcsrsData = cloudData;
    }
  }).catch(() => {});
}

export function loadMpcsrsReportData(): MpcsrsReportData {
  return inMemoryMpcsrsData;
}

export function saveMpcsrsReportData(data: MpcsrsReportData) {
  inMemoryMpcsrsData = data;
  supabaseDb.setSetting('mpcsrs_report_data', data).catch(() => {});
}
