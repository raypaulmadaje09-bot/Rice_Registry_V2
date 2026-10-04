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
import { calculateCropGrowthStage, CropGrowthStageCalc } from '../data/riceVarieties';
import { uploadFarmPhoto, supabaseClient, parseFarmerName, checkDuplicateRsbsa, checkDuplicateFarmerName, withTimeout } from '../utils/supabaseClient';
import { SafeImage } from './SafeImage';
import { DaLogo, SilagoSeal, BagOngSilagoLogo, OfficialSealsTrio } from './Seals';
import { ManageReferenceModal, ManageType } from './ManageReferenceModal';
import {
  X,
  Save,
  MapPin,
  Navigation,
  Wheat,
  Calendar,
  Sparkles,
  Settings2,
  Trash2,
  AlertTriangle,
  User,
  Droplets,
  Layers,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Camera,
  Upload,
  Image as ImageIcon,
  PenTool,
  Loader2
} from 'lucide-react';

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
    varieties,
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

  // Active Manage Reference Modal state ('variety' | 'ecosystem' | 'tenure' | 'season' | 'irrigationAssociation' | null)
  const [manageType, setManageType] = useState<ManageType | null>(null);

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Parse family, given, middle if missing
      let fam = editingParcel.farmerFamilyName || '';
      let giv = editingParcel.farmerGivenName || '';
      let mid = editingParcel.farmerMiddleName || '';
      if (!fam && editingParcel.raiserName) {
        const parts = editingParcel.raiserName.split(' ');
        if (parts.length >= 2) {
          fam = parts[parts.length - 1];
          giv = parts.slice(0, parts.length - 1).join(' ');
        } else {
          fam = editingParcel.raiserName;
        }
      }

      setFormData({
        ...editingParcel,
        farmerFamilyName: fam,
        farmerGivenName: giv,
        farmerMiddleName: mid,
        irrigationAssociation:
          editingParcel.irrigationAssociation ||
          irrigationAssociations[0] ||
          'Balagawan Communal Irrigators Association (BCIA)',
        seedType: editingParcel.seedType || 'INBRED',
        commodity: 'Rice'
      });
    } else {
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
        breed: varieties[0]?.name || 'NSIC Rc 222',
        seedType: varieties[0]?.seedType || 'INBRED',
        sex: tenures[0] || 'Owner-Cultivator',
        ageMonths: 45,
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
        healthStatus: 'Active Crop (Tillering)',
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
        plantingDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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

  // Keep Full Name synchronized with Family Name, Given Name, Middle Name
  const handleNameChange = (field: 'family' | 'given' | 'middle', val: string) => {
    setFormData((prev) => {
      const fam = field === 'family' ? val : prev.farmerFamilyName || '';
      const giv = field === 'given' ? val : prev.farmerGivenName || '';
      const mid = field === 'middle' ? val : prev.farmerMiddleName || '';

      const parts = [fam ? fam.toUpperCase() + ',' : '', giv, mid].filter(Boolean);
      const combined = parts.join(' ').trim() || `${giv} ${fam}`.trim();

      return {
        ...prev,
        farmerFamilyName: field === 'family' ? val : prev.farmerFamilyName,
        farmerGivenName: field === 'given' ? val : prev.farmerGivenName,
        farmerMiddleName: field === 'middle' ? val : prev.farmerMiddleName,
        raiserName: combined || prev.raiserName
      };
    });
  };

  // Sync variety and seed type
  const handleVarietyChange = (varietyName: string) => {
    const matched = varieties.find((v) => v.name.toLowerCase() === varietyName.toLowerCase());
    setFormData((prev) => ({
      ...prev,
      breed: varietyName,
      seedType: matched ? matched.seedType : prev.seedType,
      targetYieldMt: matched ? matched.aveYieldMt : prev.targetYieldMt
    }));
  };

  // Live Phenology & Crop Stage Calculation based on plantingDate and variety
  const phenology: CropGrowthStageCalc = useMemo(() => {
    return calculateCropGrowthStage(formData.plantingDate || '', formData.breed || 'NSIC Rc 222');
  }, [formData.plantingDate, formData.breed]);

  // Automatically update healthStatus and ageMonths when planting date or variety changes
  useEffect(() => {
    if (phenology) {
      setFormData((prev) => ({
        ...prev,
        healthStatus: phenology.stage,
        ageMonths: phenology.dap
      }));
    }
  }, [phenology.stage, phenology.dap]);

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

  // 3. Submission handler with Supabase unique constraint (23505) error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUniqueViolationAlert(null);

    if (!formData.raiserName && (!formData.farmerFamilyName || !formData.farmerGivenName)) {
      setError('Farmer Name is required (Family Name and Given Name).');
      return;
    }

    // Strict numeric-only contact number validation (strip non-digits, accept 11-digit mobile 09XXXXXXXXX)
    const rawContact = (formData.contactNumber || '').trim();
    const cleanContact = rawContact.replace(/\D/g, '');
    if (cleanContact) {
      if (cleanContact.length !== 11 || !cleanContact.startsWith('09')) {
        setError('Contact Number must be a valid 11-digit mobile number starting with 09 (e.g. 09XXXXXXXXX).');
        return;
      }
    }

    // Strict RSBSA duplicate check pre-submission
    if (duplicateRsbsaMatch) {
      setError(`⚠️ Pahimangno: Kini nga RSBSA No. narehistro na ubos kang ${duplicateRsbsaMatch.farmerName}.`);
      return;
    }

    const targetBrgy = formData.barangay || effectiveDefaultBarangay;

    // Strict validation rule: LFT can only create or manage parcels in their Assigned Barangays
    if (!isUserAuthorizedForBarangay(currentUser, targetBrgy)) {
      setError(
        `Validation Error: As an assigned LFT (${currentUser?.name}), you are restricted to registering or managing farm parcels in your assigned barangays: ${assignedBarangays?.join(', ')}. Barangay "${targetBrgy}" is outside your jurisdiction.`
      );
      return;
    }

    if (editingParcel && !isUserAuthorizedForBarangay(currentUser, editingParcel.barangay)) {
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
      breed: formData.breed || 'NSIC Rc 222',
      seedType: formData.seedType || 'INBRED',
      sex: formData.sex || 'Owner-Cultivator',
      ageMonths: Number(phenology.dap) || Number(formData.ageMonths) || 45,
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
      healthStatus: phenology.stage || formData.healthStatus || 'Active Crop (Tillering)',
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
      field_photo_url: formData.fieldPhotoUrl
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
          'Dili ma-save! Narehistro na kini nga ngalan sa mag-uuma sa maong barangay aron malikayan ang double-entry.'
        );
        setIsSubmitting(false);
        return;
      }

      await withTimeout(Promise.resolve(onSave(finalParcel)), 8000, 'Nalapas ang oras sa koneksyon. Na-save sa offline queue.');
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
          'Dili ma-save! Narehistro na kini nga ngalan sa mag-uuma sa maong barangay aron malikayan ang double-entry.'
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
          setError(err?.message || 'Error saving farm registration. Palihug sulayi pag-usab.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
        <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[96vh]">
          {/* 1. Header with Government Seals with clean horizontal layout */}
          <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <OfficialSealsTrio className="shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block truncate">
                  Republic of the Philippines • Municipality of Silago
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight truncate">
                  {editingParcel ? 'Edit Rice Farm Registration' : 'Rice Farm Registration Form'}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Municipal Agriculture Office • Southern Leyte
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* LFT Jurisdiction Warning if editing parcel outside jurisdiction */}
          {isRestrictedForEditing && editingParcel && (
            <div className="bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Restricted Jurisdiction:</strong> This parcel is located in <strong>Brgy. {editingParcel.barangay}</strong>. Because your account ({currentUser?.name}) is assigned to <strong>{assignedBarangays?.join(', ')}</strong>, you cannot modify or delete this parcel.
              </span>
            </div>
          )}

          {/* Form Body - Simple, Unified, Single Flow */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-5 overflow-y-auto space-y-6 flex-1 bg-slate-50/40">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Warning Modal / Banner on Duplicate RSBSA Validation */}
              {uniqueViolationAlert && (
                <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl flex flex-col sm:flex-row items-start justify-between gap-3 text-xs text-rose-950 shadow-md animate-in slide-in-from-top-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-rose-900 text-xs uppercase tracking-wide">
                        Duplicate RSBSA Number Detected
                      </h4>
                      <p className="text-rose-800 mt-0.5 text-xs font-medium leading-relaxed">
                        {uniqueViolationAlert}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setUniqueViolationAlert(null);
                        setDuplicateRsbsaMatch(null);
                      }}
                      className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 font-bold rounded-xl transition cursor-pointer text-xs"
                    >
                      Dismiss / Review
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Full Name & Barangay Duplicate Warning Toast */}
              {showNameDuplicateToast && duplicateNameMatch && (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start justify-between gap-3 text-xs text-amber-950 shadow-sm animate-in slide-in-from-top-2">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-snug">
                      <p className="font-bold text-amber-950 text-xs">
                        ⚠️ Pahimangno: Aduna nay narehistro nga mag-uuma nga may ngalang '{duplicateNameMatch.existingName}' sa Barangay {duplicateNameMatch.barangay}.
                      </p>
                      <p className="text-amber-900 mt-0.5 text-xs font-medium">
                        Palihug tan-awa ang kumpirmasyon sa ubos aron mapadayon o mapugngan ang doble nga talaan.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNameDuplicateToast(false)}
                    className="text-amber-700 hover:text-amber-950 p-1 rounded-lg hover:bg-amber-100 transition shrink-0 cursor-pointer"
                    title="Isira ang Pahibalo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* ========================================================
                  SECTION 1: FARMER & RSBSA IDENTIFICATION (from Image 3)
                  ======================================================== */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-emerald-700" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    1. Farmer & RSBSA Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* RSBSA Reference Number */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        RSBSA No. / Reference
                      </label>
                      {isCheckingRsbsa && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                          <Loader2 className="w-3 h-3 animate-spin" /> Susiha...
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.swineNameOrId || ''}
                      onChange={(e) => setFormData({ ...formData, swineNameOrId: e.target.value })}
                      placeholder="e.g. 08-64-16-002-000061 or NO RSBSA"
                      className={`w-full px-3 py-2 bg-slate-50/70 border rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 ${
                        duplicateRsbsaMatch
                          ? 'border-red-500 text-red-900 bg-red-50/60 focus:ring-red-500 ring-1 ring-red-400'
                          : 'border-slate-200 text-slate-900 focus:ring-emerald-600'
                      }`}
                    />
                    {/* Inline Red Warning Badge */}
                    {duplicateRsbsaMatch && (
                      <div className="mt-1.5 p-2 bg-red-50 border border-red-300 rounded-xl flex items-start gap-2 text-xs text-red-700 font-semibold shadow-2xs animate-in fade-in slide-in-from-top-1">
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          ⚠️ Pahimangno: Kini nga RSBSA No. narehistro na ubos kang{' '}
                          <span className="font-bold underline text-red-900">{duplicateRsbsaMatch.farmerName}</span>.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Parcel ID (Unique Tag) */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Registration Parcel ID
                    </label>
                    <input
                      type="text"
                      value={formData.tagNumber || ''}
                      onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                      placeholder="e.g. SLG-BAL-101"
                      className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Mobile / Contact No.
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.contactNumber || ''}
                      onKeyDown={(e) => {
                        if (
                          !/[0-9]/.test(e.key) &&
                          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
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
                      placeholder="09XXXXXXXXX"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 font-mono"
                    />
                  </div>
                </div>

                {/* Farmer Names (Family Name, Given Name, Middle Name) as in Image 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Family Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.farmerFamilyName || ''}
                      onChange={(e) => handleNameChange('family', e.target.value)}
                      placeholder="e.g. ALAS"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold uppercase focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Given Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.farmerGivenName || ''}
                      onChange={(e) => handleNameChange('given', e.target.value)}
                      placeholder="e.g. MARIO"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold uppercase focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={formData.farmerMiddleName || ''}
                      onChange={(e) => handleNameChange('middle', e.target.value)}
                      placeholder="e.g. CABUG-OS"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 uppercase focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* 1. Real-Time Name Checking: Warning Banner & Confirmation Prompt */}
                {duplicateNameMatch && (
                  <div className="p-4 bg-amber-50/95 border-2 border-amber-400 rounded-2xl space-y-3 shadow-xs animate-in fade-in duration-150">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
                          ⚠️ Pahimangno sa Doble nga Ngalan sa Mag-uuma
                        </h4>
                        <p className="text-xs text-amber-950 leading-relaxed font-semibold">
                          ⚠️ Pahimangno: Aduna nay narehistro nga mag-uuma nga may ngalang{' '}
                          <strong className="text-amber-950 font-bold underline">"{duplicateNameMatch.existingName}"</strong> sa Barangay{' '}
                          <strong className="text-amber-950 font-bold underline">{duplicateNameMatch.barangay}</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Confirmation Toggle or Prompt */}
                    <div className="bg-white/95 p-3.5 rounded-xl border border-amber-300 space-y-2.5 shadow-2xs">
                      <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                        Kini ba parehas nga tawo o bag-ong mag-uuma nga parehas ra og ngalan?
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setNameDuplicateResolution('same_person')}
                          className={`p-2.5 rounded-xl border font-semibold flex items-start gap-2.5 text-left transition cursor-pointer ${
                            nameDuplicateResolution === 'same_person'
                              ? 'bg-red-50 border-red-500 text-red-950 ring-2 ring-red-400/40 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                              nameDuplicateResolution === 'same_person'
                                ? 'border-red-600 bg-red-600 text-white font-bold'
                                : 'border-slate-400'
                            }`}
                          >
                            {nameDuplicateResolution === 'same_person' && <span className="text-[10px]">✓</span>}
                          </div>
                          <div>
                            <span className="font-bold block text-red-700">Oo, parehas nga tawo</span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Doble nga rekord (DILI tugotan ang pag-save)
                            </span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNameDuplicateResolution('distinct_person')}
                          className={`p-2.5 rounded-xl border font-semibold flex items-start gap-2.5 text-left transition cursor-pointer ${
                            nameDuplicateResolution === 'distinct_person'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-2 ring-emerald-400/40 shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 mt-0.5 rounded-full border flex items-center justify-center shrink-0 ${
                              nameDuplicateResolution === 'distinct_person'
                                ? 'border-emerald-600 bg-emerald-600 text-white font-bold'
                                : 'border-slate-400'
                            }`}
                          >
                            {nameDuplicateResolution === 'distinct_person' && <span className="text-[10px]">✓</span>}
                          </div>
                          <div>
                            <span className="font-bold block text-emerald-800">Dili, bag-ong mag-uuma</span>
                            <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                              Lahi nga tawo nga parehas ra og ngalan
                            </span>
                          </div>
                        </button>
                      </div>

                      {nameDuplicateResolution === 'same_person' && (
                        <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                          <span>🚫 Dili ma-save! Narehistro na kini nga ngalan sa mag-uuma sa maong barangay aron malikayan ang double-entry.</span>
                        </div>
                      )}

                      {nameDuplicateResolution === 'distinct_person' && (
                        <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>✓ Gikompirmar: Giila isip bag-ong mag-uuma / lahi nga tag-iya sa basakan.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Birthday & Residential Address */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.birthday || ''}
                      onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  {/* In Silago barangays shows ONLY the barangay! */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Residential Barangay
                    </label>
                    <select
                      value={formData.address?.replace(', Silago, Southern Leyte', '').trim() || formData.barangay}
                      onChange={(e) => {
                        const chosenRes = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          address: `${chosenRes}, Silago, Southern Leyte`,
                          residential_address: `${chosenRes}, Silago, Southern Leyte`
                        }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {OFFICIAL_15_BARANGAYS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Municipality & Province
                    </label>
                    <input
                      type="text"
                      disabled
                      value="Silago, Southern Leyte"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Farmer Profile Photo Uploader & Preview */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Farmer Profile Photo (1x1 / 2x2 ID Photo)
                    </label>
                    {isUploadingPhoto && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading to Supabase Storage...
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-600 shrink-0 bg-slate-200 flex items-center justify-center shadow-xs relative">
                      {isUploadingPhoto ? (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-blue-50">
                          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                        </div>
                      ) : formData.photoUrl ? (
                        <SafeImage
                          src={formData.photoUrl}
                          alt="Farmer Profile"
                          fallbackType="farmer"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className={`px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${isUploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>{isUploadingPhoto ? 'Uploading...' : 'Upload ID Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingPhoto}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload('photoUrl', file);
                            }}
                          />
                        </label>
                        {formData.photoUrl && !isUploadingPhoto && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, photoUrl: undefined })}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.photoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                        placeholder="Or paste direct image URL (https://...)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 2: FARM LOCATION & GPS (Shows ONLY barangay)
                  ======================================================== */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      2. Farm Location & GPS Coordinates
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={geoLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      geoSuccess
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200'
                    }`}
                  >
                    <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {geoLoading
                        ? 'Acquiring GPS...'
                        : geoSuccess
                        ? 'GPS Locked ✓'
                        : 'Auto-Detect Current GPS'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                  {/* Farm Barangay - RESTRICTED TO LFT ASSIGNED JURISDICTION */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Farm Location Barangay <span className="text-red-500">*</span>
                      </label>
                      {assignedBarangays && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          LFT Jurisdiction ({assignedBarangays.length} Assigned)
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
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 cursor-pointer disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      {availableBarangays.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Purok / Sitio */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Purok / Sitio</label>
                    <input
                      type="text"
                      value={formData.purok || ''}
                      onChange={(e) => setFormData({ ...formData, purok: e.target.value })}
                      placeholder="e.g. Purok Riverside"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  {/* Farm Area in Hectares */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Farm Area (Hectares) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0.05}
                      max={100}
                      required
                      value={formData.weightKg || ''}
                      onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                      placeholder="e.g. 1.45"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* GPS Boundary Polygon Indicator if captured from MapView */}
                {formData.boundaryCoords && formData.boundaryCoords.length >= 3 && (
                  <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 text-blue-900">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <PenTool className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-extrabold block text-blue-950 text-xs">
                          GIS Polygon Boundary Captured
                        </span>
                        <span className="text-[11px] text-blue-700">
                          {formData.boundaryCoords.length} corner vertices digitized &bull; Centroid auto-calculated &bull; Area:{' '}
                          <strong className="text-emerald-700 font-bold">{formData.weightKg} ha</strong>
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-600 text-white font-black text-[10px] uppercase tracking-wider shrink-0 shadow-2xs">
                      GPS Mapped
                    </span>
                  </div>
                )}

                {/* GPS Coordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lat || ''}
                      onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                      placeholder="10.5335"
                      className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.lng || ''}
                      onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                      placeholder="125.1620"
                      className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:bg-white focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Farm Field Photo Uploader & Preview */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Georeferenced Farm Field Photo (Paddy / Field Overview)
                    </label>
                    {isUploadingFieldPhoto && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Uploading to Supabase Storage...
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="w-18 h-14 rounded-lg overflow-hidden border-2 border-emerald-600 shrink-0 bg-slate-200 flex items-center justify-center shadow-xs relative">
                      {isUploadingFieldPhoto ? (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-emerald-50">
                          <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                        </div>
                      ) : formData.fieldPhotoUrl ? (
                        <SafeImage
                          src={formData.fieldPhotoUrl}
                          alt="Farm Field"
                          fallbackType="field"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 w-full space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className={`px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${isUploadingFieldPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
                          {isUploadingFieldPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          <span>{isUploadingFieldPhoto ? 'Uploading...' : 'Upload Field Photo'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isUploadingFieldPhoto}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handlePhotoUpload('fieldPhotoUrl', file);
                            }}
                          />
                        </label>
                        {formData.fieldPhotoUrl && !isUploadingFieldPhoto && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, fieldPhotoUrl: undefined })}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={formData.fieldPhotoUrl || ''}
                        onChange={(e) => setFormData({ ...formData, fieldPhotoUrl: e.target.value })}
                        placeholder="Or paste direct field image URL (https://...)"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 3: CROP PROFILE, IRRIGATION & TENURE (with Manage)
                  ======================================================== */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Wheat className="w-4 h-4 text-amber-600" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    3. Rice Variety, Irrigation & Tenurial Profile
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Rice Variety with [⚙️ Manage] */}
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Rice / Palay Variety <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setManageType('variety')}
                        className="text-[10px] font-extrabold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200/80 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Manage Varieties</span>
                      </button>
                    </div>
                    <select
                      value={formData.breed}
                      onChange={(e) => handleVarietyChange(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {varieties.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name} ({v.seedType} • {v.maturityDays} DAS)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Seed Type */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">Seed Type</label>
                    <select
                      value={formData.seedType || 'INBRED'}
                      onChange={(e) => setFormData({ ...formData, seedType: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50/80 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      <option value="INBRED">INBRED (Certified Seeds)</option>
                      <option value="HYBRID">HYBRID (Hybrid Seeds)</option>
                      <option value="UNKNOWN">UNKNOWN / Farmers Saved</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Agro-Ecosystem / Water Source with [⚙️ Manage] */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Agro-Ecosystem / Water Source
                      </label>
                      <button
                        type="button"
                        onClick={() => setManageType('ecosystem')}
                        className="text-[10px] font-extrabold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200/80 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Manage</span>
                      </button>
                    </div>
                    <select
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {ecosystems.map((eco) => (
                        <option key={eco} value={eco}>
                          {eco}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Irrigation Association (IA) with [⚙️ Manage] - USER REQUEST */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Irrigation Association (IA)
                      </label>
                      <button
                        type="button"
                        onClick={() => setManageType('irrigationAssociation')}
                        className="text-[10px] font-extrabold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-lg border border-teal-200/80 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Manage</span>
                      </button>
                    </div>
                    <select
                      value={formData.irrigationAssociation}
                      onChange={(e) =>
                        setFormData({ ...formData, irrigationAssociation: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {irrigationAssociations.map((ia) => (
                        <option key={ia} value={ia}>
                          {ia}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tenurial Status with [⚙️ Manage] */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Tenurial Status
                      </label>
                      <button
                        type="button"
                        onClick={() => setManageType('tenure')}
                        className="text-[10px] font-extrabold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200/80 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Manage</span>
                      </button>
                    </div>
                    <select
                      value={formData.sex}
                      onChange={(e) => setFormData({ ...formData, sex: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {tenures.map((ten) => (
                        <option key={ten} value={ten}>
                          {ten}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cropping Season with [⚙️ Manage] */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-700">
                        Cropping Season
                      </label>
                      <button
                        type="button"
                        onClick={() => setManageType('season')}
                        className="text-[10px] font-extrabold text-purple-700 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded-lg border border-purple-200/80 flex items-center gap-1 transition cursor-pointer"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Manage</span>
                      </button>
                    </div>
                    <select
                      value={formData.croppingSeason}
                      onChange={(e) => setFormData({ ...formData, croppingSeason: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                    >
                      {seasons.map((seas) => (
                        <option key={seas} value={seas}>
                          {seas}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* ========================================================
                  SECTION 4: DATE OF PLANTING & AUTOMATED PHENOLOGY
                  ======================================================== */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                      4. Planting Date & Automated Phenology Calculation
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Auto-Calculating Stage & Maturity</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Date of Planting / Sowing <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.plantingDate || ''}
                      onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Target Yield (Metric Tons)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.targetYieldMt || 6.0}
                      onChange={(e) =>
                        setFormData({ ...formData, targetYieldMt: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-bold focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Automated Phenology Result Card */}
                <div className="bg-[#fcfdfa] border border-emerald-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        Current Crop Stage:
                      </span>
                      <span
                        className={`text-xs font-black px-3 py-0.5 rounded-full border ${phenology.colorClass}`}
                      >
                        {phenology.stage}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
                      <span>
                        Elapsed: <strong className="text-slate-900">{phenology.dap} DAS</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Maturity: <strong className="text-slate-900">{phenology.percentageMaturity}%</strong>
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${phenology.percentageMaturity}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <p>
                      <strong className="text-slate-800">Growth Phase:</strong> {phenology.phase}
                    </p>
                    <p>
                      <strong className="text-slate-800">Est. Harvest Date:</strong>{' '}
                      <span className="font-bold text-emerald-800">
                        {phenology.estimatedHarvestDate}
                      </span>{' '}
                      ({phenology.maturityDays} Days Cycle)
                    </p>
                  </div>

                  <p className="text-[11.5px] text-slate-600 italic bg-white/80 p-2.5 rounded-xl border border-emerald-100">
                    {phenology.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white px-5 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div>
                {permissions.canDeleteParcels && editingParcel && onDelete && (
                  <>
                    {confirmDelete ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirm Permanent Delete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        disabled={isRestrictedForEditing}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-transparent ${
                          isRestrictedForEditing
                            ? 'text-slate-400 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50 hover:border-red-200 cursor-pointer'
                        }`}
                        title={
                          isRestrictedForEditing
                            ? 'Restricted: Cannot delete parcels outside your assigned barangays'
                            : undefined
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Parcel</span>
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isRestrictedForEditing ||
                    Boolean(duplicateRsbsaMatch) ||
                    Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') ||
                    isSubmitting
                  }
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                    isRestrictedForEditing ||
                    Boolean(duplicateRsbsaMatch) ||
                    Boolean(duplicateNameMatch && nameDuplicateResolution !== 'distinct_person') ||
                    isSubmitting
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
                  }`}
                  title={
                    duplicateRsbsaMatch
                      ? `⚠️ Pahimangno: Kini nga RSBSA No. narehistro na ubos kang ${duplicateRsbsaMatch.farmerName}.`
                      : duplicateNameMatch && nameDuplicateResolution === 'same_person'
                      ? `🚫 Dili ma-save: Doble nga rehistro ubos kang ${duplicateNameMatch.existingName}`
                      : duplicateNameMatch && nameDuplicateResolution === 'unresolved'
                      ? '⚠️ Palihug kumpirmara kon parehas ba kini nga tawo o bag-ong mag-uuma'
                      : isRestrictedForEditing
                      ? 'Restricted: You are only authorized to manage parcels in your assigned barangays'
                      : undefined
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        {editingParcel ? 'Update Registration' : 'Register Farm Parcel'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 3. Supabase 23505 Unique Violation Red Alert Dialog */}
      {uniqueViolationAlert && (
        <div className="fixed inset-0 z-70 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border-2 border-red-500 rounded-2xl w-full max-w-md shadow-2xl p-6 text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-black text-red-950">
                Dili Ma-save ang Rehistro!
              </h3>
              <div className="text-xs font-semibold text-red-900 leading-relaxed bg-red-50 p-4 rounded-xl border border-red-200 text-center">
                {uniqueViolationAlert}
              </div>
            </div>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={() => setUniqueViolationAlert(null)}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
              >
                Masabtan / Susiha ang Masterlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Manage Reference Modal (Variety, Ecosystem, Tenure, Season, IA) with Add, Edit, Delete */}
      {manageType && (
        <ManageReferenceModal
          isOpen={!!manageType}
          onClose={() => setManageType(null)}
          type={manageType}
          onSelect={(val) => {
            if (manageType === 'variety') handleVarietyChange(val);
            else if (manageType === 'ecosystem') setFormData((p) => ({ ...p, purpose: val }));
            else if (manageType === 'tenure') setFormData((p) => ({ ...p, sex: val }));
            else if (manageType === 'season') setFormData((p) => ({ ...p, croppingSeason: val }));
            else if (manageType === 'irrigationAssociation')
              setFormData((p) => ({ ...p, irrigationAssociation: val }));
          }}
        />
      )}
    </>
  );
};
