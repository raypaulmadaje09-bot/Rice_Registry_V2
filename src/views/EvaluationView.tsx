import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { OfficialSealsTrio } from '../components/Seals';
import {
  ClipboardCheck,
  Printer,
  RotateCcw,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  User,
  Building,
  Briefcase,
  Layers,
  Zap,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Check,
  Sliders,
  FileText,
  ChevronRight
} from 'lucide-react';

export interface EvaluationItem {
  id: string;
  category: string;
  categoryCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
  name: string;
  criterionDescription: string;
}

export const ISO_EVALUATION_ITEMS: EvaluationItem[] = [
  // A. FUNCTIONAL SUITABILITY
  {
    id: 'A1',
    category: 'FUNCTIONAL SUITABILITY',
    categoryCode: 'A',
    name: 'Functional Completeness',
    criterionDescription: 'Nakasulod ba ang tanang RSBSA data, 15 ka barangay sa Silago, georeferenced maps, ug crop production details?'
  },
  {
    id: 'A2',
    category: 'FUNCTIONAL SUITABILITY',
    categoryCode: 'A',
    name: 'Functional Correctness',
    criterionDescription: 'Sakto ug walay sayop ang pagkwenta sa yield, hectares, coordinates, ug pag-parse sa Excel files.'
  },
  {
    id: 'A3',
    category: 'FUNCTIONAL SUITABILITY',
    categoryCode: 'A',
    name: 'Functional Appropriateness',
    criterionDescription: 'Haom ba ang RiceSsistant workflow ug staging preview sa aktuwal nga panginahanglan sa DA-MAO?'
  },

  // B. PERFORMANCE EFFICIENCY
  {
    id: 'B1',
    category: 'PERFORMANCE EFFICIENCY',
    categoryCode: 'B',
    name: 'Time Behaviour',
    criterionDescription: 'Paspas ba ang tubag sa sistema, pag-render sa mapa, ug pag-search sa database nga walay pagka-antala?'
  },
  {
    id: 'B2',
    category: 'PERFORMANCE EFFICIENCY',
    categoryCode: 'B',
    name: 'Resource Utilization',
    criterionDescription: 'Maalamon ba ang paggamit sa network bandwidth ug memory sa browser?'
  },
  {
    id: 'B3',
    category: 'PERFORMANCE EFFICIENCY',
    categoryCode: 'B',
    name: 'Capacity',
    criterionDescription: 'Makadumala ba og ginatos ka mga lote ug profile sa mag-uuma nga dili mohinay ang rendering?'
  },

  // C. COMPATIBILITY
  {
    id: 'C1',
    category: 'COMPATIBILITY',
    categoryCode: 'C',
    name: 'Co-existence',
    criterionDescription: 'Hapsay bang magamit dungan sa uban pang bukas nga web applications o browser extensions?'
  },
  {
    id: 'C2',
    category: 'COMPATIBILITY',
    categoryCode: 'C',
    name: 'Interoperability',
    criterionDescription: 'Hapsay ba ang komunikasyon tali sa React frontend, Supabase SQL, Leaflet GIS, ug SheetJS engine?'
  },

  // D. INTERACTION CAPABILITY / USABILITY
  {
    id: 'D1',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Appropriateness Recognisability',
    criterionDescription: 'Masabtan ba dayon sa tiggamit ang mga gamit sa matag icon, dashboard, ug navigation link?'
  },
  {
    id: 'D2',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Learnability',
    criterionDescription: 'Sayon bang tun-an sa mga Local Farm Technicians (LFT) ug mga kawani sa DA-MAO?'
  },
  {
    id: 'D3',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Operability',
    criterionDescription: 'Sayon ug komportable bang pisliton ang mga buttons, toggle switches, ug drag-and-drop features?'
  },
  {
    id: 'D4',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'User Error Protection',
    criterionDescription: 'Aduna bay mga kumpirmasyon ug validation alerts sa dili pa mopadayon sa sensitibong aksyon sama sa pagtangtang o pag-upload sa datos?'
  },
  {
    id: 'D5',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'User Interface Aesthetics',
    criterionDescription: 'Propesyonal, hapsay, ug nindot ba ang color-coding sa mga agro-ecosystems ug ang Microsoft Word print format?'
  },
  {
    id: 'D6',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Accessibility',
    criterionDescription: 'Tin-aw ba ang contrast sa mga letra ug sayon bang mabasa?'
  },

  // E. RELIABILITY
  {
    id: 'E1',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Maturity',
    criterionDescription: 'Walay nasinatiang kalit nga pagkapalong o White Screen of Death (WSoD) atol sa paggamit.'
  },
  {
    id: 'E2',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Availability',
    criterionDescription: 'Kanunayng ma-access ang web dashboard online pinaagi sa deployment.'
  },
  {
    id: 'E3',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Fault Tolerance',
    criterionDescription: 'Dili mag-crash ang sistema bisan kon adunay blangko o kulang nga mga field sa datos gamit ang safe conditional rendering.'
  },
  {
    id: 'E4',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Recoverability',
    criterionDescription: 'Dali bang makabalik sa normal nga kahimtang kon maputol ang koneksyon sa internet o database?'
  },

  // F. SECURITY
  {
    id: 'F1',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Confidentiality',
    criterionDescription: 'Napanalipdan ba ang sensitibong impormasyon sa mga mag-uuma pinaagi sa authentication ug Role-Based Access Control?'
  },
  {
    id: 'F2',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Integrity',
    criterionDescription: 'Dili ba masalipdan o mausab sa dili awtorisadong tawo ang mga profile ug georeferenced boundaries?'
  },
  {
    id: 'F3',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Non-repudiation',
    criterionDescription: 'Natala ba ang pagkatawo sa account nga naghimo sa pag-usab o pagdugang og talaan?'
  },
  {
    id: 'F4',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Accountability',
    criterionDescription: 'Klaro ba ang pagkabulag sa responsibilidad tali sa DA-MAO Administrator ug sa Barangay LFT Accounts?'
  },
  {
    id: 'F5',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Authenticity',
    criterionDescription: 'Lig-on ba ang pag-verify sa login pinaagi sa username ug 8-character secured password nga may uppercase ug numero?'
  },

  // G. MAINTAINABILITY
  {
    id: 'G1',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Modularity',
    criterionDescription: 'Tarong bang nabahin-bahin ang tagsa-tagsa ka code files ug components (Database, Maps, Reports, Assistant)?'
  },
  {
    id: 'G2',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Reusability',
    criterionDescription: 'Nagamit ba pag-usab ang mga generic helper functions, modal structures, ug badge styles?'
  },
  {
    id: 'G3',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Analysability',
    criterionDescription: 'Sayon bang matultolan ang mga log traces ug errors kon adunay kinahanglang i-debug?'
  },
  {
    id: 'G4',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Modifiability',
    criterionDescription: 'Sayon bang dugangan og bag-ong feature (pananglitan: voice speech, previous harvest tracking) nga dili makaguba sa ubang parte?'
  },
  {
    id: 'G5',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Testability',
    criterionDescription: 'Mapasar ba ang build diagnostics ug compilation nga walay TypeScript errors?'
  },

  // H. FLEXIBILITY / PORTABILITY
  {
    id: 'H1',
    category: 'FLEXIBILITY / PORTABILITY',
    categoryCode: 'H',
    name: 'Adaptability',
    criterionDescription: 'Mo-adjust ba ang hitsura sa lain-laing gidak-on sa screen (laptops, desktops, widescreen displays)?'
  },
  {
    id: 'H2',
    category: 'FLEXIBILITY / PORTABILITY',
    categoryCode: 'H',
    name: 'Installability / Deployability',
    criterionDescription: 'Sayon ug hapsay bang ma-deploy sa Vercel cloud hosting?'
  },
  {
    id: 'H3',
    category: 'FLEXIBILITY / PORTABILITY',
    categoryCode: 'H',
    name: 'Replaceability',
    criterionDescription: 'Sayon bang ilisdan o i-upgrade ang underlying external packages nga walay pagbag-o sa core business logic?'
  },

  // I. SAFETY
  {
    id: 'I1',
    category: 'SAFETY',
    categoryCode: 'I',
    name: 'Operational Safety',
    criterionDescription: 'Nalikayan ba ang sayop nga paghatag og ayuda tungod sa estriktong pagbulag sa \'Basakan\' (Farm Location) ug \'Tirahan\' (Farmer Residence)?'
  },
  {
    id: 'I2',
    category: 'SAFETY',
    categoryCode: 'I',
    name: 'Data Hazard Mitigation',
    criterionDescription: 'Napugngan ba ang pagkadaot sa database pinaagi sa mandatory Staging Preview sa wala pa i-save ang gi-drag nga Excel file?'
  },
  {
    id: 'I3',
    category: 'SAFETY',
    categoryCode: 'I',
    name: 'Georeference Safeguard',
    criterionDescription: 'Nasiguro ba nga ang coordinates ug boundaries nahimutang sulod sa opisyal nga hurisdiksyon sa 15 ka barangay sa Silago?'
  }
];

export const CATEGORY_INFO: Record<
  string,
  { label: string; code: string; color: string; bg: string; border: string; icon: any }
> = {
  A: {
    label: 'FUNCTIONAL SUITABILITY',
    code: 'A',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: Sparkles
  },
  B: {
    label: 'PERFORMANCE EFFICIENCY',
    code: 'B',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Zap
  },
  C: {
    label: 'COMPATIBILITY',
    code: 'C',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: Share2
  },
  D: {
    label: 'INTERACTION CAPABILITY / USABILITY',
    code: 'D',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Sliders
  },
  E: {
    label: 'RELIABILITY',
    code: 'E',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: ShieldCheck
  },
  F: {
    label: 'SECURITY',
    code: 'F',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: ShieldAlert
  },
  G: {
    label: 'MAINTAINABILITY',
    code: 'G',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: Layers
  },
  H: {
    label: 'FLEXIBILITY / PORTABILITY',
    code: 'H',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: Briefcase
  },
  I: {
    label: 'SAFETY',
    code: 'I',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-300',
    icon: Award
  }
};

export const getQualitativeInterpretation = (meanScore: number): { text: string; badgeColor: string; description: string } => {
  if (meanScore >= 4.5) {
    return {
      text: 'Excellent / Highly Compliant',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Labaw pa sa gipaabot sumala sa sumbanan sa ISO/IEC 25010 standard.'
    };
  }
  if (meanScore >= 3.5) {
    return {
      text: 'Very Satisfactory / Compliant',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: 'Hingpit nga nakakab-ot sa kalidad ug kasaligan nga pagpatuman.'
    };
  }
  if (meanScore >= 2.5) {
    return {
      text: 'Satisfactory / Moderately Compliant',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: 'Nakapasar sa mga sukaranan apan adunay pipila ka mga angayng palambuon.'
    };
  }
  if (meanScore >= 1.5) {
    return {
      text: 'Fair / Needs Improvement',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      description: 'Wala makatuman sa pipila ka importanteng criteria sa standard.'
    };
  }
  return {
    text: 'Poor / Non-Compliant',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    description: 'Kritikal nga wala makatuman sa standard; kinahanglan og dinaliang rebisyon.'
  };
};

export const EvaluationView: React.FC = () => {
  const { currentUser, adminProfile } = useApp();

  // Evaluator Information State
  const [evaluatorName, setEvaluatorName] = useState(
    currentUser?.name || adminProfile.name || ''
  );
  const [evaluatorPosition, setEvaluatorPosition] = useState(
    currentUser?.title || adminProfile.title || 'Systems Evaluator / Municipal Agriculture Officer'
  );
  const [evaluatorOffice, setEvaluatorOffice] = useState(
    currentUser?.office || adminProfile.office || 'Office of the Municipal Agriculturist (DA-MAO Silago)'
  );
  const [evaluationDate, setEvaluationDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [evaluatorNotes, setEvaluatorNotes] = useState('');

  // Ratings State (Key = item id, Value = 1 to 5)
  // Default initialized with 5 for ready preview, easily modifiable
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ISO_EVALUATION_ITEMS.forEach((item) => {
      initial[item.id] = 5;
    });
    return initial;
  });

  const handleRatingChange = (id: string, score: number) => {
    setRatings((prev) => ({
      ...prev,
      [id]: score
    }));
  };

  const handleSetAllRatings = (score: number) => {
    const updated: Record<string, number> = {};
    ISO_EVALUATION_ITEMS.forEach((item) => {
      updated[item.id] = score;
    });
    setRatings(updated);
  };

  // Group items by categoryCode
  const groupedItems = useMemo(() => {
    const map: Record<string, EvaluationItem[]> = {};
    ISO_EVALUATION_ITEMS.forEach((item) => {
      if (!map[item.categoryCode]) {
        map[item.categoryCode] = [];
      }
      map[item.categoryCode].push(item);
    });
    return map;
  }, []);

  // Compute category mean scores
  const categoryMeans = useMemo(() => {
    const means: Record<string, { mean: number; total: number; count: number }> = {};
    Object.keys(groupedItems).forEach((code) => {
      const items = groupedItems[code];
      const sum = items.reduce((acc, curr) => acc + (ratings[curr.id] || 0), 0);
      means[code] = {
        mean: items.length > 0 ? sum / items.length : 0,
        total: sum,
        count: items.length
      };
    });
    return means;
  }, [groupedItems, ratings]);

  // Compute overall mean score
  const overallMean = useMemo(() => {
    const totalScore = Object.values(ratings).reduce((acc, curr) => acc + curr, 0);
    return ISO_EVALUATION_ITEMS.length > 0 ? totalScore / ISO_EVALUATION_ITEMS.length : 0;
  }, [ratings]);

  const qualitative = useMemo(() => {
    return getQualitativeInterpretation(overallMean);
  }, [overallMean]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Overview Banner */}
      <div className="bg-gradient-to-r from-[#0c2340] via-[#123358] to-[#184632] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ClipboardCheck className="w-4 h-4" />
              <span>ISO/IEC 25010 Software Quality Standard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white">
              Software Quality Evaluation &amp; Verification Instrument
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Komprehensibo ug interaktibong pagsukod sa kalidad sa Silago Rice Farm Registry &amp; Georeferenced GIS Portal sumala sa siyam (9) ka internasyonal nga mga kategorya ug 5-point Likert Scale.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto flex-wrap no-print">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
              title="Print o i-export kini nga evaluation report sa PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Export Evaluation Report to PDF / Print</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetAllRatings(5)}
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/15"
              title="I-set ang tanang grado sa 5 (Strongly Agree)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Set All (5)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Computation Cards (Overall & Category Mean) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Mean Card */}
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Overall Mean Score (Tibuok Sistema)
              </span>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span className="text-4xl sm:text-5xl font-black font-mono text-slate-900 tracking-tight">
                  {overallMean.toFixed(2)}
                </span>
                <span className="text-slate-400 font-bold text-sm">/ 5.00</span>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 border border-emerald-200 shrink-0">
              <Award className="w-7 h-7" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold border ${qualitative.badgeColor}`}>
              {qualitative.text}
            </span>
            <span className="text-xs text-slate-500">
              {qualitative.description}
            </span>
          </div>
        </div>

        {/* Legend / Likert Scale Guide */}
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            5-Point Likert Scale Reference
          </span>
          <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
              <div className="text-sm font-black">5</div>
              <div className="text-[9.5px] leading-tight mt-0.5">Strongly Agree</div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold">
              <div className="text-sm font-black">4</div>
              <div className="text-[9.5px] leading-tight mt-0.5">Agree</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold">
              <div className="text-sm font-black">3</div>
              <div className="text-[9.5px] leading-tight mt-0.5">Neutral</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
              <div className="text-sm font-black">2</div>
              <div className="text-[9.5px] leading-tight mt-0.5">Disagree</div>
            </div>
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-900 font-bold">
              <div className="text-sm font-black">1</div>
              <div className="text-[9.5px] leading-tight mt-0.5">Strongly Disagree</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 italic">
            * 32 ka standardized evaluation parameters subay sa international standard.
          </div>
        </div>
      </div>

      {/* Category Mean Breakdown Summary Cards */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm">
        <h3 className="font-serif font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          <span>Category Mean Score Summary Breakdown</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
          {Object.keys(CATEGORY_INFO).map((code) => {
            const info = CATEGORY_INFO[code];
            const meanData = categoryMeans[code] || { mean: 5.0, count: 0 };
            return (
              <div
                key={code}
                className={`p-2.5 rounded-xl border ${info.border} ${info.bg} flex flex-col justify-between text-center`}
              >
                <span className="text-[10px] font-black tracking-widest text-slate-600 block">
                  [{code}]
                </span>
                <span className="text-base font-black font-mono my-1 text-slate-900">
                  {meanData.mean.toFixed(2)}
                </span>
                <span className="text-[9px] font-semibold text-slate-600 line-clamp-1 truncate" title={info.label}>
                  {info.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluator Information Form */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-emerald-700" />
          <h3 className="font-serif font-bold text-sm text-slate-800">
            Evaluator Information (Impormasyon sa Evaluator)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Pangalan sa Evaluator *</span>
            </label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="e.g. Engr. Juan Dela Cruz"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Opisina / Posisyon *</span>
            </label>
            <input
              type="text"
              value={evaluatorPosition}
              onChange={(e) => setEvaluatorPosition(e.target.value)}
              placeholder="e.g. IT Specialist / Agriculture Officer"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Ahensya / Institusyon</span>
            </label>
            <input
              type="text"
              value={evaluatorOffice}
              onChange={(e) => setEvaluatorOffice(e.target.value)}
              placeholder="e.g. DA-MAO Silago / SLSU Hinunangan"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Petsa sa Pagsusi (Date) *</span>
            </label>
            <input
              type="date"
              value={evaluationDate}
              onChange={(e) => setEvaluationDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>
        </div>
      </div>

      {/* Main Questionnaire (9 ISO/IEC 25010 Categories) */}
      <div className="space-y-5">
        {Object.keys(groupedItems).map((code) => {
          const info = CATEGORY_INFO[code] || CATEGORY_INFO['A'];
          const items = groupedItems[code];
          const meanData = categoryMeans[code] || { mean: 5.0 };
          const Icon = info.icon;

          return (
            <div
              key={code}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden"
            >
              {/* Category Header */}
              <div className={`p-4 ${info.bg} border-b ${info.border} flex items-center justify-between flex-wrap gap-2`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-white shadow-2xs ${info.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Category {code}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
                        Mean: {meanData.mean.toFixed(2)}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold font-serif text-slate-900 tracking-tight">
                      {info.label}
                    </h3>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-slate-500 italic hidden sm:block">
                  {items.length} Parameter{items.length > 1 ? 's' : ''} Evaluated
                </div>
              </div>

              {/* Questionnaire Items Table */}
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const currentScore = ratings[item.id] || 5;

                  return (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                    >
                      {/* Left: Parameter Description */}
                      <div className="space-y-1 max-w-3xl flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {item.id}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            {item.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-1">
                          {item.criterionDescription}
                        </p>
                      </div>

                      {/* Right: 1 to 5 Rating Radio Pill Group */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                        {[1, 2, 3, 4, 5].map((score) => {
                          const isSelected = currentScore === score;
                          return (
                            <button
                              key={score}
                              type="button"
                              onClick={() => handleRatingChange(item.id, score)}
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer select-none ${
                                isSelected
                                  ? score >= 4
                                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50 scale-105'
                                    : score === 3
                                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400/50 scale-105'
                                    : 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50 scale-105'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 hover:scale-102'
                              }`}
                              title={`Rate ${score} for ${item.name}`}
                            >
                              {score}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Qualitative Notes / Recommendation Area */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-2">
        <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-700" />
          <span>Evaluator Qualitative Remarks &amp; Recommendations (Opsyonal)</span>
        </label>
        <textarea
          rows={3}
          value={evaluatorNotes}
          onChange={(e) => setEvaluatorNotes(e.target.value)}
          placeholder="Ibutang dinhi ang bisan unsang piho nga rekomendasyon, komento, o obserbasyon alang sa dugang kalamboan sa sistema..."
          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
        />
      </div>

      {/* Official Signatory Certification Block for Printing */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <h4 className="font-serif font-bold text-sm text-slate-900">
              Official Certification &amp; Authentication
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Standard: ISO/IEC 25010:2011 SQuaRE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Evaluated &amp; Certified by:
            </span>
            <div className="pt-8 border-b-2 border-slate-800 max-w-xs">
              <span className="font-bold text-sm text-slate-900 block uppercase">
                {evaluatorName || '_____________________________'}
              </span>
            </div>
            <span className="text-xs text-slate-600 block">
              {evaluatorPosition || 'Evaluator / Agriculture Officer'}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">
              Date: {evaluationDate}
            </span>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Noted &amp; Received by:
            </span>
            <div className="pt-8 border-b-2 border-slate-800 max-w-xs sm:ml-auto">
              <span className="font-bold text-sm text-slate-900 block uppercase">
                {adminProfile.name || 'MUNICIPAL AGRICULTURIST'}
              </span>
            </div>
            <span className="text-xs text-slate-600 block">
              DA-MAO Silago Municipal Agriculture Office
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">
              Southern Leyte, Philippines
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationView;

