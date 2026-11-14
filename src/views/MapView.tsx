import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from 'leaflet';
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import 'leaflet.heat';
import { useApp } from '../context/AppContext';
import { BARANGAYS, matchBarangay } from '../data/barangays';
import { SILAGO_OFFICIAL_GEOJSON, SilagoGeoJSONFeature, findSilagoBarangayFeature, normalizeBarangayName } from '../data/silagoGeoJson';
import { SILAGO_BARANGAY_BOUNDARIES, BarangayBoundary } from '../data/barangayBoundaries';
import { calculateCropGrowthStage } from '../data/riceVarieties';
import { FarmParcel, Barangay } from '../types';
import {
  Search,
  Plus,
  Minus,
  SlidersHorizontal,
  Maximize2,
  Minimize2,
  Ruler,
  Compass,
  MapPin,
  X,
  ExternalLink,
  Wheat,
  CheckCircle2,
  Sparkles,
  Flame,
  Layers,
  Layers2,
  Sliders,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
  Activity,
  Users,
  Scale,
  ShieldCheck,
  Zap,
  PenTool,
  RotateCcw,
  Check,
  Copy,
  FileSpreadsheet,
  FileText,
  Share2,
  TrendingUp,
  Droplets,
  Sun,
  Eye,
  Crosshair,
  Mountain,
  Map as MapIcon,
  ListFilter,
  Navigation,
  ArrowRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  AlertTriangle,
  Building2,
  Palette,
  Paintbrush,
  Undo2,
  CloudRain,
  CloudSun,
  RefreshCw
} from 'lucide-react';
import {
  fetchSilagoWeather,
  fetchRainViewerRadar,
  SilagoWeatherData,
  RainViewerRadarData
} from '../utils/weatherService';
import { WeatherRadarControl } from '../components/WeatherRadarControl';

interface MapViewProps {
  onSelectParcel: (parcel: FarmParcel) => void;
  onOpenAddParcelWithCoords?: (coords: {
    lat: number;
    lng: number;
    boundaryCoords?: [number, number][];
    areaHa?: number;
    barangay?: string;
  }) => void;
  focusBarangay?: Barangay | null;
  focusParcel?: FarmParcel | null;
  onOpenLogin?: () => void;
}

export type MapDisplayMode = 'markers' | 'heatmap' | 'hybrid';
export type HeatMetric = 'area' | 'farmers' | 'yield';
export type BaseLayerType = 'satellite' | 'osm' | 'topo' | 'dark' | 'voyager';

const TILE_PROVIDERS: Record<
  BaseLayerType,
  {
    name: string;
    label: string;
    tagline: string;
    url: string;
    attribution: string;
    icon: string;
  }
> = {
  satellite: {
    name: 'Satellite',
    label: 'Satellite Imagery',
    tagline: 'High-res aerial imagery (Esri World Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and GIS User Community',
    icon: '🛰️'
  },
  osm: {
    name: 'Standard OSM',
    label: 'Standard OpenStreetMap',
    tagline: 'Standard road networks, settlements & borders',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    icon: '🗺️'
  },
  topo: {
    name: 'Topographic',
    label: 'Topographic (Elevation)',
    tagline: 'Terrain slopes, elevation contours & watersheds (Esri Topo)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
    icon: '⛰️'
  },
  dark: {
    name: 'Dark GIS',
    label: 'Dark Matter GIS',
    tagline: 'High-contrast nocturnal cartography (CartoDB)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    icon: '🌙'
  },
  voyager: {
    name: 'Voyager',
    label: 'CartoDB Voyager',
    tagline: 'Clean cartographic presentation basemap',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    icon: '🧭'
  }
};

// Strategic municipal agricultural landmarks in Silago
const MUNICIPAL_FACILITIES = [
  {
    name: 'Grain Dryer & Silos',
    type: 'facility',
    lat: 10.5512,
    lng: 125.1745,
    desc: 'LGU Central Mechanical Grain Dryer & Palay Silos'
  },
  {
    name: 'Rice Demo Farm',
    type: 'demofarm',
    lat: 10.5415,
    lng: 125.1762,
    desc: 'SLSU - Silago Agro-Ecological Rice Research & Extension Demo Field'
  },
  {
    name: 'MAO Headquarters',
    type: 'office',
    lat: 10.5312,
    lng: 125.1748,
    desc: 'Silago Municipal Agriculture Office (MAO) Headquarters'
  },
  {
    name: 'Seed Cold Depot',
    type: 'depot',
    lat: 10.5235,
    lng: 125.1682,
    desc: 'DA RFO-8 Certified Palay Seed Cold Storage & Distribution Depot'
  },
  {
    name: 'NIA Irrigation Dam',
    type: 'dam',
    lat: 10.5182,
    lng: 125.1610,
    desc: 'NIA Communal Irrigation System (CIS) River Diversion Weir'
  }
];

const AGRICULTURAL_HEAT_GRADIENT = {
  0.15: '#0284c7',
  0.35: '#06b6d4',
  0.55: '#84cc16',
  0.75: '#eab308',
  0.90: '#f97316',
  1.00: '#dc2626'
};

export const DEFAULT_BOUNDARY_STYLE = {
  fillColor: '#86efac', // Soft sage green / soft mint
  fillOpacity: 0.12,     // 12% subtle fill opacity - transparent, not thick
  color: '#15803d',      // Defined emerald border
  weight: 1.2,           // 1.2px clean stroke
  opacity: 0.65          // 0.65 border opacity
};

export const PASTEL_PRESET_COLORS = [
  { name: 'Sage Green', hex: '#86efac' },
  { name: 'Soft Mint', hex: '#a7f3d0' },
  { name: 'Sky Blue', hex: '#7dd3fc' },
  { name: 'Butter Gold', hex: '#fde047' },
  { name: 'Lavender', hex: '#c4b5fd' },
  { name: 'Soft Rose', hex: '#f472b6' },
  { name: 'Peach', hex: '#fdba74' },
  { name: 'Cool Slate', hex: '#cbd5e1' }
];

function getHeatmapRadiusAndBlur(zoom: number): { radius: number; blur: number } {
  if (zoom <= 11) return { radius: 36, blur: 24 };
  if (zoom === 12) return { radius: 30, blur: 20 };
  if (zoom === 13) return { radius: 24, blur: 16 };
  if (zoom === 14) return { radius: 18, blur: 12 };
  if (zoom === 15) return { radius: 14, blur: 10 };
  return { radius: 11, blur: 8 };
}

/**
 * Spherical Geodesic Math Helpers
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculatePolygonAreaHectares(points: [number, number][]): { sqMeters: number; hectares: number } {
  if (points.length < 3) return { sqMeters: 0, hectares: 0 };
  const R = 6378137;
  let total = 0;
  const radPoints = points.map(([lat, lng]) => [lat * (Math.PI / 180), lng * (Math.PI / 180)]);
  const n = radPoints.length;
  for (let i = 0; i < n; i++) {
    const p1 = radPoints[i];
    const p2 = radPoints[(i + 1) % n];
    total += (p2[1] - p1[1]) * (2 + Math.sin(p1[0]) + Math.sin(p2[0]));
  }
  const sqMeters = Math.abs((total * R * R) / 2.0);
  const hectares = sqMeters / 10000;
  return { sqMeters, hectares };
}

function calculatePolygonCentroid(points: [number, number][]): { lat: number; lng: number } {
  if (points.length === 0) return { lat: 10.538, lng: 125.172 };
  let sumLat = 0;
  let sumLng = 0;
  points.forEach(([lat, lng]) => {
    sumLat += lat;
    sumLng += lng;
  });
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length
  };
}

/**
 * Accurately detects which of the 15 Silago barangays a coordinate pair resides within
 */
function detectBarangayFromCoordinates(lat: number, lng: number): string | null {
  if (!SILAGO_OFFICIAL_GEOJSON || !SILAGO_OFFICIAL_GEOJSON.features) return null;

  for (const feature of SILAGO_OFFICIAL_GEOJSON.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    const multiPolys: number[][][][] = geom.type === 'MultiPolygon'
      ? geom.coordinates
      : [geom.coordinates];

    for (const poly of multiPolys) {
      if (!poly || poly.length === 0) continue;
      const exteriorRing = poly[0];
      let inside = false;
      for (let i = 0, j = exteriorRing.length - 1; i < exteriorRing.length; j = i++) {
        const xi = exteriorRing[i][0], yi = exteriorRing[i][1];
        const xj = exteriorRing[j][0], yj = exteriorRing[j][1];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      if (inside) {
        return feature.properties.name;
      }
    }
  }

  return null;
}

/**
 * Coordinate sanitization and bounding box validation for Silago, Southern Leyte
 */
function sanitizeSilagoCoordinates(
  rawLat: number | undefined | null,
  rawLng: number | undefined | null,
  _barangayName: string,
  _tagNumber: string
): { lat: number | null; lng: number | null; isCorrected: boolean } {
  let lat = Number(rawLat);
  let lng = Number(rawLng);
  let isCorrected = false;

  if (lat > 100 && lng < 20 && lng > 0) {
    const tmp = lat;
    lat = lng;
    lng = tmp;
    isCorrected = true;
  }

  const isInSilago =
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= 10.32 &&
    lat <= 10.72 &&
    lng >= 125.02 &&
    lng <= 125.38;

  if (!isInSilago) return { lat: null, lng: null, isCorrected: false };

  return { lat, lng, isCorrected };
}

const escapeHtml = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  } as Record<string, string>)[character] || character);

const getParcelAreaHa = (parcel: FarmParcel): number => {
  const area = Number(parcel.areaHa || parcel.weightKg || parcel.farm_area_ha || 0);
  return Number.isFinite(area) && area > 0 ? area : 0;
};

export const MapView: React.FC<MapViewProps> = ({
  onSelectParcel,
  onOpenAddParcelWithCoords,
  focusBarangay,
  focusParcel,
  onOpenLogin
}) => {
  const { parcels, currentUser, lftAccounts, t } = useApp();
  const isAuthorized = Boolean(currentUser);
  const isBarangayScoped = Boolean(currentUser && currentUser.role !== 'Central Admin');
  const assignedBarangays = useMemo(() => {
    if (!isBarangayScoped || !currentUser) return BARANGAYS.map((barangay) => barangay.name);
    if (currentUser.assignedBarangays?.length) return currentUser.assignedBarangays;
    if (currentUser.barangay) return currentUser.barangay.split(',').map((name) => name.trim()).filter(Boolean);
    return [];
  }, [currentUser, isBarangayScoped]);
  const visibleBarangays = useMemo(() => isBarangayScoped
    ? BARANGAYS.filter((barangay) => assignedBarangays.some((name) => matchBarangay(name, barangay.name)))
    : BARANGAYS, [assignedBarangays, isBarangayScoped]);
  const visibleParcels = useMemo(() => isBarangayScoped
    ? parcels.filter((parcel) => assignedBarangays.some((name) => matchBarangay(parcel.barangay, name)))
    : parcels, [parcels, assignedBarangays, isBarangayScoped]);
  const canAccessBarangay = useCallback((name: string) => !isBarangayScoped || assignedBarangays.some((assignedName) => matchBarangay(name, assignedName)), [assignedBarangays, isBarangayScoped]);
  const [showAuthWarningModal, setShowAuthWarningModal] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Layers
  const boundariesGroupRef = useRef<L.LayerGroup | null>(null);
  const barangayLabelsGroupRef = useRef<L.LayerGroup | null>(null);
  const farmerLocationsGroupRef = useRef<L.LayerGroup | null>(null);
  const parcelsGroupRef = useRef<L.LayerGroup | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const facilitiesGroupRef = useRef<L.LayerGroup | null>(null);
  const measureGroupRef = useRef<L.LayerGroup | null>(null);
  const digitizerGroupRef = useRef<L.LayerGroup | null>(null);
  const heatLayerRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const boundaryLayersByNameRef = useRef<Map<string, L.Layer>>(new Map());
  const weatherRadarLayerRef = useRef<L.TileLayer | null>(null);
  const weatherMarkersGroupRef = useRef<L.LayerGroup | null>(null);

  // Weather & Real-Time Precipitation Radar Overlay State
  const [showWeatherLayer, setShowWeatherLayer] = useState<boolean>(false);
  const [weatherData, setWeatherData] = useState<SilagoWeatherData | null>(null);
  const [radarData, setRadarData] = useState<RainViewerRadarData | null>(null);
  const [currentRadarFrameIndex, setCurrentRadarFrameIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(false);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.7);
  const [radarMode, setRadarMode] = useState<'radar' | 'satellite'>('radar');
  const [showBarangayWeatherMarkers, setShowBarangayWeatherMarkers] = useState<boolean>(true);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // Farmer Landholdings Directory Collapsible Carousel Drawer State
  const [isFarmerListOpen, setIsFarmerListOpen] = useState<boolean>(false);
  const [activeCardTag, setActiveCardTag] = useState<string | null>(null);
  const [hoveredParcelTag, setHoveredParcelTag] = useState<string | null>(null);

  // View & Heatmap state
  const [mapDisplayMode, setMapDisplayMode] = useState<MapDisplayMode>('markers');
  const [heatMetric, setHeatMetric] = useState<HeatMetric>('area');
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [isHudExpanded, setIsHudExpanded] = useState(false);

  // Floating Layer Control state
  const [isLayerControlOpen, setIsLayerControlOpen] = useState(false);
  const [activeBaseLayer, setActiveBaseLayer] = useState<BaseLayerType>('osm');
  const [showParcelsLayer, setShowParcelsLayer] = useState(true);
  const [showBoundariesLayer, setShowBoundariesLayer] = useState(true);
  const [showFacilitiesLayer, setShowFacilitiesLayer] = useState(true);
  const [showBarangayLabels, setShowBarangayLabels] = useState(true);
  const [showFarmerLocations, setShowFarmerLocations] = useState(true);
  const [showMapLegend, setShowMapLegend] = useState(true);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.62);

  // Filters & Tools state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('ALL');
  const [selectedEcosystem, setSelectedEcosystem] = useState('ALL');
  const [selectedVariety, setSelectedVariety] = useState('ALL');
  const [selectedZone, setSelectedZone] = useState('ALL');
  const [selectedCropStage, setSelectedCropStage] = useState('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interaction Tools State
  const [activeTool, setActiveTool] = useState<'none' | 'measure' | 'drop_pin' | 'draw_boundary' | 'draw_polygon'>('none');
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [digitizerPoints, setDigitizerPoints] = useState<[number, number][]>([]);
  const [selectedParcelForDrawer, setSelectedParcelForDrawer] = useState<FarmParcel | null>(null);
  const [isCopiedCoords, setIsCopiedCoords] = useState(false);
  const [mapNotice, setMapNotice] = useState('');

  const handleToggleDrawBoundary = () => {
    if (!isAuthorized) {
      setShowAuthWarningModal(true);
      return;
    }
    if (activeTool === 'draw_boundary' || activeTool === 'draw_polygon') {
      setActiveTool('none');
      setDigitizerPoints([]);
    } else {
      setActiveTool('draw_boundary');
      setMeasurePoints([]);
      setDigitizerPoints([]);
    }
  };

  // Boundary Color Customization State
  const [customBarangayStyles, setCustomBarangayStyles] = useState<Record<string, { color: string; opacity: number }>>({});
  const [customizerBarangay, setCustomizerBarangay] = useState<{
    name: string;
    zone?: string;
    terrain?: string;
    center?: [number, number];
    areaHa?: number;
  } | null>(null);

  // Available rice varieties in registry
  const uniqueVarieties = useMemo(() => {
    const set = new Set<string>();
    visibleParcels.forEach((p) => {
      if (p.breed) set.add(p.breed.trim());
    });
    return Array.from(set).sort();
  }, [visibleParcels]);

  // Filter parcels with sanitization
  const filteredParcels = useMemo(() => {
    return visibleParcels.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        p.tagNumber.toLowerCase().includes(q) ||
        p.raiserName.toLowerCase().includes(q) ||
        p.breed.toLowerCase().includes(q) ||
        p.barangay.toLowerCase().includes(q) ||
        p.swineNameOrId.toLowerCase().includes(q);

      const matchesBrgy =
        selectedBarangay === 'ALL' ||
        p.barangay.toLowerCase() === selectedBarangay.toLowerCase() ||
        matchBarangay(p.barangay, selectedBarangay);

      const matchesEco =
        selectedEcosystem === 'ALL' ||
        (selectedEcosystem === 'IRRIGATED' && p.purpose.toLowerCase().includes('irrigated')) ||
        (selectedEcosystem === 'RAINFED' && p.purpose.toLowerCase().includes('rainfed')) ||
        (selectedEcosystem === 'HYBRID' && p.purpose.toLowerCase().includes('hybrid')) ||
        (selectedEcosystem === 'UPLAND' && p.purpose.toLowerCase().includes('upland'));

      const matchesVar =
        selectedVariety === 'ALL' ||
        p.breed.toLowerCase().includes(selectedVariety.toLowerCase());

      const barangayFeature = findSilagoBarangayFeature(p.barangay);
      const matchesZone = selectedZone === 'ALL' || barangayFeature?.properties.zone === selectedZone;
      const cropText = `${p.standingCropStage || ''} ${p.healthStatus || ''}`.toLowerCase();
      const growth = p.plantingDate ? calculateCropGrowthStage(p.plantingDate, p.variety || p.breed) : null;
      const stageText = `${cropText} ${growth?.stage || ''}`.toLowerCase();
      const matchesCropStage = selectedCropStage === 'ALL' ||
        (selectedCropStage === 'VEGETATIVE' && /vegetative|seedling|tiller/.test(stageText)) ||
        (selectedCropStage === 'REPRODUCTIVE' && /reproductive|panicle|flowering/.test(stageText)) ||
        (selectedCropStage === 'RIPENING' && /ripening|maturity/.test(stageText)) ||
        (selectedCropStage === 'HARVEST_READY' && (growth?.percentageMaturity === 100 || /harvest ready|harvesting/.test(cropText))) ||
        (selectedCropStage === 'INCOMING_HARVEST' && ((growth?.percentageMaturity ?? 0) >= 70 || /ripening|maturity|harvest ready|harvesting/.test(cropText)));

      return matchesQuery && matchesBrgy && matchesEco && matchesVar && matchesZone && matchesCropStage;
    });
  }, [visibleParcels, searchQuery, selectedBarangay, selectedEcosystem, selectedVariety, selectedZone, selectedCropStage]);
  const mapSearchSuggestions = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    if (!query) return [];
    const barangayMatches = visibleBarangays
      .filter((barangay) => barangay.name.toLocaleLowerCase().includes(query))
      .map((barangay) => ({ type: 'barangay' as const, key: `barangay-${barangay.name}`, label: `Brgy. ${barangay.name}`, barangay }));
    const parcelMatches = visibleParcels
      .filter((parcel) => `${parcel.raiserName} ${parcel.tagNumber} ${parcel.swineNameOrId || ''} ${parcel.breed} ${parcel.barangay}`.toLocaleLowerCase().includes(query))
      .slice(0, 5)
      .map((parcel) => ({ type: 'parcel' as const, key: `parcel-${parcel.tagNumber}`, label: `${parcel.raiserName} · ${parcel.swineNameOrId || parcel.tagNumber}`, parcel }));
    return [...barangayMatches.slice(0, 3), ...parcelMatches].slice(0, 7);
  }, [searchQuery, visibleBarangays, visibleParcels]);

  const unmappedParcelCount = useMemo(
    () => filteredParcels.filter((parcel) => {
      const { lat, lng } = sanitizeSilagoCoordinates(parcel.lat, parcel.lng, parcel.barangay, parcel.tagNumber);
      return lat === null || lng === null;
    }).length,
    [filteredParcels]
  );

  // Summary analytics HUD calculation
  const analyticsSummary = useMemo(() => {
    const totalParcels = filteredParcels.length;
    const totalAreaHa = filteredParcels.reduce((sum, parcel) => sum + getParcelAreaHa(parcel), 0);
    const uniqueFarmers = new Set(filteredParcels.map((p) => p.raiserName.trim().toUpperCase())).size;

    let irrigatedHa = 0;
    let rainfedHa = 0;
    let hybridHa = 0;
    let uplandHa = 0;
    let totalEstimatedYieldMt = 0;

    const varietyCounts: Record<string, number> = {};

    filteredParcels.forEach((p) => {
      const area = getParcelAreaHa(p);
      const eco = p.purpose.toLowerCase();
      if (eco.includes('irrigated')) {
        irrigatedHa += area;
        totalEstimatedYieldMt += p.targetYieldMt || area * 4.8;
      } else if (eco.includes('hybrid')) {
        hybridHa += area;
        totalEstimatedYieldMt += p.targetYieldMt || area * 6.0;
      } else if (eco.includes('upland')) {
        uplandHa += area;
        totalEstimatedYieldMt += p.targetYieldMt || area * 2.8;
      } else {
        rainfedHa += area;
        totalEstimatedYieldMt += p.targetYieldMt || area * 3.4;
      }

      if (p.breed) {
        const v = p.breed.split('(')[0].trim();
        varietyCounts[v] = (varietyCounts[v] || 0) + 1;
      }
    });

    let topVariety = Object.keys(varietyCounts).length > 0 ? '' : 'None';
    let maxCount = 0;
    Object.entries(varietyCounts).forEach(([v, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topVariety = v;
      }
    });

    const irrigatedPct = totalAreaHa > 0 ? Math.round((irrigatedHa / totalAreaHa) * 100) : 0;
    const rainfedPct = totalAreaHa > 0 ? Math.round((rainfedHa / totalAreaHa) * 100) : 0;
    const hybridPct = totalAreaHa > 0 ? Math.round((hybridHa / totalAreaHa) * 100) : 0;
    const uplandPct = totalAreaHa > 0 ? 100 - (irrigatedPct + rainfedPct + hybridPct) : 0;

    return {
      totalParcels,
      totalAreaHa: Number(totalAreaHa.toFixed(2)),
      uniqueFarmers,
      irrigatedHa: Number(irrigatedHa.toFixed(2)),
      rainfedHa: Number(rainfedHa.toFixed(2)),
      hybridHa: Number(hybridHa.toFixed(2)),
      uplandHa: Number(uplandHa.toFixed(2)),
      irrigatedPct,
      rainfedPct,
      hybridPct,
      uplandPct: Math.max(0, uplandPct),
      totalEstimatedYieldMt: Number(totalEstimatedYieldMt.toFixed(1)),
      topVariety
    };
  }, [filteredParcels]);

  // Reset View: Automatically zooms and centers map to show all 15 barangay boundaries at once
  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Ensure all 15 barangay boundaries are enabled and displayed uniformly
    setShowBoundariesLayer(true);
    setSelectedBarangay('ALL');
    setSelectedParcelForDrawer(null);
    setActiveCardTag(null);
    setHoveredParcelTag(null);
    setCustomizerBarangay(null);

    // Official Silago 15 barangays GeoJSON feature collection
    const accessibleFeatures = SILAGO_OFFICIAL_GEOJSON.features.filter((feature) => canAccessBarangay(feature.properties.name));
    const tempGeoJson = L.geoJSON({ ...SILAGO_OFFICIAL_GEOJSON, features: accessibleFeatures } as any);
    const allBarangaysBounds = tempGeoJson.getBounds();

    if (allBarangaysBounds.isValid()) {
      mapInstanceRef.current.fitBounds(allBarangaysBounds, {
        padding: [30, 30],
        maxZoom: 14,
        animate: true,
        duration: 0.8
      });
    }
  }, [canAccessBarangay]);

  // Backward compatibility alias
  const fitSilagoBorders = handleResetView;

  // Invalidate map size when toggling farmer list drawer or fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isFarmerListOpen, isFullscreen]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = focusBarangay ? focusBarangay.lat : 10.538;
    const initialLng = focusBarangay ? focusBarangay.lng : 125.172;
    const initialZoom = 13;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      zoomControl: false
    });

    L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

    const tileLayer = L.tileLayer(TILE_PROVIDERS[activeBaseLayer].url, {
      attribution: TILE_PROVIDERS[activeBaseLayer].attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups in specific z-index stacking order
    const boundariesGroup = L.layerGroup().addTo(map);
    const barangayLabelsGroup = L.layerGroup().addTo(map);
    const farmerLocationsGroup = L.layerGroup().addTo(map);
    const parcelsGroup = L.layerGroup().addTo(map);
    const markersGroup = L.layerGroup().addTo(map);
    const facilitiesGroup = L.layerGroup().addTo(map);
    const measureGroup = L.layerGroup().addTo(map);
    const digitizerGroup = L.layerGroup().addTo(map);
    const weatherMarkersGroup = L.layerGroup().addTo(map);

    boundariesGroupRef.current = boundariesGroup;
    barangayLabelsGroupRef.current = barangayLabelsGroup;
    farmerLocationsGroupRef.current = farmerLocationsGroup;
    parcelsGroupRef.current = parcelsGroup;
    markersGroupRef.current = markersGroup;
    facilitiesGroupRef.current = facilitiesGroup;
    measureGroupRef.current = measureGroup;
    digitizerGroupRef.current = digitizerGroup;
    weatherMarkersGroupRef.current = weatherMarkersGroup;
    mapInstanceRef.current = map;

    // Auto-fit map bounds directly to Silago municipality borders on map start
    const accessibleFeatures = SILAGO_OFFICIAL_GEOJSON.features.filter((feature) => canAccessBarangay(feature.properties.name));
    const tempGeoJson = L.geoJSON({ ...SILAGO_OFFICIAL_GEOJSON, features: accessibleFeatures } as any);
    const silagoBounds = tempGeoJson.getBounds();
    if (silagoBounds.isValid() && !focusBarangay) {
      map.fitBounds(silagoBounds, { padding: [25, 25] });
    }

    map.on('zoomend', () => {
      const z = map.getZoom();
      setCurrentZoom(z);
      if (heatLayerRef.current) {
        const { radius, blur } = getHeatmapRadiusAndBlur(z);
        heatLayerRef.current.setOptions({ radius, blur });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      barangayLabelsGroupRef.current = null;
      farmerLocationsGroupRef.current = null;
    };
  }, [canAccessBarangay]);

  const handleFinishDrawnPolygon = useCallback(() => {
    if (digitizerPoints.length < 3) return;
    const centroid = calculatePolygonCentroid(digitizerPoints);
    const areaMetrics = calculatePolygonAreaHectares(digitizerPoints);
    const detectedBrgy = detectBarangayFromCoordinates(centroid.lat, centroid.lng);
    if (!detectedBrgy || !canAccessBarangay(detectedBrgy)) {
      setMapNotice(detectedBrgy ? `This farm is in Brgy. ${detectedBrgy}, outside your assigned barangays.` : 'The farm boundary is outside Silago. Move the plotted points inside an official barangay boundary.');
      return;
    }
    setMapNotice('Farm boundary is within Brgy. ' + detectedBrgy + '.');
    const boundaryCoordinates: [number, number][] = digitizerPoints.map(([lat, lng]) => [
      Number(lat.toFixed(7)),
      Number(lng.toFixed(7))
    ]);

    if (onOpenAddParcelWithCoords) {
      onOpenAddParcelWithCoords({
        lat: Number(centroid.lat.toFixed(7)),
        lng: Number(centroid.lng.toFixed(7)),
        boundaryCoords: boundaryCoordinates,
        areaHa: Number(areaMetrics.hectares.toFixed(2)),
        barangay: detectedBrgy
      });
    }
    setDigitizerPoints([]);
    setActiveTool('none');
  }, [digitizerPoints, onOpenAddParcelWithCoords, canAccessBarangay]);

  // Set cursor and map interaction when drawing
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const container = map.getContainer();
    if (activeTool === 'draw_boundary' || activeTool === 'draw_polygon') {
      container.style.cursor = 'crosshair';
      map.doubleClickZoom.disable();
    } else {
      container.style.cursor = '';
      map.doubleClickZoom.enable();
    }
  }, [activeTool]);

  // Map click & dblclick handler for active tools
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (activeTool === 'measure') {
        setMeasurePoints((prev) => [...prev, [lat, lng]]);
      } else if (activeTool === 'draw_boundary' || activeTool === 'draw_polygon') {
        setDigitizerPoints((prev) => [...prev, [lat, lng]]);
      } else if (activeTool === 'drop_pin') {
        const detectedBrgy = detectBarangayFromCoordinates(lat, lng);
        if (!detectedBrgy || !canAccessBarangay(detectedBrgy)) {
          setMapNotice(detectedBrgy ? `This point is in Brgy. ${detectedBrgy}, outside your assigned barangays.` : 'Select a farm location inside one of Silago’s official barangay boundaries.');
          return;
        }
        setMapNotice(`Farm location selected in Brgy. ${detectedBrgy}.`);
        if (onOpenAddParcelWithCoords) {
          onOpenAddParcelWithCoords({
            lat: Number(lat.toFixed(7)),
            lng: Number(lng.toFixed(7)),
            barangay: detectedBrgy
          });
        }
        setActiveTool('none');
      }
    };

    const handleDblClick = (e: L.LeafletMouseEvent) => {
      if ((activeTool === 'draw_boundary' || activeTool === 'draw_polygon') && digitizerPoints.length >= 3) {
        L.DomEvent.stopPropagation(e);
        handleFinishDrawnPolygon();
      }
    };

    map.on('click', handleClick);
    map.on('dblclick', handleDblClick);
    return () => {
      map.off('click', handleClick);
      map.off('dblclick', handleDblClick);
    };
  }, [activeTool, digitizerPoints, onOpenAddParcelWithCoords, handleFinishDrawnPolygon, canAccessBarangay]);

  // Handle Tile Provider change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(TILE_PROVIDERS[activeBaseLayer].url, {
      attribution: TILE_PROVIDERS[activeBaseLayer].attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [activeBaseLayer]);

  // Focus on barangay if passed
  useEffect(() => {
    if (focusBarangay && mapInstanceRef.current) {
      const feature = findSilagoBarangayFeature(focusBarangay.name);
      const areaHa = focusBarangay.totalAreaHa || feature?.properties.areaHa;
      setSelectedBarangay(focusBarangay.name);
      setCustomizerBarangay({
        name: feature?.properties.name || focusBarangay.name,
        zone: feature?.properties.zone,
        terrain: feature?.properties.terrain,
        center: feature?.properties.center || [focusBarangay.lat, focusBarangay.lng],
        areaHa
      });
      if (feature) {
        const bounds = L.geoJSON(feature as any).getBounds();
        if (bounds.isValid()) {
          mapInstanceRef.current.fitBounds(bounds, { padding: [48, 48], maxZoom: 14, animate: true });
          return;
        }
      }
      mapInstanceRef.current.flyTo([focusBarangay.lat, focusBarangay.lng], 15, { duration: 1.2 });
    }
  }, [focusBarangay]);

  // Focus on specific parcel if passed (e.g. from DatabaseView 'Locate on GIS Map' or RiceSsistant)
  useEffect(() => {
    if (focusParcel && mapInstanceRef.current) {
      const { lat, lng } = sanitizeSilagoCoordinates(
        focusParcel.lat,
        focusParcel.lng,
        focusParcel.barangay,
        focusParcel.tagNumber
      );
      setActiveCardTag(focusParcel.tagNumber);
      setSelectedParcelForDrawer(focusParcel);
      setHoveredParcelTag(focusParcel.tagNumber);

      if (lat === null || lng === null) return;
      mapInstanceRef.current.flyTo([lat, lng], 18, { duration: 1.2 });

      // Extract details for popup
      const farmerDisplayName =
        focusParcel.farmerGivenName && focusParcel.farmerFamilyName
          ? `${focusParcel.farmerGivenName} ${focusParcel.farmerFamilyName}`
          : focusParcel.raiserName;
      const parcelArea = getParcelAreaHa(focusParcel);
      const areaHa = parcelArea > 0 ? `${parcelArea.toFixed(2)} ha` : 'Not recorded';
      const rsbsa = focusParcel.swineNameOrId || 'Not recorded';
      const variety = focusParcel.breed || 'Not recorded';
      const growthStage = calculateCropGrowthStage(focusParcel.plantingDate || '', focusParcel.breed || '');
      const stageName = focusParcel.healthStatus || growthStage?.stage || 'Not recorded';

      const popupHtml = `
        <div style="font-family: system-ui, -apple-system, sans-serif; padding: 10px 12px; min-width: 250px; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2);">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase; letter-spacing: 0.5px;">🌾 Silago Rice Parcel</span>
            <span style="font-family: monospace; font-size: 10px; background: #f1f5f9; padding: 1px 6px; border-radius: 4px; border: 1px solid #e2e8f0; color: #475569; font-weight: 700;">${escapeHtml(focusParcel.tagNumber)}</span>
          </div>
          <div style="font-size: 14px; font-weight: 900; color: #0f172a; margin-top: 4px; line-height: 1.3;">
            ${escapeHtml(farmerDisplayName)}
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #2563eb; margin-top: 2px;">
            🏷️ RSBSA: <code style="background: #eff6ff; padding: 1px 5px; border-radius: 4px; border: 1px solid #bfdbfe; font-family: monospace;">${escapeHtml(rsbsa)}</code>
          </div>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f1f5f9; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
            <div style="background: #f8fafc; padding: 5px 7px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <span style="font-size: 9.5px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block;">Barangay</span>
              <strong style="color: #0f172a; font-size: 11px; display: block; margin-top: 2px;">📍 ${escapeHtml(focusParcel.barangay)}</strong>
            </div>
            <div style="background: #ecfdf5; padding: 5px 7px; border-radius: 8px; border: 1px solid #a7f3d0;">
              <span style="font-size: 9.5px; color: #047857; font-weight: 600; text-transform: uppercase; display: block;">Total Area</span>
              <strong style="color: #065f46; font-size: 11px; font-family: monospace; display: block; margin-top: 2px;">${areaHa}</strong>
            </div>
            <div style="grid-column: span 2; background: #fffbeb; padding: 5px 7px; border-radius: 8px; border: 1px solid #fde68a;">
              <span style="font-size: 9.5px; color: #92400e; font-weight: 600; text-transform: uppercase; display: block;">Variety &amp; Ecosystem</span>
              <strong style="color: #78350f; font-size: 11px; display: block; margin-top: 2px;">🌱 ${escapeHtml(variety)} <span style="font-weight: 400; color: #b45309;">(${escapeHtml(focusParcel.purpose)})</span></strong>
            </div>
          </div>
          <div style="margin-top: 8px; font-size: 10.5px; color: #16a34a; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
            <span>🌾 Crop Stage: <strong>${escapeHtml(stageName)}</strong></span>
          </div>
        </div>
      `;

      // Open popup on map after slight animation delay
      setTimeout(() => {
        if (mapInstanceRef.current) {
          L.popup({
            offset: [0, -28],
            closeButton: true,
            autoClose: false,
            className: 'gis-located-parcel-popup'
          })
            .setLatLng([lat, lng])
            .setContent(popupHtml)
            .openOn(mapInstanceRef.current);
        }
      }, 500);

      // Auto-clear highlight pulse after 4 seconds
      setTimeout(() => {
        setHoveredParcelTag(null);
      }, 4000);

      if (isFarmerListOpen) {
        setTimeout(() => {
          const cardElement = document.getElementById(`farmer-card-${focusParcel.tagNumber}`);
          if (cardElement) {
            cardElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
          }
        }, 300);
      }
    }
  }, [focusParcel, isFarmerListOpen]);

  // Boundary Styling Helper: Soft pastel tones, clean dark border (#1e3a1e), and hover effects
  const getBarangayStyle = useCallback(
    (name: string, isHovered: boolean = false, isSelected: boolean = false) => {
      const custom = customBarangayStyles[name] || customBarangayStyles[normalizeBarangayName(name)];
      const baseFillColor = custom?.color || (isSelected ? '#a7f3d0' : DEFAULT_BOUNDARY_STYLE.fillColor);
      const baseFillOpacity =
        custom?.opacity !== undefined
          ? custom.opacity
          : isSelected
          ? 0.22
          : DEFAULT_BOUNDARY_STYLE.fillOpacity;

      if (isHovered) {
        return {
          fillColor: baseFillColor,
          fillOpacity: Math.min(0.35, baseFillOpacity + 0.10),
          color: '#142b14',
          weight: 2,
          opacity: 0.95
        };
      }

      return {
        fillColor: baseFillColor,
        fillOpacity: baseFillOpacity,
        color: isSelected ? '#064e3b' : DEFAULT_BOUNDARY_STYLE.color,
        weight: isSelected ? 2 : DEFAULT_BOUNDARY_STYLE.weight,
        opacity: isSelected ? 0.9 : DEFAULT_BOUNDARY_STYLE.opacity
      };
    },
    [customBarangayStyles]
  );

  // Boundary Customizer Handlers
  const handleUpdateBarangayColor = useCallback((barangayName: string, color: string) => {
    setCustomBarangayStyles((prev) => {
      const current = prev[barangayName] || prev[normalizeBarangayName(barangayName)] || {
        color: DEFAULT_BOUNDARY_STYLE.fillColor,
        opacity: DEFAULT_BOUNDARY_STYLE.fillOpacity
      };
      return {
        ...prev,
        [barangayName]: {
          ...current,
          color
        }
      };
    });
  }, []);

  const handleUpdateBarangayOpacity = useCallback((barangayName: string, opacity: number) => {
    setCustomBarangayStyles((prev) => {
      const current = prev[barangayName] || prev[normalizeBarangayName(barangayName)] || {
        color: DEFAULT_BOUNDARY_STYLE.fillColor,
        opacity: DEFAULT_BOUNDARY_STYLE.fillOpacity
      };
      return {
        ...prev,
        [barangayName]: {
          ...current,
          opacity
        }
      };
    });
  }, []);

  const handleResetBarangayStyle = useCallback((barangayName: string) => {
    setCustomBarangayStyles((prev) => {
      const next = { ...prev };
      delete next[barangayName];
      delete next[normalizeBarangayName(barangayName)];
      return next;
    });
  }, []);

  const handleApplyToAllBarangays = useCallback((color: string, opacity: number) => {
    const newStyles: Record<string, { color: string; opacity: number }> = {};
    SILAGO_OFFICIAL_GEOJSON.features.forEach((f) => {
      newStyles[f.properties.name] = { color, opacity };
    });
    setCustomBarangayStyles(newStyles);
  }, []);

  const handleResetAllBarangayStyles = useCallback(() => {
    setCustomBarangayStyles({});
  }, []);

  // RENDER OFFICIAL SILAGO GEOJSON BOUNDARIES WITH MODERN SOFT PASTEL TONES & HOVER TOOLTIPS
  useEffect(() => {
    const group = boundariesGroupRef.current;
    const labelsGroup = barangayLabelsGroupRef.current;
    if (!group || !labelsGroup) return;

    group.clearLayers();
    labelsGroup.clearLayers();
    boundaryLayersByNameRef.current.clear();

    if (!showBoundariesLayer) return;

    const accessibleFeatures = SILAGO_OFFICIAL_GEOJSON.features.filter((feature) => canAccessBarangay(feature.properties.name));
    const geoJsonLayer = L.geoJSON({ ...SILAGO_OFFICIAL_GEOJSON, features: accessibleFeatures } as any, {
      style: (feature) => {
        const name = feature?.properties?.name || '';
        const id = feature?.properties?.id || '';
        const isSelected =
          selectedBarangay !== 'ALL' &&
          (name.toLowerCase() === selectedBarangay.toLowerCase() ||
            id.toLowerCase() === selectedBarangay.toLowerCase() ||
            matchBarangay(name, selectedBarangay));

        return getBarangayStyle(name, false, isSelected);
      },
      onEachFeature: (feature, layer) => {
        const brgyName = feature.properties?.name || 'Barangay';
        if (showBarangayLabels && feature.properties?.center) {
          L.marker(feature.properties.center, {
            interactive: false,
            keyboard: false,
            icon: L.divIcon({
              className: '',
              html: `<span style="display:inline-flex;align-items:center;gap:4.5px;padding:2.5px 8px;border:1px solid #cbd5e1;border-radius:999px;background:rgba(255,255,255,0.96);color:#0f172a;font:700 11px/1.2 system-ui,-apple-system,sans-serif;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.12)"><span style="width:6px;height:6px;border-radius:999px;background:#16a34a;flex-shrink:0"></span>${escapeHtml(brgyName)}</span>`,
              iconSize: undefined
            })
          }).addTo(labelsGroup);
        }

        if ((layer as any)._leaflet_id) {
          boundaryLayersByNameRef.current.set(brgyName, layer);
        }

        // Minimal, clean floating tooltip with barangay name only
        layer.bindTooltip(
          `<div class="silago-brgy-tooltip-content font-bold text-slate-900 text-xs px-1 py-0.5 tracking-tight">
            Brgy. ${brgyName}
          </div>`,
          {
            sticky: true,
            direction: 'auto',
            className: 'silago-clean-tooltip'
          }
        );

        layer.on({
          mouseover: (e) => {
            const target = e.target;
            const isSelected =
              selectedBarangay !== 'ALL' &&
              (feature.properties?.name?.toLowerCase() === selectedBarangay.toLowerCase() ||
                feature.properties?.id?.toLowerCase() === selectedBarangay.toLowerCase() ||
                matchBarangay(feature.properties?.name || '', selectedBarangay));
            target.setStyle(getBarangayStyle(brgyName, true, isSelected));
            if (target.bringToFront) {
              target.bringToFront();
            }
          },
          mouseout: (e) => {
            const isSelected =
              selectedBarangay !== 'ALL' &&
              (feature.properties?.name?.toLowerCase() === selectedBarangay.toLowerCase() ||
                feature.properties?.id?.toLowerCase() === selectedBarangay.toLowerCase() ||
                matchBarangay(feature.properties?.name || '', selectedBarangay));

            e.target.setStyle(getBarangayStyle(brgyName, false, isSelected));
          },
          click: (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedBarangay(brgyName);
            setCustomizerBarangay({
              name: brgyName,
              zone: feature.properties?.zone,
              terrain: feature.properties?.terrain,
              center: feature.properties?.center,
              areaHa: feature.properties?.areaHa
            });
            if (feature.properties?.center && mapInstanceRef.current) {
              mapInstanceRef.current.flyTo(feature.properties.center, 15, { duration: 1.0 });
            } else if ((layer as any).getBounds && mapInstanceRef.current) {
              mapInstanceRef.current.fitBounds((layer as any).getBounds(), { padding: [30, 30] });
            }
          }
        });
      }
    });

    geoJsonLayer.addTo(group);
    geoJsonLayerRef.current = geoJsonLayer;
  }, [showBoundariesLayer, showBarangayLabels, selectedBarangay, getBarangayStyle, customBarangayStyles, canAccessBarangay]);

  // Generate weighted GIS Heatmap data points
  const heatPointsData = useMemo(() => {
    if (filteredParcels.length === 0) return [];

    if (heatMetric === 'farmers') {
      const locations = new Map<string, { lat: number; lng: number; farmers: Set<string> }>();
      filteredParcels.forEach((parcel) => {
        const point = sanitizeSilagoCoordinates(parcel.lat, parcel.lng, parcel.barangay, parcel.tagNumber);
        if (point.lat === null || point.lng === null) return;
        const key = `${point.lat.toFixed(5)}:${point.lng.toFixed(5)}`;
        const location = locations.get(key) || { lat: point.lat, lng: point.lng, farmers: new Set<string>() };
        const farmer = parcel.raiserName.trim().toLowerCase();
        if (farmer) location.farmers.add(farmer);
        locations.set(key, location);
      });
      const maxFarmers = Math.max(1, ...Array.from(locations.values(), (location) => location.farmers.size));
      return Array.from(locations.values(), (location) => [location.lat, location.lng, Math.max(0.25, location.farmers.size / maxFarmers)] as [number, number, number]);
    }

    let maxMetricVal = 0;
    filteredParcels.forEach((p) => {
      let val = 1;
      if (heatMetric === 'area') {
        val = getParcelAreaHa(p);
      } else if (heatMetric === 'yield') {
        val = p.targetYieldMt || getParcelAreaHa(p) * 4.2;
      }
      if (val > maxMetricVal) maxMetricVal = val;
    });

    const points: [number, number, number][] = [];

    filteredParcels.forEach((parcel) => {
      const { lat, lng } = sanitizeSilagoCoordinates(
        parcel.lat,
        parcel.lng,
        parcel.barangay,
        parcel.tagNumber
      );

      if (lat === null || lng === null) return;

      let metricVal = 1.0;
      if (heatMetric === 'area') {
        metricVal = getParcelAreaHa(parcel);
      } else if (heatMetric === 'yield') {
        metricVal = parcel.targetYieldMt || getParcelAreaHa(parcel) * 4.2;
      }
      if (metricVal <= 0) return;
      const intensity = Math.max(0.25, Math.min(1.0, metricVal / Math.max(maxMetricVal, 0.000001)));
      points.push([lat, lng, intensity]);
    });

    return points;
  }, [filteredParcels, heatMetric]);

  // Heatmap Layer Lifecycle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const isHeatActive = mapDisplayMode === 'heatmap' || mapDisplayMode === 'hybrid';

    if (!isHeatActive) {
      if (heatLayerRef.current && map.hasLayer(heatLayerRef.current)) {
        map.removeLayer(heatLayerRef.current);
      }
      return;
    }

    const { radius, blur } = getHeatmapRadiusAndBlur(map.getZoom() || 13);

    if (!heatLayerRef.current) {
      if ((L as any).heatLayer) {
        const layer = (L as any).heatLayer(heatPointsData, {
          radius,
          blur,
          maxZoom: 18,
          max: 1.0,
          gradient: AGRICULTURAL_HEAT_GRADIENT,
          minOpacity: heatmapOpacity
        });
        layer.addTo(map);
        heatLayerRef.current = layer;
      }
    } else {
      heatLayerRef.current.setLatLngs(heatPointsData);
      heatLayerRef.current.setOptions({
        radius,
        blur,
        maxZoom: 18,
        max: 1.0,
        gradient: AGRICULTURAL_HEAT_GRADIENT,
        minOpacity: heatmapOpacity
      });
      if (!map.hasLayer(heatLayerRef.current)) {
        heatLayerRef.current.addTo(map);
      }
    }
  }, [heatPointsData, mapDisplayMode, heatMetric, heatmapOpacity]);

  // Facilities Landmarks (Government & Research)
  useEffect(() => {
    const group = facilitiesGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!showFacilitiesLayer) return;

    MUNICIPAL_FACILITIES.forEach((fac) => {
      const facIcon = L.divIcon({
        className: 'custom-facility-badge-wrapper',
        html: `
          <div style="
            background: #ffffff;
            color: #1e3a8a;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 8px;
            border: 1.5px solid #2563eb;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
          ">
            <span>🏛️</span>
            <span style="font-weight: 900;">${fac.name}</span>
          </div>
        `,
        iconSize: [120, 24],
        iconAnchor: [60, 12]
      });

      const marker = L.marker([fac.lat, fac.lng], { icon: facIcon }).addTo(group);
      marker.bindTooltip(`<strong>${fac.name}</strong><br/>${fac.desc}`, { sticky: true });
    });
  }, [showFacilitiesLayer]);

  // Function to smoothly select and pan to parcel from card click
  const handleSelectParcelFromList = useCallback((parcel: FarmParcel) => {
    setActiveCardTag(parcel.tagNumber);
    setSelectedParcelForDrawer(parcel);

    const { lat, lng } = sanitizeSilagoCoordinates(
      parcel.lat,
      parcel.lng,
      parcel.barangay,
      parcel.tagNumber
    );

    if (mapInstanceRef.current && lat !== null && lng !== null) {
      mapInstanceRef.current.flyTo([lat, lng], 16, {
        duration: 1.0,
        easeLinearity: 0.25
      });
    }
  }, []);

  // Function to handle map marker/polygon click: sync to left list
  const handleSelectParcelFromMap = useCallback((parcel: FarmParcel) => {
    setActiveCardTag(parcel.tagNumber);
    setSelectedParcelForDrawer(parcel);

    // Auto-scroll carousel container to target card if open
    if (isFarmerListOpen) {
      const cardElement = document.getElementById(`farmer-card-${parcel.tagNumber}`);
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [isFarmerListOpen]);

  useEffect(() => {
    const group = farmerLocationsGroupRef.current;
    if (!group) return;
    group.clearLayers();
    if (!showFarmerLocations) return;
    const seen = new Set<string>();
    filteredParcels.forEach((parcel) => {
      const location = sanitizeSilagoCoordinates(parcel.lat, parcel.lng, parcel.barangay, parcel.tagNumber);
      if (location.lat === null || location.lng === null) return;
      const farmerKey = parcel.raiserName.trim().toLocaleLowerCase();
      const key = `${farmerKey}:${location.lat.toFixed(5)}:${location.lng.toFixed(5)}`;
      if (!farmerKey || seen.has(key)) return;
      seen.add(key);
      const icon = L.divIcon({
        className: 'silago-farmer-location-marker',
        html: '<span style="display:flex;width:23px;height:23px;align-items:center;justify-content:center;border:2px solid white;border-radius:50%;background:#2563eb;color:white;font-size:12px;box-shadow:0 2px 5px #0f172a66">👤</span>',
        iconSize: [23, 23], iconAnchor: [11, 11]
      });
      L.marker([location.lat, location.lng], { icon, zIndexOffset: 150 }).addTo(group)
        .bindTooltip(`<strong>${escapeHtml(parcel.raiserName)}</strong><br/>Registered farmer · Brgy. ${escapeHtml(parcel.barangay)}`, { sticky: true })
        .on('click', (event) => { L.DomEvent.stopPropagation(event); handleSelectParcelFromMap(parcel); });
    });
  }, [filteredParcels, showFarmerLocations, handleSelectParcelFromMap]);

  // REQUIREMENT 1 & 2: CLEAN GPS LOCATION PINPOINT (MOCK RECTANGLES AND FLOATING PILLS REMOVED)
  useEffect(() => {
    const group = parcelsGroupRef.current;
    const markersGroup = markersGroupRef.current;
    if (!group || !markersGroup) return;

    group.clearLayers();
    markersGroup.clearLayers();

    if (!showParcelsLayer) return;

    const isPureHeatmap = mapDisplayMode === 'heatmap';
    if (isPureHeatmap) return;

    filteredParcels.forEach((parcel) => {
      const eco = parcel.purpose.toLowerCase();
      const isHybridCrop = eco.includes('hybrid');
      const isSelected = activeCardTag === parcel.tagNumber || selectedParcelForDrawer?.tagNumber === parcel.tagNumber;
      const isHovered = hoveredParcelTag === parcel.tagNumber;
      const isDamageAlert = (parcel.healthStatus || '').toLowerCase().includes('damaged') || (parcel.healthStatus || '').toLowerCase().includes('pest');

      const { lat, lng } = sanitizeSilagoCoordinates(
        parcel.lat,
        parcel.lng,
        parcel.barangay,
        parcel.tagNumber
      );

      if (lat === null || lng === null) {
        if (parcel.boundaryCoords && parcel.boundaryCoords.length >= 3) {
          L.polygon(parcel.boundaryCoords, {
            color: isSelected ? '#2563eb' : '#059669',
            weight: isSelected ? 3.5 : 2,
            fillColor: isSelected ? '#3b82f6' : '#10b981',
            fillOpacity: isSelected ? 0.35 : 0.2,
            dashArray: isSelected ? undefined : '4, 4'
          })
            .addTo(group)
            .on('click', (e) => {
              L.DomEvent.stopPropagation(e);
              handleSelectParcelFromMap(parcel);
            })
            .bindTooltip(`<strong>${escapeHtml(parcel.tagNumber)}</strong> &bull; ${escapeHtml(parcel.raiserName)}<br><span style="font-size:10.5px; color:#047857;">Boundary recorded; center point needs GPS review.</span>`, { sticky: true });
        }
        return;
      }

      // Clean GPS teardrop location pin with alert badge
      const badgeIcon = isDamageAlert ? '⚠️' : isHybridCrop ? '✨' : '🌾';

      const gpsPinHtml = `
        <div class="custom-gps-pin-container ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''}">
          <!-- Glowing Concentric Target / Radar Pulse Rings -->
          <div class="gps-radar-wrapper">
            <div class="gps-radar-ring ring-1"></div>
            <div class="gps-radar-ring ring-2"></div>
            <div class="gps-radar-ring ring-3"></div>
            <div class="gps-radar-center-dot"></div>
          </div>

          <!-- Teardrop Location Pin with Hollow Circular Cutout -->
          <div class="gps-pin-icon-body">
            <svg viewBox="0 0 32 44" width="28" height="40" style="display: block; overflow: visible;">
              <defs>
                <radialGradient id="gpsGrad-${parcel.tagNumber}" cx="35%" cy="30%" r="70%">
                  <stop offset="0%" stop-color="#ff5252" />
                  <stop offset="60%" stop-color="${isSelected ? '#2563eb' : '#dc2626'}" />
                  <stop offset="100%" stop-color="${isSelected ? '#1e40af' : '#991b1b'}" />
                </radialGradient>
              </defs>
              <!-- Teardrop shape -->
              <path d="M16 0 C7.16 0 0 7.16 0 16 C0 28 16 42 16 42 C16 42 32 28 32 16 C32 7.16 24.84 0 16 0 Z" 
                    fill="url(#gpsGrad-${parcel.tagNumber})" 
                    stroke="#ffffff" 
                    stroke-width="1.8" />
              <!-- Hollow white circular cutout in the center -->
              <circle cx="16" cy="15" r="5.5" fill="#ffffff" stroke="rgba(0,0,0,0.15)" stroke-width="0.8" />
              <!-- Inner center core -->
              <circle cx="16" cy="15" r="2.6" fill="${isSelected ? '#2563eb' : '#dc2626'}" />
            </svg>
            
            <!-- Complementary Crop / Alert Badge on upper right -->
            <div style="
              position: absolute;
              top: -4px;
              right: -5px;
              background: #ffffff;
              border: 1.5px solid ${isDamageAlert ? '#e11d48' : '#2563eb'};
              border-radius: 9999px;
              width: 16px;
              height: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9.5px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            ">
              ${badgeIcon}
            </div>
          </div>
        </div>
      `;

      const gpsMarkerIcon = L.divIcon({
        className: 'custom-gps-pin-marker',
        html: gpsPinHtml,
        iconSize: [32, 44],
        iconAnchor: [16, 40]
      });

      const pinMarker = L.marker([lat, lng], { icon: gpsMarkerIcon, zIndexOffset: isSelected ? 1000 : 100 }).addTo(markersGroup);

      pinMarker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        handleSelectParcelFromMap(parcel);
      });

      pinMarker.bindTooltip(
        `<div style="font-size: 11px; padding: 4px; font-family: sans-serif;">
          <div style="font-weight: 900; color: #2563eb; font-size: 12px;">${escapeHtml(parcel.tagNumber)}</div>
          <div style="font-weight: 800; color: #0f172a; margin-top: 1px;">${escapeHtml(parcel.raiserName)}</div>
          <div style="color: #475569; font-size: 10.5px;">📍 Brgy. ${escapeHtml(parcel.barangay)} &bull; <strong>${getParcelAreaHa(parcel) > 0 ? `${getParcelAreaHa(parcel).toFixed(2)} ha` : 'Area not recorded'}</strong></div>
          <div style="font-size: 10px; color: #16a34a; font-weight: 700; margin-top: 2px;">🌾 ${escapeHtml(parcel.breed)}</div>
        </div>`,
        { sticky: true }
      );

      // Render official parcel boundary polygon if boundaryCoords are present
      if (parcel.boundaryCoords && parcel.boundaryCoords.length >= 3) {
        const poly = L.polygon(parcel.boundaryCoords, {
          color: isSelected ? '#2563eb' : '#059669',
          weight: isSelected ? 3.5 : 2,
          fillColor: isSelected ? '#3b82f6' : '#10b981',
          fillOpacity: isSelected ? 0.35 : 0.2,
          dashArray: isSelected ? undefined : '4, 4'
        }).addTo(group);

        poly.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleSelectParcelFromMap(parcel);
        });

        poly.bindTooltip(
          `<strong>${escapeHtml(parcel.tagNumber)}</strong> &bull; ${escapeHtml(parcel.raiserName)}<br><span style="font-size:10.5px; color:#047857;">Area: <strong>${getParcelAreaHa(parcel) > 0 ? `${getParcelAreaHa(parcel).toFixed(2)} ha` : 'Not recorded'}</strong> (${escapeHtml(parcel.breed)})</span>`,
          { sticky: true }
        );
      }
    });
  }, [filteredParcels, activeCardTag, selectedParcelForDrawer, hoveredParcelTag, mapDisplayMode, showParcelsLayer, handleSelectParcelFromMap]);

  // Measurement Tool Visualization
  useEffect(() => {
    const group = measureGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (measurePoints.length > 1) {
      L.polyline(measurePoints, {
        color: '#2563eb',
        weight: 3.5,
        dashArray: '6, 6'
      }).addTo(group);
    }

    measurePoints.forEach((pt, i) => {
      let label = `Pt ${i + 1}`;
      if (i > 0) {
        const prev = measurePoints[i - 1];
        const distM = calculateDistanceMeters(prev[0], prev[1], pt[0], pt[1]);
        label += ` (+${distM > 1000 ? (distM / 1000).toFixed(2) + 'km' : Math.round(distM) + 'm'})`;
      }

      L.circleMarker(pt, {
        radius: 6,
        color: '#1d4ed8',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: 2
      })
        .bindTooltip(label, { permanent: true, direction: 'top', className: 'no-scrollbar' })
        .addTo(group);
    });
  }, [measurePoints]);

  // Load weather and radar data from Open-Meteo & RainViewer
  const loadWeatherData = useCallback(async () => {
    setIsWeatherLoading(true);
    try {
      const [wData, rData] = await Promise.all([
        fetchSilagoWeather(),
        fetchRainViewerRadar()
      ]);
      setWeatherData(wData);
      setRadarData(rData);
      if (rData && rData.frames.length > 0) {
        setCurrentRadarFrameIndex(rData.currentFrameIndex);
      }
    } catch (err) {
      console.warn('Weather load error:', err);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Fetch weather data on mount and poll every 10 minutes
  useEffect(() => {
    loadWeatherData();
    const interval = setInterval(loadWeatherData, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadWeatherData]);

  // Update RainViewer Precipitation Radar / Satellite Tile Layer on Leaflet Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (weatherRadarLayerRef.current) {
      map.removeLayer(weatherRadarLayerRef.current);
      weatherRadarLayerRef.current = null;
    }

    if (!showWeatherLayer || !radarData) return;

    const frames = radarMode === 'satellite' ? radarData.satelliteFrames : radarData.frames;
    if (!frames || frames.length === 0) return;

    const validIndex = Math.min(Math.max(0, currentRadarFrameIndex), frames.length - 1);
    const frame = frames[validIndex] || frames[0];

    if (frame && frame.path) {
      const host = radarData.host || 'https://tilecache.rainviewer.com';
      const colorScheme = radarMode === 'satellite' ? '0/0_0' : '2/1_1';
      const tileUrl = `${host}${frame.path}/256/{z}/{x}/{y}/${colorScheme}.png`;

      const radarLayer = L.tileLayer(tileUrl, {
        opacity: radarOpacity,
        zIndex: 250,
        maxZoom: 19
      }).addTo(map);

      weatherRadarLayerRef.current = radarLayer;
    }
  }, [showWeatherLayer, radarData, currentRadarFrameIndex, radarMode, radarOpacity]);

  // Radar playback loop for frame animation
  useEffect(() => {
    if (!isRadarPlaying || !showWeatherLayer || !radarData) return;
    const frames = radarMode === 'satellite' ? radarData.satelliteFrames : radarData.frames;
    if (!frames || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentRadarFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRadarPlaying, showWeatherLayer, radarData, radarMode]);

  // Render Barangay Weather Status Badges on Leaflet Map
  useEffect(() => {
    const group = weatherMarkersGroupRef.current;
    if (!group) return;

    group.clearLayers();

    if (!showWeatherLayer || !showBarangayWeatherMarkers || !weatherData) return;

    weatherData.barangays.forEach((b) => {
      const riskBorderColor =
        b.riskLevel === 'HIGH'
          ? 'border-rose-400 bg-rose-950/90 text-rose-200'
          : b.riskLevel === 'MED'
          ? 'border-amber-400 bg-amber-950/90 text-amber-200'
          : 'border-slate-600 bg-slate-900/90 text-slate-100';

      const iconHtml = `
        <div style="transform: translate(-50%, -50%); display: flex; align-items: center; gap: 4px; padding: 2px 7px; border-radius: 9999px; font-family: sans-serif; font-size: 10px; font-weight: 800; box-shadow: 0 4px 14px rgba(0,0,0,0.45); border: 1.5px solid; cursor: pointer; white-space: nowrap;" class="${riskBorderColor}">
          <span style="font-size: 12px;">${b.icon}</span>
          <span>${b.temp.toFixed(0)}°</span>
          <span style="opacity: 0.85; font-size: 9px; font-family: monospace;">${b.rainMm > 0 ? `${b.rainMm.toFixed(1)}mm` : '0mm'}</span>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'weather-brgy-marker',
        iconSize: [85, 24]
      });

      const marker = L.marker([b.lat, b.lng], { icon: customIcon }).addTo(group);

      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 6px 8px; min-width: 190px;">
          <div style="font-size: 10px; font-weight: 800; color: #0284c7; text-transform: uppercase;">
            📍 Silago Meteorological Status
          </div>
          <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px;">
            ${b.barangay}
          </div>
          <div style="font-size: 10.5px; color: #64748b; margin-top: 1px;">
            Zone: ${b.zone}
          </div>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 11px; display: grid; gap: 3px;">
            <div>Weather: <strong>${b.icon} ${b.condition}</strong></div>
            <div>Temp: <strong>${b.temp.toFixed(1)}°C</strong></div>
            <div>Precipitation: <strong>${b.rainMm.toFixed(1)} mm</strong> (${b.rainProb}% prob)</div>
            <div style="margin-top: 4px; font-weight: 700; color: ${b.riskLevel === 'HIGH' ? '#dc2626' : b.riskLevel === 'MED' ? '#d97706' : '#059669'};">
              LFT Field Visit: ${b.riskLevel === 'HIGH' ? '⚠️ Heavy Rain / Mud Risk' : b.riskLevel === 'MED' ? '🟡 Proceed with Caution' : '✅ Ideal for Field Visits'}
            </div>
          </div>
        </div>
      `);
    });
  }, [showWeatherLayer, showBarangayWeatherMarkers, weatherData]);

  // Field Digitizer (Draw Boundary / Polygon) Tool Visualization
  useEffect(() => {
    const group = digitizerGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (digitizerPoints.length >= 2) {
      L.polyline(digitizerPoints, {
        color: '#2563eb',
        weight: 3.5,
        dashArray: '6, 6'
      }).addTo(group);
    }

    if (digitizerPoints.length >= 3) {
      L.polygon(digitizerPoints, {
        color: '#1d4ed8',
        weight: 2.5,
        fillColor: '#3b82f6',
        fillOpacity: 0.3
      }).addTo(group);

      // Centroid label badge showing area
      const centroid = calculatePolygonCentroid(digitizerPoints);
      const area = calculatePolygonAreaHectares(digitizerPoints);
      const centroidIcon = L.divIcon({
        className: 'digitizer-centroid-badge',
        html: `
          <div style="
            background: rgba(15, 23, 42, 0.92);
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.5);
            border-radius: 8px;
            padding: 3px 8px;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-align: center;
            transform: translate(-50%, -50%);
          ">
            🌾 ${area.hectares.toFixed(2)} ha
          </div>
        `,
        iconSize: [0, 0]
      });
      L.marker([centroid.lat, centroid.lng], { icon: centroidIcon }).addTo(group);
    }

    digitizerPoints.forEach((pt, i) => {
      const isStart = i === 0;
      const canClose = isStart && digitizerPoints.length >= 3;

      const marker = L.circleMarker(pt, {
        radius: isStart ? 8 : 6,
        color: isStart ? '#10b981' : '#2563eb',
        fillColor: '#ffffff',
        fillOpacity: 1,
        weight: isStart ? 3 : 2
      });

      if (canClose) {
        marker.bindTooltip(
          `<strong>Click to Complete Boundary</strong><br><span style="font-size: 10px; color: #10b981;">(Start Point V1)</span>`,
          { permanent: false, direction: 'top' }
        );
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          handleFinishDrawnPolygon();
        });
      } else {
        marker.bindTooltip(`V${i + 1}`, { permanent: true, direction: 'right' });
      }

      marker.addTo(group);
    });
  }, [digitizerPoints, handleFinishDrawnPolygon]);

  const drawnAreaMetrics = useMemo(() => {
    return calculatePolygonAreaHectares(digitizerPoints);
  }, [digitizerPoints]);

  const totalMeasuredDistanceMeters = useMemo(() => {
    if (measurePoints.length < 2) return 0;
    let total = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      total += calculateDistanceMeters(
        measurePoints[i][0],
        measurePoints[i][1],
        measurePoints[i + 1][0],
        measurePoints[i + 1][1]
      );
    }
    return total;
  }, [measurePoints]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCopyCoordinates = (lat: number, lng: number) => {
    const text = `${lat.toFixed(7)}, ${lng.toFixed(7)}`;
    navigator.clipboard.writeText(text);
    setIsCopiedCoords(true);
    setTimeout(() => setIsCopiedCoords(false), 2000);
  };

  // Helper for status badge color
  const getStatusBadge = (healthStatus: string | undefined) => {
    const status = (healthStatus || 'Standing Crop').toLowerCase();
    if (status.includes('harvest') || status.includes('ready')) {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        label: 'Ready for Harvest'
      };
    }
    if (status.includes('damaged') || status.includes('pest') || status.includes('fail')) {
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        label: 'Inspection Needed'
      };
    }
    if (status.includes('fallow') || status.includes('land prep')) {
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-500',
        label: 'Land Preparation'
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Healthy Standing Crop'
    };
  };

  // Active boundary custom style calculations
  const activeCustomStyle = customizerBarangay
    ? customBarangayStyles[customizerBarangay.name] ||
      customBarangayStyles[normalizeBarangayName(customizerBarangay.name)]
    : null;

  const activeBarangayColor = activeCustomStyle?.color || DEFAULT_BOUNDARY_STYLE.fillColor;
  const activeBarangayOpacity =
    activeCustomStyle?.opacity !== undefined
      ? activeCustomStyle.opacity
      : DEFAULT_BOUNDARY_STYLE.fillOpacity;
  const selectedParcelCoordinates = selectedParcelForDrawer
    ? sanitizeSilagoCoordinates(
        selectedParcelForDrawer.lat,
        selectedParcelForDrawer.lng,
        selectedParcelForDrawer.barangay,
        selectedParcelForDrawer.tagNumber
      )
    : null;
  const selectedBarangayRecords = customizerBarangay
    ? visibleParcels.filter((parcel) => matchBarangay(parcel.barangay, customizerBarangay.name))
    : [];
  const selectedBarangayFarmers = new Set(selectedBarangayRecords.map((parcel) => parcel.raiserName.trim().toLowerCase()).filter(Boolean)).size;
  const selectedBarangayMapped = selectedBarangayRecords.filter((parcel) => {
    const point = sanitizeSilagoCoordinates(parcel.lat, parcel.lng, parcel.barangay, parcel.tagNumber);
    return point.lat !== null && point.lng !== null;
  }).length;
  const selectedBarangayOfficer = customizerBarangay ? lftAccounts.find((account) =>
    (account.assignedBarangays || []).some((name) => matchBarangay(name, customizerBarangay.name)) || matchBarangay(account.barangay, customizerBarangay.name)
  ) : undefined;
  const barangayFocal = selectedBarangayOfficer?.name || selectedBarangayRecords.find((parcel) => parcel.focalPerson)?.focalPerson;
  const barangayContact = selectedBarangayOfficer?.contactNumber || selectedBarangayRecords.find((parcel) => parcel.contactNumber)?.contactNumber;

  return (
    <div
      className={`space-y-3 ${
        isFullscreen
          ? 'fixed inset-0 z-50 p-3 bg-slate-900 overflow-hidden flex flex-col h-screen'
          : 'relative'
      }`}
    >
      {/* MAIN STACKED GIS LAYOUT CONTAINER */}
      <div className={`flex flex-col gap-4 w-full ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
        {/* 1. TOP SECTION: ACTION BAR (Matching Picture 2 "+ Register Swine with GPS") */}
        {!isFullscreen && (
          <div className="flex items-center justify-between gap-3 px-1 py-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenAddParcelWithCoords) {
                  onOpenAddParcelWithCoords({ lat: 10.538, lng: 125.172 });
                } else {
                  setActiveTool('drop_pin');
                }
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Farm with GPS</span>
            </button>

            {/* Quick Registry Metrics Chips */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span><strong className="text-slate-800 font-mono">{analyticsSummary.totalParcels}</strong> Farm Lots</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span><strong className="text-slate-800 font-mono">{analyticsSummary.uniqueFarmers}</strong> Farmers</span>
              </span>
              <span className="flex items-center gap-1.5 bg-white border border-slate-200/90 px-3 py-1.5 rounded-xl shadow-2xs">
                <Wheat className="w-3.5 h-3.5 text-emerald-700" />
                <span><strong className="text-emerald-700 font-mono">{analyticsSummary.totalAreaHa}</strong> ha</span>
              </span>
            </div>
          </div>
        )}

        {/* 2. COLLAPSIBLE FARMER LANDHOLDINGS CAROUSEL / DRAWER */}
        {isFarmerListOpen && (
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Wheat className="w-4 h-4 text-blue-600" />
                  <span>Farmers Landholdings Directory ({filteredParcels.length} lots)</span>
                </span>
                <span className="text-[11px] text-slate-500 hidden md:inline">
                  &bull; Click any card or "Locate" to zoom to coordinates and display parcel boundary on the map
                </span>
              </div>

              {/* Carousel navigation controls & close button */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const container = document.getElementById('farmers-carousel-container');
                    if (container) container.scrollBy({ left: -340, behavior: 'smooth' });
                  }}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const container = document.getElementById('farmers-carousel-container');
                    if (container) container.scrollBy({ left: 340, behavior: 'smooth' });
                  }}
                  className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg shadow-2xs transition cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFarmerListOpen(false)}
                  className="ml-1 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  title="Close drawer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Horizontal Scrollable Carousel Container */}
            <div
              id="farmers-carousel-container"
              className="flex gap-3 overflow-x-auto pb-2 pt-0.5 custom-scrollbar scroll-smooth"
            >
            {filteredParcels.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 space-y-3 shadow-xs">
                <Wheat className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">No farm parcels match your search filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedBarangay('ALL');
                    setSelectedEcosystem('ALL');
                    setSelectedVariety('ALL');
                    setSelectedZone('ALL');
                    setSelectedCropStage('ALL');
                  }}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              filteredParcels.map((parcel) => {
                const isSelected = activeCardTag === parcel.tagNumber || selectedParcelForDrawer?.tagNumber === parcel.tagNumber;
                const isHovered = hoveredParcelTag === parcel.tagNumber;
                const statusInfo = getStatusBadge(parcel.healthStatus);
                const location = sanitizeSilagoCoordinates(parcel.lat, parcel.lng, parcel.barangay, parcel.tagNumber);
                const hasVerifiedLocation = location.lat !== null && location.lng !== null;

                return (
                  <div
                    key={parcel.tagNumber}
                    id={`farmer-card-${parcel.tagNumber}`}
                    onMouseEnter={() => setHoveredParcelTag(parcel.tagNumber)}
                    onMouseLeave={() => setHoveredParcelTag(null)}
                    onClick={() => handleSelectParcelFromList(parcel)}
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative group bg-white ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md bg-blue-50/20'
                        : isHovered
                        ? 'border-blue-300 shadow-md bg-slate-50/50'
                        : 'border-slate-100 hover:border-slate-300 shadow-xs hover:shadow-sm'
                    }`}
                  >
                    {/* Top Header: Farmer Name on Left, Minimalist Monospace Tags on Right */}
                    <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5 mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition truncate">
                          {parcel.raiserName}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Brgy. {parcel.barangay}, Silago</span>
                        </div>
                      </div>

                      {/* Right-aligned minimalist monospace tags */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/70 text-slate-600 font-medium tracking-tight">
                          {parcel.swineNameOrId || 'RSBSA-VERIFIED'}
                        </span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100/70 border border-slate-200/60 text-slate-500 font-semibold tracking-tight">
                          {parcel.tagNumber}
                        </span>
                      </div>
                    </div>

                    {/* Metadata Specs Grid: Light-colored chips/badges with appropriate gaps */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                      <div className="bg-emerald-50/70 border border-emerald-100/80 p-2 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-medium text-emerald-800">Total Lot Area:</span>
                        <span className="font-bold text-emerald-950 font-mono text-xs">
                          {getParcelAreaHa(parcel) > 0 ? `${getParcelAreaHa(parcel).toFixed(2)} ha` : 'Not recorded'}
                        </span>
                      </div>

                      <div className="bg-sky-50/70 border border-sky-100/80 p-2 rounded-lg flex items-center justify-between">
                        <span className="text-[10.5px] font-medium text-sky-800">Ecosystem:</span>
                        <span className="font-bold text-sky-950 text-[11px] truncate">
                          {parcel.purpose.split(' ')[0]}
                        </span>
                      </div>

                      <div className="col-span-2 bg-amber-50/60 border border-amber-100/80 p-2 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-amber-800 text-[10.5px] font-medium">
                          <Wheat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Rice Variety:</span>
                        </div>
                        <span className="font-bold text-amber-950 text-xs truncate max-w-[200px]">
                          {parcel.breed}
                        </span>
                      </div>
                    </div>

                    {/* Compact Status Indicator & Aligned Action Buttons with Hover Transitions */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1.5 ${statusInfo.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot} animate-pulse`} />
                        <span className="truncate max-w-[120px]">{statusInfo.label}</span>
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectParcelFromList(parcel);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-all flex items-center gap-1 cursor-pointer shadow-2xs hover:shadow-xs ${hasVerifiedLocation ? 'bg-emerald-700 hover:bg-emerald-800 text-white' : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200'}`}
                          title={hasVerifiedLocation ? 'Center map on this verified GPS point' : 'Open this record and review its missing or out-of-area GPS point'}
                        >
                          <MapPin className="w-3 h-3 text-white" />
                          <span>{hasVerifiedLocation ? 'Locate' : 'Review GPS'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectParcel(parcel);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-semibold text-[11px] border border-slate-200 hover:border-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                          title="Open full farmer profile dossier"
                        >
                          <span>Details</span>
                          <span className="text-slate-400 font-sans text-xs transition-transform group-hover:translate-x-0.5">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            </div>
          </div>
        )}

        {/* 3. MAIN SECTION: EXPANDED FULL-WIDTH LEAFLET GIS MAP CONTAINER */}
        <div
          className={`w-full ${
            isFullscreen ? 'flex-1 min-h-0 h-full' : 'h-[calc(100vh-195px)] min-h-[540px]'
          } bg-slate-950 border border-slate-200/90 rounded-2xl overflow-hidden shadow-lg relative`}
        >
          {/* FLOATING TOP GIS BAR (Matching Picture 2 Sleek Glassmorphism Header) */}
          <div className="absolute top-3 left-3 right-3 z-400 flex flex-wrap lg:flex-nowrap items-center justify-between gap-2 pointer-events-none">
            {/* Left: Admin/Public Mode Badge & In-Map Search */}
            <div className="flex items-center gap-1.5 pointer-events-auto min-w-0">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/60 text-slate-200 text-[11px] font-semibold shadow-lg shrink-0 whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                {isBarangayScoped ? (
                  <span className="truncate max-w-[200px] xl:max-w-[260px]">
                    Assigned: {visibleBarangays.map((b) => b.name).join(', ') || 'No barangays'}
                  </span>
                ) : currentUser ? (
                  <>
                    <span className="hidden 2xl:inline">Admin Mode: Full Municipality Access (15 Barangays)</span>
                    <span className="2xl:hidden">Admin Mode (15 Brgys)</span>
                  </>
                ) : (
                  <>
                    <span className="hidden 2xl:inline">Public Map: Full Municipality View (15 Barangays)</span>
                    <span className="2xl:hidden">Public Map (15 Brgys)</span>
                  </>
                )}
              </div>

              {/* In-Map Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search barangay or farm..."
                  className="pl-8 pr-6 py-1.5 w-36 sm:w-40 xl:w-44 2xl:w-56 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/60 text-white placeholder-slate-400 text-[11px] shadow-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Select Location, Heatmap, Filters, Basemap Switcher */}
            <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap lg:flex-nowrap shrink-0">
              {/* Select Location for Registration */}
              <button
                type="button"
                onClick={() => {
                  setActiveTool(activeTool === 'drop_pin' ? 'none' : 'drop_pin');
                  setMeasurePoints([]);
                  setDigitizerPoints([]);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 whitespace-nowrap ${
                  activeTool === 'drop_pin'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-400/80 animate-pulse'
                    : 'bg-[#16a34a] hover:bg-[#15803d] text-white'
                }`}
                title="Click anywhere on the map to pin and select registration coordinates"
              >
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden 2xl:inline">
                  {activeTool === 'drop_pin' ? 'Click Map to Select' : 'Select Location for Registration'}
                </span>
                <span className="2xl:hidden">
                  {activeTool === 'drop_pin' ? 'Click Map' : 'Select Location'}
                </span>
              </button>

              {/* Heatmap Toggle */}
              <button
                type="button"
                onClick={() => setMapDisplayMode(mapDisplayMode === 'heatmap' ? 'markers' : 'heatmap')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md border active:scale-95 whitespace-nowrap ${
                  mapDisplayMode === 'heatmap'
                    ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-400/30'
                    : 'bg-[#0f172a]/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/60'
                }`}
                title="Toggle production heatmap gradient"
              >
                <Flame className={`w-3.5 h-3.5 ${mapDisplayMode === 'heatmap' ? 'text-white' : 'text-amber-400'}`} />
                <span>Heatmap</span>
              </button>

              {/* Filters / Overlays Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsLayerControlOpen(!isLayerControlOpen)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg backdrop-blur-md border active:scale-95 whitespace-nowrap ${
                    isLayerControlOpen
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-[#0f172a]/90 hover:bg-slate-800 text-slate-200 hover:text-white border-slate-700/60'
                  }`}
                  title="Filter by ecosystem, variety, and toggle map layer overlays"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-300" />
                  <span>Filters</span>
                </button>

                {isLayerControlOpen && (
                  <div className="absolute right-0 top-10 z-500 w-80 bg-[#0f172a]/95 backdrop-blur-md border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-3.5 text-white animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                          GIS Filters &amp; Overlays
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsLayerControlOpen(false)}
                        className="text-slate-400 hover:text-white p-0.5 rounded-md hover:bg-slate-800 cursor-pointer"
                        title="Close filters"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Filter Selectors: Ecosystem & Barangay */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ecosystem</label>
                        <select
                          value={selectedEcosystem}
                          onChange={(e) => setSelectedEcosystem(e.target.value)}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white"
                        >
                          <option value="ALL">All Ecosystems</option>
                          <option value="IRRIGATED">Irrigated Lowland</option>
                          <option value="RAINFED">Rainfed Lowland</option>
                          <option value="UPLAND">Upland / Terrace</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Barangay</label>
                        <select
                          value={selectedBarangay}
                          onChange={(e) => setSelectedBarangay(e.target.value)}
                          className="w-full rounded-lg bg-slate-800 border border-slate-700 px-2 py-1 text-xs text-white"
                        >
                          <option value="ALL">All 15 Barangays</option>
                          {visibleBarangays.map((b) => (
                            <option key={b.name} value={b.name}>
                              {b.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Layer Overlays */}
                    <div className="space-y-2 pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Visible Layers
                      </span>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                        <span>Official Silago Boundaries (GeoJSON)</span>
                        <input
                          type="checkbox"
                          checked={showBoundariesLayer}
                          onChange={(e) => setShowBoundariesLayer(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-600 bg-slate-800 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                        <span>Barangay Names</span>
                        <input
                          type="checkbox"
                          checked={showBarangayLabels}
                          onChange={(e) => setShowBarangayLabels(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-600 bg-slate-800 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                        <span>Rice Farm GPS Pins</span>
                        <input
                          type="checkbox"
                          checked={showParcelsLayer}
                          onChange={(e) => setShowParcelsLayer(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-600 bg-slate-800 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                        <span>Registered Farmer Locations</span>
                        <input
                          type="checkbox"
                          checked={showFarmerLocations}
                          onChange={(e) => setShowFarmerLocations(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-600 bg-slate-800 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer hover:text-white">
                        <span>MAO Facilities &amp; Landmarks</span>
                        <input
                          type="checkbox"
                          checked={showFacilitiesLayer}
                          onChange={(e) => setShowFacilitiesLayer(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 border-slate-600 bg-slate-800 cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Heatmap settings if active */}
                    {mapDisplayMode === 'heatmap' && (
                      <div className="space-y-2 border-t border-slate-800 pt-2">
                        <label className="flex items-center justify-between gap-3 text-xs text-slate-300">
                          <span>Heatmap Measure</span>
                          <select
                            value={heatMetric}
                            onChange={(e) => setHeatMetric(e.target.value as HeatMetric)}
                            className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white"
                          >
                            <option value="area">Farm area</option>
                            <option value="farmers">Farmer density</option>
                            <option value="yield">Projected yield</option>
                          </select>
                        </label>
                        <label className="block text-[11px] font-medium text-slate-400">
                          Heatmap opacity <span className="float-right text-white">{Math.round(heatmapOpacity * 100)}%</span>
                          <input
                            type="range"
                            min="0.1"
                            max="0.9"
                            step="0.05"
                            value={heatmapOpacity}
                            onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
                            className="mt-1 w-full accent-emerald-500"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Segmented Basemap Switcher (Street | Satellite | Terrain | Dark) */}
              <div className="flex items-center gap-0.5 rounded-xl bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/60 p-0.5 shadow-lg shrink-0">
                {(['osm', 'satellite', 'topo', 'dark'] as BaseLayerType[]).map((layerKey) => {
                  const isActive = activeBaseLayer === layerKey;
                  const label = layerKey === 'osm' ? 'Street' : layerKey === 'satellite' ? 'Satellite' : layerKey === 'topo' ? 'Terrain' : 'Dark';
                  return (
                    <button
                      key={layerKey}
                      type="button"
                      onClick={() => setActiveBaseLayer(layerKey)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-[#16a34a] text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* LEFT VERTICAL TOOL RAIL (Matching Picture 2) */}
          <div className="absolute top-28 sm:top-24 lg:top-16 left-3 z-400 flex flex-col gap-1.5 pointer-events-auto">
            {/* Zoom In */}
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-9 h-9 rounded-xl bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-9 h-9 rounded-xl bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>

            {/* Reset View */}
            <button
              type="button"
              onClick={handleResetView}
              className="w-9 h-9 rounded-xl bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/60 flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95 group"
              title="Reset View: Center & view all 15 Silago barangays"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4 group-hover:-rotate-45 transition-transform duration-200" />
            </button>

            {/* Draw Boundary */}
            <button
              type="button"
              onClick={handleToggleDrawBoundary}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                activeTool === 'draw_boundary' || activeTool === 'draw_polygon'
                  ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400/40'
                  : 'bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
              title="Draw Boundary: Click points on the map to define new farm parcel boundaries"
              aria-label="Draw Boundary"
            >
              <PenTool className="w-4 h-4" />
            </button>

            {/* Colors */}
            <button
              type="button"
              onClick={() => {
                if (customizerBarangay) {
                  setCustomizerBarangay(null);
                } else {
                  const targetName = selectedBarangay !== 'ALL' ? selectedBarangay : 'Laguma';
                  const targetFeature = findSilagoBarangayFeature(targetName) || SILAGO_OFFICIAL_GEOJSON.features[0];
                  setCustomizerBarangay({
                    name: targetFeature?.properties?.name || targetName,
                    zone: targetFeature?.properties?.zone,
                    terrain: targetFeature?.properties?.terrain,
                    center: targetFeature?.properties?.center,
                    areaHa: targetFeature?.properties?.areaHa
                  });
                }
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                customizerBarangay
                  ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400/40'
                  : 'bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
              title="Colors: Customize Barangay Boundary Colors & Fill Opacity"
              aria-label="Colors"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* Farmers Directory */}
            <button
              type="button"
              onClick={() => setIsFarmerListOpen(!isFarmerListOpen)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95 relative ${
                isFarmerListOpen
                  ? 'bg-blue-600 text-white border-blue-500 ring-2 ring-blue-400/40'
                  : 'bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
              title={isFarmerListOpen ? 'Hide Farmers Directory' : 'Open Farmers Directory Carousel'}
              aria-label="Farmers Directory"
            >
              <Users className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                {filteredParcels.length}
              </span>
            </button>

            {/* Measure Distance */}
            <button
              type="button"
              onClick={() => {
                setActiveTool(activeTool === 'measure' ? 'none' : 'measure');
                setMeasurePoints([]);
                setDigitizerPoints([]);
              }}
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95 ${
                activeTool === 'measure'
                  ? 'bg-amber-600 text-white border-amber-500 ring-2 ring-amber-400/40'
                  : 'bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
              }`}
              title="Measure Distance along irrigation canal or road"
              aria-label="Measure Distance"
            >
              <Ruler className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-[#0f172a]/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center shadow-lg transition-all cursor-pointer backdrop-blur-md active:scale-95"
              title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen GIS Map'}
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

            {/* LEAFLET MAP ELEMENT */}
            <div
              ref={mapContainerRef}
              className={`w-full h-full bg-slate-950 relative z-0 ${isFullscreen ? 'min-h-0' : 'min-h-[540px]'}`}
            />

            {/* GIS MAP LEGEND (Bottom Right Floating Card, Matching Picture 2) */}
            {showMapLegend ? (
              <div className="absolute bottom-6 right-3.5 z-400 w-64 rounded-xl border border-slate-700/70 bg-[#0f172a]/95 p-3.5 text-white shadow-2xl backdrop-blur-md pointer-events-auto animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-bold tracking-wider text-slate-200 uppercase">
                      GIS MAP LEGEND
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMapLegend(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    title="Hide legend"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3 rounded-xs border border-emerald-400 bg-emerald-500/30 shrink-0" />
                    <span>Barangay Cadastral Boundary</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shrink-0 shadow" />
                    <span>Rice Farm Lot (GPS Pin)</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 border border-white shrink-0 shadow" />
                    <span>Registered Farmer Location</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-amber-400 border border-white shrink-0 shadow" />
                    <span>Irrigation Dam &amp; Facility</span>
                  </div>

                  {mapDisplayMode !== 'markers' && (
                    <div className="pt-2 border-t border-slate-800/80 text-[10px] space-y-1">
                      <div className="text-slate-400 flex justify-between">
                        <span>Heatmap: {heatMetric}</span>
                        <span className="text-emerald-400 font-medium">Low → High</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-red-600" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowMapLegend(true)}
                className="absolute bottom-6 right-3.5 z-400 px-3 py-1.5 rounded-xl border border-slate-700/70 bg-[#0f172a]/90 hover:bg-slate-800 text-slate-200 hover:text-white text-[11px] font-bold shadow-xl backdrop-blur-md flex items-center gap-1.5 cursor-pointer pointer-events-auto"
                title="Show GIS Map Legend"
              >
                <MapIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Legend</span>
              </button>
            )}

            {/* Quick Notice Banner when dropping a pin */}
            {activeTool === 'drop_pin' && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-400 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-2xl border border-rose-400/50 flex items-center gap-2 animate-bounce pointer-events-auto">
                <MapPin className="w-4 h-4 text-white shrink-0" />
                <span>Click anywhere on the map to pin and select farm location</span>
                <button
                  type="button"
                  onClick={() => setActiveTool('none')}
                  className="ml-2 bg-rose-700 hover:bg-rose-800 p-0.5 rounded cursor-pointer"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {mapNotice && (
              <div role="status" className="absolute bottom-6 left-1/2 z-450 flex max-w-[min(92%,34rem)] -translate-x-1/2 items-center gap-2 rounded-xl border border-emerald-400/40 bg-slate-900/95 text-white px-3.5 py-2 text-xs font-medium shadow-2xl backdrop-blur-md">
                <MapPin className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{mapNotice}</span>
                <button type="button" aria-label="Dismiss map message" onClick={() => setMapNotice('')} className="ml-1 text-slate-400 hover:text-white cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* DRAW BOUNDARY OVERLAY HUD */}
            {(activeTool === 'draw_boundary' || activeTool === 'draw_polygon') && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-400 max-w-xl w-[92%] sm:w-auto bg-slate-900/95 backdrop-blur-md border border-blue-500/60 rounded-2xl p-3 shadow-2xl text-white flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sky-400">
                        {digitizerPoints.length === 0
                          ? 'Click on the map to define boundary corners'
                          : `Drawing Boundary: ${digitizerPoints.length} vertices captured`}
                      </span>
                      {digitizerPoints.length >= 3 && (
                        <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 rounded text-[10px] font-bold">
                          Polygon Complete
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-300 block mt-0.5">
                      {digitizerPoints.length === 0 ? (
                        'Click at least 3 points to enclose parcel polygon • Double-click or click V1 to complete'
                      ) : digitizerPoints.length < 3 ? (
                        `Captured: ${digitizerPoints.length} point${digitizerPoints.length > 1 ? 's' : ''} • Need ${3 - digitizerPoints.length} more to form polygon`
                      ) : (
                        <>
                          Area: <strong className="text-emerald-400 font-bold">{drawnAreaMetrics.hectares.toFixed(2)} ha</strong> ({Math.round(drawnAreaMetrics.sqMeters).toLocaleString()} m²) &bull; Centroid: <span className="font-mono text-slate-300">{calculatePolygonCentroid(digitizerPoints).lat.toFixed(5)}, {calculatePolygonCentroid(digitizerPoints).lng.toFixed(5)}</span> &bull; Brgy. <strong className="text-sky-300">{detectBarangayFromCoordinates(calculatePolygonCentroid(digitizerPoints).lat, calculatePolygonCentroid(digitizerPoints).lng)}</strong>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                  {digitizerPoints.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDigitizerPoints((prev) => prev.slice(0, -1))}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      title="Undo last placed vertex"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Undo</span>
                    </button>
                  )}

                  {digitizerPoints.length >= 3 && (
                    <button
                      type="button"
                      onClick={handleFinishDrawnPolygon}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md hover:shadow-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Complete &amp; Register</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDigitizerPoints([]);
                      setActiveTool('none');
                    }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    title="Cancel drawing"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* MEASURE TOOL OVERLAY BANNER */}
            {activeTool === 'measure' && measurePoints.length > 0 && (
              <div className="absolute top-16 left-1/2 -translate-x-1/2 z-400 bg-slate-900/95 border border-amber-500/50 rounded-2xl p-3 shadow-2xl text-white flex items-center gap-3 animate-in fade-in duration-200">
                <div className="text-xs">
                  <span className="font-bold text-amber-400 block">Measuring Geodesic Distance</span>
                  <span className="text-[11px] text-slate-300">
                    {measurePoints.length} points &bull; Total:{' '}
                    <strong className="text-amber-300">
                      {totalMeasuredDistanceMeters > 1000
                        ? (totalMeasuredDistanceMeters / 1000).toFixed(2) + ' km'
                        : Math.round(totalMeasuredDistanceMeters) + ' meters'}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* SLIDE-OVER DETAIL DRAWER FOR SELECTED PARCEL - 3 STRUCTURED SEGMENTS & DEEP SHADOW */}
            {selectedParcelForDrawer && (
              <div className="absolute bottom-6 left-16 z-410 w-80 sm:w-88 max-w-[calc(100%-5rem)] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-2xl space-y-3 text-slate-800 animate-in slide-in-from-left-4 duration-200 ring-1 ring-black/5">
                {/* Header: Farmer Name & ID Tags */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                        {selectedParcelForDrawer.tagNumber}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                        {selectedParcelForDrawer.swineNameOrId || 'RSBSA'}
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-slate-900 mt-1 truncate">
                      {selectedParcelForDrawer.raiserName}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedParcelForDrawer(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 3 Structured Segments Grid: Barangay, Total Area, Variety & Ecosystem */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Segment 1: Barangay */}
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Barangay</span>
                    <span className="font-bold text-slate-900 text-xs mt-1 truncate">
                      📍 Brgy. {selectedParcelForDrawer.barangay}
                    </span>
                  </div>

                  {/* Segment 2: Total Area */}
                  <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/70 flex flex-col justify-between">
                    <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">Total Area</span>
                    <span className="font-bold text-emerald-800 font-mono text-sm mt-0.5">
                      {getParcelAreaHa(selectedParcelForDrawer) > 0 ? `${getParcelAreaHa(selectedParcelForDrawer).toFixed(2)} ha` : 'Not recorded'}
                    </span>
                  </div>

                  {/* Segment 3: Variety & Ecosystem */}
                  <div className="col-span-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Variety &amp; Ecosystem</span>
                      <span className="font-bold text-slate-900 text-xs mt-0.5 flex items-center gap-1.5 truncate">
                        <Wheat className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{selectedParcelForDrawer.breed}</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 font-medium text-[10px] shrink-0">
                      {selectedParcelForDrawer.purpose}
                    </span>
                  </div>
                </div>

                {/* Coordinates & Copy */}
                {selectedParcelCoordinates && selectedParcelCoordinates.lat !== null && selectedParcelCoordinates.lng !== null ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span className="text-[11px] font-mono text-slate-700 truncate font-medium">
                        {selectedParcelCoordinates.lat.toFixed(6)}, {selectedParcelCoordinates.lng.toFixed(6)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCoordinates(selectedParcelCoordinates.lat!, selectedParcelCoordinates.lng!)}
                      className="px-2 py-1 rounded-md bg-white text-emerald-800 hover:bg-emerald-50 border border-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs shrink-0"
                    >
                      {isCopiedCoords ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopiedCoords ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-relaxed">No verified GPS point within Silago. Confirm the farm coordinates before using this record for field navigation.</span>
                  </div>
                )}

                {/* Open Full Profile Dossier Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedParcelForDrawer) {
                      onSelectParcel(selectedParcelForDrawer);
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs hover:shadow-md cursor-pointer group"
                >
                  <span>Open Full Farmer Profile Dossier</span>
                  <ExternalLink className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            )}

            {/* INTERACTIVE COLOR CUSTOMIZER POPUP/SIDE CARD */}
            {customizerBarangay && (
              <div className="absolute top-16 right-4 z-420 w-80 max-h-[calc(100%-5rem)] overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-2xl text-slate-800 space-y-3.5 animate-in slide-in-from-top-3 duration-200">
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                        <Palette className="w-3.5 h-3.5" />
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                        Boundary Customizer
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-1">
                      Brgy. {customizerBarangay.name}
                    </h4>
                    <p className="text-[10.5px] text-slate-500">
                      Silago, Southern Leyte &bull; {customizerBarangay.zone || 'Official Boundary'}
                    </p>
                    <div className="mt-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                      <span className="block text-[9px] font-bold uppercase tracking-wide text-emerald-700">Official barangay boundary area</span>
                      <span className="mt-0.5 block font-mono text-sm font-black text-emerald-950">{customizerBarangay.areaHa ? `${customizerBarangay.areaHa.toLocaleString()} ha` : 'Area unavailable'}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-1.5 text-center">
                      <div className="rounded-lg border border-slate-200 bg-white px-1.5 py-2"><span className="block text-[9px] font-semibold uppercase text-slate-500">Rice farms</span><strong className="mt-0.5 block text-sm text-slate-900">{selectedBarangayRecords.length}</strong></div>
                      <div className="rounded-lg border border-slate-200 bg-white px-1.5 py-2"><span className="block text-[9px] font-semibold uppercase text-slate-500">Farmers</span><strong className="mt-0.5 block text-sm text-slate-900">{selectedBarangayFarmers}</strong></div>
                      <div className="rounded-lg border border-slate-200 bg-white px-1.5 py-2"><span className="block text-[9px] font-semibold uppercase text-slate-500">GPS mapped</span><strong className="mt-0.5 block text-sm text-emerald-800">{selectedBarangayMapped}</strong></div>
                    </div>
                    <p className="mt-2 text-[10px] text-slate-600">Extension focal: <strong className="text-slate-800">{barangayFocal || 'Not assigned'}</strong>{barangayContact && <><br/>Official contact: <strong className="text-slate-800">{barangayContact}</strong></>}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomizerBarangay(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    title="Close customizer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Color Selection: Native Picker + Presets */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                      <Paintbrush className="w-3 h-3 text-emerald-600" />
                      <span>Polygon Fill Color</span>
                    </label>
                    <span className="font-mono text-[10px] text-slate-500 font-bold uppercase">
                      {activeBarangayColor}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex items-center gap-2.5 px-2 py-1.5 bg-slate-50 rounded-xl border border-slate-200 flex-1">
                      <input
                        type="color"
                        value={activeBarangayColor}
                        onChange={(e) =>
                          handleUpdateBarangayColor(customizerBarangay.name, e.target.value)
                        }
                        className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0 bg-transparent shrink-0"
                        title="Choose custom color"
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-800 font-mono leading-none">
                          {activeBarangayColor.toUpperCase()}
                        </span>
                        <span className="text-[9px] text-slate-400 leading-none mt-0.5">
                          Click swatch to pick
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleResetBarangayStyle(customizerBarangay.name)}
                      className="px-2.5 py-2 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-xs"
                      title="Reset to default pastel"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Preset Pastel Swatches */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] text-slate-500 font-bold block">
                      Preset Pastel Swatches:
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PASTEL_PRESET_COLORS.map((preset) => {
                        const isSelected =
                          activeBarangayColor.toLowerCase() === preset.hex.toLowerCase();
                        return (
                          <button
                            key={preset.hex}
                            type="button"
                            onClick={() =>
                              handleUpdateBarangayColor(customizerBarangay.name, preset.hex)
                            }
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition cursor-pointer ${
                              isSelected
                                ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-100'
                            }`}
                            title={`${preset.name} (${preset.hex})`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-xs"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span className="text-[9.5px] font-bold text-slate-700 truncate leading-none">
                              {preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Opacity Slider */}
                <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-700 text-[11px]">
                      Fill Opacity
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                      {Math.round(activeBarangayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.60}
                    step={0.05}
                    value={activeBarangayOpacity}
                    onChange={(e) =>
                      handleUpdateBarangayOpacity(
                        customizerBarangay.name,
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>5% (Subtle)</span>
                    <span>12% (Default)</span>
                    <span>40% (Medium)</span>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyToAllBarangays(activeBarangayColor, activeBarangayOpacity)
                    }
                    className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    title="Apply this color and opacity to all 15 Silago barangays"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Apply to All 15 Barangays</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResetAllBarangayStyles()}
                    className="p-1.5 text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                    title="Reset all barangays to original defaults"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* AUTHORIZATION REQUIRED MODAL FOR DRAW BOUNDARY */}
            {showAuthWarningModal && (
              <div className="fixed inset-0 z-500 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-800 animate-in zoom-in-95 duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                          Access Control
                        </span>
                        <h3 className="font-serif font-bold text-base text-slate-900 leading-tight">
                          Staff Authorization Required
                        </h3>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthWarningModal(false)}
                      className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    The <strong>Draw Boundary</strong> tool allows Local Farmer Technicians (LFT) and Central Administrators to capture GIS polygon coordinates and register new rice parcels into the municipal database.
                  </p>

                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <PenTool className="w-3.5 h-3.5" />
                    </div>
                    <span>Please sign in with your authorized LFT or Admin account to draw boundaries.</span>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAuthWarningModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    >
                      Continue Viewing Map
                    </button>
                    {onOpenLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAuthWarningModal(false);
                          onOpenLogin();
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Sign In to Draw</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};
