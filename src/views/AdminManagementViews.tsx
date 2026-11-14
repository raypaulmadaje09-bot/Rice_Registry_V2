import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useApp } from '../context/AppContext';
import { BARANGAYS, matchBarangay } from '../data/barangays';
import { DECREE_CATEGORIES, LegalDecree } from '../data/legalDecrees';
import { findSilagoBarangayFeature } from '../data/silagoGeoJson';
import { findBarangayBoundary } from '../data/barangayBoundaries';
import { Barangay, PortalTab } from '../types';
import {
  FileText,
  MapPin,
  UserRound,
  SlidersHorizontal,
  Users,
  Search,
  Plus,
  Upload,
  RotateCcw,
  Pencil,
  Trash2,
  Map,
  ShieldCheck,
  Save,
  Eye,
  GripVertical,
  LockKeyhole,
  LogOut,
  Check,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  ChevronUp,
  ChevronDown,
  EyeOff,
  Crosshair,
  Undo2,
  X,
  Lock
} from 'lucide-react';
import {
  DEFAULT_FORM_SECTIONS,
  DEFAULT_FORM_FIELDS,
  BUILTIN_FIELD_IDS,
  FormTarget,
  RegistryField as SharedRegistryField,
  RegistryFormSection,
  loadFormSchema,
  saveFormSchema,
  resetFormSchema
} from '../data/formSchema';

const card = 'rounded-2xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.035)]';
const input = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10';
const primary = 'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800';
const secondary = 'inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50';

function PageBanner({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle: string; children?: React.ReactNode }) {
  return <section className={`${card} mb-5 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6`}>
    <div className="flex min-w-0 items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"><Icon className="h-6 w-6" /></span><div><div className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-800">Official Registry</div><h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h2><p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-500">{subtitle}</p></div></div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </section>;
}

const decreeCategories = DECREE_CATEGORIES;

export function LegalDecreesView() {
  const {
    legalDecrees: docs,
    addLegalDecree,
    deleteLegalDecree,
    resetLegalDecrees,
    permissions
  } = useApp();
  const isCentralAdmin = permissions.isCentralAdmin;
  const [category, setCategory] = useState('All Documents');
  const [query, setQuery] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState({ title: '', number: '', dateEnacted: '', category: 'Municipal Ordinances', summary: '', text: '' });
  const [notice, setNotice] = useState('');

  const filtered = docs.filter(
    (d: LegalDecree) =>
      (category === 'All Documents' || d.category === category) &&
      (!selected || d.id === selected) &&
      `${d.title} ${d.number} ${d.summary || ''}`.toLowerCase().includes(query.toLowerCase()) &&
      d.text.toLowerCase().includes(keyword.toLowerCase())
  );
  const counts = (c: string) => (c === 'All Documents' ? docs.length : docs.filter((d) => d.category === c).length);

  const add = () => {
    if (!isCentralAdmin || !draft.title.trim()) return;
    addLegalDecree(draft);
    setDraft({ title: '', number: '', dateEnacted: '', category: 'Municipal Ordinances', summary: '', text: '' });
    setManualOpen(false);
    setNotice('Legal decree saved & published to portal and public interface.');
    setTimeout(() => setNotice(''), 3500);
  };

  const importFile = async (file?: File) => {
    if (!isCentralAdmin || !file) return;
    const text = file.type === 'text/plain' ? await file.text() : `Imported document file: ${file.name}`;
    const name = file.name.replace(/\.[^.]+$/, '');
    addLegalDecree({
      title: name,
      number: 'Imported Document',
      category: 'Municipal Ordinances',
      dateEnacted: new Date().toISOString().slice(0, 10),
      summary: `Imported from ${file.name}`,
      text
    });
    setNotice(`${file.name} imported and published to the interface.`);
    setTimeout(() => setNotice(''), 3500);
  };

  return (
    <div>
      <PageBanner
        icon={FileText}
        title="Legal Decrees & Ordinances Management"
        subtitle="OFFICIAL LAW REGISTRY · Legislative database of enacted Municipal Ordinances, resolutions, executive orders, and national rice policies displayed across the portal and public interface."
      >
        {isCentralAdmin ? (
          <>
            <button className={secondary} onClick={() => setHistoryOpen(!historyOpen)}>
              Import History
            </button>
            <button
              className={secondary}
              onClick={() => {
                resetLegalDecrees();
                setNotice('Registry restored to official Silago municipal & national rice laws.');
                setTimeout(() => setNotice(''), 3500);
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Official Laws
            </button>
            <label className={`${secondary} cursor-pointer`}>
              <Upload className="h-4 w-4" />
              Import Legal Document
              <input type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => importFile(e.target.files?.[0])} />
            </label>
            <button className={primary} onClick={() => setManualOpen(true)}>
              <Plus className="h-4 w-4" />
              Manual Entry
            </button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            Read-Only Law Reference
          </span>
        )}
      </PageBanner>

      <section className={`${card} mb-5 grid gap-3 p-4 md:grid-cols-[minmax(220px,0.8fr)_1fr_1fr]`}>
        <select className={input} value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select Legal Decree / Ordinance</option>
          {docs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.number ? `${d.number} · ` : ''}
              {d.title}
            </option>
          ))}
        </select>
        <input className={input} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or ordinance number..." />
        <input className={input} placeholder="Search section or provision keyword..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </section>

      <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
        {decreeCategories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold transition ${
              category === c ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-300'
            }`}
          >
            {c}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] ${category === c ? 'bg-white/20' : 'bg-slate-100'}`}>
              {counts(c)}
            </span>
          </button>
        ))}
      </div>

      {historyOpen && isCentralAdmin && (
        <section className={`${card} mb-5 p-5`}>
          <h3 className="font-semibold text-slate-900">Registry Document Log</h3>
          <p className="mt-1 text-sm text-slate-500">
            {docs.length} active legal decree{docs.length === 1 ? '' : 's'} synced to both the executive portal and public interface.
          </p>
          <div className="mt-3 divide-y divide-slate-100">
            {docs.slice(0, 8).map((d) => (
              <div key={d.id} className="flex justify-between py-2 text-sm">
                <span className="font-medium text-slate-700">{d.title}</span>
                <span className="text-slate-500">{d.category}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {manualOpen && isCentralAdmin && (
        <div className={`${card} mb-5 grid gap-3 p-5 sm:grid-cols-3`}>
          <input className={input} placeholder="Document title" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <input className={input} placeholder="Ordinance / reference number" value={draft.number} onChange={(e) => setDraft({ ...draft, number: e.target.value })} />
          <select className={input} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            {decreeCategories.slice(1, -1).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input className={input} type="date" placeholder="Date enacted" value={draft.dateEnacted} onChange={(e) => setDraft({ ...draft, dateEnacted: e.target.value })} />
          <input className={`${input} sm:col-span-2`} placeholder="Brief policy summary" value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} />
          <textarea className={`${input} min-h-24 sm:col-span-3`} placeholder="Full sections, provisions, or searchable legal text" value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          <div className="flex gap-2 sm:col-span-3">
            <button className={primary} onClick={add}>
              Save &amp; Publish Legal Document
            </button>
            <button className={secondary} onClick={() => setManualOpen(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {notice && <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">{notice}</p>}

      <section className={`${card} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="font-semibold text-slate-900">{category}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{filtered.length} registered document{filtered.length === 1 ? '' : 's'}</p>
          </div>
        </div>
        {filtered.length ? (
          <div className="divide-y divide-slate-100">
            {filtered.map((d) => {
              const isExpanded = expandedId === d.id;
              return (
                <article key={d.id} className="px-5 py-4 transition hover:bg-slate-50/70">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {d.number && (
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                            {d.number}
                          </span>
                        )}
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                          {d.category}
                        </span>
                        {d.dateEnacted && <span className="text-[11px] text-slate-400">Enacted {d.dateEnacted}</span>}
                      </div>
                      <h4 className="mt-1.5 font-semibold text-slate-900">{d.title}</h4>
                      {d.summary && <p className="mt-1 text-xs leading-relaxed text-slate-600">{d.summary}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : d.id)}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{isExpanded ? 'Hide Text' : 'Read Provisions'}</span>
                      </button>
                      {isCentralAdmin && (
                        <button
                          className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() => deleteLegalDecree(d.id)}
                          aria-label="Delete document"
                          title="Delete legal decree (Central Admin only)"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                      {d.text || 'Full provision text not yet uploaded.'}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-14 text-center">
            <FileText className="mx-auto mb-3 h-9 w-9 text-slate-300" />
            <p className="font-medium text-slate-700">No legal documents in this category</p>
            <p className="mt-1 text-sm text-slate-500">
              {isCentralAdmin ? 'Import a source document or add a manual registry entry.' : 'Try selecting another policy category or clearing your search.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

const rad = (n: number) => (n * Math.PI) / 180;

function polygonAreaHa(points: [number, number][]): number {
  if (points.length < 3) return 0;
  const lat0 = rad(points.reduce((n, p) => n + p[0], 0) / points.length);
  const xy = points.map(([lat, lng]) => [rad(lng) * 6371008.8 * Math.cos(lat0), rad(lat) * 6371008.8]);
  let area = 0;
  for (let i = 0; i < xy.length; i++) {
    const a = xy[i],
      b = xy[(i + 1) % xy.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return Math.abs(area / 2) / 10000;
}

function perimeterKm(points: [number, number][]): number {
  if (points.length < 2) return 0;
  const edges = points
    .map((a, i) => [a, points[(i + 1) % points.length]] as [[number, number], [number, number]])
    .slice(0, points.length >= 3 ? points.length : points.length - 1);
  return edges.reduce((sum, [a, b]) => {
    const dLat = rad(b[0] - a[0]),
      dLng = rad(b[1] - a[1]);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
    return sum + 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  }, 0);
}

function getOfficialBoundaryPoints(name: string): [number, number][] {
  const boundary = findBarangayBoundary(name);
  if (boundary && boundary.polygon && boundary.polygon.length > 0) {
    return boundary.polygon;
  }
  const geometry = findSilagoBarangayFeature(name)?.geometry;
  if (!geometry) return [];
  const ring = geometry.type === 'Polygon' ? geometry.coordinates[0] : geometry.coordinates[0]?.[0];
  return Array.isArray(ring) ? ring.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]) : [];
}

interface InlineSurveyMapProps {
  barangay: Barangay;
  points: [number, number][];
  onPointsChange: (pts: [number, number][]) => void;
  center: [number, number];
  onCenterChange: (c: [number, number]) => void;
}

function InlineBarangaySurveyMap({ barangay, points, onPointsChange, center, onCenterChange }: InlineSurveyMapProps) {
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const shapesRef = useRef<L.LayerGroup | null>(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    if (!mapHostRef.current || mapRef.current) return;
    const map = L.map(mapHostRef.current, { center, zoom: 14, zoomControl: true });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    const group = L.layerGroup().addTo(map);
    shapesRef.current = group;

    map.on('click', (e: L.LeafletMouseEvent) => {
      const newPt: [number, number] = [e.latlng.lat, e.latlng.lng];
      onPointsChange([...pointsRef.current, newPt]);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      shapesRef.current = null;
    };
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
  }, [barangay.name]);

  useEffect(() => {
    const map = mapRef.current;
    const group = shapesRef.current;
    if (!map || !group) return;
    group.clearLayers();

    if (points.length >= 3) {
      L.polygon(points, {
        color: '#059669',
        weight: 2.5,
        fillColor: '#10b981',
        fillOpacity: 0.22
      }).addTo(group);
    }

    const markerStride = points.length > 36 ? Math.ceil(points.length / 28) : 1;
    points.forEach((point, index) => {
      if (index % markerStride !== 0 && index !== points.length - 1) return;
      const marker = L.marker(point, {
        draggable: true,
        icon: L.divIcon({
          className: '',
          html: `<span style="display:flex;width:18px;height:18px;align-items:center;justify-content:center;border:2px solid #059669;border-radius:50%;background:white;color:#1c1917;font-size:9px;font-weight:700;box-shadow:0 1px 4px #0f172a55">${index + 1}</span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        })
      }).addTo(group);

      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        onPointsChange(points.map((p, i) => (i === index ? [lat, lng] : p)));
      });
      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e.originalEvent);
        if (points.length > 3) {
          onPointsChange(points.filter((_, i) => i !== index));
        }
      });
    });

    const centerMarker = L.marker(center, {
      draggable: true,
      icon: L.divIcon({
        className: '',
        html: `<span style="display:flex;width:28px;height:28px;align-items:center;justify-content:center;border:2px solid white;border-radius:50%;background:#059669;font-size:14px;box-shadow:0 2px 6px #0f172a66">🏛️</span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      })
    }).bindTooltip(`${barangay.name} Center`);

    centerMarker.on('dragend', () => {
      const { lat, lng } = centerMarker.getLatLng();
      onCenterChange([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    });
    centerMarker.addTo(group);
  }, [points, center, barangay.name]);

  return <div ref={mapHostRef} className="h-full w-full" />;
}

export function BarangaysView({ onNavigate, onMeasureBarangay }: { onNavigate: (tab: PortalTab) => void; onMeasureBarangay: (barangay: Barangay) => void }) {
  const { lftAccounts, parcels, permissions } = useApp();
  if (!permissions.isCentralAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-900">
        <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-amber-700" />
        <h3 className="font-bold text-base">Administrator Access Required</h3>
        <p className="mt-1 text-xs">Barangay boundary configuration and GIS sector management are restricted to Central Admin.</p>
      </div>
    );
  }
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const surveyorTopRef = useRef<HTMLDivElement | null>(null);

  const getSavedSettings = (): Record<string, any> => {
    try {
      return JSON.parse(localStorage.getItem('silago_gis_measure_settings') || '{}');
    } catch {
      return {};
    }
  };

  const getSavedPoints = (): Record<string, [number, number][]> => {
    try {
      return JSON.parse(localStorage.getItem('silago_gis_measure_points') || '{}');
    } catch {
      return {};
    }
  };

  const [savedSettingsState, setSavedSettingsState] = useState(getSavedSettings);
  const [savedPointsState, setSavedPointsState] = useState(getSavedPoints);

  const rows = useMemo(() => {
    return BARANGAYS.map((barangay, index) => {
      const saved = savedSettingsState[barangay.name] || {};
      const officer = lftAccounts.find((account) =>
        (account.assignedBarangays || []).some((name) => matchBarangay(name, barangay.name)) ||
        matchBarangay(account.barangay, barangay.name)
      );
      const officialArea = findSilagoBarangayFeature(barangay.name)?.properties.areaHa || 0;
      const farmCount = parcels.filter((parcel) => matchBarangay(parcel.barangay, barangay.name)).length;
      return {
        ...barangay,
        number: index + 1,
        totalAreaHa: saved.areaHa || officialArea || barangay.totalAreaHa,
        terrain: saved.zone || barangay.terrain,
        lat: Number(saved.centerLat ?? barangay.lat),
        lng: Number(saved.centerLng ?? barangay.lng),
        focalPerson: saved.focalPerson || officer?.name || barangay.focalPerson || '',
        contactNumber: saved.contactNumber || officer?.contactNumber || barangay.contactNumber || '',
        farmCount,
        assigned: Boolean(officer),
        hasSavedBoundary: Boolean(saved.areaHa || savedPointsState[barangay.name]?.length)
      };
    });
  }, [lftAccounts, parcels, savedSettingsState, savedPointsState]);

  const filteredRows = rows.filter((row) => `${row.name} ${row.focalPerson} ${row.terrain}`.toLowerCase().includes(query.toLowerCase()));

  // Active barangay for top GIS surveyor map
  const [activeBarangay, setActiveBarangay] = useState<Barangay>(BARANGAYS[0]);
  const [points, setPoints] = useState<[number, number][]>(() => {
    const saved = getSavedPoints();
    if (saved[BARANGAYS[0]?.name]?.length) return saved[BARANGAYS[0]?.name];
    return getOfficialBoundaryPoints(BARANGAYS[0]?.name || '');
  });
  const [centerCoords, setCenterCoords] = useState<[number, number]>([BARANGAYS[0]?.lat || 10.5335, BARANGAYS[0]?.lng || 125.1620]);

  const measuredAreaHa = useMemo(() => polygonAreaHa(points), [points]);
  const measuredPerimeterKm = useMemo(() => perimeterKm(points), [points]);

  const handleSelectBarangay = (b: Barangay) => {
    setActiveBarangay(b);
    setCenterCoords([b.lat, b.lng]);
    const saved = getSavedPoints();
    if (saved[b.name]?.length) {
      setPoints(saved[b.name]);
    } else {
      setPoints(getOfficialBoundaryPoints(b.name));
    }
    surveyorTopRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAutoGenerateBoundary = () => {
    const official = getOfficialBoundaryPoints(activeBarangay.name);
    setPoints(official);
    setNotice(`Official boundary loaded for ${activeBarangay.name} (${official.length} points).`);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleUndoPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClearPoints = () => {
    setPoints([]);
  };

  const handleSaveBoundary = () => {
    try {
      const allPoints = getSavedPoints();
      allPoints[activeBarangay.name] = points;
      localStorage.setItem('silago_gis_measure_points', JSON.stringify(allPoints));
      setSavedPointsState(allPoints);

      const allSettings = getSavedSettings();
      allSettings[activeBarangay.name] = {
        ...allSettings[activeBarangay.name],
        centerLat: centerCoords[0],
        centerLng: centerCoords[1],
        areaHa: measuredAreaHa,
        perimeterKm: measuredPerimeterKm
      };
      localStorage.setItem('silago_gis_measure_settings', JSON.stringify(allSettings));
      setSavedSettingsState(allSettings);

      setNotice(`Boundary & measured area (${measuredAreaHa.toFixed(2)} ha) saved for ${activeBarangay.name}.`);
      setTimeout(() => setNotice(''), 4000);
    } catch {
      setNotice('Unable to save boundary coordinates on this browser.');
    }
  };

  const handleCancelMeasure = () => {
    const saved = getSavedPoints();
    if (saved[activeBarangay.name]?.length) {
      setPoints(saved[activeBarangay.name]);
    } else {
      setPoints(getOfficialBoundaryPoints(activeBarangay.name));
    }
    setNotice('Changes cancelled.');
    setTimeout(() => setNotice(''), 3000);
  };

  const handleDeleteBoundary = (b: Barangay) => {
    if (window.confirm(`Reset boundary for ${b.name} to official default?`)) {
      const allPoints = getSavedPoints();
      delete allPoints[b.name];
      localStorage.setItem('silago_gis_measure_points', JSON.stringify(allPoints));
      setSavedPointsState(allPoints);

      const allSettings = getSavedSettings();
      delete allSettings[b.name];
      localStorage.setItem('silago_gis_measure_settings', JSON.stringify(allSettings));
      setSavedSettingsState(allSettings);

      if (activeBarangay.name === b.name) {
        setPoints(getOfficialBoundaryPoints(b.name));
      }
      setNotice(`Boundary reset for ${b.name}.`);
      setTimeout(() => setNotice(''), 3500);
    }
  };

  return (
    <div ref={surveyorTopRef} className="mx-auto w-full max-w-6xl space-y-4 px-1 py-1 sm:px-2">
      {/* 1. TOP SECTION: INTERACTIVE LIVE GIS BOUNDARY SURVEYOR MAP (Matching Reference Image 2) */}
      <section className={`${card} p-4 sm:p-5 space-y-3`}>
        {/* Top controls above map */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleAutoGenerateBoundary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Auto-Generate Sample Boundary</span>
            </button>
            <button
              type="button"
              onClick={handleUndoPoint}
              disabled={points.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-40"
            >
              <Undo2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Undo Point</span>
            </button>
            <button
              type="button"
              onClick={handleClearPoints}
              disabled={points.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-semibold hover:bg-rose-100 transition cursor-pointer disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Points</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            * Boundary coordinates and measured area will be saved directly with this barangay record.
          </span>
        </div>

        {/* Live Leaflet Map Canvas */}
        <div className="h-[320px] sm:h-[350px] w-full rounded-2xl overflow-hidden border border-slate-200 relative bg-slate-100">
          <InlineBarangaySurveyMap
            key={activeBarangay.name}
            barangay={activeBarangay}
            points={points}
            onPointsChange={setPoints}
            center={centerCoords}
            onCenterChange={setCenterCoords}
          />
          <div className="absolute top-3 left-3 z-[400] bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold text-slate-800 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active Survey: Brgy. {activeBarangay.name}</span>
            <span className="text-slate-400 font-normal">({points.length} vertices)</span>
          </div>
        </div>

        {/* Bottom bar below map */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="text-xs text-slate-600 font-medium">
            Measured Area:{' '}
            <strong className="text-emerald-700 font-bold">{measuredAreaHa.toFixed(2)} Hectares</strong>
            {' • '}
            Perimeter: <strong className="text-blue-700 font-bold">{measuredPerimeterKm.toFixed(3)} km</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelMeasure}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveBoundary}
              className="px-4 py-1.5 rounded-xl bg-[#15803d] hover:bg-[#166534] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Barangay &amp; Boundary</span>
            </button>
          </div>
        </div>
      </section>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 2. BOTTOM SECTION: SEARCH & BARANGAYS TABLE (Matching Reference Image 2) */}
      <section className={`${card} overflow-hidden`}>
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search barangay or focal person..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total: {filteredRows.length} barangays
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Barangay Name</th>
                <th className="px-4 py-3">ASF Biosecurity Zone</th>
                <th className="px-4 py-3">Boundary &amp; Measured Area</th>
                <th className="px-4 py-3">Center Coordinates</th>
                <th className="px-4 py-3">Extension Focal Person</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRows.map((b) => (
                <tr key={b.name} className="transition hover:bg-slate-50/80">
                  <td className="px-4 py-3.5 font-semibold text-slate-900">
                    Brgy. {b.name}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex rounded-full bg-[#ecfdf5] border border-emerald-200/80 text-[#15803d] text-[10px] font-bold px-2.5 py-0.5">
                      GREEN ZONE
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {b.hasSavedBoundary ? (
                      <div>
                        <div className="font-semibold text-slate-800 text-xs">{b.totalAreaHa ? `${b.totalAreaHa.toLocaleString()} ha` : '—'}</div>
                        <div className="text-[10px] text-slate-400">Measured boundary</div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSelectBarangay(b)}
                        className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium text-xs cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        <span>Plot boundary on GIS</span>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-600">
                    {b.lat.toFixed(5)}°N, {b.lng.toFixed(5)}°E
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 font-medium">
                    {b.focalPerson || 'Rolando Santos'}
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                    {b.contactNumber || '0945-123-4561'}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSelectBarangay(b)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg px-2.5 py-1 transition cursor-pointer"
                      >
                        <Pencil className="w-3 h-3 text-emerald-700" />
                        <span>Measure GIS</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteBoundary(b)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Reset boundary"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-xs text-slate-400">
                    No barangays match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function AccountProfileView({ onSignOut }: { onSignOut: () => void }) {
  const { currentUser, updateCurrentUserProfile, updateCurrentUserPassword, verifyCurrentUserPassword } = useApp();
  const [name, setName] = useState(currentUser?.name || 'Admin');
  const [phone, setPhone] = useState(currentUser?.contactNumber || '');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [notice, setNotice] = useState('');

  const save = () => {
    updateCurrentUserProfile({ name, contactNumber: phone });
    setNotice('Profile changes saved successfully.');
    setTimeout(() => setNotice(''), 4000);
  };

  const password = () => {
    if (!verifyCurrentUserPassword(current)) {
      setNotice('Current password did not match.');
      return;
    }
    if (next.length < 6 || next !== confirm) {
      setNotice('Use at least 6 characters and confirm the new password.');
      return;
    }
    updateCurrentUserPassword(next);
    setCurrent('');
    setNext('');
    setConfirm('');
    setNotice('Password updated successfully.');
    setTimeout(() => setNotice(''), 4000);
  };

  const isCentralAdmin = currentUser?.role === 'Central Admin';
  const roleTitle = isCentralAdmin ? 'System Administrator / MAO Officer' : 'Agricultural Extension Focal Person';
  const accountId = currentUser?.id || '870624d4-cf09-4392-9704-3c5e25db3f0c';
  const username = currentUser?.username || 'admin';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 px-1 py-1 sm:px-2">
      {/* 1. Header Account Identity Card */}
      <section className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6`}>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#1e40af] text-2xl font-bold text-white shadow-sm">
            {(name || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{name || 'Admin'}</h2>
              <span className="inline-flex rounded-full bg-sky-50 border border-sky-200/80 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                {roleTitle}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 font-mono">
              Account ID: {accountId} · Username: @{username}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-rose-600 self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </section>

      {/* 2. Dual Column: Profile Info & Security Password */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Left Column: Officer Profile & Contact Info */}
        <section className={`${card} p-5 sm:p-6 space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <UserRound className="h-4 w-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">Officer Profile &amp; Contact Info</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Legal / Display Name</label>
            <input
              type="text"
              className={input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Admin"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Official Mobile / Contact Number</label>
            <input
              type="text"
              className={input}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0917-123-4561"
            />
            <span className="mt-1 block text-[11px] text-slate-400 leading-normal">
              Used for official SMS dispatches and emergency agricultural coordination.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Username</div>
              <div className="mt-1 text-xs font-bold text-slate-800 font-mono">@{username}</div>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Assigned Role</div>
              <div className="mt-1 text-xs font-bold text-slate-800 uppercase">{isCentralAdmin ? 'ADMIN' : 'FIELD OFFICER'}</div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={save}
              className="inline-flex items-center gap-2 rounded-xl bg-[#15803d] hover:bg-[#166534] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </section>

        {/* Right Column: Account Security & Password */}
        <section className={`${card} p-5 sm:p-6 space-y-4`}>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <LockKeyhole className="h-4 w-4 text-slate-500" />
            <h3 className="text-base font-bold text-slate-900">Account Security &amp; Password</h3>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Current Password</label>
            <input
              type="password"
              className={input}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                className={input}
                value={next}
                onChange={(e) => setNext(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                className={input}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-type new password"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Keep your credentials secure. As a designated officer, your login authorizes rice registrations, certificate verifications, and seasonal reports.
          </p>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={password}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Update Password</span>
            </button>
          </div>
        </section>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 flex items-center gap-2 animate-in fade-in">
          <Check className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 3. Bottom Protocols Banner */}
      <section className="rounded-3xl bg-[#173b2c] p-6 text-white shadow-md border border-emerald-950/20 space-y-4">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <h3 className="text-base font-bold text-white">Barangay Rice Registry &amp; Field Technician Protocols</h3>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1.5 backdrop-blur-xs">
            <div className="text-xs font-bold text-emerald-300">1. RSBSA &amp; GIS Boundary Mapping</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ensure all irrigated, rainfed, and upland rice farmers in your barangay are enrolled with verified GPS coordinates and RSBSA stubs.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1.5 backdrop-blur-xs">
            <div className="text-xs font-bold text-emerald-300">2. Crop Health &amp; Pest Monitoring</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Report rice blast, tungro, brown planthopper, or flood damage advisories promptly to the Municipal Agriculture Office.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-1.5 backdrop-blur-xs">
            <div className="text-xs font-bold text-emerald-300">3. Harvest &amp; Seed Subsidy Verification</div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Verify Wet &amp; Dry season harvest weights, certified inbred/hybrid seed deliveries, and NIA irrigation schedules prior to certification.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

const FORM_SCHEMA_DRAFT_KEY = 'silago_form_schema_draft_v3';

function loadDraftOrPublishedSchema() {
  if (typeof window !== 'undefined') {
    try {
      const draftRaw = localStorage.getItem(FORM_SCHEMA_DRAFT_KEY);
      if (draftRaw) {
        const parsed = JSON.parse(draftRaw);
        if (Array.isArray(parsed?.sections) && Array.isArray(parsed?.fields)) {
          return {
            sections: parsed.sections as RegistryFormSection[],
            fields: parsed.fields as SharedRegistryField[],
            isDraft: true
          };
        }
      }
    } catch {}
  }
  const published = loadFormSchema();
  return { ...published, isDraft: false };
}

/**
 * Municipal Agriculture Office Form Customization Builder.
 * Aligns 1:1 with the 4 Rice Registry sections (2 Steps of Rice Farm Registration +
 * 2 Sections of Crop & Planting Form) and publishes changes live across all modals.
 */
export function RegistryFormCustomizationView() {
  const [initialLoaded] = useState(() => loadDraftOrPublishedSchema());
  const [sections, setSections] = useState<RegistryFormSection[]>(initialLoaded.sections);
  const [fields, setFields] = useState<SharedRegistryField[]>(initialLoaded.fields);
  const [activeSection, setActiveSection] = useState<string>(
    initialLoaded.sections[0]?.label || DEFAULT_FORM_SECTIONS[0].label
  );
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState<boolean>(initialLoaded.isDraft);

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [notice, setNotice] = useState<string>('');
  const [editingField, setEditingField] = useState<SharedRegistryField | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [previewFormTab, setPreviewFormTab] = useState<FormTarget>('registration');

  const [sectionDraft, setSectionDraft] = useState<{
    label: string;
    description: string;
    formTarget: FormTarget;
  }>({
    label: '',
    description: '',
    formTarget: 'registration'
  });

  const [modalDraft, setModalDraft] = useState<{
    name: string;
    fieldType: string;
    required: boolean;
    visible: boolean;
    placeholder: string;
    helpText: string;
    optionsText: string;
  }>({
    name: '',
    fieldType: 'Text Field',
    required: false,
    visible: true,
    placeholder: '',
    helpText: '',
    optionsText: ''
  });

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3800);
  };

  const activeSectionObj = useMemo(
    () => sections.find((s) => s.label === activeSection) || sections[0],
    [sections, activeSection]
  );

  // Save changes locally in draft state until published live
  const updateDraftState = (
    nextSections: RegistryFormSection[],
    nextFields: SharedRegistryField[],
    msg?: string
  ) => {
    setSections(nextSections);
    setFields(nextFields);
    setHasUnpublishedChanges(true);
    try {
      localStorage.setItem(
        FORM_SCHEMA_DRAFT_KEY,
        JSON.stringify({ sections: nextSections, fields: nextFields })
      );
    } catch {}
    if (msg) showToast(msg);
  };

  const handleConfirmResetDefault = () => {
    const restored = resetFormSchema();
    setSections(restored.sections);
    setFields(restored.fields);
    setActiveSection(restored.sections[0].label);
    setHasUnpublishedChanges(false);
    try {
      localStorage.removeItem(FORM_SCHEMA_DRAFT_KEY);
    } catch {}
    setIsResetConfirmOpen(false);
    showToast('Reset to the 4 standard Rice Registry sections and published live.');
  };

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(FORM_SCHEMA_DRAFT_KEY, JSON.stringify({ sections, fields }));
    } catch {}
    setHasUnpublishedChanges(true);
    showToast('Form customization draft saved locally. Click "Publish Form Changes" when ready.');
  };

  const handlePublishChanges = () => {
    saveFormSchema(sections, fields, true);
    try {
      localStorage.removeItem(FORM_SCHEMA_DRAFT_KEY);
    } catch {}
    setHasUnpublishedChanges(false);
    showToast('Form changes published live to Rice Farm Registration & Crop Forms.');
  };

  const currentSectionFields = useMemo(
    () => fields.filter((f) => f.section === activeSection),
    [fields, activeSection]
  );

  const countBySection = (secName: string) =>
    fields.filter((f) => f.section === secName).length;

  const handleMoveField = (fieldId: string, direction: -1 | 1) => {
    const list = [...fields];
    const currentIndex = list.findIndex((f) => f.id === fieldId);
    if (currentIndex === -1) return;

    const secIndices: number[] = [];
    list.forEach((f, idx) => {
      if (f.section === activeSection) secIndices.push(idx);
    });

    const posInSec = secIndices.indexOf(currentIndex);
    const targetPosInSec = posInSec + direction;
    if (targetPosInSec < 0 || targetPosInSec >= secIndices.length) return;

    const targetIndex = secIndices[targetPosInSec];
    const temp = list[currentIndex];
    list[currentIndex] = list[targetIndex];
    list[targetIndex] = temp;

    updateDraftState(sections, list);
  };

  const handleToggleVisibility = (fieldId: string) => {
    const target = fields.find((f) => f.id === fieldId);
    if (target?.isCore && target.required && target.visible) {
      showToast(`Core required field "${target.name}" cannot be hidden.`);
      return;
    }
    const updated = fields.map((f) => (f.id === fieldId ? { ...f, visible: !f.visible } : f));
    updateDraftState(sections, updated);
  };

  const handleDeleteField = (field: SharedRegistryField) => {
    if (field.isCore || BUILTIN_FIELD_IDS.has(field.id)) {
      showToast(`Core Rice Registry field "${field.name}" cannot be deleted (use Edit or Hide instead).`);
      return;
    }
    const updated = fields.filter((f) => f.id !== field.id);
    updateDraftState(sections, updated, `Removed custom field "${field.name}".`);
  };

  const handleOpenAddField = () => {
    setEditingField(null);
    setModalDraft({
      name: '',
      fieldType: 'Text Field',
      required: false,
      visible: true,
      placeholder: '',
      helpText: '',
      optionsText: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEditField = (f: SharedRegistryField) => {
    setEditingField(f);
    setModalDraft({
      name: f.name,
      fieldType: f.fieldType || 'Text Field',
      required: f.required,
      visible: f.visible,
      placeholder: f.placeholder || '',
      helpText: f.helpText || '',
      optionsText: Array.isArray(f.options) ? f.options.join(', ') : ''
    });
    setIsModalOpen(true);
  };

  const handleSaveModalField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDraft.name.trim()) return;

    const parsedOptions =
      modalDraft.fieldType === 'Dropdown Menu'
        ? modalDraft.optionsText
            .split(/[,\n]/)
            .map((o) => o.trim())
            .filter(Boolean)
        : undefined;

    if (editingField) {
      const updated = fields.map((f) =>
        f.id === editingField.id
          ? {
              ...f,
              name: modalDraft.name.trim(),
              fieldType: editingField.isCore ? f.fieldType : modalDraft.fieldType,
              required: modalDraft.required,
              visible: editingField.isCore && modalDraft.required ? true : modalDraft.visible,
              placeholder: modalDraft.placeholder,
              helpText: modalDraft.helpText,
              options: parsedOptions && parsedOptions.length > 0 ? parsedOptions : f.options
            }
          : f
      );
      updateDraftState(
        sections,
        updated,
        `Updated "${modalDraft.name.trim()}". Click "Publish Form Changes" to apply live.`
      );
    } else {
      const targetForm: FormTarget = activeSectionObj?.formTarget || 'registration';
      const newField: SharedRegistryField = {
        id: `custom-${Date.now()}`,
        section: activeSection,
        formTarget: targetForm,
        name: modalDraft.name.trim(),
        fieldType: modalDraft.fieldType,
        required: modalDraft.required,
        visible: modalDraft.visible,
        valueBehavior: 'editable',
        placeholder: modalDraft.placeholder,
        helpText: modalDraft.helpText,
        options: parsedOptions
      };
      updateDraftState(
        sections,
        [...fields, newField],
        `Added "${modalDraft.name.trim()}" to ${activeSection}. Click "Publish Form Changes" to apply live.`
      );
    }

    setIsModalOpen(false);
  };

  const handleSaveNewSection = (e: React.FormEvent) => {
    e.preventDefault();
    const label = sectionDraft.label.trim();
    if (!label) return;
    if (sections.some((s) => s.label.toLowerCase() === label.toLowerCase())) {
      showToast(`Section "${label}" already exists.`);
      return;
    }

    const newSec: RegistryFormSection = {
      id: `sec-${Date.now()}`,
      label,
      description:
        sectionDraft.description.trim() ||
        'Custom office section included automatically when it contains visible fields.',
      formTarget: sectionDraft.formTarget,
      isCore: false
    };

    const nextSections = [...sections, newSec];
    updateDraftState(nextSections, fields, `Section "${label}" created.`);
    setActiveSection(label);
    setSectionDraft({ label: '', description: '', formTarget: 'registration' });
    setIsAddSectionOpen(false);
  };

  const handleDeleteCustomSection = (sec: RegistryFormSection) => {
    if (sec.isCore) return;
    const nextSections = sections.filter((s) => s.label !== sec.label);
    const nextFields = fields.filter((f) => f.section !== sec.label);
    updateDraftState(
      nextSections,
      nextFields,
      `Deleted custom section "${sec.label}".`
    );
    setActiveSection(nextSections[0]?.label || DEFAULT_FORM_SECTIONS[0].label);
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-1 py-1 sm:px-2">
      {/* 1. Office Header Card */}
      <section className={`${card} p-5 sm:p-6 space-y-4`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  Form Customization
                </h1>
                <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                  Admin-Only Builder
                </span>
                {hasUnpublishedChanges && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                    Unpublished Draft
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Configure sections and fields displayed in the Rice Farm Registration Form and Crop &amp; Planting Form.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
              <span>Reset Default</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPreviewFormTab(activeSectionObj?.formTarget || 'registration');
                setIsPreviewModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span>Preview Form</span>
            </button>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5 text-slate-500" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={handlePublishChanges}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#15803d] hover:bg-[#166534] px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Publish Form Changes</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. Aligned 4-Section Pill Tabs Row + Add Section */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {sections.map((sec) => {
          const count = countBySection(sec.label);
          const isActive = sec.label === activeSection;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.label)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-[#15803d] text-white shadow-sm ring-1 ring-[#15803d]'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span>{sec.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setIsAddSectionOpen(true)}
          className="shrink-0 inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-600 transition cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>+ Add Section</span>
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 flex items-center gap-2"
        >
          <Check className="h-4 w-4 text-emerald-700 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* 3. Main Two-Column Layout */}
      <div className="grid gap-5 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN: Section Fields Customizer (7 Columns) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Section Header Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">{activeSection}</h2>
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                  {currentSectionFields.length} Fields
                </span>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                    activeSectionObj?.formTarget === 'crop'
                      ? 'bg-amber-50 border border-amber-200 text-amber-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-800'
                  }`}
                >
                  {activeSectionObj?.formTarget === 'crop'
                    ? 'Crop & Planting Form'
                    : 'Rice Farm Registration Form'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeSectionObj?.description || 'Custom office form section.'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeSectionObj && !activeSectionObj.isCore && (
                <button
                  type="button"
                  onClick={() => handleDeleteCustomSection(activeSectionObj)}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold text-rose-700 transition cursor-pointer"
                  title="Delete custom section"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Section</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleOpenAddField}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#15803d] hover:bg-[#166534] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>+ Add Field</span>
              </button>
            </div>
          </div>

          {/* Field Cards List */}
          <div className="space-y-2.5">
            {currentSectionFields.map((field) => {
              const isCoreField = Boolean(field.isCore || BUILTIN_FIELD_IDS.has(field.id));
              return (
                <div
                  key={field.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-slate-300 transition space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="mt-1 cursor-grab text-slate-300 group-hover:text-slate-400">
                        <GripVertical className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {field.name}
                            {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {field.fieldType || 'Text Field'}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              field.required
                                ? 'bg-rose-50 border border-rose-200 text-rose-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            Required: {field.required ? 'ON' : 'OFF'}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              field.visible
                                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                : 'bg-amber-50 border border-amber-200 text-amber-700'
                            }`}
                          >
                            {field.visible ? 'Visible: ON' : 'Hidden'}
                          </span>
                          {field.isCore ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Core</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700">
                              <Pencil className="w-2.5 h-2.5" />
                              <span>Editable</span>
                            </span>
                          )}
                        </div>

                        {field.placeholder && (
                          <div className="text-[11px] text-slate-500 mt-1 font-mono">
                            Placeholder: &quot;{field.placeholder}&quot;
                          </div>
                        )}

                        {field.helpText && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{field.helpText}</div>
                        )}
                      </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveField(field.id, -1)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveField(field.id, 1)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(field.id)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title={field.visible ? 'Hide field' : 'Show field'}
                      >
                        {field.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditField(field)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Edit field settings"
                      >
                        <Pencil className="h-3 w-3" />
                        <span>Edit</span>
                      </button>
                      {isCoreField ? (
                        <span
                          className="p-1 text-slate-300 cursor-not-allowed"
                          title="Built-in Rice Registry field (cannot be deleted)"
                        >
                          <Lock className="h-3.5 w-3.5" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteField(field)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete custom field"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {currentSectionFields.length === 0 && (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
                <SlidersHorizontal className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-xs font-semibold text-slate-700">
                  No fields in this section yet
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  Click &quot;+ Add Field&quot; above to add fields to {activeSection}.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Form Preview (5 Columns) */}
        <div className="lg:col-span-5 space-y-3 sticky top-4">
          <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                LIVE FORM PREVIEW
              </span>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-md transition ${
                  previewDevice === 'desktop'
                    ? 'bg-white shadow-2xs text-emerald-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Desktop View"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded-md transition ${
                  previewDevice === 'tablet'
                    ? 'bg-white shadow-2xs text-emerald-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Tablet View"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-md transition ${
                  previewDevice === 'mobile'
                    ? 'bg-white shadow-2xs text-emerald-800'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                title="Mobile View"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className={`transition-all duration-300 mx-auto ${
              previewDevice === 'mobile'
                ? 'max-w-[340px]'
                : previewDevice === 'tablet'
                ? 'max-w-[420px]'
                : 'w-full'
            }`}
          >
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="bg-[#173b2c] text-white px-4 py-3">
                <div className="text-[9px] font-bold tracking-widest uppercase text-emerald-300">
                  MUNICIPAL AGRICULTURE OFFICE &middot;{' '}
                  {activeSectionObj?.formTarget === 'crop'
                    ? 'CROP & PLANTING FORM'
                    : 'RICE FARM REGISTRATION FORM'}
                </div>
                <div className="text-xs font-bold text-white mt-0.5">{activeSection}</div>
              </div>

              <div className="p-4 sm:p-5 space-y-3.5 bg-slate-50/40">
                {currentSectionFields
                  .filter((f) => f.visible)
                  .map((field) => (
                    <div key={field.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          {field.name}
                          {field.required && <span className="text-rose-500 ml-0.5">*</span>}
                        </label>
                        <span className="text-[10px] font-medium text-emerald-700">
                          {field.valueBehavior === 'auto' ? 'Auto' : 'Editable'}
                        </span>
                      </div>

                      {field.fieldType === 'Dropdown Menu' ||
                      field.fieldType === 'Barangay Selector' ? (
                        <div className="relative">
                          <select
                            disabled
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 appearance-none shadow-2xs"
                          >
                            <option>{field.placeholder || `Select ${field.name}`}</option>
                            {field.options?.map((opt) => (
                              <option key={opt}>{opt}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        </div>
                      ) : field.fieldType === 'File Upload' ? (
                        <div className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50/40 p-3 text-center text-xs font-semibold text-emerald-800 flex items-center justify-center gap-2">
                          <Upload className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{field.placeholder || 'Choose or upload image'}</span>
                        </div>
                      ) : field.fieldType === 'Text Area' ? (
                        <textarea
                          readOnly
                          rows={2}
                          placeholder={field.placeholder || ''}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 shadow-2xs resize-none"
                        />
                      ) : (
                        <input
                          type={
                            field.fieldType === 'Date Field'
                              ? 'date'
                              : field.fieldType === 'Number Field'
                              ? 'number'
                              : 'text'
                          }
                          readOnly
                          placeholder={field.placeholder || ''}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder:text-slate-400 shadow-2xs"
                        />
                      )}

                      {field.helpText && (
                        <span className="text-[10px] text-slate-400 block leading-tight">
                          {field.helpText}
                        </span>
                      )}
                    </div>
                  ))}

                <div className="pt-2">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-[#15803d] hover:bg-[#166534] py-2.5 text-xs font-bold text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {activeSectionObj?.formTarget === 'crop'
                        ? 'Save Crop & Planting Record'
                        : 'Save Rice Farm Registration'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Field Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingField ? 'Edit Field Settings' : 'Add New Custom Form Field'}
                </h3>
                <p className="text-xs text-slate-500">Section: {activeSection}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalField} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Field Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalDraft.name}
                  onChange={(e) => setModalDraft({ ...modalDraft, name: e.target.value })}
                  placeholder="e.g. PCIC Insurance Policy No."
                  className={input}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Field Type</label>
                  <select
                    disabled={Boolean(editingField?.isCore)}
                    value={modalDraft.fieldType}
                    onChange={(e) => setModalDraft({ ...modalDraft, fieldType: e.target.value })}
                    className={`${input} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option>Text Field</option>
                    <option>Number Field</option>
                    <option>Date Field</option>
                    <option>Dropdown Menu</option>
                    <option>Barangay Selector</option>
                    <option>Text Area</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={modalDraft.placeholder}
                    onChange={(e) => setModalDraft({ ...modalDraft, placeholder: e.target.value })}
                    placeholder="e.g. Enter details..."
                    className={input}
                  />
                </div>
              </div>

              {modalDraft.fieldType === 'Dropdown Menu' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dropdown Options (comma-separated)
                  </label>
                  <textarea
                    rows={2}
                    value={modalDraft.optionsText}
                    onChange={(e) => setModalDraft({ ...modalDraft, optionsText: e.target.value })}
                    placeholder="e.g. Option A, Option B, Option C"
                    className={input}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Help / Guidance Text
                </label>
                <input
                  type="text"
                  value={modalDraft.helpText}
                  onChange={(e) => setModalDraft({ ...modalDraft, helpText: e.target.value })}
                  placeholder="e.g. Guidance note shown under the field input"
                  className={input}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-700">Required Field</span>
                  <input
                    type="checkbox"
                    checked={modalDraft.required}
                    onChange={(e) => setModalDraft({ ...modalDraft, required: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-700 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                  <span className="text-xs font-bold text-slate-700">Visible in Form</span>
                  <input
                    type="checkbox"
                    disabled={Boolean(editingField?.isCore && modalDraft.required)}
                    checked={modalDraft.visible}
                    onChange={(e) => setModalDraft({ ...modalDraft, visible: e.target.checked })}
                    className="h-4 w-4 rounded accent-emerald-700 cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  {editingField ? 'Save Changes' : 'Add Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {isAddSectionOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddSectionOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Custom Form Section</h3>
                <p className="text-xs text-slate-500">
                  Attach additional fields to Rice Farm Registration or Crop &amp; Planting Form.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSectionOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewSection} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sectionDraft.label}
                  onChange={(e) => setSectionDraft({ ...sectionDraft, label: e.target.value })}
                  placeholder="e.g. 5. Grain Storage & Mechanization"
                  className={input}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Form</label>
                <select
                  value={sectionDraft.formTarget}
                  onChange={(e) =>
                    setSectionDraft({
                      ...sectionDraft,
                      formTarget: e.target.value as FormTarget
                    })
                  }
                  className={input}
                >
                  <option value="registration">Rice Farm Registration Form (Step 2)</option>
                  <option value="crop">Crop &amp; Planting Record Form</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={sectionDraft.description}
                  onChange={(e) =>
                    setSectionDraft({ ...sectionDraft, description: e.target.value })
                  }
                  placeholder="Optional description shown in the form builder"
                  className={input}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddSectionOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#15803d] hover:bg-[#166534] text-xs font-bold text-white shadow-sm cursor-pointer"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Form Preview Modal */}
      {isPreviewModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-xs"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPreviewModalOpen(false);
          }}
        >
          <div className="w-full max-w-3xl max-h-[88vh] rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-[#173b2c] text-white px-6 py-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                  Full Form Customization Preview
                </div>
                <h3 className="text-base font-bold">
                  {previewFormTab === 'registration'
                    ? 'Rice Farm Registration Form (Steps 1 & 2)'
                    : 'Crop & Planting Record Form (Sections 3 & 4)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-3 pb-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewFormTab('registration')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  previewFormTab === 'registration'
                    ? 'bg-[#15803d] text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Rice Farm Registration Form
              </button>
              <button
                type="button"
                onClick={() => setPreviewFormTab('crop')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                  previewFormTab === 'crop'
                    ? 'bg-[#15803d] text-white'
                    : 'bg-white border border-slate-200 text-slate-600'
                }`}
              >
                Crop &amp; Planting Form
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
              {sections
                .filter((s) => s.formTarget === previewFormTab)
                .map((sec) => {
                  const secFields = fields.filter(
                    (f) => f.section === sec.label && f.visible
                  );
                  return (
                    <div
                      key={sec.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                          {sec.label}
                        </h4>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {secFields.length} visible {secFields.length === 1 ? 'field' : 'fields'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {secFields.map((f) => (
                          <div
                            key={f.id}
                            className={`space-y-1 ${
                              f.fieldType === 'Text Area' ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <label className="block text-[11px] font-bold text-slate-700">
                              {f.name}
                              {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                            </label>
                            <input
                              type="text"
                              readOnly
                              placeholder={f.placeholder || f.fieldType || 'Input'}
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600"
                            />
                          </div>
                        ))}
                        {secFields.length === 0 && (
                          <p className="text-xs text-slate-400 sm:col-span-2">
                            No visible fields in this section.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Inline Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsResetConfirmOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reset Form Customization?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will restore the 4 standard Rice Registry sections and default fields, and
              remove any custom sections or custom fields from the active forms.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetDefault}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                Reset to Default &amp; Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
