import { OfficialSignatory } from '../types';
import { supabaseDb } from '../utils/supabaseClient';

export type { OfficialSignatory };

export interface OfficialReportLetter {
  id: string;
  title: string;
  memoRef: string;
  date: string;
  // Header texts that can be customized
  countryHeader?: string;
  republicHeader?: string;
  provinceHeader?: string;
  municipalityHeader?: string;
  officeHeader?: string;
  memorandumFor: string;
  memorandumForTitle: string;
  thru?: string;
  thruTitle?: string;
  from: string;
  fromOfficer?: string;
  fromTitle: string;
  subject: string;
  openingGreeting: string;
  bodyParagraph1: string;
  includeStatsSummaryTable: boolean;
  bodyParagraph2: string;
  closingStatement: string;
  preparedBy: string;
  preparedTitle: string;
  reviewedBy: string;
  reviewedTitle: string;
  approvedBy: string;
  approvedTitle: string;
  signatories?: OfficialSignatory[];
  isDefault?: boolean;
}

export const DEFAULT_REPORT_LETTERS: OfficialReportLetter[] = [
  {
    id: 'letter-irrigators-overview',
    title: 'Irrigators Association & Rice Land Overview',
    memoRef: 'SLG-MAO-IA-RPT',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    countryHeader: '',
    republicHeader: 'Republic of the Philippines',
    provinceHeader: 'Province of Southern Leyte',
    municipalityHeader: 'Municipality of Silago',
    officeHeader: 'Municipal Agriculture Office',
    memorandumFor: 'MUNICIPAL MAYOR',
    memorandumForTitle: 'Office of the Municipal Mayor, Municipality of Silago',
    thru: 'MAO OFFICER-IN-CHARGE',
    thruTitle: 'Municipal Agriculture Office',
    from: 'RICE TECHNICIAN / LFT FOCAL',
    fromTitle: 'Agricultural Technologist',
    subject: 'SUMMARY OF IRRIGATED & RAINFED RICE LANDS AND DIRECTORY OF ACTIVE IRRIGATORS ASSOCIATIONS',
    openingGreeting: 'Summary of verified municipal rice landholdings and active irrigators associations:',
    bodyParagraph1: 'Official agricultural profile encompassing verified Irrigated Rice Lands, Rainfed Rice Lands, and registered Rice Farmers across the duly accredited Irrigators Associations of the Municipality of Silago.',
    includeStatsSummaryTable: false,
    bodyParagraph2: 'All accredited Irrigators Associations are actively operating under the coordination of the Municipal Agriculture Office, providing vital irrigation distribution, field clustering, and water management across our municipal agricultural zones.',
    closingStatement: 'Submitted for official municipal records, program coordination, and operational planning.',
    preparedBy: '',
    preparedTitle: 'RICE TECHNICIAN / LFT FOCAL',
    reviewedBy: '',
    reviewedTitle: 'MUNICIPAL AGRICULTURIST',
    approvedBy: '',
    approvedTitle: 'MUNICIPAL MAYOR',
    isDefault: true
  },
  {
    id: 'letter-mpcsrs-monthly',
    title: 'MPCSRS Monthly Palay & Crop Validation Report',
    memoRef: 'SLG-MAO-MPCSRS-RPT',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    countryHeader: '',
    republicHeader: 'REGION VIII • REGION 8 (EASTERN VISAYAS)',
    provinceHeader: 'Municipality/City: Silago, Southern Leyte',
    municipalityHeader: 'Department of Agriculture & PSA-BAS Reporting System',
    officeHeader: 'MONTHLY PALAY & CORN SITUATION REPORTING SYSTEM (MPCSRS)',
    memorandumFor: 'REGIONAL EXECUTIVE DIRECTOR',
    memorandumForTitle: 'Department of Agriculture - Regional Field Office VIII',
    thru: 'PROVINCIAL STATISTICIAN & PROVINCIAL AGRICULTURIST',
    thruTitle: 'Southern Leyte Provincial Field Office',
    from: 'MUNICIPAL AGRICULTURIST',
    fromTitle: 'Municipal Agriculture Office',
    subject: 'MONTHLY PALAY STANDING CROP & VALIDATED BARANGAY AREA HARVEST SITUATION REPORT',
    openingGreeting: 'Monthly consolidated standing crop and validated rice area report:',
    bodyParagraph1: 'Submitting herewith the validated rice area distribution across all municipal barangays, categorized into Newly Planted/Seedling Stage, Vegetative Stage, Reproductive Stage, and Maturing Stage under the supervision of assigned Agricultural Technicians.',
    includeStatsSummaryTable: true,
    bodyParagraph2: 'Based from PSA-BAS Operational Definition on Monthly Palay & Corn Situation Reporting System (MPCSRS) and Department of Agriculture operational field guidelines.',
    closingStatement: 'Certified correct and verified through ground surveys by the municipal consolidator and field technicians.',
    preparedBy: '',
    preparedTitle: 'AT / Report Officer / Consolidator',
    reviewedBy: '',
    reviewedTitle: 'Municipal Agriculturist',
    approvedBy: '',
    approvedTitle: 'Municipal Agriculturist',
    isDefault: true
  },
  {
    id: 'letter-transmittal-mayor-sb',
    title: 'Transmittal to Mayor & Sangguniang Bayan',
    memoRef: 'SLG-MAO-RICE-TRANS',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    memorandumFor: 'MUNICIPAL MAYOR',
    memorandumForTitle: 'Office of the Municipal Mayor, Municipality of Silago',
    thru: 'THE SANGGUNIANG BAYAN / COMMITTEE ON AGRICULTURE',
    thruTitle: 'Municipality of Silago, Province of Southern Leyte',
    from: 'MUNICIPAL AGRICULTURIST',
    fromTitle: 'Municipal Agriculture Office / LFT Program Coordinator',
    subject: 'TRANSMITTAL AND ENDORSEMENT OF OFFICIAL MASTERLIST OF RSBSA-REGISTERED RICE FARMERS AND GIS-MAPPED PARCELS FOR BARANGAY {BARANGAY}',
    openingGreeting: 'Greetings of peace and progress in agriculture!',
    bodyParagraph1: 'Respectfully submitting herewith the official, field-validated Masterlist and GIS Land Registry of registered rice farmers and agricultural parcels within the jurisdiction of Barangay {BARANGAY}, Municipality of Silago, Southern Leyte for the {SEASON} cropping period.',
    includeStatsSummaryTable: true,
    bodyParagraph2: 'This masterlist was comprehensively surveyed, geo-referenced, and cross-referenced with the Registry System for Basic Sectors in Agriculture (RSBSA) database by our designated Local Farmer Technicians (LFTs) and Agricultural Field Officers. All listed landholdings have been verified on-ground to ensure accuracy in boundary mapping, legitimate land tenure status, and actual standing crop condition.',
    closingStatement: 'This submission is formally tendered for legislative noting, program validation, resource allocation, and inclusion in the municipal agricultural registry and socio-economic profiling of Silago.',
    preparedBy: '',
    preparedTitle: 'Local Farmer Technician (LFT) / Rice Sector Focal',
    reviewedBy: '',
    reviewedTitle: 'Municipal Agriculturist / Municipal LFT Coordinator',
    approvedBy: '',
    approvedTitle: 'Municipal Mayor',
    isDefault: true
  },
  {
    id: 'letter-endorsement-da-rfo8',
    title: 'Endorsement to DA RFO-8 & Provincial Agriculture',
    memoRef: 'SLG-MAO-RICE-ENDORSE',
    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    memorandumFor: 'PROVINCIAL GOVERNOR',
    memorandumForTitle: 'Office of the Governor, Province of Southern Leyte',
    thru: 'PROVINCIAL AGRICULTURIST',
    thruTitle: 'Southern Leyte Provincial Agriculture Office',
    from: 'MUNICIPAL AGRICULTURIST',
    fromTitle: 'Municipal Agriculture Office, Silago, Southern Leyte',
    subject: 'ENDORSEMENT OF VERIFIED RICE FARMERS MASTERLIST FOR DA RFO-8 INTERVENTIONS AND PCIC CROP INSURANCE',
    openingGreeting: 'Warm agricultural greetings!',
    bodyParagraph1: 'The Municipal Agricultural Office of Silago respectfully transmits and endorses the attached masterlist of verified rice producers and farm parcels from Barangay {BARANGAY} for eligibility under the Department of Agriculture Regional Field Office VIII (DA RFO-8) Masagana Rice Industry Development Program (MRIDP).',
    includeStatsSummaryTable: true,
    bodyParagraph2: 'The beneficiaries listed herein have been fully verified with authentic RSBSA reference numbers and precision GPS parcel coordinates. We hereby endorse them for prioritized allocation of Certified Inbred/Hybrid Seeds, Fertilizer Discount Vouchers (FDV), Fuel Assistance, and Philippine Crop Insurance Corporation (PCIC) comprehensive crop coverage.',
    closingStatement: 'Favorable action, accreditation, and inclusion in the upcoming provincial distribution schedule are earnestly sought.',
    preparedBy: '',
    preparedTitle: 'Local Farmer Technician (LFT)',
    reviewedBy: '',
    reviewedTitle: 'Municipal Agriculturist',
    approvedBy: '',
    approvedTitle: 'Municipal Mayor',
    isDefault: true
  },
  {
    id: 'letter-certification-barangay-posting',
    title: 'Barangay Hall RSBSA Posting Certification',
    memoRef: 'SLG-MAO-CERT-2024-01A',
    date: 'March 01, 2024',
    memorandumFor: 'ALL CONCERNED RICE FARMERS AND RESIDENTS',
    memorandumForTitle: 'Barangay {BARANGAY}, Silago, Southern Leyte',
    thru: 'PUNONG BARANGAY AND SANGGUNIANG BARANGAY MEMBERS',
    thruTitle: 'Barangay Local Government Unit of {BARANGAY}',
    from: 'Municipal Agriculture Office',
    fromTitle: 'Municipality of Silago, Southern Leyte',
    subject: 'PUBLIC CERTIFICATION AND POSTING OF VERIFIED RSBSA MASTERLIST OF RICE PRODUCERS',
    openingGreeting: 'To all agricultural stakeholders and constituent farmers:',
    bodyParagraph1: 'THIS IS TO CERTIFY that the attached registry containing {FARMER_COUNT} registered rice farmers covering an aggregate cultivated area of {TOTAL_AREA} hectares in Barangay {BARANGAY} has been duly verified and posted on the official bulletin board of the Barangay Hall for public scrutiny and transparency.',
    includeStatsSummaryTable: true,
    bodyParagraph2: 'Farmers whose names are listed are confirmed registered under the RSBSA system. Any omission, spelling correction, or parcel boundary adjustment may be formally reported to the assigned Local Farmer Technician (LFT) or at the Municipal Agriculture Office within fifteen (15) working days from this date.',
    closingStatement: 'Issued this {DATE} at Silago, Southern Leyte for all legal, administrative, and subsidy entitlement purposes.',
    preparedBy: 'Wella S. Bongons',
    preparedTitle: 'Local Farmer Technician (LFT)',
    reviewedBy: 'Engr. Arnaldo M. Valdez',
    reviewedTitle: 'Municipal Agriculturist',
    approvedBy: 'Hon. Lemuel P. Honor',
    approvedTitle: 'Municipal Mayor',
    isDefault: true
  }
];

export const REPORT_LETTERS_STORAGE_KEY = 'silago_official_report_letters';

let inMemoryReportLetters: OfficialReportLetter[] = DEFAULT_REPORT_LETTERS;

// Hydrate from Supabase cloud database
if (typeof window !== 'undefined') {
  supabaseDb.getSetting<OfficialReportLetter[]>('official_report_letters').then((cloudLetters) => {
    if (Array.isArray(cloudLetters) && cloudLetters.length > 0) {
      inMemoryReportLetters = cloudLetters;
    }
  }).catch(() => {});
}

export function loadSavedReportLetters(): OfficialReportLetter[] {
  return inMemoryReportLetters;
}

export function saveReportLetters(letters: OfficialReportLetter[]) {
  inMemoryReportLetters = letters;
  supabaseDb.setSetting('official_report_letters', letters).catch(() => {});
}
