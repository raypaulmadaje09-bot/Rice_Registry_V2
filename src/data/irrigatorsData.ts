import { OfficialSignatory } from '../types';
import { supabaseDb } from '../utils/supabaseClient';

export interface IrrigatorsAssociationItem {
  id: string;
  associationName: string;
  contactPerson: string;
  barangay: string;
  phone?: string;
  email?: string;
}

export interface IrrigatorsDirectoryLetterData {
  republicHeader: string;
  provinceHeader: string;
  municipalityHeader: string;
  officeHeader: string;
  totalIrrigatedAreaHa: number;
  totalRainfedAreaHa: number;
  totalRiceFarmersCount: number;
  associations: IrrigatorsAssociationItem[];
  preparedByName: string;
  preparedByTitle: string;
  notedByName: string;
  notedByTitle: string;
  signatories?: OfficialSignatory[];
}

export const DEFAULT_IRRIGATORS_ASSOCIATIONS: IrrigatorsAssociationItem[] = [];

export const DEFAULT_IRRIGATORS_LETTER_DATA: IrrigatorsDirectoryLetterData = {
  republicHeader: 'Republic of the Philippines',
  provinceHeader: 'Province of Southern Leyte',
  municipalityHeader: 'Municipality of Silago',
  officeHeader: 'Municipal Agriculture Office',
  totalIrrigatedAreaHa: 0,
  totalRainfedAreaHa: 0,
  totalRiceFarmersCount: 0,
  associations: DEFAULT_IRRIGATORS_ASSOCIATIONS,
  preparedByName: '',
  preparedByTitle: 'Signature over Printed Name / Designation',
  notedByName: '',
  notedByTitle: 'MAO Officer / In-Charge'
};

export const STORAGE_KEY = 'silago_irrigators_letter_data';

let inMemoryIrrigatorsData: IrrigatorsDirectoryLetterData = DEFAULT_IRRIGATORS_LETTER_DATA;

// Hydrate from Supabase cloud database
if (typeof window !== 'undefined') {
  supabaseDb.getSetting<IrrigatorsDirectoryLetterData>('irrigators_letter_data').then((cloudData) => {
    if (cloudData && Array.isArray(cloudData.associations)) {
      inMemoryIrrigatorsData = cloudData;
    }
  }).catch(() => {});
}

export function loadIrrigatorsLetterData(): IrrigatorsDirectoryLetterData {
  return inMemoryIrrigatorsData;
}

export function saveIrrigatorsLetterData(data: IrrigatorsDirectoryLetterData) {
  inMemoryIrrigatorsData = data;
  supabaseDb.setSetting('irrigators_letter_data', data).catch(() => {});
}
