import rawGeoJson from './barangay_level_4.json';

/**
 * Official Boundary GeoJSON Dataset for Silago, Southern Leyte (Region VIII - Eastern Visayas)
 * Sourced directly from official barangay_level_4.geojson dataset.
 * Standard GeoJSON specification: Coordinates are formatted as [longitude, latitude].
 */

export interface SilagoBarangayProperties {
  id: string;
  name: string;
  barangayCode?: string;
  zone: 'North/Upland' | 'Central/Inland' | 'Coastal/Poblacion & South';
  terrain: string;
  areaHa?: number;
  municipality: string;
  province: string;
  region: string;
  center: [number, number]; // [lat, lng] for quick Leaflet centering
  // Original raw properties from GIS reference
  gid?: number;
  administrative_level?: number;
  admin_level_name?: string;
  shape0?: string;
  shape1?: string;
  shape2?: string;
  shape3?: string;
  shape4?: string;
  serial_id?: number;
}

export interface SilagoGeoJSONFeature {
  type: 'Feature';
  properties: SilagoBarangayProperties;
  geometry: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: any;
  };
}

export interface SilagoFeatureCollection {
  type: 'FeatureCollection';
  features: SilagoGeoJSONFeature[];
}

function computeCentroid(coords: any): [number, number] {
  let latSum = 0;
  let lngSum = 0;
  let count = 0;

  function traverse(arr: any) {
    if (Array.isArray(arr) && arr.length >= 2 && typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      lngSum += arr[0];
      latSum += arr[1];
      count++;
    } else if (Array.isArray(arr)) {
      arr.forEach(traverse);
    }
  }

  traverse(coords);
  return count > 0 ? [Number((latSum / count).toFixed(6)), Number((lngSum / count).toFixed(6))] : [10.53, 125.15];
}

function getZoneAndTerrain(name: string): {
  zone: 'North/Upland' | 'Central/Inland' | 'Coastal/Poblacion & South';
  terrain: string;
} {
  const n = name.toLowerCase();
  if (n.includes('hingatungan') || n.includes('salvacion') || n.includes('laguma') || n.includes('lagoma') || n.includes('tuba-on') || n.includes('tubaon')) {
    return { zone: 'North/Upland', terrain: 'Northern River Basin & Coastal Alluvial Plain' };
  }
  if (n.includes('district') || n.includes('pob') || n.includes('sap-ang') || n.includes('sapang') || n.includes('mercedes') || n.includes('balagawan')) {
    return { zone: 'Coastal/Poblacion & South', terrain: 'Coastal Lowlands & Central Urban Core' };
  }
  return { zone: 'Central/Inland', terrain: 'Central Terraced Fields & Upland Agroforestry' };
}

// Transform raw reference GeoJSON features into enriched typed GeoJSON collection
export const SILAGO_OFFICIAL_GEOJSON: SilagoFeatureCollection = {
  type: 'FeatureCollection',
  features: (rawGeoJson.features as any[]).map((f) => {
    const rawProps = f.properties || {};
    const brgyName = rawProps.shape4 || 'Unknown Barangay';
    const id = brgyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const { zone, terrain } = getZoneAndTerrain(brgyName);
    const center = computeCentroid(f.geometry.coordinates);

    return {
      type: 'Feature' as const,
      properties: {
        id,
        name: brgyName,
        zone,
        terrain,
        municipality: rawProps.shape3 || 'Silago',
        province: rawProps.shape2 || 'Southern Leyte',
        region: rawProps.shape1 || 'Eastern Visayas',
        center,
        gid: rawProps.gid,
        administrative_level: rawProps.administrative_level,
        admin_level_name: rawProps.admin_level_name,
        shape0: rawProps.shape0,
        shape1: rawProps.shape1,
        shape2: rawProps.shape2,
        shape3: rawProps.shape3,
        shape4: rawProps.shape4,
        serial_id: rawProps.serial_id
      },
      geometry: f.geometry
    };
  })
};

/**
 * Normalizes a barangay name for resilient matching across abbreviations
 */
export function normalizeBarangayName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^brgy\.?\s*/i, '')
    .replace(/^barangay\s*/i, '')
    .replace(/poblacion\s+district\s+/i, 'pob. district ')
    .replace(/pob\s+district\s+/i, 'pob. district ')
    .replace(/pd\s*1/i, 'pob. district i')
    .replace(/pob\s*1/i, 'pob. district i')
    .replace(/pd\s*2/i, 'pob. district ii')
    .replace(/pob\s*2/i, 'pob. district ii')
    .replace(/lagoma/i, 'laguma')
    .replace(/sapang/i, 'sap-ang')
    .replace(/tubaon/i, 'tuba-on')
    .trim();
}

/**
 * Helper to find a GeoJSON feature by barangay name or alias
 */
export function findSilagoBarangayFeature(name: string): SilagoGeoJSONFeature | undefined {
  if (!name) return undefined;
  const norm = normalizeBarangayName(name);

  return SILAGO_OFFICIAL_GEOJSON.features.find((f) => {
    const featureNorm = normalizeBarangayName(f.properties.name);
    return (
      featureNorm === norm ||
      featureNorm.includes(norm) ||
      norm.includes(featureNorm) ||
      (f.properties.id && norm.includes(f.properties.id))
    );
  });
}
