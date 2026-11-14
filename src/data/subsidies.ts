import { GovernmentSubsidyProgram, SubsidyCategory } from '../types';

export const SUBSIDY_CATEGORIES: SubsidyCategory[] = [
  'Seedlings / Seeds',
  'Fertilizer',
  'Farm Input Pack',
  'Cash / Voucher'
];

export const DEFAULT_SUBSIDY_PROGRAMS: GovernmentSubsidyProgram[] = [
  {
    id: 'prog-rcef-seeds-2026ws',
    title: 'Free Certified Palay Seedlings / Seeds (RCEF)',
    category: 'Seedlings / Seeds',
    itemDescription: 'NSIC Certified Inbred Palay Seeds / Seedlings (20 kg per bag)',
    defaultQuantity: '2 bags / ha',
    fundingSource: 'DA-RFO VIII / RCEF Seed Program',
    season: 'Wet Season (WS) 2026',
    targetBarangay: 'All Barangays',
    distributionDate: '2026-06-15',
    status: 'Active',
    createdAt: '2026-06-01T08:00:00.000Z'
  },
  {
    id: 'prog-gov-fertilizer-2026ws',
    title: 'Free Government Fertilizer Assistance (Urea & Complete)',
    category: 'Fertilizer',
    itemDescription: 'Urea (46-0-0) & Complete (14-14-14) Fertilizer Allocation',
    defaultQuantity: '2 bags',
    fundingSource: 'DA National Rice Program / LGU-Silago',
    season: 'Wet Season (WS) 2026',
    targetBarangay: 'All Barangays',
    distributionDate: '2026-06-20',
    status: 'Active',
    createdAt: '2026-06-05T08:00:00.000Z'
  }
];
