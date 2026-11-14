import React, { useState, useEffect, useMemo } from 'react';
import { FarmParcel } from '../types';
import {
  BARANGAYS,
  OFFICIAL_15_BARANGAYS,
  getAssignedLftForBarangay,
  getUserAssignedBarangays,
  isUserAuthorizedForBarangay,
  matchBarangay
} from '../data/barangays';
import { useApp } from '../context/AppContext';
import { uploadFarmPhoto, supabaseClient, parseFarmerName, checkDuplicateRsbsa, checkDuplicateFarmerName, withTimeout } from '../utils/supabaseClient';
import {
  getParcelCustomFields,
  saveParcelCustomFields,
  useRegistryFormSchema
} from '../data/formSchema';
import {
  OfficeCustomFieldsGrid,
  OfficeModalHeader,
  OfficePhotoField,
  OfficeSectionCard,
  OFFICE_INPUT_CLASS,
  OFFICE_LABEL_CLASS,
  OFFICE_SELECT_CLASS,
  mergeCustomFieldValues,
  validateRequiredCustomFields
} from './OfficeFormPrimitives';
import {
  X,
  Save,
  MapPin,
  Navigation,
  Trash2,
  AlertTriangle,
  User,
  CheckCircle2,
  Image as ImageIcon,
  PenTool,
  Loader2,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

type RegistrationStep = 1 | 2;

const REGISTRATION_STEPS: Array<{
  step: RegistrationStep;
  shortLabel: string;
  label: string;
  icon: React.ElementType;
}> = [
  { step: 1, shortLabel: 'Farmer & RSBSA', label: '1. Farmer & RSBSA Profile', icon: User },
  { step: 2, shortLabel: 'Location & GPS', label: '2. Farm Location & GPS Coordinates', icon: MapPin }
];

interface AddParcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (parcel: FarmParcel) => Promise<void> | void;
  editingParcel?: FarmParcel | null;
  initialCoords?: {
    lat: number;
    lng: number;
    boundaryCoords?: [number, number][];
    areaHa?: number;
    barangay?: string;
  } | null;
  defaultBarangay?: string;
  onDelete?: (tagNumber: string) => void;
}

export const AddParcelModal: React.FC<AddParcelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingParcel,
  initialCoords,
  defaultBarangay,
  onDelete
}) => {
  const {
    currentUser,
    permissions,
    ecosystems,
    tenures,
    seasons,
    irrigationAssociations,
    parcels
  } = useApp();

  // Determine LFT jurisdiction
  const assignedBarangays = useMemo(() => {
    return getUserAssignedBarangays(currentUser);
  }, [currentUser]);

  // Check if current user is restricted from editing this parcel
  const isRestrictedForEditing = useMemo(() => {
    if (!editingParcel) return false;
    return !isUserAuthorizedForBarangay(currentUser, editingParcel.barangay);
  }, [editingParcel, currentUser]);

  // Filter available barangays to user's assigned jurisdiction if they are an LFT
  const availableBarangays = useMemo(() => {
    if (!assignedBarangays) return BARANGAYS;
    return BARANGAYS.filter((b) =>
      assignedBarangays.some((ab) => matchBarangay(b.name, ab))
    );
  }, [assignedBarangays]);

  // Determine the effective default barangay for new registrations
  const effectiveDefaultBarangay = useMemo(() => {
    if (assignedBarangays && assignedBarangays.length > 0) {
      const match = assignedBarangays.find((b) =>
        matchBarangay(defaultBarangay || '', b)
      );
      return match || assignedBarangays[0];
    }
    return defaultBarangay || availableBarangays[0]?.name || OFFICIAL_15_BARANGAYS[0];
  }, [assignedBarangays, defaultBarangay, availableBarangays]);

  // Confirm delete dialog in edit mode
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Photo upload states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingFieldPhoto, setIsUploadingFieldPhoto] = useState(false);

  // Geolocation state
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoSuccess, setGeoSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Strict Duplicate Validation and Error Handling States
  const [duplicateRsbsaMatch, setDuplicateRsbsaMatch] = useState<{ farmerName: string; rsbsa: string } | null>(null);
  const [isCheckingRsbsa, setIsCheckingRsbsa] = useState(false);
  const [duplicateNameMatch, setDuplicateNameMatch] = useState<{
    existingName: string;
    barangay: string;
    isExactSameRecord?: boolean;
  } | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameDuplicateResolution, setNameDuplicateResolution] = useState<'unresolved' | 'same_person' | 'distinct_person'>('unresolved');
  const [showNameDuplicateToast, setShowNameDuplicateToast] = useState(false);
  const [uniqueViolationAlert, setUniqueViolationAlert] = useState<string | null>(null);
  const formSchema = useRegistryFormSchema();
  const sec1Label =
    formSchema.sections.find((s) => s.id === 'sec-farmer')?.label || '1. Farmer & RSBSA Profile';
  const sec2Label =
    formSchema.sections.find((s) => s.id === 'sec-location')?.label || '2. Farm Location & GPS';
  const customRegSections = formSchema.getCustomSections('registration');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState<RegistrationStep>(1);
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  // Form State
  const [formData, setFormData] = useState<Partial<FarmParcel>>({
    tagNumber: '',
    swineNameOrId: '',
    farmerFamilyName: '',
    farmerGivenName: '',
    farmerMiddleName: '',
    raiserName: '',
    birthday: '',
    contactNumber: '09175551234',
    barangay: effectiveDefaultBarangay,
    purok: 'Purok Riverside',
    address: 'Silago, Southern Leyte',
    breed: 'NSIC Rc 222',
    seedType: 'INBRED',
    sex: 'Owner-Cultivator',
    ageMonths: 90,
    weightKg: 1.45,
    scale: 'Smallholder (<2 ha)',
    purpose: 'Irrigated Lowland (NIA)',
    irrigationAssociation: 'Balagawan Communal Irrigators Association (BCIA)',
    vaccinationStatus: 'RSBSA Enrolled & PCIC Insured',
    healthStatus: 'Active Crop (Tillering)',
    biosecurityScore: 'Georeferenced (GPS Polygon Mapped)',
    registrationDate: new Date().toISOString().split('T')[0],
    focalPerson: getAssignedLftForBarangay(effectiveDefaultBarangay).name,
    lat: 10.5335,
    lng: 125.162,
    syncStatus: 'Live Synced',
    targetYieldMt: 6.1,
    plantingDate: '',
    croppingSeason: 'Wet Season (WS) 2026 (June – Nov 2026)',
    commodity: 'Rice',
    pestAdvisoryNotice: 'Routine water and nutrient monitoring advised.'
  });

  // Populate data when modal opens or editingParcel changes
  useEffect(() => {
    if (editingParcel) {
      // Parse family, given, middle safely using "LAST, FIRST MIDDLE" and space-separated parser
      const parsedName = parseFarmerName(editingParcel.raiserName || '');
      const fam = editingParcel.farmerFamilyName || parsedName.family || '';
      const giv = editingParcel.farmerGivenName || parsedName.given || '';
      const mid = editingParcel.farmerMiddleName || parsedName.middle || '';

      setFormData({
        ...editingParcel,
        farmerFamilyName: fam,
        farmerGivenName: giv,
        farmerMiddleName: mid,
        weightKg:
          Number(editingParcel.weightKg || editingParcel.areaHa || editingParcel.farm_area_ha) ||
          1.25,
        irrigationAssociation:
          editingParcel.irrigationAssociation ||
          irrigationAssociations[0] ||
          'Balagawan Communal Irrigators Association (BCIA)',
        seedType: editingParcel.seedType || 'INBRED',
        commodity: 'Rice'
      });
      setCustomValues(
        editingParcel.customFields || getParcelCustomFields(editingParcel.tagNumber)
      );
    } else {
      setCustomValues({});
      const randomTag = `FARMER-SLG-${(defaultBarangay || 'POB1').substring(0, 4).toUpperCase().replace(/\s+/g, '')}-${Math.floor(
        1000 + Math.random() * 9000
      )}`;
      const randomRsbsa = `08-64-16-${String(Math.floor(1 + Math.random() * 15)).padStart(3, '0')}-${String(
        Math.floor(1000 + Math.random() * 9000)
      )}`;

      setFormData({
        tagNumber: randomTag,
        swineNameOrId: randomRsbsa,
        farmerFamilyName: '',
        farmerGivenName: '',
        farmerMiddleName: '',
        raiserName: '',
        birthday: '1975-06-15',
        contactNumber: '09175551234',
        barangay: (initialCoords?.barangay && availableBarangays.some(b => matchBarangay(b.name, initialCoords.barangay!)))
          ? initialCoords.barangay
          : effectiveDefaultBarangay,
        purok: 'Purok Riverside',
        address: `${(initialCoords?.barangay && availableBarangays.some(b => matchBarangay(b.name, initialCoords.barangay!))) ? initialCoords.barangay : effectiveDefaultBarangay}, Silago, Southern Leyte`,
        residential_address: `${(initialCoords?.barangay && availableBarangays.some(b => matchBarangay(b.name, initialCoords.barangay!))) ? initialCoords.barangay : effectiveDefaultBarangay}, Silago, Southern Leyte`,
        breed: 'Not yet assigned',
        seedType: 'INBRED',
        sex: tenures[0] || 'Owner-Cultivator',
        ageMonths: 0,
        weightKg: initialCoords?.areaHa ? Number(initialCoords.areaHa.toFixed(2)) : 1.25,
        scale: (initialCoords?.areaHa || 1.25) < 2
          ? 'Smallholder (<2 ha)'
          : (initialCoords?.areaHa || 1.25) <= 5
          ? 'Medium Farm (2-5 ha)'
          : 'Commercial (>5 ha)',
        purpose: ecosystems[0] || 'Irrigated Lowland (NIA)',
        irrigationAssociation:
          irrigationAssociations[0] || 'Balagawan Communal Irrigators Association (BCIA)',
        vaccinationStatus: 'RSBSA Enrolled & PCIC Insured',
        healthStatus: 'Registered (Pending Crop Form)',
        biosecurityScore: 'Georeferenced (GPS Polygon Mapped)',
        registrationDate: new Date().toISOString().split('T')[0],
        focalPerson: getAssignedLftForBarangay(
          (initialCoords?.barangay && availableBarangays.some(b => matchBarangay(b.name, initialCoords.barangay!)))
            ? initialCoords.barangay
            : effectiveDefaultBarangay
        ).name,
        lat: initialCoords ? Number(initialCoords.lat.toFixed(6)) : 10.5335,
        lng: initialCoords ? Number(initialCoords.lng.toFixed(6)) : 125.162,
        boundaryCoords: initialCoords?.boundaryCoords,
        syncStatus: 'Live Synced',
        targetYieldMt: 6.0,
        plantingDate: '',
        croppingSeason: seasons[0] || 'Wet Season (WS) 2026 (June – Nov 2026)',
        commodity: 'Rice',
        pestAdvisoryNotice: 'Routine water and nutrient monitoring advised.'
      });
    }
    setConfirmDelete(false);
    setError(null);
    setDuplicateRsbsaMatch(null);
    setDuplicateNameMatch(null);
    setNameDuplicateResolution('unresolved');
    setShowNameDuplicateToast(false);
    setUniqueViolationAlert(null);
    setIsSubmitting(false);
    setActiveStep(1);
  }, [editingParcel, defaultBarangay, effectiveDefaultBarangay, initialCoords, isOpen]);

  // 1. Real-time Duplicate Check for RSBSA Number (both local state and Supabase query)
  useEffect(() => {
    const inputRsbsa = (formData.swineNameOrId || '').trim();
    if (!inputRsbsa || inputRsbsa.toUpperCase() === 'NO RSBSA') {
      setDuplicateRsbsaMatch(null);
      setIsCheckingRsbsa(false);
      return;
    }

    // Step A: Immediate check against local list state
    const localMatch = parcels.find((p) => {
      if (editingParcel && (p.tagNumber === editingParcel.tagNumber || p.swineNameOrId === editingParcel.swineNameOrId)) {
        return false;
      }
      const existingRsbsa = (p.swineNameOrId || '').trim();
      return (
        existingRsbsa &&
        existingRsbsa.toUpperCase() !== 'NO RSBSA' &&
        existingRsbsa.toLowerCase() === inputRsbsa.toLowerCase()
      );
    });

    if (localMatch) {
      const name =
        (localMatch.farmerGivenName && localMatch.farmerFamilyName
          ? `${localMatch.farmerGivenName} ${localMatch.farmerFamilyName}`
          : localMatch.raiserName) || 'Existing Farmer';
      setDuplicateRsbsaMatch({ farmerName: name, rsbsa: inputRsbsa });
      return;
    }

    // Check duplicate RSBSA across online DB and offline pending queue
    let isCancelled = false;
    setIsCheckingRsbsa(true);

    const timer = setTimeout(async () => {
      try {
        const dup = await checkDuplicateRsbsa(inputRsbsa, editingParcel?.tagNumber);
        if (isCancelled) return;

        if (dup.isDuplicate) {
          setDuplicateRsbsaMatch({
            farmerName: dup.farmerName || 'Registered Farmer',
            rsbsa: inputRsbsa
          });
        } else {
          setDuplicateRsbsaMatch(null);
        }
      } catch (e) {
        console.warn('Real-time RSBSA duplicate check notice:', e);
      } finally {
        if (!isCancelled) setIsCheckingRsbsa(false);
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [formData.swineNameOrId, parcels, editingParcel]);

  // 2. Strict Real-Time Duplicate Farmer Name Checking & Normalization
  useEffect(() => {
    const fam = (formData.farmerFamilyName || '').trim();
    const giv = (formData.farmerGivenName || '').trim();
    const mid = (formData.farmerMiddleName || '').trim();
    const brgy = (formData.barangay || effectiveDefaultBarangay || '').trim();

    if ((!fam || !giv) && !formData.raiserName) {
      setDuplicateNameMatch(null);
      setNameDuplicateResolution('unresolved');
      setIsCheckingName(false);
      return;
    }

    const normalize = (str: string) =>
      (str || '').toLowerCase().trim().replace(/[,.-]/g, ' ').replace(/\s+/g, ' ');

    // Combine Given Name + Middle Name + Family Name and normalize (trim whitespace, lowercase)
    const combinedInput = [giv, mid, fam].filter(Boolean).join(' ');
    const normalizedInput = normalize(combinedInput) || normalize(formData.raiserName || '');
    const normalizedGivFam = normalize(`${giv} ${fam}`);

    if (normalizedInput.length < 3) {
      setDuplicateNameMatch(null);
      setNameDuplicateResolution('unresolved');
      setIsCheckingName(false);
      return;
    }

    // Step A: Immediate Local state check (parcels list in AppContext)
    const localMatch = parcels.find((p) => {
      if (editingParcel && p.tagNumber === editingParcel.tagNumber) return false;

      // Barangay jurisdiction check
      const pBrgy = (p.barangay || '').trim();
      const isSameBrgy = matchBarangay(pBrgy, brgy) || pBrgy.toLowerCase() === brgy.toLowerCase();
      if (!isSameBrgy) return false;

      // Extract existing farmer's name components
      let pGiv = (p.farmerGivenName || '').trim();
      let pMid = (p.farmerMiddleName || '').trim();
      let pFam = (p.farmerFamilyName || '').trim();
      if (!pGiv && !pFam && p.raiserName) {
        const parsed = parseFarmerName(p.raiserName);
        pGiv = parsed.given;
        pMid = parsed.middle;
        pFam = parsed.family;
      }

      const pCombined = [pGiv, pMid, pFam].filter(Boolean).join(' ');
      const pNormalized = normalize(pCombined) || normalize(p.raiserName || '');
      const pNormalizedGivFam = normalize(`${pGiv} ${pFam}`);

      return (
        pNormalized === normalizedInput ||
        (giv.length >= 2 && fam.length >= 2 && pNormalizedGivFam === normalizedGivFam)
      );
    });

    if (localMatch) {
      const matchName =
        localMatch.farmerGivenName && localMatch.farmerFamilyName
          ? [localMatch.farmerGivenName, localMatch.farmerMiddleName, localMatch.farmerFamilyName].filter(Boolean).join(' ')
          : localMatch.raiserName || 'Existing Farmer';

      setDuplicateNameMatch({
        existingName: matchName,
        barangay: localMatch.barangay || brgy,
        isExactSameRecord: Boolean(
          localMatch.swineNameOrId &&
          formData.swineNameOrId &&
          localMatch.swineNameOrId.trim().toUpperCase() !== 'NO RSBSA' &&
          localMatch.swineNameOrId.trim().toLowerCase() === formData.swineNameOrId.trim().toLowerCase()
        )
      });
      setShowNameDuplicateToast(true);
      return;
    }

    // Step B: Remote Supabase query against 'farms' / 'farmers' table
    let isCancelled = false;
    setIsCheckingName(true);

    const timer = setTimeout(async () => {
      try {
        const { data: dbFarms, error: qErr } = await supabaseClient
          .from('farmers')
          .select('id, farmer_name, barangay, rsbsa_number')
          .ilike('barangay', brgy);

        if (isCancelled) return;

        if (!qErr && Array.isArray(dbFarms) && dbFarms.length > 0) {
          const found = dbFarms.find((row: any) => {
            if (editingParcel) {
              const tag = row.tag_number || row.tagNumber || row.id;
              if (editingParcel.tagNumber === tag) return false;
            }
            let rGiv = (row.given_name || '').trim();
            let rMid = (row.middle_name || '').trim();
            let rFam = (row.family_name || '').trim();
            if (!rGiv && !rFam && row.farmer_name) {
              const parsed = parseFarmerName(row.farmer_name);
              rGiv = parsed.given;
              rMid = parsed.middle;
              rFam = parsed.family;
            }
            const rCombined = [rGiv, rMid, rFam].filter(Boolean).join(' ');
            const rNormalized = normalize(rCombined) || normalize(row.farmer_name || '');
            const rNormalizedGivFam = normalize(`${rGiv} ${rFam}`);

            return (
              rNormalized === normalizedInput ||
              (giv.length >= 2 && fam.length >= 2 && rNormalizedGivFam === normalizedGivFam)
            );
          });

          if (found) {
            const foundAny = found as any;
            const matchName =
              found.farmer_name ||
              [foundAny.given_name, foundAny.middle_name, foundAny.family_name].filter(Boolean).join(' ') ||
              'Existing Farmer';

            setDuplicateNameMatch({
              existingName: matchName,
              barangay: found.barangay || brgy,
              isExactSameRecord: Boolean(
                found.rsbsa_number &&
                formData.swineNameOrId &&
                found.rsbsa_number.trim().toLowerCase() === formData.swineNameOrId.trim().toLowerCase()
              )
            });
            setShowNameDuplicateToast(true);
            return;
          }
        }
        setDuplicateNameMatch(null);
        setNameDuplicateResolution('unresolved');
        setShowNameDuplicateToast(false);
      } catch (err) {
        console.warn('Real-time farmer name query check notice:', err);
      } finally {
        if (!isCancelled) setIsCheckingName(false);
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [
    formData.farmerGivenName,
    formData.farmerMiddleName,
    formData.farmerFamilyName,
    formData.raiserName,
    formData.barangay,
    formData.swineNameOrId,
    parcels,
    editingParcel,
    effectiveDefaultBarangay
  ]);

  // Keep Full Name synchronized cleanly without leaving trailing commas
  const handleNameChange = (field: 'family' | 'given' | 'middle', val: string) => {
    setFormData((prev) => {
      const fam = field === 'family' ? val : prev.farmerFamilyName || '';
      const giv = field === 'given' ? val : prev.farmerGivenName || '';
      const mid = field === 'middle' ? val : prev.farmerMiddleName || '';

      const famClean = fam.trim().toUpperCase();
      const givenPart = [giv.trim(), mid.trim()].filter(Boolean).join(' ').toUpperCase();
      const combined =
        famClean && givenPart ? `${famClean}, ${givenPart}` : famClean || givenPart;

      return {
        ...prev,
        farmerFamilyName: field === 'family' ? val : prev.farmerFamilyName,
        farmerGivenName: field === 'given' ? val : prev.farmerGivenName,
        farmerMiddleName: field === 'middle' ? val : prev.farmerMiddleName,
        raiserName: combined
      };
    });
  };

  // GPS Geolocation Handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    setGeoSuccess(false);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6))
        }));
        setGeoLoading(false);
        setGeoSuccess(true);
        setTimeout(() => setGeoSuccess(false), 4000);
      },
      (err) => {
        setGeoLoading(false);
        setError(`GPS error: ${err.message}. Defaulting to Silago municipal coordinates.`);
        setFormData((prev) => ({
          ...prev,
          lat: 10.5335,
          lng: 125.162
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Photo upload handler: uploads directly to Supabase Storage 'farm-photos' bucket
  const handlePhotoUpload = async (field: 'photoUrl' | 'fieldPhotoUrl', file: File) => {
    const isField = field === 'fieldPhotoUrl';
    if (isField) setIsUploadingFieldPhoto(true);
    else setIsUploadingPhoto(true);

    try {
      // Instant local object URL preview without heavy Base64 data string
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        [field]: previewUrl
      }));

      const recordTag = formData.tagNumber || formData.swineNameOrId || 'farm_parcel';
      const cleanTag = recordTag.replace(/[^a-zA-Z0-9_-]/g, '_');
      const publicUrl = await uploadFarmPhoto(file, `${cleanTag}-${isField ? 'field' : 'farmer'}`);

      if (publicUrl) {
        setFormData((prev) => ({
          ...prev,
          [field]: publicUrl
        }));
      }
    } catch (err) {
      console.warn('Direct Supabase photo upload notice:', err);
    } finally {
      if (isField) setIsUploadingFieldPhoto(false);
      else setIsUploadingPhoto(false);
    }
  };

  const validateStep = (step: RegistrationStep): string | null => {
    const rawContact = (formData.contactNumber || '').trim();
    const cleanContact = rawContact.replace(/\D/g, '');
    const targetBrgy = formData.barangay || effectiveDefaultBarangay;

    if (step === 1) {
      if (
        formSchema.isVisible('reg-family-name') &&
        formSchema.isRequired('reg-family-name') &&
        !formData.farmerFamilyName?.trim()
      ) {
        return `${formSchema.getLabel('reg-family-name', 'Family Name')} is required.`;
      }
      if (
        formSchema.isVisible('reg-given-name') &&
        formSchema.isRequired('reg-given-name') &&
        !formData.farmerGivenName?.trim()
      ) {
        return `${formSchema.getLabel('reg-given-name', 'Given Name')} is required.`;
      }
      if (
        formSchema.isVisible('reg-middle-name') &&
        formSchema.isRequired('reg-middle-name') &&
        !formData.farmerMiddleName?.trim()
      ) {
        return `${formSchema.getLabel('reg-middle-name', 'Middle Name')} is required.`;
      }
      if (!formData.farmerFamilyName?.trim() && !formData.farmerGivenName?.trim() && !formData.raiserName?.trim()) {
        return 'Farmer Name is required (Family Name and Given Name).';
      }
      if (
        formSchema.isVisible('reg-rsbsa') &&
        formSchema.isRequired('reg-rsbsa') &&
        !formData.swineNameOrId?.trim()
      ) {
        return `${formSchema.getLabel('reg-rsbsa', 'RSBSA No. / Reference')} is required.`;
      }
      if (
        formSchema.isVisible('reg-parcel-id') &&
        formSchema.isRequired('reg-parcel-id') &&
        !formData.tagNumber?.trim()
      ) {
        return `${formSchema.getLabel('reg-parcel-id', 'Registration Parcel ID')} is required.`;
      }
      if (
        formSchema.isVisible('reg-contact') &&
        formSchema.isRequired('reg-contact') &&
        !cleanContact
      ) {
        return `${formSchema.getLabel('reg-contact', 'Mobile / Contact No.')} is required.`;
      }
      if (cleanContact && (cleanContact.length !== 11 || !cleanContact.startsWith('09'))) {
        return 'Contact Number must be a valid 11-digit mobile number starting with 09 (e.g. 09XXXXXXXXX).';
      }
      if (
        formSchema.isVisible('reg-birthday') &&
        formSchema.isRequired('reg-birthday') &&
        !formData.birthday
      ) {
        return `${formSchema.getLabel('reg-birthday', 'Date of Birth')} is required.`;
      }
      if (
        formSchema.isVisible('reg-farmer-photo') &&
        formSchema.isRequired('reg-farmer-photo') &&
        !formData.photoUrl
      ) {
        return `${formSchema.getLabel('reg-farmer-photo', 'Farmer ID Photo')} is required.`;
      }
      if (duplicateRsbsaMatch) {
        return `Duplicate Notice: RSBSA No. is already registered under ${duplicateRsbsaMatch.farmerName}.`;
      }
      if (duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') {
        return 'Please confirm the duplicate farmer name notice before proceeding.';
      }
      const step1CustomErr = validateRequiredCustomFields(
        formSchema.getCustomFieldsForSection(sec1Label),
        customValues
      );
      if (step1CustomErr) return step1CustomErr;
    }

    if (step === 2) {
      if (!isUserAuthorizedForBarangay(currentUser, targetBrgy)) {
        return `Validation Error: As an assigned LFT (${currentUser?.name}), you are restricted to registering or managing farm parcels in your assigned barangays: ${assignedBarangays?.join(', ')}. Barangay "${targetBrgy}" is outside your jurisdiction.`;
      }
      if (
        formSchema.isVisible('reg-purok') &&
        formSchema.isRequired('reg-purok') &&
        !formData.purok?.trim()
      ) {
        return `${formSchema.getLabel('reg-purok', 'Purok / Sitio')} is required.`;
      }
      const area = Number(formData.weightKg);
      if (!Number.isFinite(area) || area < 0.05 || area > 100) {
        return 'Farm Area (Hectares) must be between 0.05 and 100 ha.';
      }
      const lat = Number(formData.lat);
      const lng = Number(formData.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat === 0 || lng === 0) {
        return 'Valid Latitude and Longitude GPS coordinates are required.';
      }
      if (
        formSchema.isVisible('reg-field-photo') &&
        formSchema.isRequired('reg-field-photo') &&
        !formData.fieldPhotoUrl
      ) {
        return `${formSchema.getLabel('reg-field-photo', 'Georeferenced Farm Field Photo')} is required.`;
      }
      const step2CustomErr = validateRequiredCustomFields(
        [
          ...formSchema.getCustomFieldsForSection(sec2Label),
          ...customRegSections.flatMap((sec) => formSchema.getCustomFieldsForSection(sec.label))
        ],
        customValues
      );
      if (step2CustomErr) return step2CustomErr;
    }

    return null;
  };

  const handleNextStep = () => {
    setError(null);
    setUniqueViolationAlert(null);
    const stepErr = validateStep(activeStep);
    if (stepErr) {
      setError(stepErr);
      return;
    }
    if (activeStep < 2) {
      setActiveStep((prev) => (prev + 1) as RegistrationStep);
    }
  };

  const handlePrevStep = () => {
    setError(null);
    if (activeStep > 1) {
      setActiveStep((prev) => (prev - 1) as RegistrationStep);
    }
  };

  // 3. Submission handler with Supabase unique constraint (23505) error handling
  const submitRegistration = async () => {
    setError(null);
    setUniqueViolationAlert(null);

    for (const s of [1, 2] as RegistrationStep[]) {
      const stepErr = validateStep(s);
      if (stepErr) {
        setActiveStep(s);
        setError(stepErr);
        return;
      }
    }

    const rawContact = (formData.contactNumber || '').trim();
    const cleanContact = rawContact.replace(/\D/g, '');
    const targetBrgy = formData.barangay || effectiveDefaultBarangay;

    if (editingParcel && !isUserAuthorizedForBarangay(currentUser, editingParcel.barangay)) {
      setActiveStep(2);
      setError(
        `Access Denied: This parcel is located in Brgy. ${editingParcel.barangay}. You (${currentUser?.name}) are only authorized to manage parcels in: ${assignedBarangays?.join(', ')}.`
      );
      return;
    }

    const finalRaiserName =
      formData.raiserName ||
      `${formData.farmerFamilyName ? formData.farmerFamilyName.toUpperCase() + ', ' : ''}${
        formData.farmerGivenName || ''
      } ${formData.farmerMiddleName || ''}`.trim();

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

    const rawTag = (formData.tagNumber || '').trim();
    let formattedTag = rawTag;
    if (!formattedTag) {
      formattedTag = `FARMER-SLG-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    } else if (!formattedTag.startsWith('FARMER-SLG-')) {
      if (formattedTag.startsWith('FARMER-')) {
        formattedTag = `FARMER-SLG-${formattedTag.replace(/^FARMER-/, '')}`;
      } else if (formattedTag.startsWith('SLG-')) {
        formattedTag = `FARMER-${formattedTag}`;
      } else {
        formattedTag = `FARMER-SLG-${formattedTag}`;
      }
    }

    const mergedCustomValues = mergeCustomFieldValues(
      formSchema.getCustomFieldsForTarget('registration'),
      customValues,
      editingParcel?.customFields || getParcelCustomFields(formattedTag)
    );

    const finalParcel: FarmParcel = {
      tagNumber: formattedTag,
      swineNameOrId: formData.swineNameOrId || 'NO RSBSA',
      rsbsa_no: formData.swineNameOrId || 'NO RSBSA',
      farmerFamilyName: formData.farmerFamilyName || '',
      farmerGivenName: formData.farmerGivenName || '',
      farmerMiddleName: formData.farmerMiddleName || '',
      birthday: formData.birthday || '',
      farmLocation: formData.farmLocation || targetBrgy.toUpperCase(),
      raiserName: finalRaiserName,
      barangay: targetBrgy,
      purok: formData.purok || 'Purok Riverside',
      address: formData.residential_address || formData.address || `${targetBrgy}, Silago, Southern Leyte`,
      residential_address: formData.residential_address || formData.address || `${targetBrgy}, Silago, Southern Leyte`,
      contactNumber: cleanContact || '09170000000',
      breed: formData.breed || 'Not yet assigned',
      seedType: formData.seedType || 'INBRED',
      sex: formData.sex || 'Owner-Cultivator',
      ageMonths: Number(formData.ageMonths) || 0,
      weightKg: Number(formData.weightKg) || 1.0,
      areaHa: Number(formData.weightKg) || 1.0,
      farm_area_ha: Number(formData.weightKg) || 1.0,
      scale:
        Number(formData.weightKg) < 2
          ? 'Smallholder (<2 ha)'
          : Number(formData.weightKg) <= 5
          ? 'Medium Farm (2-5 ha)'
          : 'Commercial (>5 ha)',
      purpose: formData.purpose || 'Irrigated Lowland (NIA)',
      irrigationAssociation:
        formData.irrigationAssociation || 'Balagawan Communal Irrigators Association (BCIA)',
      vaccinationStatus: formData.vaccinationStatus || 'RSBSA Enrolled & PCIC Insured',
      healthStatus: formData.healthStatus || 'Registered (Pending Crop Form)',
      biosecurityScore: 'Georeferenced (GPS Polygon Mapped)',
      registrationDate: formData.registrationDate || new Date().toISOString().split('T')[0],
      focalPerson:
        formData.focalPerson || getAssignedLftForBarangay(targetBrgy).name,
      lat: Number(formData.lat) || 10.5335,
      lng: Number(formData.lng) || 125.162,
      gps_coordinates: `${Number(formData.lat) || 10.5335}, ${Number(formData.lng) || 125.162}`,
      boundaryCoords: formData.boundaryCoords,
      syncStatus: isOffline ? 'Offline / Pending Sync' : 'Live Synced',
      is_pending_sync: isOffline,
      isPendingSync: isOffline,
      targetYieldMt: Number(formData.targetYieldMt) || 6.0,
      plantingDate: formData.plantingDate || '',
      croppingSeason: formData.croppingSeason || 'Wet Season (WS) 2026 (June – Nov 2026)',
      season: formData.croppingSeason || 'Wet Season (WS) 2026 (June – Nov 2026)',
      commodity: 'Rice',
      commodity_planted: 'Rice',
      pestAdvisoryNotice: formData.pestAdvisoryNotice || 'Routine monitoring advised.',
      photoUrl: formData.photoUrl,
      photo_url: formData.photoUrl,
      fieldPhotoUrl: formData.fieldPhotoUrl,
      field_photo_url: formData.fieldPhotoUrl,
      customFields: mergedCustomValues
    };

    setIsSubmitting(true);
    try {
      // 1. Strict RSBSA duplicate check against online Supabase farmers and offline queue
      const inputRsbsa = (formData.swineNameOrId || '').trim();
      if (inputRsbsa && inputRsbsa.toUpperCase() !== 'NO RSBSA') {
        const dupCheck = await checkDuplicateRsbsa(inputRsbsa, editingParcel?.tagNumber);
        if (dupCheck.isDuplicate) {
          setDuplicateRsbsaMatch({
            farmerName: dupCheck.farmerName || 'Registered Farmer',
            rsbsa: inputRsbsa
          });
          setUniqueViolationAlert(
            `Warning: A farmer with RSBSA No. ${inputRsbsa} is already registered in the system (${dupCheck.farmerName || 'Existing Record'}). Duplicate entries are not allowed.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Strict Full Name duplicate check against online Supabase farmers and offline queue
      const fam = (formData.farmerFamilyName || '').trim();
      const giv = (formData.farmerGivenName || '').trim();
      const mid = (formData.farmerMiddleName || '').trim();
      const checkFullName = [giv, mid, fam].filter(Boolean).join(' ') || (formData.raiserName || '').trim();

      if (checkFullName.length >= 3 && nameDuplicateResolution !== 'distinct_person') {
        const nameCheck = await checkDuplicateFarmerName(
          checkFullName,
          targetBrgy,
          editingParcel?.tagNumber
        );
        if (nameCheck.isDuplicate) {
          setDuplicateNameMatch({
            existingName: nameCheck.existingName || checkFullName,
            barangay: nameCheck.barangay || targetBrgy,
            isExactSameRecord: true
          });
          setUniqueViolationAlert(
            `Warning: A farmer named "${nameCheck.existingName || checkFullName}" is already registered in Barangay ${nameCheck.barangay || targetBrgy}. Duplicate entries are not allowed.`
          );
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Check if duplicate name resolution is unresolved or exact duplicate
      if (duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') {
        setUniqueViolationAlert(
          'Unable to save: This farmer name is already registered in this barangay.'
        );
        setIsSubmitting(false);
        return;
      }

      saveParcelCustomFields(finalParcel.tagNumber, mergedCustomValues);
      await withTimeout(Promise.resolve(onSave(finalParcel)), 8000, 'Connection timed out. Record saved to offline queue.');
      onClose();
    } catch (err: any) {
      console.warn('Submission notice:', err);
      const isUniqueViolation =
        err?.code === '23505' ||
        err?.message?.includes('23505') ||
        err?.message?.toLowerCase().includes('unique') ||
        err?.message?.toLowerCase().includes('duplicate key') ||
        err?.details?.includes('23505');

      if (isUniqueViolation) {
        setUniqueViolationAlert(
          'Unable to save: A duplicate farmer record already exists in this barangay.'
        );
      } else {
        // If it's a fetch/network notice or other non-fatal issue, do not block the user
        const isFetchError =
          err?.message?.includes('fetch') ||
          err?.message?.includes('Failed to fetch') ||
          err?.name === 'TypeError';

        if (isFetchError) {
          // Parcel is already persisted in local state and broadcasted
          onClose();
        } else {
          setError(err?.message || 'Error saving farm registration. Please try again.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeStep < 2) {
      handleNextStep();
      return;
    }
    await submitRegistration();
  };

  const handleDelete = () => {
    if (editingParcel && onDelete) {
      if (!permissions.canDeleteParcels) {
        setError('Permission Denied: Deleting official farm records is restricted to Central Admin.');
        return;
      }
      onDelete(editingParcel.tagNumber);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white border border-slate-300 rounded-lg w-full max-w-3xl shadow-xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
          <OfficeModalHeader
            title={editingParcel ? 'Edit Rice Farm Registration' : 'Rice Farm Registration Form'}
            subtitle="Municipal Agriculture Office • Southern Leyte"
            onClose={onClose}
          />

          {/* LFT Jurisdiction Warning if editing parcel outside jurisdiction */}
          {isRestrictedForEditing && editingParcel && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Restricted Jurisdiction:</strong> This parcel is located in{' '}
                <strong>Brgy. {editingParcel.barangay}</strong>. Your account ({currentUser?.name})
                is assigned to <strong>{assignedBarangays?.join(', ')}</strong>, so you cannot
                modify or delete this record.
              </span>
            </div>
          )}

          {/* Clean Office Section Tabs */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 flex items-center justify-between gap-4 flex-wrap shrink-0">
            <div className="flex items-center gap-6">
              {REGISTRATION_STEPS.map((item) => {
                const Icon = item.icon;
                const isActive = activeStep === item.step;
                return (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => {
                      setError(null);
                      setActiveStep(item.step);
                    }}
                    className={`py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                      isActive
                        ? 'border-emerald-800 text-emerald-900 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.step === 1 ? sec1Label : sec2Label}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              Step {activeStep} of 2
            </span>
          </div>

          {/* Form Body - 2 Separated Farmer & Location Steps */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-100/70">
              {error && (
                <div className="p-3 bg-red-50 border border-red-300 rounded-md flex items-center gap-2 text-xs text-red-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Duplicate RSBSA Validation Notice */}
              {uniqueViolationAlert && (
                <div className="p-3.5 bg-red-50 border border-red-300 rounded-md flex flex-col sm:flex-row items-start justify-between gap-3 text-xs text-red-900">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-red-900 text-xs uppercase tracking-wide">
                        Duplicate Record Notice
                      </h4>
                      <p className="text-red-800 mt-0.5 text-xs leading-relaxed">
                        {uniqueViolationAlert}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setUniqueViolationAlert(null);
                      setDuplicateRsbsaMatch(null);
                    }}
                    className="px-3 py-1 bg-white border border-red-300 hover:bg-red-100 text-red-800 font-semibold rounded-md transition cursor-pointer text-[11px] shrink-0"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Full Name & Barangay Duplicate Warning */}
              {showNameDuplicateToast && duplicateNameMatch && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-md flex items-start justify-between gap-3 text-xs text-amber-950">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <p className="font-semibold text-amber-950 text-xs">
                        Duplicate Name Notice: A farmer named &lsquo;{duplicateNameMatch.existingName}&rsquo; is already registered in Barangay {duplicateNameMatch.barangay}.
                      </p>
                      <p className="text-amber-900 mt-0.5 text-[11px]">
                        Please confirm below whether this is the same person or a distinct farmer.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNameDuplicateToast(false)}
                    className="text-amber-700 hover:text-amber-950 p-1 rounded-md hover:bg-amber-100 transition shrink-0 cursor-pointer"
                    title="Close notice"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ========================================================
                  SECTION 1: FARMER & RSBSA IDENTIFICATION (Step 1 of 2)
                  ======================================================== */}
              {activeStep === 1 && (
                <OfficeSectionCard title={sec1Label}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {/* RSBSA Reference Number */}
                    {formSchema.isVisible('reg-rsbsa') && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <label className={OFFICE_LABEL_CLASS}>
                            {formSchema.getLabel('reg-rsbsa', 'RSBSA No. / Reference')}{' '}
                            {formSchema.isRequired('reg-rsbsa') && (
                              <span className="text-red-600">*</span>
                            )}
                          </label>
                          {isCheckingRsbsa && (
                            <span className="text-[10px] text-emerald-700 inline-flex items-center gap-1 font-medium">
                              <Loader2 className="w-3 h-3 animate-spin" /> Checking...
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          required={formSchema.isRequired('reg-rsbsa')}
                          value={formData.swineNameOrId || ''}
                          onChange={(e) => setFormData({ ...formData, swineNameOrId: e.target.value })}
                          placeholder={formSchema.getPlaceholder(
                            'reg-rsbsa',
                            'e.g. 08-64-16-002-000061 or NO RSBSA'
                          )}
                          className={`${OFFICE_INPUT_CLASS} font-mono font-semibold ${
                            duplicateRsbsaMatch
                              ? 'border-red-500 text-red-900 bg-red-50/50 focus:border-red-600 focus:ring-red-600'
                              : ''
                          }`}
                        />
                        {duplicateRsbsaMatch && (
                          <div className="mt-1 p-2 bg-red-50 border border-red-300 rounded-md flex items-start gap-1.5 text-[11px] text-red-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                            <span>
                              Already registered under{' '}
                              <strong className="underline">{duplicateRsbsaMatch.farmerName}</strong>.
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Parcel ID (Unique Tag) */}
                    {formSchema.isVisible('reg-parcel-id') && (
                      <div className="space-y-1">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('reg-parcel-id', 'Registration Parcel ID')}{' '}
                          {formSchema.isRequired('reg-parcel-id') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          required={formSchema.isRequired('reg-parcel-id')}
                          value={formData.tagNumber || ''}
                          onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                          placeholder={formSchema.getPlaceholder('reg-parcel-id', 'e.g. FARMER-SLG-POB1-101')}
                          className={`${OFFICE_INPUT_CLASS} font-mono font-semibold`}
                        />
                      </div>
                    )}

                    {/* Contact Number */}
                    {formSchema.isVisible('reg-contact') && (
                      <div className="space-y-1">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('reg-contact', 'Mobile / Contact No.')}{' '}
                          {formSchema.isRequired('reg-contact') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <input
                          type="tel"
                          inputMode="numeric"
                          required={formSchema.isRequired('reg-contact')}
                          value={formData.contactNumber || ''}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              ![
                                'Backspace',
                                'Delete',
                                'ArrowLeft',
                                'ArrowRight',
                                'Tab',
                                'Enter'
                              ].includes(e.key) &&
                              !(e.ctrlKey || e.metaKey)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                            setFormData({ ...formData, contactNumber: digits });
                          }}
                          maxLength={11}
                          placeholder={formSchema.getPlaceholder('reg-contact', '09XXXXXXXXX')}
                          className={`${OFFICE_INPUT_CLASS} font-mono`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Farmer Names (Family Name, Given Name, Middle Name) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {formSchema.isVisible('reg-family-name') && (
                      <div className="space-y-1">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('reg-family-name', 'Family Name')}{' '}
                          {formSchema.isRequired('reg-family-name') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          required={formSchema.isRequired('reg-family-name')}
                          value={formData.farmerFamilyName || ''}
                          onChange={(e) => handleNameChange('family', e.target.value)}
                          placeholder={formSchema.getPlaceholder('reg-family-name', 'e.g. ALAS')}
                          className={`${OFFICE_INPUT_CLASS} font-semibold uppercase`}
                        />
                      </div>
                    )}

                    {formSchema.isVisible('reg-given-name') && (
                      <div className="space-y-1">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('reg-given-name', 'Given Name')}{' '}
                          {formSchema.isRequired('reg-given-name') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          required={formSchema.isRequired('reg-given-name')}
                          value={formData.farmerGivenName || ''}
                          onChange={(e) => handleNameChange('given', e.target.value)}
                          placeholder={formSchema.getPlaceholder('reg-given-name', 'e.g. MARIO')}
                          className={`${OFFICE_INPUT_CLASS} font-semibold uppercase`}
                        />
                      </div>
                    )}

                    {formSchema.isVisible('reg-middle-name') && (
                      <div className="space-y-1">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('reg-middle-name', 'Middle Name')}{' '}
                          {formSchema.isRequired('reg-middle-name') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <input
                          type="text"
                          required={formSchema.isRequired('reg-middle-name')}
                          value={formData.farmerMiddleName || ''}
                          onChange={(e) => handleNameChange('middle', e.target.value)}
                          placeholder={formSchema.getPlaceholder('reg-middle-name', 'e.g. CABUG-OS')}
                          className={`${OFFICE_INPUT_CLASS} uppercase`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Real-Time Name Duplicate Resolution */}
                  {duplicateNameMatch && (
                    <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-md space-y-2.5 text-xs">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 flex-1">
                          <h4 className="font-bold text-amber-950 uppercase tracking-wide">
                            Duplicate Name Verification
                          </h4>
                          <p className="text-amber-900">
                            A farmer named <strong className="underline">&ldquo;{duplicateNameMatch.existingName}&rdquo;</strong> is already registered in Barangay{' '}
                            <strong className="underline">{duplicateNameMatch.barangay}</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-md border border-amber-200 space-y-2">
                        <p className="font-semibold text-slate-800">
                          Is this the same person or a distinct farmer with the same name?
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setNameDuplicateResolution('same_person')}
                            className={`p-2 rounded-md border text-left transition cursor-pointer ${
                              nameDuplicateResolution === 'same_person'
                                ? 'bg-red-50 border-red-500 text-red-900 font-semibold'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold block">Same Person</span>
                            <span className="text-[11px] text-slate-500 block">
                              Duplicate record (block saving)
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setNameDuplicateResolution('distinct_person')}
                            className={`p-2 rounded-md border text-left transition cursor-pointer ${
                              nameDuplicateResolution === 'distinct_person'
                                ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold'
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="font-bold block">Distinct Farmer</span>
                            <span className="text-[11px] text-slate-500 block">
                              Different individual with matching name
                            </span>
                          </button>
                        </div>

                        {nameDuplicateResolution === 'same_person' && (
                          <p className="text-[11px] font-semibold text-red-700 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            Saving is blocked to prevent duplicate registration.
                          </p>
                        )}
                        {nameDuplicateResolution === 'distinct_person' && (
                          <p className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            Confirmed as distinct farmer. You may proceed.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Birthday & Residential Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    {formSchema.isVisible('reg-birthday') && (
                      <div className="space-y-1">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('reg-birthday', 'Date of Birth')}{' '}
                          {formSchema.isRequired('reg-birthday') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <input
                          type="date"
                          required={formSchema.isRequired('reg-birthday')}
                          value={formData.birthday || ''}
                          onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                          className={OFFICE_INPUT_CLASS}
                        />
                      </div>
                    )}

                    {formSchema.isVisible('reg-res-barangay') && (
                      <div className="space-y-1">
                        <label className={OFFICE_LABEL_CLASS}>
                          {formSchema.getLabel('reg-res-barangay', 'Residential Barangay')}{' '}
                          {formSchema.isRequired('reg-res-barangay') && (
                            <span className="text-red-600">*</span>
                          )}
                        </label>
                        <select
                          value={
                            formData.address?.replace(', Silago, Southern Leyte', '').trim() ||
                            formData.barangay
                          }
                          onChange={(e) => {
                            const chosenRes = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              address: `${chosenRes}, Silago, Southern Leyte`,
                              residential_address: `${chosenRes}, Silago, Southern Leyte`
                            }));
                          }}
                          className={OFFICE_SELECT_CLASS}
                        >
                          {OFFICIAL_15_BARANGAYS.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className={OFFICE_LABEL_CLASS}>Municipality &amp; Province</label>
                      <input
                        type="text"
                        disabled
                        value="Silago, Southern Leyte"
                        className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-md text-xs text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {formSchema.isVisible('reg-farmer-photo') && (
                    <OfficePhotoField
                      label={`${formSchema.getLabel('reg-farmer-photo', 'Farmer ID Photo (1x1 / 2x2 Optional)')}${formSchema.isRequired('reg-farmer-photo') ? ' *' : ''}`}
                      uploadButtonLabel="Upload ID Photo"
                      urlPlaceholder="Or paste direct image URL (https://...)"
                      altText="Farmer Profile"
                      fallbackType="farmer"
                      value={formData.photoUrl}
                      isUploading={isUploadingPhoto}
                      previewRounded="circle"
                      fallbackIcon={<User className="w-5 h-5 text-slate-400" />}
                      onUploadFile={(file) => handlePhotoUpload('photoUrl', file)}
                      onChangeUrl={(url) => setFormData({ ...formData, photoUrl: url })}
                      onRemove={() => setFormData({ ...formData, photoUrl: undefined })}
                    />
                  )}

                  <OfficeCustomFieldsGrid
                    fields={formSchema.getCustomFieldsForSection(sec1Label)}
                    values={customValues}
                    onChange={(fieldId, value) =>
                      setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
                    }
                  />
                </OfficeSectionCard>
              )}

              {/* ========================================================
                  SECTION 2: FARM LOCATION & GPS (Step 2 of 2)
                  ======================================================== */}
              {activeStep === 2 && (
                <>
                  <OfficeSectionCard
                    title={sec2Label}
                    rightContent={
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={geoLoading}
                        className={`px-3 py-1 rounded-md text-[11px] font-semibold transition inline-flex items-center gap-1.5 cursor-pointer border ${
                          geoSuccess
                            ? 'bg-emerald-800 border-emerald-800 text-white'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                        }`}
                      >
                        <Navigation className={`w-3 h-3 ${geoLoading ? 'animate-spin' : ''}`} />
                        <span>
                          {geoLoading
                            ? 'Acquiring GPS...'
                            : geoSuccess
                            ? 'GPS Locked ✓'
                            : 'Auto-Detect GPS'}
                        </span>
                      </button>
                    }
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                      {/* Farm Barangay - RESTRICTED TO LFT ASSIGNED JURISDICTION */}
                      {formSchema.isVisible('reg-farm-barangay') && (
                        <div className="space-y-1 sm:col-span-2">
                          <div className="flex items-center justify-between gap-2">
                            <label className={OFFICE_LABEL_CLASS}>
                              {formSchema.getLabel('reg-farm-barangay', 'Farm Location Barangay')}{' '}
                              {formSchema.isRequired('reg-farm-barangay') && (
                                <span className="text-red-600">*</span>
                              )}
                            </label>
                            {assignedBarangays && (
                              <span className="text-[10px] font-semibold text-emerald-800">
                                LFT Assigned ({assignedBarangays.length})
                              </span>
                            )}
                          </div>
                          <select
                            value={formData.barangay}
                            disabled={isRestrictedForEditing}
                            onChange={(e) => {
                              const newBrgy = e.target.value;
                              const assigned = getAssignedLftForBarangay(newBrgy);
                              setFormData({
                                ...formData,
                                barangay: newBrgy,
                                focalPerson: assigned.name
                              });
                            }}
                            className={OFFICE_SELECT_CLASS}
                          >
                            {availableBarangays.map((b) => (
                              <option key={b.name} value={b.name}>
                                {b.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Purok / Sitio */}
                      {formSchema.isVisible('reg-purok') && (
                        <div className="space-y-1">
                          <label className={OFFICE_LABEL_CLASS}>
                            {formSchema.getLabel('reg-purok', 'Purok / Sitio')}{' '}
                            {formSchema.isRequired('reg-purok') && (
                              <span className="text-red-600">*</span>
                            )}
                          </label>
                          <input
                            type="text"
                            required={formSchema.isRequired('reg-purok')}
                            value={formData.purok || ''}
                            onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                            placeholder={formSchema.getPlaceholder('reg-purok', 'e.g. Purok Riverside')}
                            className={OFFICE_INPUT_CLASS}
                          />
                        </div>
                      )}

                      {/* Farm Area in Hectares */}
                      {formSchema.isVisible('reg-area') && (
                        <div className="space-y-1">
                          <label className={OFFICE_LABEL_CLASS}>
                            {formSchema.getLabel('reg-area', 'Farm Area (Hectares)')}{' '}
                            {formSchema.isRequired('reg-area') && (
                              <span className="text-red-600">*</span>
                            )}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min={0.05}
                            max={100}
                            required={formSchema.isRequired('reg-area')}
                            value={formData.weightKg || ''}
                            onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                            placeholder={formSchema.getPlaceholder('reg-area', 'e.g. 1.25')}
                            className={`${OFFICE_INPUT_CLASS} font-semibold`}
                          />
                        </div>
                      )}
                    </div>

                    {/* GPS Boundary Polygon Indicator if captured from MapView */}
                    {formData.boundaryCoords && formData.boundaryCoords.length >= 3 && (
                      <div className="p-3 bg-slate-50 border border-slate-300 rounded-md flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-slate-800">
                          <PenTool className="w-4 h-4 text-emerald-700 shrink-0" />
                          <div>
                            <span className="font-bold block text-slate-900 text-xs">
                              GIS Polygon Boundary Captured
                            </span>
                            <span className="text-[11px] text-slate-600">
                              {formData.boundaryCoords.length} vertices digitized &bull; Area:{' '}
                              <strong className="text-emerald-800">{formData.weightKg} ha</strong>
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-800 text-white font-semibold text-[10px] uppercase tracking-wider shrink-0">
                          GPS Mapped
                        </span>
                      </div>
                    )}

                    {/* GPS Coordinates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {formSchema.isVisible('reg-lat') && (
                        <div className="space-y-1">
                          <label className={OFFICE_LABEL_CLASS}>
                            {formSchema.getLabel('reg-lat', 'Latitude')}{' '}
                            {formSchema.isRequired('reg-lat') && (
                              <span className="text-red-600">*</span>
                            )}
                          </label>
                          <input
                            type="number"
                            step="any"
                            required={formSchema.isRequired('reg-lat')}
                            value={formData.lat || ''}
                            onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                            placeholder={formSchema.getPlaceholder('reg-lat', '10.5335')}
                            className={`${OFFICE_INPUT_CLASS} font-mono font-semibold`}
                          />
                        </div>
                      )}

                      {formSchema.isVisible('reg-lng') && (
                        <div className="space-y-1">
                          <label className={OFFICE_LABEL_CLASS}>
                            {formSchema.getLabel('reg-lng', 'Longitude')}{' '}
                            {formSchema.isRequired('reg-lng') && (
                              <span className="text-red-600">*</span>
                            )}
                          </label>
                          <input
                            type="number"
                            step="any"
                            required={formSchema.isRequired('reg-lng')}
                            value={formData.lng || ''}
                            onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                            placeholder={formSchema.getPlaceholder('reg-lng', '125.1620')}
                            className={`${OFFICE_INPUT_CLASS} font-mono font-semibold`}
                          />
                        </div>
                      )}
                    </div>

                    {formSchema.isVisible('reg-field-photo') && (
                      <OfficePhotoField
                        label={`${formSchema.getLabel('reg-field-photo', 'Georeferenced Farm Field Photo (Optional)')}${formSchema.isRequired('reg-field-photo') ? ' *' : ''}`}
                        uploadButtonLabel="Upload Field Photo"
                        urlPlaceholder="Or paste direct field image URL (https://...)"
                        altText="Farm Field"
                        fallbackType="field"
                        value={formData.fieldPhotoUrl}
                        isUploading={isUploadingFieldPhoto}
                        previewRounded="square"
                        fallbackIcon={<ImageIcon className="w-5 h-5 text-slate-400" />}
                        onUploadFile={(file) => handlePhotoUpload('fieldPhotoUrl', file)}
                        onChangeUrl={(url) => setFormData({ ...formData, fieldPhotoUrl: url })}
                        onRemove={() => setFormData({ ...formData, fieldPhotoUrl: undefined })}
                      />
                    )}

                    <OfficeCustomFieldsGrid
                      fields={formSchema.getCustomFieldsForSection(sec2Label)}
                      values={customValues}
                      onChange={(fieldId, value) =>
                        setCustomValues((prev) => ({ ...prev, [fieldId]: value }))
                      }
                    />
                  </OfficeSectionCard>

                  {customRegSections.map((sec) => {
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
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
              <div className="flex items-center gap-2">
                {permissions.canDeleteParcels && editingParcel && onDelete && (
                  <>
                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirm Delete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        disabled={isRestrictedForEditing}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 border border-transparent ${
                          isRestrictedForEditing
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-red-700 hover:bg-red-50 hover:border-red-200 cursor-pointer'
                        }`}
                        title={
                          isRestrictedForEditing
                            ? 'Restricted: Cannot delete parcels outside your assigned barangays'
                            : undefined
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Parcel</span>
                      </button>
                    )}
                  </>
                )}
                <span className="text-[11px] font-medium text-slate-600 hidden sm:inline">
                  Step {activeStep} of 2
                </span>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-md text-xs font-semibold border border-slate-300 transition cursor-pointer"
                >
                  Cancel
                </button>

                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-md text-xs font-semibold border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>
                )}

                {activeStep < 2 && editingParcel && (
                  <button
                    type="button"
                    onClick={() => void submitRegistration()}
                    disabled={
                      isRestrictedForEditing ||
                      Boolean(duplicateRsbsaMatch) ||
                      Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') ||
                      isSubmitting
                    }
                    className={`px-4 py-2 rounded-md text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isRestrictedForEditing ||
                      Boolean(duplicateRsbsaMatch) ||
                      Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') ||
                      isSubmitting
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-700 cursor-pointer'
                    }`}
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSubmitting ? 'Saving...' : 'Update Registration'}</span>
                  </button>
                )}

                {activeStep < 2 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={
                      isRestrictedForEditing ||
                      Boolean(duplicateRsbsaMatch) ||
                      Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person')
                    }
                    className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
                      isRestrictedForEditing ||
                      Boolean(duplicateRsbsaMatch) ||
                      Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person')
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                    }`}
                  >
                    <span>Next: {REGISTRATION_STEPS[1].shortLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      isRestrictedForEditing ||
                      Boolean(duplicateRsbsaMatch) ||
                      Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') ||
                      isSubmitting
                    }
                    className={`px-4 py-2 rounded-md text-xs font-semibold transition flex items-center gap-2 ${
                      isRestrictedForEditing ||
                      Boolean(duplicateRsbsaMatch) ||
                      Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') ||
                      isSubmitting
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-800 hover:bg-emerald-900 text-white cursor-pointer'
                    }`}
                    title={
                      duplicateRsbsaMatch
                        ? `Duplicate Notice: RSBSA No. is already registered under ${duplicateRsbsaMatch.farmerName}.`
                        : duplicateNameMatch && nameDuplicateResolution === 'same_person'
                        ? `Blocked: Duplicate record under ${duplicateNameMatch.existingName}`
                        : duplicateNameMatch && nameDuplicateResolution === 'unresolved'
                        ? 'Please confirm the duplicate farmer name verification notice first'
                        : isRestrictedForEditing
                        ? 'Restricted: You are only authorized to manage parcels in your assigned barangays'
                        : undefined
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>
                          {editingParcel ? 'Update Registration' : 'Register Farmer & Farm'}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Supabase 23505 Unique Violation Notice Dialog */}
      {uniqueViolationAlert && (
        <div className="fixed inset-0 z-70 bg-slate-950/70 flex items-center justify-center p-4">
          <div className="bg-white border border-red-400 rounded-lg w-full max-w-md shadow-2xl p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Duplicate Record Blocked
              </h3>
              <div className="text-xs text-red-900 leading-relaxed bg-red-50 p-3.5 rounded-md border border-red-200">
                {uniqueViolationAlert}
              </div>
            </div>
            <div className="pt-1 flex justify-center">
              <button
                type="button"
                onClick={() => setUniqueViolationAlert(null)}
                className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-md text-xs font-semibold transition cursor-pointer"
              >
                Acknowledge &amp; Review Masterlist
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
