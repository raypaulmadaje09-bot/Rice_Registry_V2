import { SILAGO_OFFICIAL_GEOJSON, SilagoGeoJSONFeature, SilagoBarangayProperties } from './silagoGeoJson';

export { SILAGO_OFFICIAL_GEOJSON };
export type { SilagoGeoJSONFeature, SilagoBarangayProperties };

export interface BarangayBoundary {
  id: string;
  name: string;
  aliases: string[];
  zone: 'North/Upland' | 'Central/Inland' | 'Coastal/Poblacion & South';
  center: [number, number]; // [lat, lng]
  color: string;           // #000000
  fillColor: string;       // #4ade80
  polygon: [number, number][]; // Multi-point territorial boundary polygon [lat, lng]
  terrainType: string;
  areaHa?: number;
}

/**
 * Flattens outer boundary ring from Polygon or MultiPolygon GeoJSON geometry into Leaflet [lat, lng]
 */
function extractOuterRingLatLngs(geometry: any): [number, number][] {
  if (!geometry || !geometry.coordinates) return [];
  const coords = geometry.coordinates;
  const points: [number, number][] = [];

  if (geometry.type === 'MultiPolygon' && Array.isArray(coords[0]) && Array.isArray(coords[0][0])) {
    const ring = coords[0][0];
    ring.forEach(([lng, lat]: [number, number]) => {
      if (typeof lat === 'number' && typeof lng === 'number') {
        points.push([lat, lng]);
      }
    });
  } else if (geometry.type === 'Polygon' && Array.isArray(coords[0])) {
    const ring = coords[0];
    ring.forEach(([lng, lat]: [number, number]) => {
      if (typeof lat === 'number' && typeof lng === 'number') {
        points.push([lat, lng]);
      }
    });
  }

  return points;
}

/**
 * Official Silago Municipal Barangay Boundaries derived directly from the Official GeoJSON Dataset
 */
export const SILAGO_BARANGAY_BOUNDARIES: BarangayBoundary[] = SILAGO_OFFICIAL_GEOJSON.features.map((feature) => {
  const props = feature.properties;
  const polygonCoords = extractOuterRingLatLngs(feature.geometry);

  return {
    id: props.id,
    name: props.name,
    aliases: [props.name.toLowerCase(), props.id.toLowerCase()],
    zone: props.zone,
    center: props.center,
    color: '#1e3a1e',
    fillColor: '#86efac',
    polygon: polygonCoords,
    terrainType: props.terrain,
    areaHa: props.areaHa
  };
});

export function findBarangayBoundary(name: string): BarangayBoundary | undefined {
  if (!name) return undefined;
  const lower = name.trim().toLowerCase();
  return SILAGO_BARANGAY_BOUNDARIES.find((b) =>
    b.name.toLowerCase() === lower ||
    b.aliases.some((a) => lower.includes(a) || a.includes(lower))
  );
}
