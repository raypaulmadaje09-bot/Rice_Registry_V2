import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, MapPin, Ruler, Undo2, Trash2, Sparkles, CheckCircle2, LocateFixed, Satellite, Mountain, Save, Crosshair, AlertCircle } from 'lucide-react';
import { Barangay } from '../types';
import { findSilagoBarangayFeature } from '../data/silagoGeoJson';
import { findBarangayBoundary } from '../data/barangayBoundaries';
import { matchBarangay } from '../data/barangays';
import { useApp } from '../context/AppContext';

interface GisMeasureViewProps { barangay: Barangay; onSaveAndReturn?: () => void }
type Point = [number, number];
type MapStyle = 'street' | 'satellite' | 'topo';
type SavedMeasureSettings = { zone?: string; buffer?: string; focalPerson?: string; contactNumber?: string; centerLat?: number; centerLng?: number; areaHa?: number; perimeterKm?: number };
function getSavedMeasureSettings(): Record<string, SavedMeasureSettings> {
  try { return JSON.parse(localStorage.getItem('silago_gis_measure_settings') || '{}'); } catch { return {}; }
}
const tileSources: Record<MapStyle, { url: string; attribution: string; maxZoom: number }> = {
  street: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', maxZoom: 19 },
  satellite: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri', maxZoom: 19 },
  topo: { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', attribution: 'Tiles &copy; Esri Topographic Map', maxZoom: 19 }
};
const rad = (n: number) => n * Math.PI / 180;
function polygonAreaHa(points: Point[]) {
  if (points.length < 3) return 0;
  const lat0 = rad(points.reduce((n, p) => n + p[0], 0) / points.length);
  const xy = points.map(([lat, lng]) => [rad(lng) * 6371008.8 * Math.cos(lat0), rad(lat) * 6371008.8] as Point);
  let area = 0;
  for (let i = 0; i < xy.length; i++) { const a = xy[i], b = xy[(i + 1) % xy.length]; area += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(area / 2) / 10000;
}
function perimeterKm(points: Point[]) {
  if (points.length < 2) return 0;
  const edges = points.map((a, i) => [a, points[(i + 1) % points.length]] as [Point, Point]).slice(0, points.length >= 3 ? points.length : points.length - 1);
  return edges.reduce((sum, [a, b]) => { const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2; return sum + 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); }, 0);
}
function featureRing(name: string): Point[] {
  const boundary = findBarangayBoundary(name);
  if (boundary && boundary.polygon && boundary.polygon.length > 0) {
    return boundary.polygon as Point[];
  }
  const geometry = findSilagoBarangayFeature(name)?.geometry;
  if (!geometry) return [];
  const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0]?.[0];
  return Array.isArray(ring) ? ring.map(([lng, lat]: [number, number]) => [lat, lng] as Point) : [];
}

export const GisMeasureView: React.FC<GisMeasureViewProps> = ({ barangay, onSaveAndReturn }) => {
  const { lftAccounts } = useApp();
  const assignedOfficer = lftAccounts.find(account =>
    (account.assignedBarangays || []).some(name => matchBarangay(name, barangay.name)) || matchBarangay(account.barangay, barangay.name)
  );
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const shapesRef = useRef<L.LayerGroup | null>(null);
  const plottingRef = useRef(true);
  const rulerRef = useRef(false);
  const centerRef = useRef(false);
  const savedSettings = getSavedMeasureSettings()[barangay.name] || {};
  const [mapStyle, setMapStyle] = useState<MapStyle>('satellite');
  const [points, setPoints] = useState<Point[]>(() => {
    try {
      const all = JSON.parse(localStorage.getItem('silago_gis_measure_points') || '{}');
      if (Array.isArray(all[barangay.name]) && all[barangay.name].length > 0) {
        return all[barangay.name];
      }
    } catch {}
    const official = featureRing(barangay.name);
    return official.length > 0 ? official : [];
  });
  const [isPlotting, setIsPlotting] = useState(true);
  const [pinCenter, setPinCenter] = useState(false);
  const [centerMode, setCenterMode] = useState(false);
  const [rulerMode, setRulerMode] = useState(false);
  const [rulerPoints, setRulerPoints] = useState<Point[]>([]);
  const [zone, setZone] = useState(savedSettings.zone || 'Rice Granary Zone');
  const [buffer, setBuffer] = useState(savedSettings.buffer || '500');
  const [focalPerson, setFocalPerson] = useState(savedSettings.focalPerson || assignedOfficer?.name || barangay.focalPerson || '');
  const [contactNumber, setContactNumber] = useState(savedSettings.contactNumber || assignedOfficer?.contactNumber || barangay.contactNumber || '');
  const [centerLat, setCenterLat] = useState(Number(savedSettings.centerLat ?? barangay.lat));
  const [centerLng, setCenterLng] = useState(Number(savedSettings.centerLng ?? barangay.lng));
  const [notice, setNotice] = useState('');
  const center: Point = [centerLat, centerLng];
  const zoneColor = zone === 'Buffer Zone' ? 'border-amber-200 bg-amber-50 text-amber-800' : zone === 'Coastal Agricultural Zone' ? 'border-sky-200 bg-sky-50 text-sky-800' : zone === 'Upland Agricultural Zone' ? 'border-orange-200 bg-orange-50 text-orange-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800';
  const area = useMemo(() => polygonAreaHa(points), [points]);
  const perimeter = useMemo(() => perimeterKm(points), [points]);
  const rulerDistance = useMemo(() => rulerPoints.length === 2 ? perimeterKm(rulerPoints).toFixed(3) : null, [rulerPoints]);

  useEffect(() => { plottingRef.current = isPlotting; rulerRef.current = rulerMode; centerRef.current = centerMode; }, [isPlotting, rulerMode, centerMode]);

  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return;
    const map = L.map(mapHostRef.current, { center, zoom: 14, zoomControl: true });
    tileRef.current = L.tileLayer(tileSources[mapStyle].url, { attribution: tileSources[mapStyle].attribution, maxZoom: tileSources[mapStyle].maxZoom }).addTo(map);
    shapesRef.current = L.layerGroup().addTo(map);
    map.on('click', (event: L.LeafletMouseEvent) => {
      const point: Point = [event.latlng.lat, event.latlng.lng];
      if (centerRef.current) {
        setCenterLat(Number(point[0].toFixed(6)));
        setCenterLng(Number(point[1].toFixed(6)));
        setCenterMode(false);
      } else if (rulerRef.current) {
        setRulerPoints(prev => prev.length === 2 ? [point] : [...prev, point]);
        setRulerMode(false);
        setIsPlotting(false);
      } else if (plottingRef.current) setPoints(prev => [...prev, point]);
    });
    mapRef.current = map;
    if (points.length >= 3) {
      try {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [35, 35] });
        }
      } catch {}
    }
    return () => { map.remove(); mapRef.current = null; tileRef.current = null; shapesRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (points.length >= 3) {
      try {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [35, 35] });
          return;
        }
      } catch {}
    }
    map.setView(center, 14);
  }, [barangay.name, points]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tileRef.current) return;
    tileRef.current.remove();
    tileRef.current = L.tileLayer(tileSources[mapStyle].url, { attribution: tileSources[mapStyle].attribution, maxZoom: tileSources[mapStyle].maxZoom }).addTo(map);
  }, [mapStyle]);
  useEffect(() => {
    const map = mapRef.current, group = shapesRef.current;
    if (!map || !group) return;
    group.clearLayers();
    const boundaryColor = zone === 'Buffer Zone' ? '#d97706' : zone === 'Coastal Agricultural Zone' ? '#0284c7' : zone === 'Upland Agricultural Zone' ? '#c2410c' : '#059669';
    if (points.length >= 3) L.polygon(points, { color: boundaryColor, weight: 2.5, fillColor: boundaryColor, fillOpacity: 0.18 }).addTo(group);
    if (rulerPoints.length === 2) L.polyline(rulerPoints, { color: '#2563eb', weight: 3, dashArray: '6 6' }).addTo(group);
    // Render interactive vertex control markers (sampled cleanly for high-resolution polygons)
    const markerStride = points.length > 36 ? Math.ceil(points.length / 28) : 1;
    points.forEach((point, index) => {
      if (index % markerStride !== 0 && index !== points.length - 1) return;
      const marker = L.marker(point, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<span style="display:flex;width:20px;height:20px;align-items:center;justify-content:center;border:2px solid ${boundaryColor};border-radius:50%;background:white;color:#1c1917;font-size:9.5px;font-weight:700;box-shadow:0 1px 4px #0f172a55">${index + 1}</span>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(group);
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        setPoints(prev => prev.map((p, i) => i === index ? [lat, lng] : p));
      });
      marker.on('click', (event: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(event.originalEvent);
        if (points.length > 3) setPoints(prev => prev.filter((_, i) => i !== index));
      });
      marker.bindTooltip(`Vertex #${index + 1} · Drag to calibrate · Click to remove`, { direction: 'top' });
    });
    if (pinCenter) L.circle(center, { radius: Number(buffer), color: boundaryColor, weight: 1.5, fillColor: boundaryColor, fillOpacity: 0.08, dashArray: '6, 6' }).addTo(group);
    const centerMarker = L.marker(center, { draggable: true, icon: L.divIcon({ className: '', html: `<span style="display:flex;width:30px;height:30px;align-items:center;justify-content:center;border:2px solid white;border-radius:50%;background:${boundaryColor};font-size:15px;box-shadow:0 2px 6px #0f172a66">🏛️</span>`, iconSize: [30, 30], iconAnchor: [15, 15] }) }).bindTooltip(`${barangay.name} Barangay Center · Drag to adjust`);
    centerMarker.on('dragend', () => { const { lat, lng } = centerMarker.getLatLng(); setCenterLat(Number(lat.toFixed(6))); setCenterLng(Number(lng.toFixed(6))); });
    centerMarker.addTo(group);
  }, [points, rulerPoints, pinCenter, buffer, barangay.name, centerLat, centerLng, zone]);

  const reloadOfficialBoundary = useCallback(() => {
    const ring = featureRing(barangay.name);
    if (ring.length < 3) {
      setNotice(`No official GIS boundary found for ${barangay.name}.`);
      return;
    }
    setPoints(ring);
    setIsPlotting(false);
    const bounds = L.latLngBounds(ring);
    if (bounds.isValid()) {
      mapRef.current?.fitBounds(bounds, { padding: [35, 35] });
    }
    setNotice(`Official boundary loaded for ${barangay.name} (${ring.length} points).`);
  }, [barangay.name]);
  const undoPoint = () => setPoints(prev => prev.slice(0, -1));
  const clearPoints = () => { setPoints([]); setIsPlotting(true); };
  const detectGps = () => {
    if (!navigator.geolocation) { setNotice('This device does not support GPS location.'); return; }
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));
      setCenterLat(lat);
      setCenterLng(lng);
      setPinCenter(true);
      mapRef.current?.setView([lat, lng], 15);
      setNotice('Barangay center updated from device GPS. Save to keep the change.');
    }, (error) => setNotice(`Unable to get GPS location: ${error.message}`), { enableHighAccuracy: true, timeout: 8000 });
  };
  const saveBarangayBoundary = () => {
    try {
      const allPoints = JSON.parse(localStorage.getItem('silago_gis_measure_points') || '{}');
      allPoints[barangay.name] = points;
      localStorage.setItem('silago_gis_measure_points', JSON.stringify(allPoints));
      const settings = getSavedMeasureSettings();
      settings[barangay.name] = { zone, buffer, focalPerson, contactNumber, centerLat, centerLng, areaHa: area, perimeterKm: perimeter };
      localStorage.setItem('silago_gis_measure_settings', JSON.stringify(settings));
      setNotice('Barangay details and GIS boundary saved.');
      onSaveAndReturn?.();
    } catch { setNotice('Unable to save this barangay on this device.'); }
  };

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"><Map className="h-6 w-6"/></span><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Official Registry · Silago, Southern Leyte</div><h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Measure GIS: Plot &amp; Measure Boundary</h1><p className="mt-1 text-sm leading-relaxed text-slate-500">Click on the satellite or street map to plot vertices along the boundary perimeter. Drag vertices to calibrate.</p></div></div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900">Barangay information &amp; classification</h2><p className="mt-1 text-xs text-slate-500">Update the barangay profile, center coordinates, and rice production classification.</p></div><button type="button" onClick={detectGps} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"><Crosshair className="h-4 w-4"/>Auto-Detect Current GPS</button></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-xs font-semibold text-slate-600">Barangay Name<input readOnly value={barangay.name} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800"/></label>
        <label className="text-xs font-semibold text-slate-600">Assigned Extension Focal Person<input value={focalPerson} onChange={e => setFocalPerson(e.target.value)} placeholder="Enter assigned focal person" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"/></label>
        <label className="text-xs font-semibold text-slate-600">Official Contact Number<input value={contactNumber} onChange={e => setContactNumber(e.target.value)} placeholder="Enter contact number" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800"/></label>
        <label className="text-xs font-semibold text-slate-600">Agricultural Zone Classification<div className="mt-1.5 flex items-center gap-2"><select value={zone} onChange={e => setZone(e.target.value)} className={`min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-sm ${zoneColor}`}><option>Rice Granary Zone</option><option>Buffer Zone</option><option>Coastal Agricultural Zone</option><option>Upland Agricultural Zone</option></select><span className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[10px] font-bold ${zoneColor}`}>{zone === 'Buffer Zone' ? 'BUFFER' : zone === 'Coastal Agricultural Zone' ? 'COASTAL' : zone === 'Upland Agricultural Zone' ? 'UPLAND' : 'RICE'}</span></div></label>
        <label className="text-xs font-semibold text-slate-600">Center Latitude (°N)<input type="number" step="0.000001" value={centerLat} onChange={e => setCenterLat(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-800"/></label>
        <label className="text-xs font-semibold text-slate-600">Center Longitude (°E)<input type="number" step="0.000001" value={centerLng} onChange={e => setCenterLng(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm text-slate-800"/></label>
      </div>
      {notice && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900"><AlertCircle className="h-4 w-4 shrink-0"/>{notice}</p>}
    </section>

    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-bold text-slate-900">Live GIS map controls &amp; metrics</h2><p className="mt-1 text-xs text-slate-500">Choose a basemap, draw the boundary, and review the calculated measurements.</p></div><div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">{(['street','satellite','topo'] as MapStyle[]).map(style=><button key={style} onClick={()=>setMapStyle(style)} className={`rounded-lg px-3 py-2 text-xs font-semibold capitalize ${mapStyle===style?'bg-white text-emerald-800 shadow-sm':'text-slate-500 hover:text-slate-800'}`}>{style==='satellite'?<Satellite className="mr-1 inline h-3.5 w-3.5"/>:style==='topo'?<Mountain className="mr-1 inline h-3.5 w-3.5"/>:<Map className="mr-1 inline h-3.5 w-3.5"/>}{style}</button>)}</div></div>
      <div className="flex flex-wrap gap-2"><button onClick={()=>{setIsPlotting(true);setRulerMode(false);setCenterMode(false);setPinCenter(false);setRulerPoints([]);}} className={`${isPlotting&&!centerMode?'bg-emerald-700 text-white':'border border-slate-200 bg-white text-slate-700'} inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold`}><Map className="h-4 w-4"/>Plot &amp; Measure Boundary</button><button onClick={()=>{setPinCenter(true);setCenterMode(v=>!v);setRulerMode(false);setIsPlotting(false);}} className={`${pinCenter?'border border-emerald-200 bg-emerald-50 text-emerald-800':'border border-slate-200 bg-white text-slate-700'} inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold`}><MapPin className="h-4 w-4"/>{centerMode?'Click Map to Set Center':'Pin Barangay Hall / Center'}</button><button onClick={()=>{setRulerMode(v=>!v);setCenterMode(false);setPinCenter(false);setIsPlotting(false);setRulerPoints([]);}} className={`${rulerMode?'border border-emerald-200 bg-emerald-50 text-emerald-800':'border border-slate-200 bg-white text-slate-700'} inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold`}><Ruler className="h-4 w-4"/>Ruler Distance</button><label className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-600">Surveillance Buffer<select value={buffer} onChange={e=>setBuffer(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="250">250 m Radius</option><option value="500">500 m Radius</option><option value="1000">1 km Radius</option><option value="2000">2 km Radius</option></select></label></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Enclosed Land Area" value={points.length>=3?`${area.toFixed(2)} ha`:'—'} detail={points.length>=3?'Calculated from plotted boundary':'Plot at least 3 vertices'} tone="emerald"/>
        <Metric label="Boundary Perimeter" value={points.length>=3?`${perimeter.toFixed(3)} km`:'—'} detail={points.length>=3?'Closed polygon perimeter':'Plot at least 3 vertices'} tone="blue"/>
        <Metric label="Barangay Center GPS" value={`${centerLat.toFixed(5)}, ${centerLng.toFixed(5)}`} detail={`${barangay.name}, Silago`} tone="slate"/>
      </div>
      {rulerDistance && <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">Ruler distance: {rulerDistance} km</div>}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
        <div ref={mapHostRef} className="h-[460px] w-full"/>
        <div className="absolute left-3 top-3 z-[500] flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1.5 text-xs font-bold shadow-sm ${points.length>=3?'bg-emerald-700 text-white':'bg-white text-slate-700'}`}>{points.length>=3?<><CheckCircle2 className="mr-1 inline h-3.5 w-3.5"/>Polygon Closed</>:'Boundary Not Closed'}</span><span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">{points.length} vertices</span></div>
        <div className="pointer-events-none absolute bottom-3 left-3 z-[500] rounded-lg bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-sm">Click anywhere on the map to add boundary points; drag markers to adjust.</div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap gap-2"><button onClick={reloadOfficialBoundary} className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100 transition cursor-pointer"><Sparkles className="h-4 w-4"/>Reload Official Boundary</button><button onClick={undoPoint} disabled={!points.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"><Undo2 className="h-4 w-4"/>Undo Point</button><button onClick={clearPoints} disabled={!points.length} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-40"><Trash2 className="h-4 w-4"/>Clear Points</button></div><button onClick={()=>mapRef.current?.setView(center,15)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700"><LocateFixed className="h-4 w-4"/>Center Map</button></div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px] leading-relaxed text-slate-500">Boundary coordinates and measured area will be saved with this Silago barangay record. Verify measurements against official land records.</p><button type="button" onClick={saveBarangayBoundary} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"><Save className="h-4 w-4"/>Save Barangay &amp; Boundary</button></div>
    </section>
  </div>;
};

function Metric({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'emerald'|'blue'|'slate' }) {
  const color = tone==='emerald'?'text-emerald-800 bg-emerald-50':tone==='blue'?'text-blue-800 bg-blue-50':'text-slate-800 bg-slate-50';
  return <div className="rounded-2xl border border-slate-200 p-4"><div className="text-xs font-semibold text-slate-500">{label}</div><div className={`mt-2 inline-flex rounded-lg px-2.5 py-1.5 text-lg font-bold ${color}`}>{value}</div><div className="mt-2 text-[11px] text-slate-500">{detail}</div></div>;
}
