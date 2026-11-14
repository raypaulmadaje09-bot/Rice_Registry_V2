import React, { useEffect, useMemo, useState } from 'react';
import { FarmParcel } from '../types';
import { useApp } from '../context/AppContext';
import { isUserAuthorizedForBarangay } from '../data/barangays';
import { calculateCropGrowthStage, CropGrowthStageCalc } from '../data/riceVarieties';
import { withTimeout } from '../utils/supabaseClient';
import { ManageReferenceModal, ManageType } from './ManageReferenceModal';
import {
  useRegistryFormSchema,
  getParcelCustomFields,
  saveParcelCustomFields
} from '../data/formSchema';
import {
  OfficeCustomFieldsGrid,
  OfficeFieldManageButton,
  OfficeModalHeader,
  OfficeSectionCard,
  OFFICE_INPUT_CLASS,
  OFFICE_LABEL_CLASS,
  OFFICE_SELECT_CLASS,
  mergeCustomFieldValues,
  validateRequiredCustomFields
} from './OfficeFormPrimitives';
import { Save, Search, AlertTriangle, Loader2 } from 'lucide-react';

interface CropPlantingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialParcel?: FarmParcel | null;
}

/**
 * Municipal Agriculture Office Crop Variety & Planting Schedule Form.
 * Shows the complete office-style crop entry form immediately on open with a
 * clean search + dropdown selector for choosing a registered farmer record.
 */
export const CropPlantingModal: React.FC<CropPlantingModalProps> = ({
  isOpen,
  onClose,
  initialParcel = null
}) => {
  const {
    currentUser,
    parcels,
    updateParcel,
    varieties,
    ecosystems,
    tenures,
    seasons,
    irrigationAssociations
  } = useApp();

  const formSchema = useRegistryFormSchema();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<FarmParcel | null>(null);
  const [manageType, setManageType] = useState<ManageType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const sec3Label =
    formSchema.sections.find((s) => s.id === 'sec-crop')?.label ||
    '3. Variety, Irrigation & Tenure';
  const sec4Label =
    formSchema.sections.find((s) => s.id === 'sec-planting')?.label ||
    '4. Planting Date & Harvest';
  const customCropSections = formSchema.getCustomSections('crop');

  const [cropData, setCropData] = useState<{
    breed: string;
    seedType: string;
    purpose: string;
    irrigationAssociation: string;
    sex: string;
    croppingSeason: string;
    plantingDate: string;
    targetYieldMt: number;
  }>({
    breed: varieties[0]?.name || 'NSIC Rc 222',
    seedType: String(varieties[0]?.seedType || 'INBRED'),
    purpose: ecosystems[0] || 'Irrigated Lowland (NIA)',
    irrigationAssociation:
      irrigationAssociations[0] || 'Balagawan Communal Irrigators Association (BCIA)',
    sex: tenures[0] || 'Owner-Cultivator',
    croppingSeason: seasons[0] || 'Wet Season (WS) 2026 (June – Nov 2026)',
    plantingDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    targetYieldMt: 6.0
  });

  const populateFromParcel = (parcel: FarmParcel) => {
    const hasVariety =
      parcel.breed &&
      parcel.breed.toLowerCase() !== 'not yet assigned' &&
      varieties.some((v) => v.name.toLowerCase() === parcel.breed.toLowerCase());
    const defaultVariety = varieties[0]?.name || 'NSIC Rc 222';
    const resolvedBreed = hasVariety ? parcel.breed : parcel.variety || defaultVariety;
    const matchedVar = varieties.find((v) => v.name.toLowerCase() === resolvedBreed.toLowerCase());

    setCropData({
      breed: resolvedBreed,
      seedType: parcel.seedType || matchedVar?.seedType || 'INBRED',
      purpose: parcel.purpose || ecosystems[0] || 'Irrigated Lowland (NIA)',
      irrigationAssociation:
        parcel.irrigationAssociation ||
        irrigationAssociations[0] ||
        'Balagawan Communal Irrigators Association (BCIA)',
      sex: parcel.sex || tenures[0] || 'Owner-Cultivator',
      croppingSeason:
        parcel.croppingSeason || parcel.season || seasons[0] || 'Wet Season (WS) 2026 (June – Nov 2026)',
      plantingDate:
        parcel.plantingDate ||
        new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetYieldMt: Number(parcel.targetYieldMt) || matchedVar?.aveYieldMt || 6.0
    });
    setCustomValues(parcel.customFields || getParcelCustomFields(parcel.tagNumber));
  };

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setIsSubmitting(false);
    setSearchQuery('');
    if (initialParcel) {
      setSelectedParcel(initialParcel);
      populateFromParcel(initialParcel);
    } else {
      setSelectedParcel(null);
      setCustomValues({});
    }
  }, [isOpen, initialParcel]);

  const authorizedFarmers = useMemo(() => {
    return parcels.filter((p) => isUserAuthorizedForBarangay(currentUser, p.barangay));
  }, [parcels, currentUser]);

  const matchingFarmers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return authorizedFarmers;
    return authorizedFarmers.filter((p) => {
      const fullName =
        `${p.raiserName || ''} ${p.farmerFamilyName || ''} ${p.farmerGivenName || ''} ${p.farmerMiddleName || ''}`.toLowerCase();
      const rsbsa = `${p.swineNameOrId || ''} ${p.rsbsa_no || ''}`.toLowerCase();
      const tag = (p.tagNumber || '').toLowerCase();
      const brgy = (p.barangay || '').toLowerCase();
      return fullName.includes(q) || rsbsa.includes(q) || tag.includes(q) || brgy.includes(q);
    });
  }, [authorizedFarmers, searchQuery]);

  const handleSelectFarmer = (parcel: FarmParcel) => {
    setSelectedParcel(parcel);
    populateFromParcel(parcel);
    setError(null);
  };

  const handleVarietyChange = (varietyName: string) => {
    const matched = varieties.find((v) => v.name.toLowerCase() === varietyName.toLowerCase());
    setCropData((prev) => ({
      ...prev,
      breed: varietyName,
      seedType: matched ? matched.seedType : prev.seedType,
      targetYieldMt: matched ? matched.aveYieldMt : prev.targetYieldMt
    }));
  };

  const phenology: CropGrowthStageCalc = useMemo(() => {
    return calculateCropGrowthStage(cropData.plantingDate || '', cropData.breed || 'NSIC Rc 222');
  }, [cropData.plantingDate, cropData.breed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedParcel) {
      setError('Please select a registered farmer before saving.');
      return;
    }
    if (!isUserAuthorizedForBarangay(currentUser, selectedParcel.barangay)) {
      setError(`Access Denied: Brgy. ${selectedParcel.barangay} is outside your assigned jurisdiction.`);
      return;
    }
    if (formSchema.isVisible('crop-variety') && formSchema.isRequired('crop-variety') && !cropData.breed) {
      setError(`${formSchema.getLabel('crop-variety', 'Rice / Palay Variety')} is required.`);
      return;
    }
    if (formSchema.isVisible('crop-planting-date') && formSchema.isRequired('crop-planting-date') && !cropData.plantingDate) {
      setError(`${formSchema.getLabel('crop-planting-date', 'Date of Planting / Sowing')} is required.`);
      return;
    }
    const customErr = validateRequiredCustomFields(
      formSchema.getCustomFieldsForTarget('crop'),
      customValues
    );
    if (customErr) {
      setError(customErr);
      return;
    }

    const cropCustomFields = formSchema.getCustomFieldsForTarget('crop');
    const mergedCustomValues = mergeCustomFieldValues(cropCustomFields, customValues, {
      ...getParcelCustomFields(selectedParcel.tagNumber),
      ...(selectedParcel.customFields || {})
    });
    saveParcelCustomFields(selectedParcel.tagNumber, mergedCustomValues);

    const updatedParcel: FarmParcel = {
      ...selectedParcel,
      breed: cropData.breed,
      variety: cropData.breed,
      seedType: cropData.seedType,
      purpose: cropData.purpose,
      ecosystem: cropData.purpose,
      irrigationAssociation: cropData.irrigationAssociation,
      sex: cropData.sex,
      croppingSeason: cropData.croppingSeason,
      season: cropData.croppingSeason,
      plantingDate: cropData.plantingDate,
      targetYieldMt: Number(cropData.targetYieldMt) || 6.0,
      harvestDate: phenology.estimatedHarvestDate,
      healthStatus: phenology.stage,
      standingCropStage: phenology.stage,
      ageMonths: phenology.dap,
      customFields: mergedCustomValues
    };

    setIsSubmitting(true);
    try {
      await withTimeout(
        Promise.resolve(updateParcel(selectedParcel.tagNumber, updatedParcel)),
        8000,
        'Connection timed out. Record saved to local queue.'
      );
      onClose();
    } catch (err: any) {
      const isFetchError =
        err?.message?.includes('fetch') ||
        err?.message?.includes('Failed to fetch') ||
        err?.name === 'TypeError';
      if (isFetchError) {
        onClose();
      } else {
        setError(err?.message || 'Error saving crop & planting details. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white border border-slate-300 rounded-lg w-full max-w-3xl shadow-xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
          <OfficeModalHeader
            title="Crop & Planting Record Form"
            subtitle="Municipal Agriculture Office • Rice Variety, Irrigation & Planting Schedule"
            onClose={onClose}
          />

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-100/70">
              {error && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-md flex items-center gap-2 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Section 1: Clean Office Search + Dropdown Farmer Selector */}
              <OfficeSectionCard
                title="Registered Farmer"
                rightContent={
                  <span className="text-[11px] font-medium text-slate-600">
                    {authorizedFarmers.length}{' '}
                    {authorizedFarmers.length === 1 ? 'registered record' : 'registered records'}
                  </span>
                }
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5 space-y-1">
                    <label className={OFFICE_LABEL_CLASS}>Search Filter</label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Name, RSBSA No., or Barangay..."
                        className={`${OFFICE_INPUT_CLASS} pl-8 pr-12`}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-1">
                    <label className={OFFICE_LABEL_CLASS}>
                      Select Registered Farmer <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={selectedParcel?.tagNumber || ''}
                      onChange={(e) => {
                        const found = authorizedFarmers.find((p) => p.tagNumber === e.target.value);
                        if (found) handleSelectFarmer(found);
                        else setSelectedParcel(null);
                      }}
                      className={OFFICE_SELECT_CLASS}
                    >
                      <option value="">
                        -- Select Registered Farmer ({matchingFarmers.length}) --
                      </option>
                      {matchingFarmers.map((p) => (
                        <option key={p.tagNumber} value={p.tagNumber}>
                          {p.raiserName} — Brgy. {p.barangay} ({p.swineNameOrId || 'NO RSBSA'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {searchQuery && matchingFarmers.length === 0 && (
                  <p className="text-[11px] text-amber-700">
                    No registered farmer matched &ldquo;{searchQuery}&rdquo;.
                  </p>
                )}

                {selectedParcel && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-[11px]">
                    <div className="min-w-0">
                      <span className="text-slate-500 block">Farmer Name</span>
                      <span className="font-bold text-slate-900 truncate block">
                        {selectedParcel.raiserName}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 block">RSBSA No.</span>
                      <span className="font-mono font-semibold text-slate-800 truncate block">
                        {selectedParcel.swineNameOrId || 'NO RSBSA'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-slate-500 block">Barangay</span>
                      <span className="font-semibold text-slate-800 truncate block">
                        {selectedParcel.barangay}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Farm Area</span>
                      <span className="font-semibold text-slate-800">
                        {Number(selectedParcel.weightKg || selectedParcel.areaHa || 0).toFixed(2)} ha
                      </span>
                    </div>
                  </div>
                )}
              </OfficeSectionCard>

              {/* Section 3: Variety, Irrigation & Tenurial Details */}
              <OfficeSectionCard title={sec3Label}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {formSchema.isVisible('crop-variety') && (
                    <div className="space-y-1 sm:col-span-2">
                      <div className="flex items-center justify-between gap-2">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('crop-variety', 'Rice / Palay Variety')}{' '}
                          {formSchema.isRequired('crop-variety') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <OfficeFieldManageButton
                          label="Manage"
                          onClick={() => setManageType('variety')}
                        />
                      </div>
                      <select
                        required={formSchema.isRequired('crop-variety')}
                        value={cropData.breed}
                        onChange={(e) => handleVarietyChange(e.target.value)}
                        className={OFFICE_SELECT_CLASS}
                      >
                        {varieties.map((v) => (
                          <option key={v.name} value={v.name}>
                            {v.name} ({v.seedType} • {v.maturityDays} DAS)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formSchema.isVisible('crop-seed-type') && (
                    <div className="space-y-1">
                      <label className={OFFICE_LABEL_CLASS}>
                        {formSchema.getLabel('crop-seed-type', 'Seed Type')}{' '}
                        {formSchema.isRequired('crop-seed-type') && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      <select
                        required={formSchema.isRequired('crop-seed-type')}
                        value={cropData.seedType}
                        onChange={(e) => setCropData({ ...cropData, seedType: e.target.value })}
                        className={OFFICE_SELECT_CLASS}
                      >
                        <option value="INBRED">INBRED (Certified Seeds)</option>
                        <option value="HYBRID">HYBRID (Hybrid Seeds)</option>
                        <option value="UNKNOWN">UNKNOWN / Farmer Saved</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {formSchema.isVisible('crop-ecosystem') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('crop-ecosystem', 'Agro-Ecosystem / Water Source')}{' '}
                          {formSchema.isRequired('crop-ecosystem') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <OfficeFieldManageButton onClick={() => setManageType('ecosystem')} />
                      </div>
                      <select
                        required={formSchema.isRequired('crop-ecosystem')}
                        value={cropData.purpose}
                        onChange={(e) => setCropData({ ...cropData, purpose: e.target.value })}
                        className={OFFICE_SELECT_CLASS}
                      >
                        {ecosystems.map((eco) => (
                          <option key={eco} value={eco}>
                            {eco}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formSchema.isVisible('crop-ia') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('crop-ia', 'Irrigation Association (IA)')}{' '}
                          {formSchema.isRequired('crop-ia') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <OfficeFieldManageButton
                          onClick={() => setManageType('irrigationAssociation')}
                        />
                      </div>
                      <select
                        required={formSchema.isRequired('crop-ia')}
                        value={cropData.irrigationAssociation}
                        onChange={(e) =>
                          setCropData({ ...cropData, irrigationAssociation: e.target.value })
                        }
                        className={OFFICE_SELECT_CLASS}
                      >
                        {irrigationAssociations.map((ia) => (
                          <option key={ia} value={ia}>
                            {ia}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formSchema.isVisible('crop-tenure') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('crop-tenure', 'Tenurial Status')}{' '}
                          {formSchema.isRequired('crop-tenure') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <OfficeFieldManageButton onClick={() => setManageType('tenure')} />
                      </div>
                      <select
                        required={formSchema.isRequired('crop-tenure')}
                        value={cropData.sex}
                        onChange={(e) => setCropData({ ...cropData, sex: e.target.value })}
                        className={OFFICE_SELECT_CLASS}
                      >
                        {tenures.map((ten) => (
                          <option key={ten} value={ten}>
                            {ten}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formSchema.isVisible('crop-season') && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('crop-season', 'Cropping Season')}{' '}
                          {formSchema.isRequired('crop-season') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <OfficeFieldManageButton onClick={() => setManageType('season')} />
                      </div>
                      <select
                        required={formSchema.isRequired('crop-season')}
                        value={cropData.croppingSeason}
                        onChange={(e) => setCropData({ ...cropData, croppingSeason: e.target.value })}
                        className={OFFICE_SELECT_CLASS}
                      >
                        {seasons.map((seas) => (
                          <option key={seas} value={seas}>
                            {seas}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <OfficeCustomFieldsGrid
                  fields={formSchema.getCustomFieldsForSection(sec3Label)}
                  values={customValues}
                  onChange={(fieldId, value) =>
                    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
                  }
                />
              </OfficeSectionCard>

              {/* Section 4: Planting Schedule & Automated Phenology Summary */}
              <OfficeSectionCard title={sec4Label}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {formSchema.isVisible('crop-planting-date') && (
                    <div className="space-y-1">
                      <label className={OFFICE_LABEL_CLASS}>
                        {formSchema.getLabel('crop-planting-date', 'Date of Planting / Sowing')}{' '}
                        {formSchema.isRequired('crop-planting-date') && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      <input
                        type="date"
                        required={formSchema.isRequired('crop-planting-date')}
                        value={cropData.plantingDate}
                        onChange={(e) => setCropData({ ...cropData, plantingDate: e.target.value })}
                        className={`${OFFICE_INPUT_CLASS} font-medium`}
                      />
                    </div>
                  )}

                  {formSchema.isVisible('crop-target-yield') && (
                    <div className="space-y-1">
                      <label className={OFFICE_LABEL_CLASS}>
                        {formSchema.getLabel('crop-target-yield', 'Target Yield (Metric Tons)')}{' '}
                        {formSchema.isRequired('crop-target-yield') && (
                          <span className="text-red-600">*</span>
                        )}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        required={formSchema.isRequired('crop-target-yield')}
                        placeholder={formSchema.getPlaceholder('crop-target-yield', 'e.g. 6.0')}
                        value={cropData.targetYieldMt}
                        onChange={(e) =>
                          setCropData({ ...cropData, targetYieldMt: Number(e.target.value) })
                        }
                        className={`${OFFICE_INPUT_CLASS} font-medium`}
                      />
                    </div>
                  )}
                </div>

                {formSchema.isVisible('crop-phenology') && (
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-3 space-y-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Crop Stage</span>
                        <span className="font-bold text-slate-900">{phenology.stage}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Days After Sowing</span>
                        <span className="font-bold text-slate-900">
                          {phenology.dap} DAS ({phenology.percentageMaturity}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Growth Phase</span>
                        <span className="font-semibold text-slate-800">{phenology.phase}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Est. Harvest Date</span>
                        <span className="font-bold text-emerald-800">
                          {phenology.estimatedHarvestDate} ({phenology.maturityDays} days)
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-700 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${phenology.percentageMaturity}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-600">{phenology.description}</p>
                  </div>
                )}

                <OfficeCustomFieldsGrid
                  fields={formSchema.getCustomFieldsForSection(sec4Label)}
                  values={customValues}
                  onChange={(fieldId, value) =>
                    setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
                  }
                />
              </OfficeSectionCard>

              {customCropSections.map((sec) => {
                const secFields = formSchema.getCustomFieldsForSection(sec.label);
                if (secFields.length === 0) return null;
                return (
                  <OfficeSectionCard key={sec.id} title={sec.label}>
                    <OfficeCustomFieldsGrid
                      fields={secFields}
                      values={customValues}
                      onChange={(fieldId, value) =>
                        setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
                      }
                    />
                  </OfficeSectionCard>
                );
              })}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <span className="text-[11px] font-medium text-slate-600">
                {selectedParcel
                  ? `Selected farmer: ${selectedParcel.raiserName}`
                  : 'Select a registered farmer to enable saving'}
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!selectedParcel || isSubmitting}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center gap-2 ${
                    !selectedParcel || isSubmitting
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Crop &amp; Planting Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {manageType && (
        <ManageReferenceModal
          isOpen={!!manageType}
          onClose={() => setManageType(null)}
          type={manageType}
          onSelect={(val) => {
            if (manageType === 'variety') handleVarietyChange(val);
            else if (manageType === 'ecosystem') setCropData((p) => ({ ...p, purpose: val }));
            else if (manageType === 'tenure') setCropData((p) => ({ ...p, sex: val }));
            else if (manageType === 'season') setCropData((p) => ({ ...p, croppingSeason: val }));
            else if (manageType === 'irrigationAssociation')
              setCropData((p) => ({ ...p, irrigationAssociation: val }));
          }}
        />
      )}
    </>
  );
};
