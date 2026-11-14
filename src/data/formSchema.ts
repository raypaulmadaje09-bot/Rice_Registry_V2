import { useEffect, useState } from 'react';
import { supabaseDb } from '../utils/supabaseClient';

export type FormTarget = 'registration' | 'crop';

export interface RegistryFormSection {
  id: string;
  label: string;
  description: string;
  formTarget: FormTarget;
  isCore?: boolean;
}

export interface RegistryField {
  id: string;
  name: string;
  section: string;
  formTarget: FormTarget;
  required: boolean;
  visible: boolean;
  isCore?: boolean;
  placeholder?: string;
  helpText?: string;
  fieldType?: string;
  valueBehavior?: 'editable' | 'fixed' | 'auto';
  fixedValue?: string;
  options?: string[];
}

export interface PersistedFormSchema {
  sections: RegistryFormSection[];
  fields: RegistryField[];
}

export const FORM_SCHEMA_STORAGE_KEY = 'silago_form_schema_v3';
export const PARCEL_CUSTOM_FIELDS_KEY = 'silago_parcel_custom_fields';
export const FORM_SCHEMA_EVENT = 'silago-form-schema-updated';

export const DEFAULT_FORM_SECTIONS: RegistryFormSection[] = [
  {
    id: 'sec-farmer',
    label: '1. Farmer & RSBSA Profile',
    description: 'RSBSA reference, parcel ID, contact details, legal name, birth date, residential barangay, and ID photo.',
    formTarget: 'registration',
    isCore: true
  },
  {
    id: 'sec-location',
    label: '2. Farm Location & GPS',
    description: 'Farm barangay jurisdiction, purok/sitio, parcel hectares, latitude/longitude coordinates, and field photo.',
    formTarget: 'registration',
    isCore: true
  },
  {
    id: 'sec-crop',
    label: '3. Variety, Irrigation & Tenure',
    description: 'Registered rice variety, seed classification, water source, irrigators association, tenure, and cropping season.',
    formTarget: 'crop',
    isCore: true
  },
  {
    id: 'sec-planting',
    label: '4. Planting Date & Harvest',
    description: 'Planting/sowing date, target harvest yield (MT), and automated crop phenology schedule.',
    formTarget: 'crop',
    isCore: true
  }
];

export const DEFAULT_FORM_FIELDS: RegistryField[] = [
  // Section 1: 1. Farmer & RSBSA Profile (Rice Farm Registration Form - Step 1)
  {
    id: 'reg-rsbsa',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'RSBSA No. / Reference',
    fieldType: 'Text Field',
    required: false,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. 08-64-16-002-000061 or NO RSBSA',
    helpText: 'Unique Registry System for Basic Sectors in Agriculture ID'
  },
  {
    id: 'reg-parcel-id',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Registration Parcel ID',
    fieldType: 'Text Field',
    required: false,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. FARMER-SLG-POB1-101',
    helpText: 'Auto-formatted municipal parcel identifier'
  },
  {
    id: 'reg-contact',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Mobile / Contact No.',
    fieldType: 'Text Field',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: '09XXXXXXXXX',
    helpText: '11-digit mobile number for SMS advisories and claim pickup notices'
  },
  {
    id: 'reg-family-name',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Family Name',
    fieldType: 'Text Field',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. ALAS',
    helpText: 'Farmer surname (used for alphabetical RSBSA masterlist sorting)'
  },
  {
    id: 'reg-given-name',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Given Name',
    fieldType: 'Text Field',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. MARIO',
    helpText: 'Farmer first / given legal name'
  },
  {
    id: 'reg-middle-name',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Middle Name',
    fieldType: 'Text Field',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. CABUG-OS',
    helpText: 'Optional middle name'
  },
  {
    id: 'reg-birthday',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Date of Birth',
    fieldType: 'Date Field',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'YYYY-MM-DD',
    helpText: 'Used for RSBSA age verification and PCIC enrollment'
  },
  {
    id: 'reg-res-barangay',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Residential Barangay',
    fieldType: 'Barangay Selector',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Select Residential Barangay',
    helpText: 'Domicile barangay within Municipality of Silago'
  },
  {
    id: 'reg-farmer-photo',
    section: '1. Farmer & RSBSA Profile',
    formTarget: 'registration',
    name: 'Farmer ID Photo (1x1 / 2x2 Optional)',
    fieldType: 'File Upload',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Upload ID Photo',
    helpText: 'Identification photograph of the registered riceland owner'
  },

  // Section 2: 2. Farm Location & GPS (Rice Farm Registration Form - Step 2)
  {
    id: 'reg-farm-barangay',
    section: '2. Farm Location & GPS',
    formTarget: 'registration',
    name: 'Farm Location Barangay',
    fieldType: 'Barangay Selector',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'Select Farm Barangay',
    helpText: 'Official barangay where the rice parcel is situated'
  },
  {
    id: 'reg-purok',
    section: '2. Farm Location & GPS',
    formTarget: 'registration',
    name: 'Purok / Sitio',
    fieldType: 'Text Field',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. Purok Riverside',
    helpText: 'Local zone, purok, or sitio address of the farm'
  },
  {
    id: 'reg-area',
    section: '2. Farm Location & GPS',
    formTarget: 'registration',
    name: 'Farm Area (Hectares)',
    fieldType: 'Number Field',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. 1.25',
    helpText: 'Total cultivated rice parcel area in hectares (0.05 – 100 ha)'
  },
  {
    id: 'reg-lat',
    section: '2. Farm Location & GPS',
    formTarget: 'registration',
    name: 'Latitude',
    fieldType: 'Number Field',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: '10.5335',
    helpText: 'WGS84 decimal latitude coordinate of the parcel'
  },
  {
    id: 'reg-lng',
    section: '2. Farm Location & GPS',
    formTarget: 'registration',
    name: 'Longitude',
    fieldType: 'Number Field',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: '125.1620',
    helpText: 'WGS84 decimal longitude coordinate of the parcel'
  },
  {
    id: 'reg-field-photo',
    section: '2. Farm Location & GPS',
    formTarget: 'registration',
    name: 'Georeferenced Farm Field Photo (Optional)',
    fieldType: 'File Upload',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Upload Field Photo',
    helpText: 'Field boundary or standing paddy verification photo'
  },

  // Section 3: 3. Variety, Irrigation & Tenure (Crop & Planting Form)
  {
    id: 'crop-variety',
    section: '3. Variety, Irrigation & Tenure',
    formTarget: 'crop',
    name: 'Rice / Palay Variety',
    fieldType: 'Dropdown Menu',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'Select Rice Variety',
    helpText: 'Managed in Reference Varieties list',
    options: ['NSIC Rc 222 (INBRED • 114 DAS)', 'NSIC Rc 160', 'NSIC Rc 216', 'NSIC Rc 480']
  },
  {
    id: 'crop-seed-type',
    section: '3. Variety, Irrigation & Tenure',
    formTarget: 'crop',
    name: 'Seed Type',
    fieldType: 'Dropdown Menu',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Select Seed Class',
    helpText: 'Seed certification type (Inbred, Hybrid, or Farmer Saved)',
    options: ['INBRED (Certified Seeds)', 'HYBRID (Hybrid Seeds)', 'UNKNOWN / Farmer Saved']
  },
  {
    id: 'crop-ecosystem',
    section: '3. Variety, Irrigation & Tenure',
    formTarget: 'crop',
    name: 'Agro-Ecosystem / Water Source',
    fieldType: 'Dropdown Menu',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Select Ecosystem',
    helpText: 'Managed in Reference Ecosystems list'
  },
  {
    id: 'crop-ia',
    section: '3. Variety, Irrigation & Tenure',
    formTarget: 'crop',
    name: 'Irrigation Association (IA)',
    fieldType: 'Dropdown Menu',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Select Irrigation Association',
    helpText: 'Managed in Reference Irrigation Associations list'
  },
  {
    id: 'crop-tenure',
    section: '3. Variety, Irrigation & Tenure',
    formTarget: 'crop',
    name: 'Tenurial Status',
    fieldType: 'Dropdown Menu',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Select Tenurial Status',
    helpText: 'Owner-Cultivator, Tenant, Leaseholder, etc.'
  },
  {
    id: 'crop-season',
    section: '3. Variety, Irrigation & Tenure',
    formTarget: 'crop',
    name: 'Cropping Season',
    fieldType: 'Dropdown Menu',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'Select Cropping Season',
    helpText: 'Current municipal wet or dry season cycle'
  },

  // Section 4: 4. Planting Date & Harvest (Crop & Planting Form)
  {
    id: 'crop-planting-date',
    section: '4. Planting Date & Harvest',
    formTarget: 'crop',
    name: 'Date of Planting / Sowing',
    fieldType: 'Date Field',
    required: true,
    visible: true,
    isCore: true,
    valueBehavior: 'editable',
    placeholder: 'YYYY-MM-DD',
    helpText: 'Used for automatic DAS & harvest date computation'
  },
  {
    id: 'crop-target-yield',
    section: '4. Planting Date & Harvest',
    formTarget: 'crop',
    name: 'Target Yield (Metric Tons)',
    fieldType: 'Number Field',
    required: false,
    visible: true,
    valueBehavior: 'editable',
    placeholder: 'e.g. 6.0',
    helpText: 'Expected harvest output per hectare in metric tons'
  },
  {
    id: 'crop-phenology',
    section: '4. Planting Date & Harvest',
    formTarget: 'crop',
    name: 'Automated Phenology & Est. Harvest',
    fieldType: 'Auto-Calculated Schedule',
    required: false,
    visible: true,
    isCore: true,
    valueBehavior: 'auto',
    placeholder: 'Auto-calculated from planting date & variety maturity',
    helpText: 'Computes crop stage, days after sowing (DAS), maturity %, and estimated harvest date'
  }
];

export const BUILTIN_FIELD_IDS = new Set(DEFAULT_FORM_FIELDS.map((f) => f.id));

/**
 * Reads persisted form customization schema (sections & fields) with fallback to the
 * official 4-section Rice Registry structure.
 */
export function loadFormSchema(): PersistedFormSchema {
  if (typeof window === 'undefined') {
    return { sections: DEFAULT_FORM_SECTIONS, fields: DEFAULT_FORM_FIELDS };
  }
  try {
    const raw = localStorage.getItem(FORM_SCHEMA_STORAGE_KEY);
    if (!raw) return { sections: DEFAULT_FORM_SECTIONS, fields: DEFAULT_FORM_FIELDS };
    const parsed = JSON.parse(raw) as Partial<PersistedFormSchema>;
    const validSections =
      Array.isArray(parsed?.sections) && parsed.sections.length > 0
        ? parsed.sections
        : DEFAULT_FORM_SECTIONS;
    const validFields =
      Array.isArray(parsed?.fields) && parsed.fields.length > 0
        ? parsed.fields
        : DEFAULT_FORM_FIELDS;
    return { sections: validSections, fields: validFields };
  } catch {
    return { sections: DEFAULT_FORM_SECTIONS, fields: DEFAULT_FORM_FIELDS };
  }
}

/**
 * Persists customized form schema locally, notifies live open modals/forms,
 * and syncs to Supabase `app_settings` so staff workspaces reflect changes immediately.
 */
export function saveFormSchema(
  sections: RegistryFormSection[],
  fields: RegistryField[],
  syncToCloud = true
): void {
  const payload: PersistedFormSchema = { sections, fields };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FORM_SCHEMA_STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(FORM_SCHEMA_EVENT, { detail: payload }));
    } catch {}
  }
  if (syncToCloud) {
    try {
      supabaseDb.setSetting(FORM_SCHEMA_STORAGE_KEY, payload);
    } catch {}
  }
}

/**
 * Restores the standard 4-section Rice Farm Registration & Crop Form schema.
 */
export function resetFormSchema(): PersistedFormSchema {
  saveFormSchema(DEFAULT_FORM_SECTIONS, DEFAULT_FORM_FIELDS, true);
  return { sections: DEFAULT_FORM_SECTIONS, fields: DEFAULT_FORM_FIELDS };
}

/**
 * Loads per-parcel answers for custom fields created via Form Customization.
 */
export function loadParcelCustomFieldsMap(): Record<string, Record<string, string>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(PARCEL_CUSTOM_FIELDS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function getParcelCustomFields(tagNumber: string | undefined): Record<string, string> {
  if (!tagNumber) return {};
  const map = loadParcelCustomFieldsMap();
  return map[tagNumber] || {};
}

export function saveParcelCustomFields(
  tagNumber: string,
  values: Record<string, string>,
  syncToCloud = true
): void {
  if (!tagNumber) return;
  const cleaned: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) {
    if (String(v ?? '').trim() !== '') cleaned[k] = String(v);
  }
  const map = loadParcelCustomFieldsMap();
  if (Object.keys(cleaned).length > 0) {
    map[tagNumber] = cleaned;
  } else {
    delete map[tagNumber];
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(PARCEL_CUSTOM_FIELDS_KEY, JSON.stringify(map));
    } catch {}
  }
  if (syncToCloud) {
    try {
      supabaseDb.setSetting(PARCEL_CUSTOM_FIELDS_KEY, map);
    } catch {}
  }
}

/**
 * React hook consumed by Form Customization, AddParcelModal, and CropPlantingModal
 * so changes published in Form Customization reflect live across all registration dialogs.
 */
export function useRegistryFormSchema() {
  const [schema, setSchema] = useState<PersistedFormSchema>(() => loadFormSchema());

  useEffect(() => {
    const handleUpdate = () => {
      setSchema(loadFormSchema());
    };
    window.addEventListener(FORM_SCHEMA_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(FORM_SCHEMA_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const fieldMap = new Map(schema.fields.map((f) => [f.id, f]));

  const getField = (id: string) => fieldMap.get(id);
  const isVisible = (id: string) => {
    const f = fieldMap.get(id);
    return f ? f.visible !== false : true;
  };
  const isRequired = (id: string) => {
    const f = fieldMap.get(id);
    return Boolean(f?.required);
  };
  const getLabel = (id: string, fallback: string) => fieldMap.get(id)?.name || fallback;
  const getPlaceholder = (id: string, fallback = '') => fieldMap.get(id)?.placeholder || fallback;
  const getHelpText = (id: string) => fieldMap.get(id)?.helpText || '';

  const getCustomFieldsForSection = (sectionLabel: string) =>
    schema.fields.filter(
      (f) => f.section === sectionLabel && !BUILTIN_FIELD_IDS.has(f.id) && f.visible !== false
    );

  const getCustomFieldsForTarget = (target: FormTarget) =>
    schema.fields.filter(
      (f) => f.formTarget === target && !BUILTIN_FIELD_IDS.has(f.id) && f.visible !== false
    );

  const getCustomSections = (target: FormTarget) =>
    schema.sections.filter((s) => s.formTarget === target && !s.isCore);

  return {
    sections: schema.sections,
    fields: schema.fields,
    getField,
    isVisible,
    isRequired,
    getLabel,
    getPlaceholder,
    getHelpText,
    getCustomFieldsForSection,
    getCustomFieldsForTarget,
    getCustomSections
  };
}
