import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { OfficialSealsTrio } from '../components/Seals';
import {
  ClipboardCheck,
  Printer,
  Sparkles,
  Award,
  CheckCircle2,
  Calendar,
  User,
  Building,
  Briefcase,
  Layers,
  Zap,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  FileText,
  Globe
} from 'lucide-react';

export interface EvaluationItem {
  id: string;
  category: string;
  categoryCode: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I';
  name: string;
  nameEn: string;
  nameCeb: string;
  criterionDescription: string;
  descriptionEn: string;
  descriptionCeb: string;
}

export const ISO_EVALUATION_ITEMS: EvaluationItem[] = [
  // A. FUNCTIONAL SUITABILITY
  {
    id: 'A1',
    category: 'FUNCTIONAL SUITABILITY',
    categoryCode: 'A',
    name: 'Functional Completeness',
    nameEn: 'Functional Completeness',
    nameCeb: 'Functional Completeness (Kabuukon sa Gamit)',
    criterionDescription: 'Nakasulod ba ang tanang RSBSA data, 15 ka barangay sa Silago, georeferenced maps, ug crop production details?',
    descriptionEn: 'Does the system capture all RSBSA records, 15 Silago barangays, georeferenced maps, and seasonal crop production details?',
    descriptionCeb: 'Nakasulod ba ang tanang RSBSA data, 15 ka barangay sa Silago, georeferenced maps, ug crop production details?'
  },
  {
    id: 'A2',
    category: 'FUNCTIONAL SUITABILITY',
    categoryCode: 'A',
    name: 'Functional Correctness',
    nameEn: 'Functional Correctness',
    nameCeb: 'Functional Correctness (Kasakto sa Pagkwenta)',
    criterionDescription: 'Sakto ug walay sayop ang pagkwenta sa yield, hectares, coordinates, ug pag-parse sa Excel files.',
    descriptionEn: 'Are calculations for yield, farm hectares, GPS coordinates, and Excel file parsing accurate and error-free?',
    descriptionCeb: 'Sakto ug walay sayop ang pagkwenta sa yield, hectares, coordinates, ug pag-parse sa Excel files.'
  },
  {
    id: 'A3',
    category: 'FUNCTIONAL SUITABILITY',
    categoryCode: 'A',
    name: 'Functional Appropriateness',
    nameEn: 'Functional Appropriateness',
    nameCeb: 'Functional Appropriateness (Kahaom sa Panginahanglan)',
    criterionDescription: 'Haom ba ang RiceSsistant workflow ug staging preview sa aktuwal nga panginahanglan sa DA-MAO?',
    descriptionEn: 'Is the RiceSsistant workflow and staging preview appropriately tailored to the actual operational needs of DA-MAO?',
    descriptionCeb: 'Haom ba ang RiceSsistant workflow ug staging preview sa aktuwal nga panginahanglan sa DA-MAO?'
  },

  // B. PERFORMANCE EFFICIENCY
  {
    id: 'B1',
    category: 'PERFORMANCE EFFICIENCY',
    categoryCode: 'B',
    name: 'Time Behaviour',
    nameEn: 'Time Behaviour',
    nameCeb: 'Time Behaviour (Kadasig sa Pagtubag)',
    criterionDescription: 'Paspas ba ang tubag sa sistema, pag-render sa mapa, ug pag-search sa database nga walay pagka-antala?',
    descriptionEn: 'Does the system deliver rapid response times during map rendering, database searching, and report generation without delays?',
    descriptionCeb: 'Paspas ba ang tubag sa sistema, pag-render sa mapa, ug pag-search sa database nga walay pagka-antala?'
  },
  {
    id: 'B2',
    category: 'PERFORMANCE EFFICIENCY',
    categoryCode: 'B',
    name: 'Resource Utilization',
    nameEn: 'Resource Utilization',
    nameCeb: 'Resource Utilization (Kinaadman sa Paggamit og Rekurso)',
    criterionDescription: 'Maalamon ba ang paggamit sa network bandwidth ug memory sa browser?',
    descriptionEn: 'Does the application optimize network bandwidth, API requests, and browser memory consumption prudently?',
    descriptionCeb: 'Maalamon ba ang paggamit sa network bandwidth ug memory sa browser?'
  },
  {
    id: 'B3',
    category: 'PERFORMANCE EFFICIENCY',
    categoryCode: 'B',
    name: 'Capacity',
    nameEn: 'Capacity',
    nameCeb: 'Capacity (Kapasidad sa Pagkarga)',
    criterionDescription: 'Makadumala ba og ginatos ka mga lote ug profile sa mag-uuma nga dili mohinay ang rendering?',
    descriptionEn: 'Can the platform smoothly handle hundreds of parcel lots and farmer profiles without UI lagging or slowdowns?',
    descriptionCeb: 'Makadumala ba og ginatos ka mga lote ug profile sa mag-uuma nga dili mohinay ang rendering?'
  },

  // C. COMPATIBILITY
  {
    id: 'C1',
    category: 'COMPATIBILITY',
    categoryCode: 'C',
    name: 'Co-existence',
    nameEn: 'Co-existence',
    nameCeb: 'Co-existence (Pag-uban sa Ubang App)',
    criterionDescription: 'Hapsay bang magamit dungan sa uban pang bukas nga web applications o browser extensions?',
    descriptionEn: 'Can the application operate concurrently and smoothly with other open web applications or browser extensions?',
    descriptionCeb: 'Hapsay bang magamit dungan sa uban pang bukas nga web applications o browser extensions?'
  },
  {
    id: 'C2',
    category: 'COMPATIBILITY',
    categoryCode: 'C',
    name: 'Interoperability',
    nameEn: 'Interoperability',
    nameCeb: 'Interoperability (Panaghiusa sa mga Teknolohiya)',
    criterionDescription: 'Hapsay ba ang komunikasyon tali sa React frontend, Supabase SQL, Leaflet GIS, ug SheetJS engine?',
    descriptionEn: 'Is there seamless data communication among the React frontend, Supabase SQL, Leaflet GIS, and SheetJS export engine?',
    descriptionCeb: 'Hapsay ba ang komunikasyon tali sa React frontend, Supabase SQL, Leaflet GIS, ug SheetJS engine?'
  },

  // D. INTERACTION CAPABILITY / USABILITY
  {
    id: 'D1',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Appropriateness Recognisability',
    nameEn: 'Appropriateness Recognisability',
    nameCeb: 'Appropriateness Recognisability (Daling Pag-ila sa Gamit)',
    criterionDescription: 'Masabtan ba dayon sa tiggamit ang mga gamit sa matag icon, dashboard, ug navigation link?',
    descriptionEn: 'Can users immediately comprehend the purpose and functionality of each icon, dashboard metric, and navigation link?',
    descriptionCeb: 'Masabtan ba dayon sa tiggamit ang mga gamit sa matag icon, dashboard, ug navigation link?'
  },
  {
    id: 'D2',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Learnability',
    nameEn: 'Learnability',
    nameCeb: 'Learnability (Kasayon sa Pagkat-on)',
    criterionDescription: 'Sayon bang tun-an sa mga Local Farm Technicians (LFT) ug mga kawani sa DA-MAO?',
    descriptionEn: 'Is the portal easy to learn and master for Local Farm Technicians (LFTs) and DA-MAO personnel?',
    descriptionCeb: 'Sayon bang tun-an sa mga Local Farm Technicians (LFT) ug mga kawani sa DA-MAO?'
  },
  {
    id: 'D3',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Operability',
    nameEn: 'Operability',
    nameCeb: 'Operability (Kasayon sa Pagpadagan)',
    criterionDescription: 'Sayon ug komportable bang pisliton ang mga buttons, toggle switches, ug drag-and-drop features?',
    descriptionEn: 'Are interactive buttons, toggle controls, filter selectors, and drag-and-drop file inputs convenient and easy to use?',
    descriptionCeb: 'Sayon ug komportable bang pisliton ang mga buttons, toggle switches, ug drag-and-drop features?'
  },
  {
    id: 'D4',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'User Error Protection',
    nameEn: 'User Error Protection',
    nameCeb: 'User Error Protection (Panalipod sa Sayop sa Tiggamit)',
    criterionDescription: 'Aduna bay mga kumpirmasyon ug validation alerts sa dili pa mopadayon sa sensitibong aksyon sama sa pagtangtang o pag-upload sa datos?',
    descriptionEn: 'Does the system provide confirmation modals, input guards, and validation alerts prior to executing sensitive actions?',
    descriptionCeb: 'Aduna bay mga kumpirmasyon ug validation alerts sa dili pa mopadayon sa sensitibong aksyon sama sa pagtangtang o pag-upload sa datos?'
  },
  {
    id: 'D5',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'User Interface Aesthetics',
    nameEn: 'User Interface Aesthetics',
    nameCeb: 'User Interface Aesthetics (Katahom sa Interface)',
    criterionDescription: 'Propesyonal, hapsay, ug nindot ba ang color-coding sa mga agro-ecosystems ug ang Microsoft Word print format?',
    descriptionEn: 'Is the visual layout professional, clean, and appealing with intuitive color-coded agro-ecosystems and printable reports?',
    descriptionCeb: 'Propesyonal, hapsay, ug nindot ba ang color-coding sa mga agro-ecosystems ug ang Microsoft Word print format?'
  },
  {
    id: 'D6',
    category: 'INTERACTION CAPABILITY / USABILITY',
    categoryCode: 'D',
    name: 'Accessibility',
    nameEn: 'Accessibility',
    nameCeb: 'Accessibility (Katin-aw sa Pagbasa)',
    criterionDescription: 'Tin-aw ba ang contrast sa mga letra ug sayon bang mabasa?',
    descriptionEn: 'Are font typography, text contrast, and visual layouts clearly legible across various device screens?',
    descriptionCeb: 'Tin-aw ba ang contrast sa mga letra ug sayon bang mabasa?'
  },

  // E. RELIABILITY
  {
    id: 'E1',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Maturity',
    nameEn: 'Maturity',
    nameCeb: 'Maturity (Kahamtong sa Sistema)',
    criterionDescription: 'Walay nasinatiang kalit nga pagkapalong o White Screen of Death (WSoD) atol sa paggamit.',
    descriptionEn: 'Does the application run steadily without encountering sudden shutdowns or White Screen of Death (WSoD) crashes?',
    descriptionCeb: 'Walay nasinatiang kalit nga pagkapalong o White Screen of Death (WSoD) atol sa paggamit.'
  },
  {
    id: 'E2',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Availability',
    nameEn: 'Availability',
    nameCeb: 'Availability (Kanunayng Pagka-abli)',
    criterionDescription: 'Kanunayng ma-access ang web dashboard online pinaagi sa deployment.',
    descriptionEn: 'Is the web dashboard consistently accessible online through active cloud deployment?',
    descriptionCeb: 'Kanunayng ma-access ang web dashboard online pinaagi sa deployment.'
  },
  {
    id: 'E3',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Fault Tolerance',
    nameEn: 'Fault Tolerance',
    nameCeb: 'Fault Tolerance (Paglahutay sa Kakuwangon)',
    criterionDescription: 'Dili mag-crash ang sistema bisan kon adunay blangko o kulang nga mga field sa datos gamit ang safe conditional rendering.',
    descriptionEn: 'Does the system prevent crashes even when encountering blank or incomplete data fields via safe conditional rendering?',
    descriptionCeb: 'Dili mag-crash ang sistema bisan kon adunay blangko o kulang nga mga field sa datos gamit ang safe conditional rendering.'
  },
  {
    id: 'E4',
    category: 'RELIABILITY',
    categoryCode: 'E',
    name: 'Recoverability',
    nameEn: 'Recoverability',
    nameCeb: 'Recoverability (Daling Pagka-ayo)',
    criterionDescription: 'Dali bang makabalik sa normal nga kahimtang kon maputol ang koneksyon sa internet o database?',
    descriptionEn: 'Can the system swiftly restore normal operational state upon reconnection after network or database interruptions?',
    descriptionCeb: 'Dali bang makabalik sa normal nga kahimtang kon maputol ang koneksyon sa internet o database?'
  },

  // F. SECURITY
  {
    id: 'F1',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Confidentiality',
    nameEn: 'Confidentiality',
    nameCeb: 'Confidentiality (Kasirado sa Datos)',
    criterionDescription: 'Napanalipdan ba ang sensitibong impormasyon sa mga mag-uuma pinaagi sa authentication ug Role-Based Access Control?',
    descriptionEn: 'Is sensitive farmer identity and landholding data securely guarded through authentication and Role-Based Access Control?',
    descriptionCeb: 'Napanalipdan ba ang sensitibong impormasyon sa mga mag-uuma pinaagi sa authentication ug Role-Based Access Control?'
  },
  {
    id: 'F2',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Integrity',
    nameEn: 'Integrity',
    nameCeb: 'Integrity (Pagkadili-matuis sa Talaan)',
    criterionDescription: 'Dili ba masalipdan o mausab sa dili awtorisadong tawo ang mga profile ug georeferenced boundaries?',
    descriptionEn: 'Are farmer profiles and georeferenced polygon boundaries safeguarded against unauthorized modification or tampering?',
    descriptionCeb: 'Dili ba masalipdan o mausab sa dili awtorisadong tawo ang mga profile ug georeferenced boundaries?'
  },
  {
    id: 'F3',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Non-repudiation',
    nameEn: 'Non-repudiation',
    nameCeb: 'Non-repudiation (Pagmatuod sa Naglihok)',
    criterionDescription: 'Natala ba ang pagkatawo sa account nga naghimo sa pag-usab o pagdugang og talaan?',
    descriptionEn: 'Does the system accurately record the identity of the account responsible for inserting or modifying records?',
    descriptionCeb: 'Natala ba ang pagkatawo sa account nga naghimo sa pag-usab o pagdugang og talaan?'
  },
  {
    id: 'F4',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Accountability',
    nameEn: 'Accountability',
    nameCeb: 'Accountability (Katin-aw sa Responsibilidad)',
    criterionDescription: 'Klaro ba ang pagkabulag sa responsibilidad tali sa DA-MAO Administrator ug sa Barangay LFT Accounts?',
    descriptionEn: 'Is there a clear operational demarcation of responsibilities between DA-MAO Central Admin and Barangay LFT Accounts?',
    descriptionCeb: 'Klaro ba ang pagkabulag sa responsibilidad tali sa DA-MAO Administrator ug sa Barangay LFT Accounts?'
  },
  {
    id: 'F5',
    category: 'SECURITY',
    categoryCode: 'F',
    name: 'Authenticity',
    nameEn: 'Authenticity',
    nameCeb: 'Authenticity (Pagka-tinuod sa Pag-ila)',
    criterionDescription: 'Lig-on ba ang pag-verify sa login pinaagi sa username ug 8-character secured password nga may uppercase ug numero?',
    descriptionEn: 'Is login verification secured through validated usernames and enforced 8-character passwords with uppercase and numeric digits?',
    descriptionCeb: 'Lig-on ba ang pag-verify sa login pinaagi sa username ug 8-character secured password nga may uppercase ug numero?'
  },

  // G. MAINTAINABILITY
  {
    id: 'G1',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Modularity',
    nameEn: 'Modularity',
    nameCeb: 'Modularity (Pagkabulag sa mga Bahin)',
    criterionDescription: 'Tarong bang nabahin-bahin ang tagsa-tagsa ka code files ug components (Database, Maps, Reports, Assistant)?',
    descriptionEn: 'Is the codebase neatly partitioned into modular components (Database, Maps, Reports, Assistant, Accounts)?',
    descriptionCeb: 'Tarong bang nabahin-bahin ang tagsa-tagsa ka code files ug components (Database, Maps, Reports, Assistant)?'
  },
  {
    id: 'G2',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Reusability',
    nameEn: 'Reusability',
    nameCeb: 'Reusability (Paggamit Pag-usab)',
    criterionDescription: 'Nagamit ba pag-usab ang mga generic helper functions, modal structures, ug badge styles?',
    descriptionEn: 'Are shared utility functions, modal frameworks, badge indicators, and data hooks effectively reused across views?',
    descriptionCeb: 'Nagamit ba pag-usab ang mga generic helper functions, modal structures, ug badge styles?'
  },
  {
    id: 'G3',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Analysability',
    nameEn: 'Analysability',
    nameCeb: 'Analysability (Kasayon sa Pagtuki)',
    criterionDescription: 'Sayon bang matultolan ang mga log traces ug errors kon adunay kinahanglang i-debug?',
    descriptionEn: 'Can developers conveniently trace diagnostic logs and identify errors whenever debugging is required?',
    descriptionCeb: 'Sayon bang matultolan ang mga log traces ug errors kon adunay kinahanglang i-debug?'
  },
  {
    id: 'G4',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Modifiability',
    nameEn: 'Modifiability',
    nameCeb: 'Modifiability (Kasayon sa Pagbag-o)',
    criterionDescription: 'Sayon bang dugangan og bag-ong feature (pananglitan: voice speech, previous harvest tracking) nga dili makaguba sa ubang parte?',
    descriptionEn: 'Can new functionalities (e.g. voice interaction, historical crop tracking) be incorporated without breaking other modules?',
    descriptionCeb: 'Sayon bang dugangan og bag-ong feature (pananglitan: voice speech, previous harvest tracking) nga dili makaguba sa ubang parte?'
  },
  {
    id: 'G5',
    category: 'MAINTAINABILITY',
    categoryCode: 'G',
    name: 'Testability',
    nameEn: 'Testability',
    nameCeb: 'Testability (Kasayon sa Pagsulay)',
    criterionDescription: 'Mapasar ba ang build diagnostics ug compilation nga walay TypeScript errors?',
    descriptionEn: 'Does the application consistently pass TypeScript compilation and production build checks with zero errors?',
    descriptionCeb: 'Mapasar ba ang build diagnostics ug compilation nga walay TypeScript errors?'
  },

  // H. FLEXIBILITY / PORTABILITY
  {
    id: 'H1',
    category: 'FLEXIBILITY / PORTABILITY',
    categoryCode: 'H',
    name: 'Adaptability',
    nameEn: 'Adaptability',
    nameCeb: 'Adaptability (Kahiangay sa Nagkalain-laing Screen)',
    criterionDescription: 'Mo-adjust ba ang hitsura sa lain-laing gidak-on sa screen (laptops, desktops, widescreen displays)?',
    descriptionEn: 'Does the user interface responsively adapt across varied screen resolutions (laptops, desktops, widescreen monitors)?',
    descriptionCeb: 'Mo-adjust ba ang hitsura sa lain-laing gidak-on sa screen (laptops, desktops, widescreen displays)?'
  },
  {
    id: 'H2',
    category: 'FLEXIBILITY / PORTABILITY',
    categoryCode: 'H',
    name: 'Installability / Deployability',
    nameEn: 'Installability / Deployability',
    nameCeb: 'Installability (Kasayon sa Pag-deploy)',
    criterionDescription: 'Sayon ug hapsay bang ma-deploy sa Vercel cloud hosting?',
    descriptionEn: 'Can the application be deployed smoothly and reliably to cloud platforms like Vercel with automated CI/CD?',
    descriptionCeb: 'Sayon ug hapsay bang ma-deploy sa Vercel cloud hosting?'
  },
  {
    id: 'H3',
    category: 'FLEXIBILITY / PORTABILITY',
    categoryCode: 'H',
    name: 'Replaceability',
    nameEn: 'Replaceability',
    nameCeb: 'Replaceability (Kasayon sa Pag-ilis og Pakete)',
    criterionDescription: 'Sayon bang ilisdan o i-upgrade ang underlying external packages nga walay pagbag-o sa core business logic?',
    descriptionEn: 'Can underlying third-party packages and dependencies be updated or substituted without altering core business logic?',
    descriptionCeb: 'Sayon bang ilisdan o i-upgrade ang underlying external packages nga walay pagbag-o sa core business logic?'
  },

  // I. SAFETY
  {
    id: 'I1',
    category: 'SAFETY',
    categoryCode: 'I',
    name: 'Operational Safety',
    nameEn: 'Operational Safety',
    nameCeb: 'Operational Safety (Kaluwasan sa Operasyon)',
    criterionDescription: 'Nalikayan ba ang sayop nga paghatag og ayuda tungod sa estriktong pagbulag sa \'Basakan\' (Farm Location) ug \'Tirahan\' (Farmer Residence)?',
    descriptionEn: 'Does the strict distinction between \'Farm Location\' (Basakan) and \'Farmer Residence\' prevent misallocation of agricultural aid?',
    descriptionCeb: 'Nalikayan ba ang sayop nga paghatag og ayuda tungod sa estriktong pagbulag sa \'Basakan\' (Farm Location) ug \'Tirahan\' (Farmer Residence)?'
  },
  {
    id: 'I2',
    category: 'SAFETY',
    categoryCode: 'I',
    name: 'Data Hazard Mitigation',
    nameEn: 'Data Hazard Mitigation',
    nameCeb: 'Data Hazard Mitigation (Pagpugong sa Kadaot sa Datos)',
    criterionDescription: 'Napugngan ba ang pagkadaot sa database pinaagi sa mandatory Staging Preview sa wala pa i-save ang gi-drag nga Excel file?',
    descriptionEn: 'Is database integrity preserved through mandatory interactive staging previews before committing uploaded Excel spreadsheets?',
    descriptionCeb: 'Napugngan ba ang pagkadaot sa database pinaagi sa mandatory Staging Preview sa wala pa i-save ang gi-drag nga Excel file?'
  },
  {
    id: 'I3',
    category: 'SAFETY',
    categoryCode: 'I',
    name: 'Georeference Safeguard',
    nameEn: 'Georeference Safeguard',
    nameCeb: 'Georeference Safeguard (Kasegurohan sa Koordinada)',
    criterionDescription: 'Nasiguro ba nga ang coordinates ug boundaries nahimutang sulod sa opisyal nga hurisdiksyon sa 15 ka barangay sa Silago?',
    descriptionEn: 'Are GIS parcel coordinates and boundaries verified to ensure they fall strictly within the 15 official barangays of Silago?',
    descriptionCeb: 'Nasiguro ba nga ang coordinates ug boundaries nahimutang sulod sa opisyal nga hurisdiksyon sa 15 ka barangay sa Silago?'
  }
];

export const CATEGORY_INFO: Record<
  string,
  {
    labelEn: string;
    labelCeb: string;
    code: string;
    color: string;
    bg: string;
    border: string;
    icon: any;
  }
> = {
  A: {
    labelEn: 'FUNCTIONAL SUITABILITY',
    labelCeb: 'FUNCTIONAL SUITABILITY (Kahaom sa Gamit)',
    code: 'A',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: Sparkles
  },
  B: {
    labelEn: 'PERFORMANCE EFFICIENCY',
    labelCeb: 'PERFORMANCE EFFICIENCY (Kaepisyente sa Pagpadagan)',
    code: 'B',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: Zap
  },
  C: {
    labelEn: 'COMPATIBILITY',
    labelCeb: 'COMPATIBILITY (Kahiangay sa Ubang Sistema)',
    code: 'C',
    color: 'text-cyan-700',
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    icon: Share2
  },
  D: {
    labelEn: 'INTERACTION CAPABILITY / USABILITY',
    labelCeb: 'USABILITY (Kasayon sa Paggamit ug Pakig-uban)',
    code: 'D',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: Sliders
  },
  E: {
    labelEn: 'RELIABILITY',
    labelCeb: 'RELIABILITY (Kasaligan sa Sistema)',
    code: 'E',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    icon: ShieldCheck
  },
  F: {
    labelEn: 'SECURITY',
    labelCeb: 'SECURITY (Seguridad ug Panalipod)',
    code: 'F',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    icon: ShieldAlert
  },
  G: {
    labelEn: 'MAINTAINABILITY',
    labelCeb: 'MAINTAINABILITY (Kasayon sa Pagmentinar)',
    code: 'G',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: Layers
  },
  H: {
    labelEn: 'FLEXIBILITY / PORTABILITY',
    labelCeb: 'PORTABILITY (Pagbalhin-balhin ug Kahiangay)',
    code: 'H',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
    icon: Briefcase
  },
  I: {
    labelEn: 'SAFETY',
    labelCeb: 'SAFETY (Kaluwasan sa Operasyon ug Datos)',
    code: 'I',
    color: 'text-emerald-800',
    bg: 'bg-emerald-50/80',
    border: 'border-emerald-300',
    icon: Award
  }
};

export const getQualitativeInterpretation = (
  meanScore: number,
  isCeb: boolean
): { text: string; badgeColor: string; description: string } => {
  if (meanScore >= 4.5) {
    return {
      text: isCeb ? 'Ekselente / Taas Kaayong Pagsunod' : 'Excellent / Highly Compliant',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: isCeb
        ? 'Labaw pa sa gipaabot sumala sa sumbanan sa ISO/IEC 25010 standard.'
        : 'Significantly exceeds ISO/IEC 25010 standard quality requirements.'
    };
  }
  if (meanScore >= 3.5) {
    return {
      text: isCeb ? 'Makapatagbaw Kaayo / Ningsunod' : 'Very Satisfactory / Compliant',
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
      description: isCeb
        ? 'Hingpit nga nakakab-ot sa kalidad ug kasaligan nga pagpatuman.'
        : 'Fully meets all quality and reliability implementation benchmarks.'
    };
  }
  if (meanScore >= 2.5) {
    return {
      text: isCeb ? 'Makapatagbaw / Kasarangan' : 'Satisfactory / Moderately Compliant',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      description: isCeb
        ? 'Nakapasar sa mga sukaranan apan adunay pipila ka mga angayng palambuon.'
        : 'Meets minimum baseline standards with some areas for enhancement.'
    };
  }
  if (meanScore >= 1.5) {
    return {
      text: isCeb ? 'Kulang / Nagkinahanglan og Pagpalambo' : 'Fair / Needs Improvement',
      badgeColor: 'bg-orange-100 text-orange-800 border-orange-300',
      description: isCeb
        ? 'Wala makatuman sa pipila ka importanteng criteria sa standard.'
        : 'Fails to satisfy several key criteria within the standard.'
    };
  }
  return {
    text: isCeb ? 'Dili Maayo / Wala Makatuman' : 'Poor / Non-Compliant',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
    description: isCeb
      ? 'Kritikal nga wala makatuman sa standard; kinahanglan og dinaliang rebisyon.'
      : 'Critically non-compliant; requires immediate architectural revision.'
  };
};

export const EvaluationView: React.FC = () => {
  const { currentUser, adminProfile, language, setLanguage } = useApp();
  const isCeb = language === 'CEB' || (language as string) === 'Cebuano';

  // Evaluator Information State
  const [evaluatorName, setEvaluatorName] = useState(
    currentUser?.name || adminProfile.name || ''
  );
  const [evaluatorPosition, setEvaluatorPosition] = useState(
    currentUser?.title || adminProfile.title || (isCeb ? 'Opisyal sa Agrikultura / Evaluator' : 'Systems Evaluator / Municipal Agriculture Officer')
  );
  const [evaluatorOffice, setEvaluatorOffice] = useState(
    currentUser?.office || adminProfile.office || 'Office of the Municipal Agriculturist (DA-MAO Silago)'
  );
  const [evaluationDate, setEvaluationDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [evaluatorNotes, setEvaluatorNotes] = useState('');

  // Ratings State (Key = item id, Value = 1 to 5)
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
    return getQualitativeInterpretation(overallMean, isCeb);
  }, [overallMean, isCeb]);

  // Likert scale labels
  const likertLabels: Record<number, string> = useMemo(() => {
    if (isCeb) {
      return {
        5: 'Labaw nga Uyon',
        4: 'Uyon',
        3: 'Neutral',
        2: 'Dili Uyon',
        1: 'Hugot nga Dili Uyon'
      };
    }
    return {
      5: 'Strongly Agree',
      4: 'Agree',
      3: 'Neutral',
      2: 'Disagree',
      1: 'Strongly Disagree'
    };
  }, [isCeb]);

  // Print function
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Official Print Header (Only visible in Print / PDF Export) */}
      <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4 text-center">
        <div className="flex items-center justify-center gap-6 mb-2">
          <OfficialSealsTrio className="h-16 w-auto" />
        </div>
        <div className="text-[11px] font-serif uppercase tracking-wider text-slate-700 leading-tight">
          Republic of the Philippines &bull; Province of Southern Leyte
        </div>
        <div className="text-sm font-black font-serif uppercase tracking-wide text-slate-900">
          Municipality of Silago &bull; Municipal Agriculture Office
        </div>
        <div className="text-base font-black font-serif text-emerald-950 mt-1 uppercase underline decoration-2 underline-offset-4">
          {isCeb
            ? 'Report sa Pagsukod sa Kalidad sa Sistema (ISO/IEC 25010)'
            : 'ISO/IEC 25010 Software Quality Evaluation & Verification Report'}
        </div>
        <div className="text-[10px] text-slate-500 font-mono mt-1">
          {isCeb ? 'Sumbanan' : 'Standard'}: ISO/IEC 25010:2011 SQuaRE &bull; Silago Rice Farm Registry &amp; GIS Portal
        </div>
      </div>

      {/* Top Header & Overview Banner */}
      <div className="bg-gradient-to-r from-[#0c2340] via-[#123358] to-[#184632] text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-white/10 relative overflow-hidden print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              <ClipboardCheck className="w-4 h-4" />
              <span>ISO/IEC 25010 Software Quality Standard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight text-white">
              {isCeb
                ? 'Pagsukod ug Pagmatuod sa Kalidad sa Sistema'
                : 'Software Quality Evaluation & Verification Instrument'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isCeb
                ? 'Komprehensibo ug interaktibong pagsukod sa kalidad sa Silago Rice Farm Registry & Georeferenced GIS Portal sumala sa siyam (9) ka internasyonal nga mga kategorya ug 5-point Likert Scale.'
                : 'Comprehensive interactive assessment for Silago Rice Farm Registry & Georeferenced GIS Portal across 9 international quality categories using a 5-point Likert Scale.'}
            </p>
          </div>

          {/* Action Buttons & Language Switcher */}
          <div className="flex items-center gap-2 shrink-0 self-stretch sm:self-auto flex-wrap no-print">
            {/* Quick Language Toggle */}
            <button
              type="button"
              onClick={() => setLanguage(isCeb ? 'EN' : 'CEB')}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/20 active:scale-95"
              title={isCeb ? 'Switch to English language' : 'Ibalhin sa pinulongang Cebuano'}
            >
              <Globe className="w-3.5 h-3.5 text-blue-300" />
              <span>{isCeb ? 'Language: CEB' : 'Language: EN'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
              title={isCeb ? 'I-export ang Report sa PDF / I-print' : 'Export Evaluation Report to PDF / Print'}
            >
              <Printer className="w-4 h-4" />
              <span>{isCeb ? 'I-export ang Report sa PDF / I-print' : 'Export Evaluation Report to PDF / Print'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSetAllRatings(5)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-white/15 active:scale-95"
              title={isCeb ? 'I-set ang tanan sa 5 (Labaw nga Uyon)' : 'Set All Ratings to 5 (Strongly Agree)'}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isCeb ? 'I-set Tanan (5)' : 'Set All (5)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live Computation Cards (Overall & Category Mean) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:grid-cols-4">
        {/* Overall Mean Card */}
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between relative overflow-hidden print:border-slate-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {isCeb ? 'OVERALL MEAN SCORE (TIBUOK SISTEMA)' : 'OVERALL MEAN SCORE (ENTIRE SYSTEM)'}
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
        <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col justify-between print:border-slate-300">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            {isCeb ? 'Giya sa 5-Point Likert Scale Reference' : '5-Point Likert Scale Reference'}
          </span>
          <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold">
              <div className="text-sm font-black">5</div>
              <div className="text-[9.5px] leading-tight mt-0.5">{likertLabels[5]}</div>
            </div>
            <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold">
              <div className="text-sm font-black">4</div>
              <div className="text-[9.5px] leading-tight mt-0.5">{likertLabels[4]}</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-bold">
              <div className="text-sm font-black">3</div>
              <div className="text-[9.5px] leading-tight mt-0.5">{likertLabels[3]}</div>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 font-bold">
              <div className="text-sm font-black">2</div>
              <div className="text-[9.5px] leading-tight mt-0.5">{likertLabels[2]}</div>
            </div>
            <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-900 font-bold">
              <div className="text-sm font-black">1</div>
              <div className="text-[9.5px] leading-tight mt-0.5">{likertLabels[1]}</div>
            </div>
          </div>
          <div className="mt-3 text-[11px] text-slate-500 italic">
            {isCeb
              ? `* ${ISO_EVALUATION_ITEMS.length} ka standardized evaluation parameters subay sa international standard.`
              : `* ${ISO_EVALUATION_ITEMS.length} standardized evaluation parameters adhering to international standards.`}
          </div>
        </div>
      </div>

      {/* Category Mean Breakdown Summary Cards */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm print:border-slate-300">
        <h3 className="font-serif font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-700" />
          <span>{isCeb ? 'Katingbanan sa Mean Score matag Kategorya' : 'Category Mean Score Summary Breakdown'}</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-9 gap-2">
          {Object.keys(CATEGORY_INFO).map((code) => {
            const info = CATEGORY_INFO[code];
            const meanData = categoryMeans[code] || { mean: 5.0, count: 0 };
            const labelText = isCeb ? info.labelCeb : info.labelEn;
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
                <span className="text-[9px] font-semibold text-slate-600 line-clamp-1 truncate" title={labelText}>
                  {labelText.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Evaluator Information Form */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-4 print:border-slate-300">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <User className="w-4 h-4 text-emerald-700" />
          <h3 className="font-serif font-bold text-sm text-slate-800">
            {isCeb ? 'Impormasyon sa Evaluator' : 'Evaluator Information'}
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{isCeb ? 'Pangalan sa Evaluator *' : 'Evaluator Name *'}</span>
            </label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder={isCeb ? 'pananglitan: Engr. Juan Dela Cruz' : 'e.g. Engr. Juan Dela Cruz'}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>{isCeb ? 'Opisina / Posisyon *' : 'Office / Position *'}</span>
            </label>
            <input
              type="text"
              value={evaluatorPosition}
              onChange={(e) => setEvaluatorPosition(e.target.value)}
              placeholder={isCeb ? 'pananglitan: IT Specialist / Agriculture Officer' : 'e.g. IT Specialist / Agriculture Officer'}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{isCeb ? 'Ahensya / Institusyon' : 'Agency / Institution'}</span>
            </label>
            <input
              type="text"
              value={evaluatorOffice}
              onChange={(e) => setEvaluatorOffice(e.target.value)}
              placeholder={isCeb ? 'pananglitan: DA-MAO Silago / SLSU Hinunangan' : 'e.g. DA-MAO Silago / SLSU Hinunangan'}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{isCeb ? 'Petsa sa Pagsusi *' : 'Date of Evaluation *'}</span>
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
          const categoryTitle = isCeb ? info.labelCeb : info.labelEn;

          return (
            <div
              key={code}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden print:border-slate-300 print:break-inside-avoid"
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
                        {isCeb ? `Kategorya ${code}` : `Category ${code}`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white text-slate-700 border border-slate-200/80 shadow-2xs">
                        Mean: {meanData.mean.toFixed(2)}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold font-serif text-slate-900 tracking-tight">
                      {categoryTitle}
                    </h3>
                  </div>
                </div>

                <div className="text-[11px] font-medium text-slate-500 italic hidden sm:block">
                  {isCeb
                    ? `${items.length} ka Parameter ang Gisusi`
                    : `${items.length} Parameter${items.length > 1 ? 's' : ''} Evaluated`}
                </div>
              </div>

              {/* Questionnaire Items Table */}
              <div className="divide-y divide-slate-100">
                {items.map((item) => {
                  const currentScore = ratings[item.id] || 5;
                  const itemTitle = isCeb ? item.nameCeb : item.nameEn;
                  const itemDesc = isCeb ? item.descriptionCeb : item.descriptionEn;

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
                            {itemTitle}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-1">
                          {itemDesc}
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
                              title={`${isCeb ? 'Markahi og' : 'Rate'} ${score} (${likertLabels[score]}) - ${itemTitle}`}
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
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm space-y-2 print:border-slate-300">
        <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-emerald-700" />
          <span>
            {isCeb
              ? 'Mga Komento ug Rekomendasyon sa Evaluator (Opsyonal)'
              : 'Evaluator Qualitative Remarks & Recommendations (Optional)'}
          </span>
        </label>
        <textarea
          rows={3}
          value={evaluatorNotes}
          onChange={(e) => setEvaluatorNotes(e.target.value)}
          placeholder={
            isCeb
              ? 'Ibutang dinhi ang bisan unsang piho nga rekomendasyon, komento, o obserbasyon alang sa dugang kalamboan sa sistema...'
              : 'Enter any specific recommendations, comments, or observations for further system enhancement...'
          }
          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs"
        />
      </div>

      {/* Official Signatory Certification Block for Printing */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6 print:border-slate-300 print:break-inside-avoid">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <h4 className="font-serif font-bold text-sm text-slate-900">
              {isCeb ? 'Opisyal nga Sertipikasyon ug Pagmatuod' : 'Official Certification & Authentication'}
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {isCeb ? 'Sumbanan: ISO/IEC 25010:2011 SQuaRE' : 'Standard: ISO/IEC 25010:2011 SQuaRE'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isCeb ? 'Gisusi ug Gimatud-an ni:' : 'Evaluated & Certified by:'}
            </span>
            <div className="pt-8 border-b-2 border-slate-800 max-w-xs">
              <span className="font-bold text-sm text-slate-900 block uppercase">
                {evaluatorName || '_____________________________'}
              </span>
            </div>
            <span className="text-xs text-slate-600 block">
              {evaluatorPosition || (isCeb ? 'Evaluator / Opisyal sa Agrikultura' : 'Evaluator / Agriculture Officer')}
            </span>
            <span className="text-[11px] text-slate-400 block font-mono">
              {isCeb ? 'Petsa' : 'Date'}: {evaluationDate}
            </span>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {isCeb ? 'Gipahibalo ug Gidawat ni:' : 'Noted & Received by:'}
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
              Southern Leyte, {isCeb ? 'Pilipinas' : 'Philippines'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationView;
