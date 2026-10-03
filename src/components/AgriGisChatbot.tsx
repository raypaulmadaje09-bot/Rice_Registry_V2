import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PortalTab, FarmParcel } from '../types';
import { BARANGAYS } from '../data/barangays';
import { RICE_VARIETIES } from '../data/riceVarieties';
import { ACTIVE_SEASON } from '../data/seasonalProduction';
import { RiceSsistantLogo } from './RiceSsistantLogo';
import { RiceSsistantMarkdown } from './RiceSsistantMarkdown';
import {
  X,
  Minus,
  Send,
  Compass,
  FileText,
  MapPin,
  CheckCircle2,
  Wheat,
  PlusCircle,
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Settings,
  BookOpen,
  ArrowRight,
  ClipboardList,
  Copy,
  Check,
  RotateCw
} from 'lucide-react';

export type ChatActionType =
  | 'nav:dashboard'
  | 'nav:map'
  | 'nav:eartags'
  | 'nav:reports'
  | 'nav:accounts'
  | 'nav:photos'
  | 'nav:settings'
  | 'action:add_parcel'
  | 'action:locate_parcel'
  | 'action:view_record'
  | 'action:report_barangay'
  | 'action:map_barangay'
  | 'action:filter_records';

export interface ChatAction {
  type: ChatActionType;
  label: string;
  tab?: PortalTab;
  barangay?: string;
  parcel?: FarmParcel;
  searchTerm?: string;
  iconType: 'map' | 'reports' | 'eartags' | 'dashboard' | 'accounts' | 'photos' | 'settings' | 'add_parcel' | 'print';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actions?: ChatAction[];
  isAutoNavigated?: boolean;
  farmerResults?: FarmParcel[];
}

export type SupportedLanguage = 'bisaya' | 'tagalog' | 'english';

/**
 * Extracts structured [ACTION:...] triggers from AI responses or templates,
 * formats them into interactive ChatAction objects, and cleans the text for display.
 */
export const parseActionTagsAndCleanText = (
  rawText: string,
  parcels: FarmParcel[],
  lang: SupportedLanguage = 'bisaya'
): { cleanText: string; actions: ChatAction[] } => {
  const actions: ChatAction[] = [];
  const actionRegex = /\[ACTION:([a-zA-Z0-9_: -]+)\]/gi;

  let match;
  while ((match = actionRegex.exec(rawText)) !== null) {
    const rawTag = match[1].trim();
    const parts = rawTag.split(':');
    const mainType = parts[0].toLowerCase();
    const subType = parts[1] || '';
    const extra = parts.slice(2).join(':') || '';

    const normalizedRaw = rawTag.toLowerCase().replace(/[\s_-]+/g, '_');

    if (
      normalizedRaw === 'open_registration' ||
      normalizedRaw === 'add_parcel' ||
      mainType === 'add_parcel' ||
      subType === 'add_parcel' ||
      mainType === 'open_registration'
    ) {
      const label =
        lang === 'tagalog'
          ? '➕ Mag-rehistro ng Basakan'
          : lang === 'english'
          ? '➕ + Enroll New Farm'
          : '➕ Mag-rehistro og Basakan';
      if (!actions.some((a) => a.type === 'action:add_parcel')) {
        actions.push({ type: 'action:add_parcel', label, iconType: 'add_parcel' });
      }
    } else if (
      normalizedRaw === 'open_gis_map' ||
      normalizedRaw === 'open_map' ||
      normalizedRaw === 'gis_map' ||
      (mainType === 'nav' && (subType === 'map' || subType === 'gis_map'))
    ) {
      const label =
        lang === 'tagalog' ? '🗺️ Buksan ang GIS Map' : lang === 'english' ? '🗺️ Open GIS Map' : '🗺️ Ablihi ang GIS Map';
      if (!actions.some((a) => a.type === 'nav:map')) {
        actions.push({ type: 'nav:map', tab: 'map', label, iconType: 'map' });
      }
    } else if (
      normalizedRaw === 'open_records' ||
      normalizedRaw === 'open_database' ||
      normalizedRaw === 'records' ||
      (mainType === 'nav' && (subType === 'eartags' || subType === 'records' || subType === 'rice_farm_records'))
    ) {
      const label =
        lang === 'tagalog'
          ? '🌾 Rice Farm Records'
          : lang === 'english'
          ? '🌾 Rice Farm Records'
          : '🌾 Rice Farm Records';
      if (!actions.some((a) => a.type === 'nav:eartags')) {
        actions.push({ type: 'nav:eartags', tab: 'eartags', label, iconType: 'eartags' });
      }
    } else if (mainType === 'nav') {
      const tab = subType as PortalTab;
      if (tab === 'map') {
        const label =
          lang === 'tagalog' ? '🗺️ Buksan ang GIS Map' : lang === 'english' ? '🗺️ Open GIS Map' : '🗺️ Ablihi ang GIS Map';
        if (!actions.some((a) => a.type === 'nav:map')) {
          actions.push({ type: 'nav:map', tab: 'map', label, iconType: 'map' });
        }
      } else if (tab === 'reports') {
        const label =
          lang === 'tagalog'
            ? '📄 Buksan ang Official Reports'
            : lang === 'english'
            ? '📄 Open Official Reports'
            : '📄 Ablihi ang Official Reports';
        if (!actions.some((a) => a.type === 'nav:reports')) {
          actions.push({ type: 'nav:reports', tab: 'reports', label, iconType: 'reports' });
        }
      } else if (tab === 'eartags') {
        const label =
          lang === 'tagalog'
            ? '🌾 Rice Farm Records Database'
            : lang === 'english'
            ? '🌾 Rice Farm Records Database'
            : '🌾 Ablihi ang Records Database';
        if (!actions.some((a) => a.type === 'nav:eartags')) {
          actions.push({ type: 'nav:eartags', tab: 'eartags', label, iconType: 'eartags' });
        }
      } else if (tab === 'dashboard' || tab === 'lft_dashboard') {
        const label =
          lang === 'tagalog' ? '📊 Buksan ang Dashboard' : lang === 'english' ? '📊 Executive Dashboard' : '📊 Ablihi ang Dashboard';
        if (!actions.some((a) => a.type === 'nav:dashboard')) {
          actions.push({ type: 'nav:dashboard', tab, label, iconType: 'dashboard' });
        }
      } else if (tab === 'accounts') {
        const label =
          lang === 'tagalog' ? '👥 LFT Field Accounts' : lang === 'english' ? '👥 LFT Field Accounts' : '👥 Ablihi ang LFT Accounts';
        if (!actions.some((a) => a.type === 'nav:accounts')) {
          actions.push({ type: 'nav:accounts', tab: 'accounts', label, iconType: 'accounts' });
        }
      } else if (tab === 'photos') {
        const label =
          lang === 'tagalog' ? '📸 Photo & Media Gallery' : lang === 'english' ? '📸 Photo & Media' : '📸 Ablihi ang Photo & Media';
        if (!actions.some((a) => a.type === 'nav:photos')) {
          actions.push({ type: 'nav:photos', tab: 'photos', label, iconType: 'photos' });
        }
      } else if (tab === 'settings') {
        const label =
          lang === 'tagalog' ? '⚙️ System Settings' : lang === 'english' ? '⚙️ System Settings' : '⚙️ Ablihi ang Settings';
        if (!actions.some((a) => a.type === 'nav:settings')) {
          actions.push({ type: 'nav:settings', tab: 'settings', label, iconType: 'settings' });
        }
      }
    } else if (mainType === 'map_barangay') {
      const brgy = subType || extra;
      const foundB = BARANGAYS.find((b) => b.name.toLowerCase() === brgy.toLowerCase())?.name || brgy;
      const label =
        lang === 'tagalog'
          ? `🗺️ I-filter sa Mapa: Brgy. ${foundB}`
          : lang === 'english'
          ? `🗺️ Filter Map: Brgy. ${foundB}`
          : `🗺️ Tan-awon sa Mapa: Brgy. ${foundB}`;
      if (!actions.some((a) => a.type === 'action:map_barangay' && a.barangay === foundB)) {
        actions.push({ type: 'action:map_barangay', barangay: foundB, label, iconType: 'map' });
      }
    } else if (mainType === 'report_barangay') {
      const brgy = subType || extra;
      const foundB = BARANGAYS.find((b) => b.name.toLowerCase() === brgy.toLowerCase())?.name || brgy;
      const label =
        lang === 'tagalog'
          ? `📄 I-filter ang Report: Brgy. ${foundB}`
          : lang === 'english'
          ? `📄 Filter Report: Brgy. ${foundB}`
          : `📄 I-filter ang Report: Brgy. ${foundB}`;
      if (!actions.some((a) => a.type === 'action:report_barangay' && a.barangay === foundB)) {
        actions.push({ type: 'action:report_barangay', barangay: foundB, label, iconType: 'reports' });
      }
    } else if (mainType === 'locate_parcel') {
      const target = (subType + (extra ? `:${extra}` : '')).trim().toLowerCase();
      const p = parcels.find(
        (x) =>
          x.tagNumber.toLowerCase() === target ||
          x.raiserName.toLowerCase().includes(target) ||
          `${x.farmerFamilyName || ''} ${x.farmerGivenName || ''}`.toLowerCase().includes(target) ||
          (x.farmerFamilyName && x.farmerFamilyName.toLowerCase().includes(target))
      );
      if (p && !actions.some((a) => a.type === 'action:locate_parcel' && a.parcel?.tagNumber === p.tagNumber)) {
        actions.push({
          type: 'action:locate_parcel',
          parcel: p,
          label: lang === 'english' ? '📍 Locate on Map' : '📍 I-locate sa Mapa',
          iconType: 'map'
        });
      }
    } else if (mainType === 'filter_records') {
      const target = (subType + (extra ? `:${extra}` : '')).trim();
      const p = parcels.find(
        (x) =>
          x.tagNumber.toLowerCase() === target.toLowerCase() ||
          x.raiserName.toLowerCase().includes(target.toLowerCase()) ||
          `${x.farmerFamilyName || ''} ${x.farmerGivenName || ''}`.toLowerCase().includes(target.toLowerCase()) ||
          (x.farmerFamilyName && x.farmerFamilyName.toLowerCase().includes(target.toLowerCase()))
      );
      const label =
        lang === 'english'
          ? `📋 Filter Records${target ? `: "${target}"` : ''}`
          : `📋 I-filter sa Records${target ? `: "${target}"` : ''}`;
      if (!actions.some((a) => a.type === 'action:filter_records' && a.searchTerm === target)) {
        actions.push({
          type: 'action:filter_records',
          parcel: p,
          searchTerm: target,
          label,
          iconType: 'eartags'
        });
      }
    } else if (mainType === 'view_record') {
      const target = (subType + (extra ? `:${extra}` : '')).trim().toLowerCase();
      const p = parcels.find(
        (x) => x.tagNumber.toLowerCase() === target || x.raiserName.toLowerCase().includes(target)
      );
      if (p && !actions.some((a) => a.type === 'action:view_record' && a.parcel?.tagNumber === p.tagNumber)) {
        actions.push({
          type: 'action:view_record',
          parcel: p,
          label: `📋 View Record (${p.tagNumber})`,
          iconType: 'eartags'
        });
      }
    }
  }

  const cleanText = rawText.replace(/\[ACTION:[a-zA-Z0-9_: -]+\]/gi, '').trim();
  return { cleanText, actions };
};

/**
 * Detects if user query is asking about completely out-of-scope external topics
 * (e.g., world politics, unrelated general programming, celebrity gossip, pop music, crypto, sports, astrology)
 */
export const isOutOfScopeQuery = (rawQuery: string): boolean => {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;

  const outOfScopeKeywords = [
    'celebrity', 'chismis', 'tsismis', 'gossip', 'showbiz', 'hollywood', 'entertainment',
    'president of the united states', 'donald trump', 'joe biden', 'vladimir putin', 'ukraine war', 'middle east', 'world politics', 'senate hearing',
    'bitcoin', 'crypto', 'ethereum', 'dogecoin', 'stock market', 'wall street', 'casino', 'gambling',
    'nba score', 'pba score', 'world cup', 'premier league', 'messi', 'ronaldo', 'lebron', 'dota', 'mlbb', 'mobile legends',
    'write a python script', 'write javascript code', 'react native tutorial', 'solve leetcode', 'quantum physics', 'java code', 'c++ code',
    'marites', 'kardashian', 'taylor swift', 'kpop', 'blackpink', 'bts', 'movie review', 'cinema',
    'horoscope', 'zodiac', 'astrology',
    'tokyo', 'new york', 'paris', 'london', 'los angeles', 'manila weather', 'cebu city traffic', 'davao city'
  ];

  return outOfScopeKeywords.some((keyword) => q.includes(keyword));
};

export const getOutOfScopeResponse = (
  politeName: string,
  lang: SupportedLanguage = 'bisaya'
): { text: string; actions: ChatAction[] } => {
  if (lang === 'tagalog') {
    return {
      text: `Pasensya na po, ${politeName || "Sir/Ma'am"}, ngunit ang aking tungkulin ay limitado lamang sa pagdumala at pag-alalay sa Silago Rice Farm Registry at GIS portal dito sa DA-MAO Silago. Ano po ang ating masusubaybayan tungkol sa ating mga magsasaka, palayan, o RSBSA records?`,
      actions: [
        { type: 'nav:map', tab: 'map', label: '🗺️ Buksan ang GIS Map', iconType: 'map' },
        { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
        { type: 'nav:reports', tab: 'reports', label: '📄 RSBSA Reports', iconType: 'reports' }
      ]
    };
  }
  if (lang === 'english') {
    return {
      text: `Pardon me, ${politeName || "Sir/Ma'am"}, but my duty is exclusively limited to managing and assisting with the Silago Rice Farm Registry and GIS portal here at DA-MAO Silago. What would you like to review regarding our Silago farmers, rice parcels, or RSBSA records?`,
      actions: [
        { type: 'nav:map', tab: 'map', label: '🗺️ Open GIS Map', iconType: 'map' },
        { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
        { type: 'nav:reports', tab: 'reports', label: '📄 RSBSA Reports', iconType: 'reports' }
      ]
    };
  }
  return {
    text: `Pasayloa ko, ${politeName || "Sir/Ma'am"}, apan ang akong katungdanan limitado lamang sa pagdumala ug pag-abag sa Silago Rice Farm Registry ug GIS portal dinhi sa DA-MAO Silago. Unsay atong masubay bahin sa atong mga mag-uuma, basakan, o RSBSA records?`,
    actions: [
      { type: 'nav:map', tab: 'map', label: '🗺️ Ablihi ang GIS Map', iconType: 'map' },
      { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
      { type: 'nav:reports', tab: 'reports', label: '📄 RSBSA Reports', iconType: 'reports' }
    ]
  };
};

/**
 * Checks if user explicitly commands the bot to switch or lock language
 */
export const detectExplicitLanguageSwitch = (
  raw: string
): { lang: SupportedLanguage; isOnlySwitch: boolean } | null => {
  const q = raw.toLowerCase().trim().replace(/[?!.,;:~]/g, '');
  if (!q) return null;

  // Single word checks
  if (['tagalog', 'filipino'].includes(q)) {
    return { lang: 'tagalog', isOnlySwitch: true };
  }
  if (['bisaya', 'binisaya', 'cebuano'].includes(q)) {
    return { lang: 'bisaya', isOnlySwitch: true };
  }
  if (['english'].includes(q)) {
    return { lang: 'english', isOnlySwitch: true };
  }

  // Tagalog explicit requests
  const tagalogPhrases = [
    'tagalog tayo',
    'mag tagalog ka',
    'mag-tagalog ka',
    'mag tagalog tayo',
    'mag-tagalog tayo',
    'mag tagalog',
    'mag-tagalog',
    'tagalog please',
    'tagalog po',
    'in tagalog',
    'tagalog naman',
    'tagalog lang',
    'tagalog nalang',
    'filipino tayo',
    'mag filipino',
    'in filipino',
    'ilisi ug tagalog',
    'ilis tagalog',
    'speak tagalog',
    'talk in tagalog',
    'gamit tagalog',
    'switch to tagalog',
    'change to tagalog',
    'set to tagalog',
    'tagalog mode'
  ];

  for (const p of tagalogPhrases) {
    if (q === p || q.includes(p)) {
      const stripped = q.replace(new RegExp(p, 'gi'), '').trim();
      return { lang: 'tagalog', isOnlySwitch: stripped.length === 0 };
    }
  }

  // Bisaya / Cebuano explicit requests
  const bisayaPhrases = [
    'bisaya please',
    'in bisaya',
    'binisaya please',
    'in binisaya',
    'ilisi ug binisaya',
    'ilisi ug bisaya',
    'ilis bisaya',
    'ilis binisaya',
    'pagbinisaya',
    'mag binisaya',
    'mag-binisaya',
    'bisaya tayo',
    'mag bisaya',
    'bisaya lang',
    'binisaya lang',
    'cebuano please',
    'in cebuano',
    'speak bisaya',
    'speak cebuano',
    'talk in bisaya',
    'switch to bisaya',
    'switch to cebuano',
    'change to bisaya',
    'set to bisaya',
    'bisaya mode'
  ];

  for (const p of bisayaPhrases) {
    if (q === p || q.includes(p)) {
      const stripped = q.replace(new RegExp(p, 'gi'), '').trim();
      return { lang: 'bisaya', isOnlySwitch: stripped.length === 0 };
    }
  }

  // English explicit requests
  const englishPhrases = [
    'speak english',
    'english please',
    'in english',
    'english only',
    'english tayo',
    'mag english',
    'mag-english',
    'talk in english',
    'switch to english',
    'change to english',
    'set to english',
    'ilisi ug english',
    'ilis english',
    'english mode'
  ];

  for (const p of englishPhrases) {
    if (q === p || q.includes(p)) {
      const stripped = q.replace(new RegExp(p, 'gi'), '').trim();
      return { lang: 'english', isOnlySwitch: stripped.length === 0 };
    }
  }

  return null;
};

/**
 * Detect language of a user sentence based on vocabulary and grammar particles
 */
export const detectLanguageFromText = (raw: string): SupportedLanguage | null => {
  const q = raw.toLowerCase().trim();
  if (!q) return null;

  // Check explicit switch first
  const explicit = detectExplicitLanguageSwitch(q);
  if (explicit) return explicit.lang;

  // Bisaya / Cebuano markers
  const bisayaMatches = q.match(/\b(ngano|nganong|unsa|unsay|kinsa|kinsay|pila|hain|diin|asa|basakan|kaayo|diay|bitaw|gyud|jud|kanimo|kaniya|atong|palihug|mabuhat|matabang|luna|humay|yuta|wa|naa|naay|adlaw|buntag|gabii|hapon|sapayan|daghang|karon|diri|dinhi|didto|tana|kamo|lahi|gani|nganong|ambot)\b/g);

  // Tagalog markers
  const tagalogMatches = q.match(/\b(bakit|bat|ano|anong|paano|sino|sinong|alin|saan|kailan|kelan|ganon|ganun|ganito|naman|kasi|natin|namin|meron|mayroon|walang|magkano|po|opo|ho|oho|dito|doon|diyan|umaga|gabi|maraming|ngayon|tayo|kayo|bakit ganon|bat ganon|ano ba|eh kasi|hala|pala|talaga)\b/g);

  // English markers
  const englishMatches = q.match(/\b(why|what|whats|how|who|where|when|which|is|are|the|this|that|these|those|please|can|could|would|should|have|has|registered|farmers|parcels|fields|statistics|status|summary|hello|good|morning|afternoon|evening|thank|thanks)\b/g);

  const bisayaCount = bisayaMatches ? bisayaMatches.length : 0;
  const tagalogCount = tagalogMatches ? tagalogMatches.length : 0;
  const englishCount = englishMatches ? englishMatches.length : 0;

  if (bisayaCount > tagalogCount && bisayaCount > englishCount) return 'bisaya';
  if (tagalogCount > bisayaCount && tagalogCount > englishCount) return 'tagalog';
  if (englishCount > bisayaCount && englishCount > tagalogCount) return 'english';

  return null;
};

/**
 * Detect casual follow-ups or confusion expressions like "bat ganon", "ngano man", "ha?", "why so?"
 */
export const isConfusionOrCasualFollowUp = (raw: string): boolean => {
  const q = raw.toLowerCase().trim().replace(/[?!.,;:~]/g, '');
  if (!q) return false;

  const confusionPhrases = [
    'ha',
    'ano',
    'unsa',
    'ngano',
    'bakit',
    'why',
    'why so',
    'bat ganon',
    'bakit ganon',
    'bakit ganun',
    'bat ganun',
    'ngano man',
    'ngano diay',
    'ngano bitaw',
    'unsa ba',
    'unsa man',
    'ano ba',
    'ano yun',
    'ano ba yan',
    'hala',
    'ay ganun',
    'ay ganon',
    'so what',
    'how come',
    'huh',
    'eh bakit',
    'eh ngano',
    'grabe naman',
    'totoo ba'
  ];

  if (confusionPhrases.includes(q)) return true;

  for (const cp of confusionPhrases) {
    if (q === cp || q.startsWith(`${cp} `) || q.endsWith(` ${cp}`)) {
      return true;
    }
  }

  return false;
};

export interface AgriGisChatbotProps {
  viewMode: 'landing' | 'portal';
  activeTab?: PortalTab;
  onNavigateTab?: (tab: PortalTab) => void;
  onOpenAddParcelModal?: () => void;
  onLocateParcelOnMap?: (parcel: FarmParcel) => void;
  onFilterRecords?: (term: string) => void;
  onViewParcelRecord?: (parcel: FarmParcel) => void;
  onFilterReportBarangay?: (barangay: string) => void;
  onFocusBarangayOnMap?: (barangayName: string) => void;
}

/**
 * Format farmer name in proper case (e.g., "Leopoldo Aling")
 */
export const formatFarmerDisplayName = (p: FarmParcel): string => {
  if (p.farmerGivenName && p.farmerFamilyName) {
    const toProper = (s: string) =>
      s
        .toLowerCase()
        .split(' ')
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
        .join(' ');
    const first = toProper(p.farmerGivenName);
    const last = toProper(p.farmerFamilyName);
    return `${first} ${last}`;
  }
  return p.raiserName;
};

/**
 * 1. Strict Conversational Greeting & Courtesy Detector
 * Ensures greetings like "hi", "hello", "hey", "kumusta", "maayong adlaw", "good morning", "yo"
 * NEVER trigger a database search or render record cards.
 */
export const isGreetingOrCourtesy = (rawQuery: string): boolean => {
  const q = rawQuery.trim().toLowerCase().replace(/[?!.,;:~]/g, '');
  if (!q) return true;

  const tokens = q.split(/\s+/).filter(Boolean);

  const singleWordGreetings = new Set([
    'hi', 'hello', 'hey', 'heya', 'yo', 'hoy', 'oy', 'uy',
    'kumusta', 'kamusta', 'musta', 'komusta',
    'mabuhay', 'greetings', 'morning', 'afternoon', 'evening',
    'salamat', 'thanks', 'thank', 'thx', 'ok', 'okay', 'k',
    'sige', 'alright', 'copy', 'roger'
  ]);

  if (tokens.length === 1 && singleWordGreetings.has(tokens[0])) {
    return true;
  }

  const greetingPhrases = [
    'hi',
    'hello',
    'hey',
    'yo',
    'kumusta',
    'kamusta',
    'musta',
    'kumusta ka',
    'kamusta ka',
    'kumusta kamo',
    'kamusta kayo',
    'maayong adlaw',
    'maayong buntag',
    'maayong hapon',
    'maayong gabii',
    'maayong gabi',
    'good morning',
    'good afternoon',
    'good evening',
    'good day',
    'magandang araw',
    'magandang umaga',
    'magandang hapon',
    'magandang gabi',
    'daghang salamat',
    'maraming salamat',
    'thank you',
    'thanks a lot',
    'hello ricesistant',
    'hi ricesistant',
    'kumusta ricesistant',
    'good morning ricesistant',
    'maayong adlaw ricesistant',
    'maayong buntag ricesistant'
  ];

  if (greetingPhrases.includes(q)) return true;

  for (const gp of greetingPhrases) {
    if (
      q === gp ||
      q === `${gp} po` ||
      q === `${gp} ricesistant` ||
      q === `${gp} assistant` ||
      q === `${gp} ka-agri`
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Format polite dynamic greeting honorific and name for current authenticated user
 */
export const formatPoliteGreetingName = (fullName?: string, role?: string): string => {
  if (!fullName || !fullName.trim()) {
    if (role === 'Central Admin') return 'Sir/Ma\'am Admin';
    if (role?.includes('LFT') || role === 'Barangay Focal Person') return 'Ka-Agri Field Officer';
    return 'Ka-Agri';
  }
  const clean = fullName.trim();
  if (/^(sir|ma'am|mam|mr\.|ms\.|mrs\.)/i.test(clean)) {
    return clean;
  }
  const first = clean.split(' ')[0];
  const isLikelyFemale = /^(wella|maria|elena|mary|ana|jane|rose|joy|grace|cristina|marites)/i.test(first);
  const honorific = isLikelyFemale ? "Ma'am" : "Sir";
  return `${honorific} ${clean}`;
};

/**
 * Natural friendly response for greetings and courtesies dynamically addressing the user
 */
export const getGreetingResponse = (
  rawQuery: string,
  politeName?: string,
  lang: SupportedLanguage = 'bisaya'
): string => {
  const q = rawQuery.trim().toLowerCase();
  const nameSuffix = politeName ? `, ${politeName}` : '';

  if (lang === 'tagalog') {
    if (q.includes('salamat') || q.includes('thank')) {
      return `Walang anuman${nameSuffix}! Katuwang mo ako rito sa DA-MAO Silago. Kung kailangan mo ng tulong sa pagrehistro, pag-kalkula ng ektarya, o pag-check ng RSBSA, sabihan mo lang ako kaagad!`;
    }
    if (q.includes('umaga') || q.includes('morning')) {
      return `Magandang umaga${nameSuffix}! Ako ang iyong kasamahan at kaagapay na si **RiceSsistant** sa DA-MAO Silago. Handa akong tumulong sa iyong mga agricultural records at GIS mapping ngayon. Ano ang ating unahing gawin?`;
    }
    if (q.includes('hapon') || q.includes('afternoon')) {
      return `Magandang hapon${nameSuffix}! Si **RiceSsistant** ito, ang iyong kaagapay sa DA-MAO. Handa akong tumulong sa pag-check ng mga basakan, RSBSA, o pag-generate ng report. May kailangan ka bang ipahanap ngayon?`;
    }
    if (q.includes('gabi') || q.includes('evening')) {
      return `Magandang gabi${nameSuffix}! RiceSsistant dito, ang iyong masipag na katuwang sa DA-MAO Silago. Paano kita matutulungan sa ating mga talaan ng basakan ngayon?`;
    }
    return `Kumusta${nameSuffix}! Ako si **RiceSsistant**, ang iyong masipag na katuwang sa DA-MAO Silago. Handa akong maglista, maghanap ng magsasaka, o magkalkula ng ektarya para sa iyo. Ano ang maitutulong ko ngayon?`;
  }

  if (lang === 'english') {
    if (q.includes('salamat') || q.includes('thank')) {
      return `You're very welcome${nameSuffix}! I'm always here as your active DA-MAO co-worker. Let me know whenever you need help registering parcels, checking RSBSA compliance, or filtering maps!`;
    }
    if (q.includes('morning')) {
      return `Good morning${nameSuffix}! I'm **RiceSsistant**, your proactive co-worker at DA-MAO Silago. I'm ready to help with parcel registrations, RSBSA lookups, and GIS mapping today. What task shall we tackle first?`;
    }
    if (q.includes('afternoon')) {
      return `Good afternoon${nameSuffix}! **RiceSsistant** here, ready to assist you at the Municipal Agriculture Office. How can I help with our rice records, reports, or mapping today?`;
    }
    if (q.includes('evening')) {
      return `Good evening${nameSuffix}! I'm **RiceSsistant**, your dedicated co-worker. How can I assist you with our Silago rice database tonight?`;
    }
    return `Hello${nameSuffix}! I am **RiceSsistant**, your hands-on co-worker at DA-MAO Silago. Whether you need to register a farm, search an RSBSA stub, or compute barangay hectarage, I'm right here to help!`;
  }

  // Bisaya / Cebuano default
  if (q.includes('salamat') || q.includes('thank')) {
    return `Walay sapayan${nameSuffix}! Kaabag ug kauban nimo ko dinhi sa DA-MAO Silago. Kon aduna kay kinahanglan ipangita nga RSBSA, mag-lista og bag-ong mag-uuma, o mag-kalkula sa ektarya, ingna dayon ko!`;
  }

  if (q.includes('buntag') || q.includes('morning')) {
    return `Maayong buntag${nameSuffix}! Ako si **RiceSsistant**, imong abtik ug kasaligang kaabag dinhi sa DA-MAO Silago. Andam ko motabang sa imong mga buluhaton karon—mag-rehistro og basakan, mangita og mag-uuma, o mag-andam og report. Unsa may atong unahon karon?`;
  }

  if (q.includes('hapon') || q.includes('afternoon')) {
    return `Maayong hapon${nameSuffix}! Si **RiceSsistant** ni, imong kaabag sa buhatan. Andam ko moabag sa pagsubay sa mga luna, RSBSA status, o pag-filter sa GIS mapa. Naa ba koy matabang nimo karon?`;
  }

  if (q.includes('gabii') || q.includes('gabi') || q.includes('evening')) {
    return `Maayong gabii${nameSuffix}! RiceSsistant ni, imong kasaligang kauban sa DA-MAO Silago. Unsa may akong ikaabag sa atong mga talaan sa basakan karon?`;
  }

  return `Maayong adlaw, ${politeName || 'Ka-Agri'}! Ako si **RiceSsistant**, imong abtik nga kaabag sa DA-MAO Silago. Andam ko motabang nimo sa pag-rehistro og mag-uuma, pagsubay sa RSBSA, o pag-kalkula sa ektarya sa basakan. Unsa may atong trabahuon karon?`;
};

export interface DynamicUserContext {
  name: string;
  role: string;
  title: string;
  scope: string;
  office: string;
}

/**
 * Detects if user is asking about their own identity, name, role, or credentials
 * (e.g. "Kinsa ko?", "Who am I?", "What is my role?", "Kinsa akong ngalan?")
 */
export const isUserIdentityQuery = (rawQuery: string): boolean => {
  const q = rawQuery.trim().toLowerCase().replace(/[?!.,;:~]/g, '');

  if (
    q.includes('who am i') ||
    q.includes('what is my name') ||
    q.includes('whats my name') ||
    q.includes('what is my role') ||
    q.includes('whats my role') ||
    q.includes('what is my designation') ||
    q.includes('what is my title') ||
    q.includes('who is logged in') ||
    q.includes('who is currently logged in') ||
    q.includes('who am i logged in as') ||
    q.includes('where am i from') ||
    q.includes('where am i based') ||
    q.includes('where am i located') ||
    q.includes('where am i') ||
    q.includes('where do i work') ||
    q.includes('my identity') ||
    q.includes('my profile') ||
    q.includes('kinsa ko') ||
    q.includes('kinsa ba ko') ||
    q.includes('kinsa man ko') ||
    q.includes('kinsa diay ko') ||
    q.includes('kinsa akong ngalan') ||
    q.includes('unsay akong ngalan') ||
    q.includes('unsa akong ngalan') ||
    q.includes('kinsa akong pangalan') ||
    q.includes('unsay akong pangalan') ||
    q.includes('unsa akong pangalan') ||
    q.includes('unsay akong role') ||
    q.includes('unsa akong role') ||
    q.includes('unsay akong posisyon') ||
    q.includes('unsa akong posisyon') ||
    q.includes('unsay akong katungdanan') ||
    q.includes('unsa akong katungdanan') ||
    q.includes('taga asa ko') ||
    q.includes('taga-asa ko') ||
    q.includes('taga asa man ko') ||
    q.includes('taga asa diay ko') ||
    q.includes('asa ko gikan') ||
    q.includes('asa ko nagpuyo') ||
    q.includes('asa ko nagtrabaho') ||
    q.includes('asa ko dapit') ||
    q.includes('asa ko') ||
    q.includes('taga diin ko') ||
    q.includes('taga-diin ko') ||
    q.includes('diin ko gikan') ||
    q.includes('kinsay naka login') ||
    q.includes('kinsa naka login') ||
    q.includes('kinsay naka log in') ||
    q.includes('kinsa naka log in') ||
    q.includes('kinsay naka-login') ||
    q.includes('kinsay naka sign in') ||
    q.includes('kinsa naka sign in') ||
    q.includes('kinsay naka-sign in') ||
    q.includes('sino ako') ||
    q.includes('sino ba ako') ||
    q.includes('taga saan ako') ||
    q.includes('taga-saan ako') ||
    q.includes('saan ako galing') ||
    q.includes('saan ako nagtatrabaho') ||
    q.includes('saan ako') ||
    q.includes('ano ang pangalan ko') ||
    q.includes('anong pangalan ko') ||
    q.includes('ano ang role ko') ||
    q.includes('anong role ko')
  ) {
    return true;
  }

  return false;
};

/**
 * Builds dynamic context-aware response for user identity inquiries
 */
export const getUserIdentityResponse = (
  rawQuery: string,
  user: DynamicUserContext,
  lang: SupportedLanguage = 'bisaya'
): string => {
  const q = rawQuery.trim().toLowerCase().replace(/[?!.,;:~]/g, '');
  const isLocationOriginQuery =
    q.includes('taga asa') ||
    q.includes('taga-asa') ||
    q.includes('taga diin') ||
    q.includes('taga-diin') ||
    q.includes('diin ko') ||
    q.includes('asa ko') ||
    q.includes('taga saan') ||
    q.includes('taga-saan') ||
    q.includes('saan ako') ||
    q.includes('where am i');

  const roleTitle =
    user.role === 'Central Admin'
      ? 'Municipal Agriculture Administrator'
      : (user.title || user.role || 'Municipal Agriculture Officer');

  if (isLocationOriginQuery) {
    if (lang === 'tagalog') {
      return `Base sa ating sistema, naka-login ka ngayon bilang **${roleTitle}** sa DA-MAO Silago, Southern Leyte! Narito ka sa ating tanggapan sa Silago na namamahala sa 15 na mga barangay.`;
    }
    if (lang === 'english') {
      return `Based on our system, you are currently logged in as the **${roleTitle}** at DA-MAO Silago, Southern Leyte! You are based in our Silago office overseeing the 15 agricultural barangays.`;
    }
    return `Base sa atong sistema, naka-login ka karon isip **${roleTitle}** sa DA-MAO Silago, Southern Leyte! Naa ka sa atong buhatan dinhi sa Silago nga nagdumala sa 15 ka mga barangay.`;
  }

  if (lang === 'tagalog') {
    return `Ikaw si **${user.name}**, kasalukuyang naka-log in bilang **${user.role}**.\n\n> 👤 **Pangalan:** **${user.name}**\n> 🛡️ **Role:** **${user.role}**\n> 📋 **Designasyon / Titulo:** ${user.title}\n> 📍 **Nasasakupan:** ${user.scope}\n> 🏢 **Tanggapan:** ${user.office}\n\nMay maitutulong ba ako sa iyong mga gawain ngayon, ${user.name}?`;
  }

  if (lang === 'english') {
    return `You are currently authenticated as **${user.name}**, holding the role of **${user.role}**.\n\n> 👤 **Name:** **${user.name}**\n> 🛡️ **Role:** **${user.role}**\n> 📋 **Designation / Title:** ${user.title}\n> 📍 **Jurisdictional Scope:** ${user.scope}\n> 🏢 **Station / Office:** ${user.office}\n\nHow may I assist you with your agricultural records or GIS mapping today, ${user.name}?`;
  }

  return `Ikaw si **${user.name}**, kasamtangang nag-access sa sistema isip **${user.role}**.\n\n> 👤 **Ngalan:** **${user.name}**\n> 🛡️ **Role:** **${user.role}**\n> 📋 **Designation / Titulo:** ${user.title}\n> 📍 **Sakop / Hurisdiksyon:** ${user.scope}\n> 🏢 **Opisina:** ${user.office}\n\nUnsa may akong ikaabag sa imong mga buluhaton karon, ${user.name}?`;
};

/**
 * Common stopwords and dictionary words that must NEVER be treated as raw farmer name searches
 */
const SEARCH_STOPWORDS = new Set([
  'hi', 'hello', 'hey', 'yo', 'hoy', 'kumusta', 'kamusta', 'musta',
  'what', 'how', 'who', 'why', 'when', 'where', 'which',
  'unsa', 'pila', 'ngano', 'diin', 'kanus-a', 'hain', 'kinsa',
  'ano', 'sino', 'paano', 'bakit', 'kailan', 'saan', 'alin',
  'bat', 'ganon', 'ganun', 'ganito', 'naman', 'kasi', 'eh', 'ha',
  'natin', 'namin', 'tayo', 'kayo', 'sila', 'po', 'opo', 'ho', 'oho',
  'hala', 'meron', 'mayroon', 'walang', 'wala', 'ba', 'man', 'diay',
  'help', 'tabang', 'tulong', 'guide', 'info', 'information',
  'rice', 'farm', 'farmer', 'farmers', 'parcel', 'parcels', 'field', 'fields',
  'humay', 'palay', 'basakan', 'luna', 'tanom', 'pananom',
  'map', 'maps', 'mapa', 'gis', 'gps', 'polygon', 'boundary',
  'system', 'record', 'records', 'data', 'registry', 'masterlist', 'report', 'reports',
  'silago', 'barangay', 'brgy', 'purok',
  'test', 'testing', 'yes', 'no', 'okay', 'ok', 'sige', 'alright',
  'please', 'palihug', 'paki', 'can', 'could', 'you', 'pwede', 'mahimo',
  'morning', 'afternoon', 'evening', 'night', 'day', 'adlaw', 'buntag', 'hapon', 'gabii',
  'salamat', 'thanks', 'thank',
  'me', 'my', 'ako', 'akong', 'ikaw', 'imong', 'kita', 'atong', 'kami', 'amo',
  'is', 'are', 'am', 'was', 'were', 'the', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of',
  'sa', 'ug', 'nga', 'ang', 'og', 'ni', 'kay', 'kini', 'kana', 'adto',
  'ng', 'mga', 'na', 'si', 'ay', 'ito', 'iyan', 'doon', 'dito',
  'show', 'list', 'tell', 'explain', 'pakita', 'ipakita', 'ihayag',
  'ricesistant', 'assistant', 'bot', 'ai'
]);

/**
 * 2. Search intent detector for farmer / RSBSA / parcel lookups
 * Only triggers if user explicitly asks to search or find a farmer/record
 */
interface SearchIntentResult {
  isSearch: boolean;
  term: string;
}

export const extractSearchIntent = (rawQuery: string): SearchIntentResult => {
  const q = rawQuery.trim().toLowerCase();

  // If it's a greeting, it is NEVER a search intent
  if (isGreetingOrCourtesy(rawQuery)) {
    return { isSearch: false, term: '' };
  }

  // If it's casual confusion or follow-up expression, it is NEVER a search intent
  if (isConfusionOrCasualFollowUp(rawQuery)) {
    return { isSearch: false, term: '' };
  }

  // If it's an explicit language switch command, it is NEVER a search intent
  if (detectExplicitLanguageSwitch(rawQuery)) {
    return { isSearch: false, term: '' };
  }

  // If it's a user identity inquiry ("Kinsa ko?", "Who am I?"), it is NEVER a search intent
  if (isUserIdentityQuery(rawQuery)) {
    return { isSearch: false, term: '' };
  }

  // If it's a bot identity or capability question, it is NEVER a search intent
  if (
    q.includes('who are you') ||
    q.includes('kinsa ka') ||
    q.includes('sino ka') ||
    q.includes('ano ka') ||
    q.includes('unsa ka') ||
    q.includes('what can you do') ||
    q.includes('ano magagawa mo') ||
    q.includes('unsa imong mabuhat') ||
    q.includes('unsa imong matabang') ||
    q.includes('unsa may imong matabang') ||
    q === 'help' ||
    q === 'tabang' ||
    q === 'tulong'
  ) {
    return { isSearch: false, term: '' };
  }

  const searchPrefixes = [
    'kinsay tag-iya ani ni',
    'kinsay tag-iya ani nga',
    'kinsay tag-iya ani',
    'kinsay tag-iya sa',
    'kinsay tag-iya',
    'kinsa ang tag-iya sa',
    'kinsa ang tag-iya',
    'kinsa tag-iya',
    'kinsa si',
    'tag-iya ani',
    'tag-iya sa',
    'tag-iya',
    'pangitaa si',
    'pangitaa ang',
    'pangitaa',
    'pangita si',
    'pangita',
    'who is the owner of',
    'who is the owner',
    'who owns this',
    'who owns',
    'who is farmer',
    'who is',
    'find farmer',
    'find parcel',
    'find record',
    'find rsbsa',
    'find',
    'search for farmer',
    'search for',
    'search farmer',
    'search parcel',
    'search record',
    'search rsbsa',
    'search',
    'lookup farmer',
    'lookup parcel',
    'lookup rsbsa',
    'lookup',
    'look up',
    'locate farmer',
    'locate parcel',
    'check farmer',
    'check rsbsa'
  ];

  for (const prefix of searchPrefixes) {
    if (q === prefix) {
      return { isSearch: true, term: '' };
    }
    if (q.startsWith(prefix + ' ')) {
      const rest = q.slice(prefix.length).replace(/^[?:!.,\s]+|[?:!.,\s]+$/g, '').trim();
      if (rest && !['ricesistant', 'assistant', 'bot', 'ai'].includes(rest)) {
        return { isSearch: true, term: rest };
      }
    }
  }

  return { isSearch: false, term: '' };
};

/**
 * Validates if a raw input is a legitimate candidate farmer name or RSBSA code
 * (Prevents random conversational words from triggering direct search)
 */
export const isCandidateFarmerName = (query: string): boolean => {
  const q = query.trim().toLowerCase().replace(/[?!.,;:~]/g, '');
  if (!q || q.length < 3) return false;

  // Identity inquiries and confusion phrases are conversational queries, not candidate farmer names
  if (isUserIdentityQuery(query)) return false;
  if (isConfusionOrCasualFollowUp(query)) return false;
  if (detectExplicitLanguageSwitch(query)) return false;

  // Question sentences are conversational queries, not raw names
  if (/[?]/.test(query)) return false;

  const tokens = q.split(/\s+/).filter(Boolean);
  if (tokens.length > 3) return false;

  // If any token is in stopwords, do not treat as raw farmer search
  for (const token of tokens) {
    if (SEARCH_STOPWORDS.has(token)) return false;
  }

  return true;
};

/**
 * Live search against FarmParcel registry
 * Searches ONLY identifying fields (Name, RSBSA, Tag Number) to prevent false substring matches
 */
export const searchParcelsDatabase = (rawTerm: string, allParcels: FarmParcel[]): FarmParcel[] => {
  const cleanTerm = rawTerm
    .toLowerCase()
    .replace(/[?:!.,;]/g, '')
    .trim();
  if (!cleanTerm || cleanTerm.length < 3) return [];

  if (SEARCH_STOPWORDS.has(cleanTerm)) return [];

  const tokens = cleanTerm.split(/\s+/).filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];

  return allParcels.filter((parcel) => {
    // Only search identifying fields (NOT generic address or commodity "RICE")
    const identifyingFields = [
      parcel.raiserName,
      parcel.farmerFamilyName,
      parcel.farmerGivenName,
      parcel.farmerMiddleName,
      parcel.swineNameOrId,
      parcel.tagNumber
    ]
      .filter(Boolean)
      .map((f) => (f as string).toLowerCase());

    const combinedIdentifying = identifyingFields.join(' ');

    if (combinedIdentifying.includes(cleanTerm)) {
      return true;
    }

    return tokens.every((token) => combinedIdentifying.includes(token));
  });
};

export const IDLE_ATTENTION_GREETINGS = [
  "👋 Hello! Naa ra ko diri kon magpatabang ka sa GIS o RSBSA.",
  "Sir, naa ra ko diri kon magpatabang ka! 👋",
  "Need help sa GIS map o RSBSA records? Pindota ko! 🌾",
  "Maayong adlaw! Pwede ko nimo pangutan-on bahin sa mga mag-uuma sa Silago. ✨",
  "Nagkinahanglan ka og tabang sa RSBSA o GIS parcel lookup? I-click ko! 🗺️"
];

export const AgriGisChatbot: React.FC<AgriGisChatbotProps> = ({
  viewMode,
  activeTab,
  onNavigateTab,
  onOpenAddParcelModal,
  onLocateParcelOnMap,
  onFilterRecords,
  onViewParcelRecord,
  onFilterReportBarangay,
  onFocusBarangayOnMap
}) => {
  const { currentUser, adminProfile, parcels, lftAccounts, officeContactInfo } = useApp();

  // 1. DYNAMIC SESSION EXTRACTION (Active authentication state from context)
  const activeUser = currentUser;

  // 2. FALLBACK HANDLING (Respectful dynamic title based on role, never hardcoding any individual person)
  const getUserFallbackName = (role?: string): string => {
    if (role === 'Central Admin') return 'Admin';
    if (role === 'Barangay Focal Person' || role?.includes('LFT')) return 'Field Officer / Ka-Agri';
    return 'Ka-Agri / Staff';
  };

  const dynamicUserName =
    activeUser?.name?.trim() ||
    (activeUser?.role === 'Central Admin' && adminProfile?.name?.trim() ? adminProfile.name.trim() : '') ||
    getUserFallbackName(activeUser?.role);

  const dynamicUserRole = activeUser?.role || 'Staff';

  const dynamicUserTitle =
    activeUser?.title?.trim() ||
    (activeUser?.role === 'Central Admin'
      ? (adminProfile?.title?.trim() || 'Municipal Administrator / Program Coordinator')
      : 'LFT Agricultural Technician');

  const dynamicUserScope =
    activeUser?.assignedBarangays && activeUser.assignedBarangays.length > 0
      ? activeUser.assignedBarangays.map((b: string) => `Brgy. ${b}`).join(', ')
      : (activeUser?.barangay
          ? `Brgy. ${activeUser.barangay}`
          : (activeUser?.role === 'Central Admin'
              ? 'Municipality of Silago (All 15 Barangays & Agricultural Sectors)'
              : 'Silago Rice Sector'));

  const dynamicUserOffice =
    activeUser?.office?.trim() ||
    (activeUser?.role === 'Central Admin'
      ? (adminProfile?.office?.trim() || 'Silago Municipal Agriculture Office (DA-MAO)')
      : 'Municipal Agriculture Office - LFT Field Unit');

  const dynamicUserObj: DynamicUserContext = {
    name: dynamicUserName,
    role: dynamicUserRole,
    title: dynamicUserTitle,
    scope: dynamicUserScope,
    office: dynamicUserOffice
  };

  // Unique session identifier for data isolation across different users
  const userUniqueId = activeUser
    ? `${activeUser.role}__${activeUser.username || activeUser.name || 'default'}`
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
    : null;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastNavNotice, setLastNavNotice] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [lastMatchedParcels, setLastMatchedParcels] = useState<FarmParcel[]>([]);

  // Conversational language state
  const [activeLanguage, setActiveLanguage] = useState<SupportedLanguage>('bisaya');
  const [isLanguageLocked, setIsLanguageLocked] = useState<boolean>(false);

  // Idle Attention-Seeking State (Magpapansin Effect)
  const [isIdleBubbleVisible, setIsIdleBubbleVisible] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isLauncherJiggling, setIsLauncherJiggling] = useState(false);
  const [idleGreetingIndex, setIdleGreetingIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const currentUserSessionIdRef = useRef<string | null>(null);

  // Role check
  const isCentralAdmin = activeUser?.role === 'Central Admin';
  const isLftUser =
    activeUser?.role === 'Barangay Focal Person' ||
    (activeUser && !isCentralAdmin);

  const isAuthorizedStaff =
    !!activeUser &&
    (isCentralAdmin ||
      isLftUser ||
      activeUser.role?.includes('LFT') ||
      activeUser.title?.includes('LFT'));

  const getFreshWelcomeMessage = (lang: SupportedLanguage = activeLanguage): ChatMessage => {
    const politeName = formatPoliteGreetingName(
      dynamicUserObj?.name?.trim() || activeUser?.name?.trim() || currentUser?.name?.trim() || adminProfile?.name?.trim(),
      dynamicUserObj?.role || activeUser?.role || currentUser?.role
    );

    let welcomeText = '';
    let actions: ChatAction[] = [];

    if (lang === 'tagalog') {
      welcomeText = `Magandang araw, ${politeName}! Ako si **RiceSsistant**, ang iyong digital partner at katuwang dito sa Silago Rice Registry & GIS portal (DA-MAO Silago). Ano ang ating aasikasuhin ngayon sa ating mga palayan, mapa, o talaan ng mga magsasaka?`;
      actions = [
        { type: 'nav:map', tab: 'map', label: '🗺️ Buksan ang GIS Map', iconType: 'map' },
        { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
        { type: 'action:add_parcel', label: '➕ Magrehistro ng Palayan', iconType: 'add_parcel' }
      ];
    } else if (lang === 'english') {
      welcomeText = `Good day, ${politeName}! I'm **RiceSsistant**, your digital co-worker and partner here at the Silago Rice Registry & GIS portal (DA-MAO Silago). What shall we explore today across our rice fields, GIS map, or farmer database?`;
      actions = [
        { type: 'nav:map', tab: 'map', label: '🗺️ Open GIS Map', iconType: 'map' },
        { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
        { type: 'action:add_parcel', label: '➕ Enroll New Farm', iconType: 'add_parcel' }
      ];
    } else {
      welcomeText = `Maayong adlaw, ${politeName}! Ako si **RiceSsistant**, imong digital partner ug kaabag dinhi sa Silago Rice Registry & GIS portal (DA-MAO Silago). Unsay atong atimanon karon sa atong mga basakan, mapa, o talaan sa mga mag-uuma?`;
      actions = [
        { type: 'nav:map', tab: 'map', label: '🗺️ Ablihi ang GIS Map', iconType: 'map' },
        { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
        { type: 'action:add_parcel', label: '➕ Mag-rehistro og Basakan', iconType: 'add_parcel' }
      ];
    }

    return {
      id: `initial-welcome-${Date.now()}`,
      sender: 'assistant',
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions
    };
  };

  // Strict session lifecycle: reset messages cleanly on logout, teardown, or account switch
  useEffect(() => {
    // 1. Teardown if user logs out, switches to landing page, or loses authorized staff access
    if (viewMode !== 'portal' || !isAuthorizedStaff || !userUniqueId) {
      setMessages([]);
      setIsOpen(false);
      setIsMinimized(false);
      setInputMessage('');
      setStreamingText(null);
      setIsLoading(false);
      setLastMatchedParcels([]);
      setLastNavNotice(null);
      currentUserSessionIdRef.current = null;
      return;
    }

    // 2. Fresh session initialization on mount or user account switch
    if (currentUserSessionIdRef.current !== userUniqueId) {
      currentUserSessionIdRef.current = userUniqueId;
      setMessages([getFreshWelcomeMessage()]);
      setInputMessage('');
      setStreamingText(null);
      setIsLoading(false);
      setLastMatchedParcels([]);
      setLastNavNotice(null);
    }
  }, [viewMode, isAuthorizedStaff, userUniqueId]);

  // Scroll to bottom whenever messages or streaming updates
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText, isOpen, isMinimized, isLoading]);

  // Sleek Idle Attention Capsule (Magpapansin Effect) Timer Lifecycle
  useEffect(() => {
    // If chat is open or not in portal mode or not authorized, clear idle prompts
    if (isOpen || viewMode !== 'portal' || !isAuthorizedStaff) {
      setIsIdleBubbleVisible(false);
      setIsFadingOut(false);
      setIsLauncherJiggling(false);
      return;
    }

    let hideTimer: NodeJS.Timeout | null = null;
    let fadeOutTimer: NodeJS.Timeout | null = null;
    let repeatInterval: NodeJS.Timeout | null = null;

    const triggerAttentionPrompt = () => {
      setIsFadingOut(false);
      setIsIdleBubbleVisible(true);
      setIsLauncherJiggling(true);
      setIdleGreetingIndex((prev) => (prev + 1) % IDLE_ATTENTION_GREETINGS.length);

      // Visible for 7 seconds, then initiate smooth fade out
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      fadeOutTimer = setTimeout(() => {
        setIsFadingOut(true);
        // Complete unmount after 500ms fade out animation
        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
          setIsIdleBubbleVisible(false);
          setIsFadingOut(false);
          setIsLauncherJiggling(false);
        }, 500);
      }, 7000);
    };

    // Show attention bubble after 10 seconds of idle closed state
    const initialTimer = setTimeout(() => {
      triggerAttentionPrompt();

      // Periodically re-trigger softly every 40 seconds of continuous idle time
      repeatInterval = setInterval(() => {
        triggerAttentionPrompt();
      }, 40000);
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
      if (fadeOutTimer) clearTimeout(fadeOutTimer);
      if (hideTimer) clearTimeout(hideTimer);
      if (repeatInterval) clearInterval(repeatInterval);
    };
  }, [isOpen, viewMode, isAuthorizedStaff]);

  // If on public landing page or user is not logged in / not authorized staff, do not render
  if (viewMode !== 'portal' || !isAuthorizedStaff || !currentUser) {
    return null;
  }

  // Helper to render action icon
  const renderActionIcon = (iconType: ChatAction['iconType']) => {
    switch (iconType) {
      case 'map':
        return <Compass className="w-3.5 h-3.5 text-emerald-600" />;
      case 'reports':
      case 'print':
        return <FileText className="w-3.5 h-3.5 text-blue-600" />;
      case 'eartags':
        return <Wheat className="w-3.5 h-3.5 text-amber-600" />;
      case 'add_parcel':
        return <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'dashboard':
        return <LayoutDashboard className="w-3.5 h-3.5 text-teal-600" />;
      case 'accounts':
        return <Users className="w-3.5 h-3.5 text-purple-600" />;
      case 'photos':
        return <ImageIcon className="w-3.5 h-3.5 text-rose-600" />;
      case 'settings':
        return <Settings className="w-3.5 h-3.5 text-slate-600" />;
      default:
        return <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  // Copy answer to clipboard
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 2000);
  };

  // Execute Navigation or Deep Link Action Trigger
  const handleExecuteAction = (action: ChatAction) => {
    if (action.type === 'action:add_parcel') {
      onOpenAddParcelModal?.();
      setLastNavNotice('Opened Registration Form');
    } else if (action.type === 'action:locate_parcel' && action.parcel) {
      handleLocateParcel(action.parcel);
    } else if (action.type === 'action:filter_records') {
      const term = action.searchTerm || action.parcel?.raiserName || action.parcel?.swineNameOrId || '';
      if (onFilterRecords) {
        onFilterRecords(term);
      } else {
        onNavigateTab?.('eartags');
      }
      setLastNavNotice(`Filtered Rice Farm Records for "${term}"`);
    } else if (action.type === 'action:view_record' && action.parcel) {
      handleViewParcelProfile(action.parcel);
    } else if (action.type === 'action:report_barangay') {
      if (action.barangay && onFilterReportBarangay) {
        onFilterReportBarangay(action.barangay);
      }
      onNavigateTab?.('reports');
      setLastNavNotice(`Filtered Official Reports for Brgy. ${action.barangay || 'Selected'}`);
    } else if (action.type === 'action:map_barangay') {
      if (action.barangay && onFocusBarangayOnMap) {
        onFocusBarangayOnMap(action.barangay);
      } else {
        onNavigateTab?.('map');
      }
      setLastNavNotice(`Centered GIS Map on Brgy. ${action.barangay || 'Selected'}`);
    } else if (action.tab) {
      onNavigateTab?.(action.tab);
      const tabNames: Record<PortalTab, string> = {
        dashboard: 'Executive Dashboard',
        lft_dashboard: 'LFT Field Dashboard',
        brgy_dashboard: 'Barangay Overview',
        map: 'GIS Rice Map & Polygons',
        eartags: 'Rice Farm Records',
        reports: 'Print Official Reports & Masterlist',
        accounts: 'LFT Field Accounts',
        photos: 'Photo & Media Gallery',
        settings: 'System Settings'
      };
      setLastNavNotice(`Switched to ${tabNames[action.tab] || action.tab}`);
    }

    setTimeout(() => {
      setLastNavNotice(null);
    }, 3000);
  };

  // Locate parcel on GIS map
  const handleLocateParcel = (parcel: FarmParcel) => {
    if (onLocateParcelOnMap) {
      onLocateParcelOnMap(parcel);
    } else if (onNavigateTab) {
      onNavigateTab('map');
    }
    setLastNavNotice(`Locating ${formatFarmerDisplayName(parcel)} in Brgy. ${parcel.barangay} on GIS Map...`);
    setTimeout(() => setLastNavNotice(null), 3500);
  };

  // Open full farmer record profile modal
  const handleViewParcelProfile = (parcel: FarmParcel) => {
    if (onViewParcelRecord) {
      onViewParcelRecord(parcel);
    }
    setLastNavNotice(`Opened record for ${formatFarmerDisplayName(parcel)}`);
    setTimeout(() => setLastNavNotice(null), 3500);
  };

  // Detect explicit direct navigation commands (e.g. "Go to Reports", "Open Map", "Add Farmer", "Mag-rehistro ko")
  const detectDirectCommand = (
    query: string,
    lang: SupportedLanguage = activeLanguage
  ): {
    action: ChatAction;
    confirmationText: string;
  } | null => {
    const q = query.toLowerCase().trim();
    const politeName = formatPoliteGreetingName(dynamicUserObj?.name, dynamicUserObj?.role);

    // 1. Add Farmer / New Parcel Registration
    if (
      q.includes('add farmer') ||
      q.includes('add parcel') ||
      q.includes('register parcel') ||
      q.includes('register farmer') ||
      q.includes('register new') ||
      q.includes('new registration') ||
      q.includes('open registration form') ||
      q.includes('+ add rice farm registration') ||
      q.includes('mag-rehistro') ||
      q.includes('mag rehistro') ||
      q.includes('magrehistro') ||
      q.includes('maglista kog') ||
      q.includes('maglista og') ||
      q.includes('maglista ta') ||
      q.includes('dungag mag-uuma') ||
      q.includes('pun-an ang basakan') ||
      q.includes('magparehistro') ||
      q.includes('mag fill up') ||
      q.includes('mag-fill up') ||
      q.includes('add farm') ||
      q === 'add farmer' ||
      q === '+ add' ||
      q === 'add'
    ) {
      let confirm = `Abtik kaayo ta ana, ${politeName}! Gi-ablihan dayon nako ang Registration Form sa basakan. Gusto nimo nga tabangan tika og susi sa RSBSA number o GPS coordinates karon?`;
      if (lang === 'tagalog') {
        confirm = `Sige po, ${politeName}! Binuksan ko na agad ang Form para sa Bagong Pagpaparehistro ng Palayan. Handa akong tumulong sa pag-check ng RSBSA number, barayti ng binhi, o GPS boundary.`;
      }
      if (lang === 'english') {
        confirm = `Right away, ${politeName}! Opening the New Rice Farm & RSBSA Registration Form. Would you like me to assist with verifying the RSBSA stub or centroid GPS coordinates?`;
      }

      return {
        action: {
          type: 'action:add_parcel',
          label:
            lang === 'tagalog'
              ? '➕ Buksan ang Registration Form'
              : lang === 'english'
              ? '➕ Open Registration Form'
              : '➕ Mag-rehistro og Basakan (Add Farm)',
          iconType: 'add_parcel'
        },
        confirmationText: confirm
      };
    }

    // 2. Specific Barangay Filter on GIS Map (e.g. "tan-awon nako ang mapa sa Balagawan", "mapa sa Mercedes")
    const mentionedBrgy = BARANGAYS.find((b) => q.includes(b.name.toLowerCase()));
    if (
      mentionedBrgy &&
      (q.includes('map') || q.includes('mapa') || q.includes('gis') || q.includes('tan-awon') || q.includes('locate') || q.includes('focus'))
    ) {
      let confirm = `Sige, ${politeName}! Gi-filter ug gi-focus dayon nako ang GIS Rice Map padulong sa **Barangay ${mentionedBrgy.name}**.`;
      if (lang === 'tagalog') confirm = `Sige po, ${politeName}! Ipinokus ko na ang GIS Rice Map sa **Barangay ${mentionedBrgy.name}**.`;
      if (lang === 'english') confirm = `Focusing and filtering the GIS Rice Map directly to **Barangay ${mentionedBrgy.name}** for you, ${politeName}.`;

      return {
        action: {
          type: 'action:map_barangay',
          barangay: mentionedBrgy.name,
          label:
            lang === 'tagalog'
              ? `🗺️ I-filter sa Mapa: Brgy. ${mentionedBrgy.name}`
              : lang === 'english'
              ? `🗺️ Filter Map: Brgy. ${mentionedBrgy.name}`
              : `🗺️ Tan-awon sa Mapa: Brgy. ${mentionedBrgy.name}`,
          iconType: 'map'
        },
        confirmationText: confirm
      };
    }

    // 2.1 General GIS Map & Polygons
    if (
      q.includes('go to map') ||
      q.includes('open map') ||
      q.includes('switch to map') ||
      q.includes('take me to map') ||
      q.includes('take me to gis') ||
      q.includes('open gis map') ||
      q.includes('view map') ||
      q.includes('show map') ||
      q.includes('tan-awon nako ang mapa') ||
      q.includes('tan-awon ang mapa') ||
      q.includes('ablihi ang mapa') ||
      q.includes('ablihi ang gis') ||
      q === 'map' ||
      q === 'gis map' ||
      q === 'mapa'
    ) {
      let confirm = `Nag-navigate padulong sa GIS Rice Map & Georeferenced Polygons, ${politeName}...`;
      if (lang === 'tagalog') confirm = `Pumupunta sa GIS Rice Map & Georeferenced Polygons, ${politeName}...`;
      if (lang === 'english') confirm = `Navigating to GIS Rice Map & Georeferenced Polygons, ${politeName}...`;

      return {
        action: {
          type: 'nav:map',
          tab: 'map',
          label:
            lang === 'tagalog'
              ? '📍 Buksan ang GIS Mapping'
              : lang === 'english'
              ? '📍 Open GIS Mapping Module'
              : '📍 Buksan ang GIS Map',
          iconType: 'map'
        },
        confirmationText: confirm
      };
    }

    // 3. Specific Barangay Filter for Reports
    if (
      mentionedBrgy &&
      (q.includes('report') || q.includes('masterlist') || q.includes('print') || q.includes('dokumento') || q.includes('talaan'))
    ) {
      let confirm = `Gi-andam ug gi-filter nako ang Opisyal nga Production Report alang sa **Barangay ${mentionedBrgy.name}**, ${politeName}.`;
      if (lang === 'tagalog') confirm = `Inihanda ko na ang Opisyal na Ulat para sa **Barangay ${mentionedBrgy.name}**, ${politeName}.`;
      if (lang === 'english') confirm = `Prepared and filtered the Official Registry Report for **Barangay ${mentionedBrgy.name}**, ${politeName}.`;

      return {
        action: {
          type: 'action:report_barangay',
          barangay: mentionedBrgy.name,
          label:
            lang === 'tagalog'
              ? `📄 Report sa Brgy. ${mentionedBrgy.name}`
              : lang === 'english'
              ? `📄 Report for Brgy. ${mentionedBrgy.name}`
              : `📄 Report sa Brgy. ${mentionedBrgy.name}`,
          iconType: 'reports'
        },
        confirmationText: confirm
      };
    }

    // 3.1 General Reports & Masterlists
    if (
      q.includes('go to report') ||
      q.includes('open report') ||
      q.includes('switch to report') ||
      q.includes('take me to report') ||
      q.includes('open masterlist') ||
      q.includes('go to masterlist') ||
      q.includes('print report') ||
      q.includes('view report') ||
      q.includes('ablihi ang report') ||
      q.includes('tan-awon ang report') ||
      q.includes('mag-print og report') ||
      q.includes('opisyal nga report') ||
      q === 'reports' ||
      q === 'report' ||
      q === 'masterlist'
    ) {
      let confirm = `Nag-navigate padulong sa Print Official Reports & Masterlists, ${politeName}...`;
      if (lang === 'tagalog') confirm = `Pumupunta sa Print Official Reports & Masterlists, ${politeName}...`;
      if (lang === 'english') confirm = `Navigating to Official Reports & Masterlists, ${politeName}...`;

      return {
        action: {
          type: 'nav:reports',
          tab: 'reports',
          label:
            lang === 'tagalog'
              ? '📄 Pumunta sa Opisyal na Reports'
              : lang === 'english'
              ? '📄 Go to Official Reports'
              : '📄 Buksan ang Official Reports',
          iconType: 'reports'
        },
        confirmationText: confirm
      };
    }

    // 4. Rice Farm Records (Database)
    if (
      q.includes('go to farm records') ||
      q.includes('open farm records') ||
      q.includes('switch to records') ||
      q.includes('take me to records') ||
      q.includes('view farm records') ||
      q.includes('view records') ||
      q.includes('show records') ||
      q.includes('open database') ||
      q.includes('farmer records') ||
      q === 'records' ||
      q === 'database'
    ) {
      let confirm = `Nag-navigate padulong sa Rice Farm Records Database, ${politeName}...`;
      if (lang === 'tagalog') confirm = `Pumupunta sa Rice Farm Records Database, ${politeName}...`;
      if (lang === 'english') confirm = `Navigating to Rice Farm Records Database, ${politeName}...`;

      return {
        action: {
          type: 'nav:eartags',
          tab: 'eartags',
          label:
            lang === 'tagalog'
              ? '🌾 Pumunta sa Rice Farm Records'
              : lang === 'english'
              ? '🌾 Go to Rice Farm Records'
              : '🌾 Rice Farm Records Database',
          iconType: 'eartags'
        },
        confirmationText: confirm
      };
    }

    // 5. Dashboard
    if (
      q.includes('go to dashboard') ||
      q.includes('open dashboard') ||
      q.includes('switch to dashboard') ||
      q.includes('take me to dashboard') ||
      q.includes('executive dashboard') ||
      q.includes('lft dashboard') ||
      q === 'dashboard'
    ) {
      const targetTab: PortalTab = isCentralAdmin ? 'dashboard' : 'lft_dashboard';
      let confirm = `Nag-navigate padulong sa ${isCentralAdmin ? 'Executive Dashboard' : 'LFT Field Dashboard'}, ${politeName}...`;
      if (lang === 'tagalog') confirm = `Pumupunta sa ${isCentralAdmin ? 'Executive Dashboard' : 'LFT Field Dashboard'}, ${politeName}...`;
      if (lang === 'english') confirm = `Navigating to ${isCentralAdmin ? 'Executive Dashboard' : 'LFT Field Dashboard'}, ${politeName}...`;

      return {
        action: {
          type: 'nav:dashboard',
          tab: targetTab,
          label: `📊 Go to ${isCentralAdmin ? 'Executive' : 'LFT'} Dashboard`,
          iconType: 'dashboard'
        },
        confirmationText: confirm
      };
    }

    return null;
  };

  // IN-DEPTH SYSTEM REASONING & PROACTIVE CO-WORKER ANALYTICS
  const performSystemAnalyticalReasoning = (
    query: string,
    lang: SupportedLanguage = activeLanguage
  ): {
    text: string;
    actions?: ChatAction[];
    matchedParcels?: FarmParcel[];
  } | null => {
    const q = query.toLowerCase();
    const politeName = formatPoliteGreetingName(dynamicUserObj?.name, dynamicUserObj?.role);

    // 0. Proactive Crop Insurance / PCIC Inquiry ("kinsay walay insurance", "walay insurance", "uninsured", "sinong walang insurance")
    if (
      q.includes('insurance') ||
      q.includes('insurans') ||
      q.includes('pcic') ||
      q.includes('uninsured') ||
      q.includes('walay insurance') ||
      q.includes('walang insurance')
    ) {
      const uninsured = parcels.filter((p) => {
        const status = (p.vaccinationStatus || '').toLowerCase();
        return (
          status.includes('uninsured') ||
          status.includes('wala') ||
          status.includes('pending') ||
          status.includes('not insured') ||
          !status.includes('insured')
        );
      });

      const uninsuredHa = uninsured.reduce((sum, p) => sum + (p.weightKg || 0), 0);
      const insuredCount = parcels.length - uninsured.length;

      if (lang === 'tagalog') {
        return {
          text: `Narito ang opisyal na katayuan ng **PCIC Crop Insurance** sa Silago:\n\n> 🛡️ **Segurado sa PCIC:** **${insuredCount} parsela** (${((insuredCount / parcels.length) * 100).toFixed(1)}%)\n> ⚠️ **Walang Insurance / Pending:** **${uninsured.length} parsela** (**${uninsuredHa.toFixed(2)} ektarya** ang nasa peligro)\n\n### Mga Magsasakang Nangangailangan ng Insurance Enrollment:\n\n${uninsured.slice(0, 5).map((p) => `- 👨‍🌾 **${formatFarmerDisplayName(p)}** (Brgy. ${p.barangay}) • ${p.weightKg} ha • Tag: \`${p.tagNumber}\``).join('\n')}\n\n🤝 **Katuwang na Alok ni RiceSsistant:**\n*Gusto mo ba, ${politeName}, na ihanda ko ang buong listahan upang ma-endorse agad natin sa PCIC Coordinator ng DA-MAO ngayon?*`,
          actions: [
            {
              type: 'nav:reports',
              tab: 'reports',
              label: '📄 I-generate ang PCIC Masterlist',
              iconType: 'reports'
            },
            {
              type: 'action:add_parcel',
              label: '➕ I-update ang Status ng Basakan',
              iconType: 'add_parcel'
            }
          ],
          matchedParcels: uninsured.slice(0, 5)
        };
      } else if (lang === 'english') {
        return {
          text: `Here is the official **PCIC Crop Insurance Compliance** status across Silago:\n\n> 🛡️ **Covered by PCIC Insurance:** **${insuredCount} parcels** (${((insuredCount / parcels.length) * 100).toFixed(1)}%)\n> ⚠️ **Uninsured / Pending Policy:** **${uninsured.length} parcels** (**${uninsuredHa.toFixed(2)} ha** vulnerable to climatic risk)\n\n### Farmers Requiring Immediate Insurance Policy Endorsement:\n\n${uninsured.slice(0, 5).map((p) => `- 👨‍🌾 **${formatFarmerDisplayName(p)}** (Brgy. ${p.barangay}) • ${p.weightKg} ha • Parcel ID: \`${p.tagNumber}\``).join('\n')}\n\n🤝 **Proactive Co-Worker Assistance:**\n*Would you like me, ${politeName}, to filter and prepare this masterlist for immediate endorsement to our Municipal PCIC Coordinator today?*`,
          actions: [
            {
              type: 'nav:reports',
              tab: 'reports',
              label: '📄 Generate PCIC Masterlist',
              iconType: 'reports'
            },
            {
              type: 'action:add_parcel',
              label: '➕ Update Parcel Insurance Info',
              iconType: 'add_parcel'
            }
          ],
          matchedParcels: uninsured.slice(0, 5)
        };
      } else {
        return {
          text: `Ania ang opisyal nga kahimtang sa **PCIC Crop Insurance** dinhi sa Silago:\n\n> 🛡️ **Segurado sa PCIC:** **${insuredCount} ka basakan** (${((insuredCount / parcels.length) * 100).toFixed(1)}%)\n> ⚠️ **Walay Insurance / Pending:** **${uninsured.length} ka basakan** (**${uninsuredHa.toFixed(2)} ka ektarya** nga delikado kon may bagyo o baha)\n\n### Mga Mag-uuma nga Kinahanglan Ma-enroll sa PCIC:\n\n${uninsured.slice(0, 5).map((p) => `- 👨‍🌾 **${formatFarmerDisplayName(p)}** (Brgy. ${p.barangay}) • ${p.weightKg} ha • Tag: \`${p.tagNumber}\``).join('\n')}\n\n🤝 **Tanyag nga Tabang gikan kang RiceSsistant:**\n*Gusto ba nimo, ${politeName}, nga tabangan tika og filter ug han-ay sa ilang listahan para dali nato ma-endorse sa PCIC Coordinator sa MAO karon?*`,
          actions: [
            {
              type: 'nav:reports',
              tab: 'reports',
              label: '📄 I-generate ang PCIC Masterlist',
              iconType: 'reports'
            },
            {
              type: 'action:add_parcel',
              label: '➕ I-update ang Status sa Basakan',
              iconType: 'add_parcel'
            }
          ],
          matchedParcels: uninsured.slice(0, 5)
        };
      }
    }

    // 1. Total rice hectares query ("Pila tanan ka ektarya ang natamnan ug humay?", "total registered hectares")
    if (
      (q.includes('pila tanan') || q.includes('total') || q.includes('sukod') || q.includes('natamnan') || q.includes('ilan lahat') || q.includes('kuwenta') || q.includes('kalkula')) &&
      (q.includes('ektarya') || q.includes('hectare') || q.includes('ha') || q.includes('humay') || q.includes('palay') || q.includes('rice') || q.includes('luna'))
    ) {
      const totalHa = parcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
      const totalCount = parcels.length;

      const brgyTotals: Record<string, { count: number; ha: number }> = {};
      parcels.forEach((p) => {
        const b = p.barangay || 'Balagawan';
        if (!brgyTotals[b]) brgyTotals[b] = { count: 0, ha: 0 };
        brgyTotals[b].count++;
        brgyTotals[b].ha += (p.weightKg || 0);
      });

      const topBrgys = Object.entries(brgyTotals).sort((a, b) => b[1].ha - a[1].ha);

      if (lang === 'tagalog') {
        return {
          text: `Kinalkula ko ang opisyal na datos sa ating GIS registry sa Silago para sa iyo, ${politeName}:\n\n> 🌾 **Kabuuang Sukat:** **${totalHa.toFixed(2)} ektarya** ang kasalukuyang natatamnan ng palay sa buong munisipyo.\n> 📍 **Bilang ng Parsela:** **${totalCount} georeferenced parcels** na may selyadong GPS boundary.\n\n### Distribusyon bawat Barangay:\n\n| Barangay | Bilang ng Plots | Sukat (Hectares) | Bahagdan |\n|---|---|---|---|\n${topBrgys.map(([name, data]) => `| **${name}** | ${data.count} plots | **${data.ha.toFixed(2)} ha** | ${Math.round((data.ha / totalHa) * 100)}% |`).join('\n')}\n\nNangunguna ang **${topBrgys[0]?.[0]}** na may **${topBrgys[0]?.[1].ha.toFixed(2)} ha**.\n\n*Gusto mo bang i-export natin ito sa official report para sa iyong presentation o submit sa MAO?*`,
          actions: [
            { type: 'nav:reports', tab: 'reports', label: '📄 I-print ang Hectarage Summary', iconType: 'reports' },
            { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' }
          ]
        };
      } else if (lang === 'english') {
        return {
          text: `I computed the total hectarage breakdown from our active geospatial database, ${politeName}:\n\n> 🌾 **Total Georeferenced Rice Land:** **${totalHa.toFixed(2)} hectares** across the municipality.\n> 📍 **Total Parcels Mapped:** **${totalCount} active plots** with verified centroid coordinates.\n\n### Land Allocation by Barangay:\n\n| Barangay | Registered Plots | Total Land (ha) | Share (%) |\n|---|---|---|---|\n${topBrgys.map(([name, data]) => `| **${name}** | ${data.count} plots | **${data.ha.toFixed(2)} ha** | ${Math.round((data.ha / totalHa) * 100)}% |`).join('\n')}\n\n**${topBrgys[0]?.[0]}** leads with **${topBrgys[0]?.[1].ha.toFixed(2)} ha**.\n\n*Would you like me to prepare this breakdown into a printable municipal report for your office presentation?*`,
          actions: [
            { type: 'nav:reports', tab: 'reports', label: '📄 Print Hectarage Summary', iconType: 'reports' },
            { type: 'nav:map', tab: 'map', label: '📍 Open GIS Map', iconType: 'map' }
          ]
        };
      } else {
        return {
          text: `Gikwenta nako ang kinatibuk-ang datos sa atong GIS registry para nimo, ${politeName}:\n\n> 🌾 **Kinatibuk-ang Sukod:** **${totalHa.toFixed(2)} ka ektarya** ang natamnan ug humay sa tibuok Silago.\n> 📍 **Rehistradong Parcels:** **${totalCount} ka georeferenced parcels** nga may tagsa-tagsa ka GPS centroid ug polygon boundary.\n\n### Pagkabahin Matag Barangay:\n\n| Barangay | Gidaghanon sa Plots | Sukod (Hectares) | Porsyento |\n|---|---|---|---|\n${topBrgys.map(([name, data]) => `| **${name}** | ${data.count} plots | **${data.ha.toFixed(2)} ha** | ${Math.round((data.ha / totalHa) * 100)}% |`).join('\n')}\n\nAng kinadak-ang basakan anaa sa **${topBrgys[0]?.[0]}** nga may **${topBrgys[0]?.[1].ha.toFixed(2)} ha**.\n\n*Tabangan tika og andam og opisyal nga report para sa imong presentation sa MAO karon?*`,
          actions: [
            { type: 'nav:reports', tab: 'reports', label: '📄 I-print ang Hectarage Summary', iconType: 'reports' },
            { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' }
          ]
        };
      }
    }

    // 2. Specific Barangay Comparison (e.g., "I-compare ang irrigated ug rainfed sa Balagawan" or any barangay)
    const mentionedBrgy = BARANGAYS.find((b) => q.includes(b.name.toLowerCase()));
    if (mentionedBrgy && (q.includes('compare') || q.includes('irrigated') || q.includes('rainfed') || q.includes('irigasyon'))) {
      const bParcels = parcels.filter((p) => p.barangay.toLowerCase() === mentionedBrgy.name.toLowerCase());
      let bIrrigatedHa = 0;
      let bIrrigatedCount = 0;
      let bRainfedHa = 0;
      let bRainfedCount = 0;

      bParcels.forEach((p) => {
        const pur = (p.purpose || '').toLowerCase();
        if (pur.includes('irrigated') || pur.includes('nia')) {
          bIrrigatedHa += (p.weightKg || 0);
          bIrrigatedCount++;
        } else {
          bRainfedHa += (p.weightKg || 0);
          bRainfedCount++;
        }
      });

      const bTotalHa = bIrrigatedHa + bRainfedHa;
      const irrPct = bTotalHa > 0 ? Math.round((bIrrigatedHa / bTotalHa) * 100) : 100;
      const rainPct = 100 - irrPct;

      if (lang === 'tagalog') {
        return {
          text: `Narito ang paghahambing ng irigasyon sa **Barangay ${mentionedBrgy.name}**:\n\n| Sistema ng Palayan | Sukat (Ektarya) | Bahagdan | Bilang ng Parsela |\n|---|---|---|---|\n| **Irrigated Lowland (NIA / CIS)** | **${bIrrigatedHa.toFixed(2)} ha** | **${irrPct}%** | ${bIrrigatedCount} parsela |\n| **Rainfed Lowland (Umaasa sa Ulan)** | **${bRainfedHa.toFixed(2)} ha** | **${rainPct}%** | ${bRainfedCount} parsela |\n| **Kabuuang Sukat** | **${bTotalHa.toFixed(2)} ha** | **100%** | **${bParcels.length} parsela** |\n\n> 💡 **Paliwanag:** Sa ${mentionedBrgy.name}, **${irrPct}%** ng palayan ay siniserbisyuhan ng Balagawan Irrigators Association kaya nakakapagtanim ng hanggang dalawang cropping cycle bawat taon kumpara sa rainfed na umaasa lamang sa seasonal na ulan.`
        };
      } else if (lang === 'english') {
        return {
          text: `Here is the irrigation comparison for **Barangay ${mentionedBrgy.name}**:\n\n| Irrigation Regime | Land Area (ha) | Share (%) | Registered Plots |\n|---|---|---|---|\n| **Irrigated Lowland (NIA/CIS)** | **${bIrrigatedHa.toFixed(2)} ha** | **${irrPct}%** | ${bIrrigatedCount} plots |\n| **Rainfed Lowland** | **${bRainfedHa.toFixed(2)} ha** | **${rainPct}%** | ${bRainfedCount} plots |\n| **Total** | **${bTotalHa.toFixed(2)} ha** | **100%** | **${bParcels.length} plots** |\n\n> 💡 **Technical Insight:** In ${mentionedBrgy.name}, **${irrPct}%** of land is serviced by gravity river diversion weirs under the Balagawan Irrigators Association, yielding double-cropping capability over purely rainfed plots.`
        };
      } else {
        return {
          text: `Ania ang pagtandi sa irigasyon sa **Barangay ${mentionedBrgy.name}**:\n\n| Sistema sa Basakan | Sukod (Hectares) | Porsyento | Gidaghanon sa Mag-uuma |\n|---|---|---|---|\n| **Irrigated Lowland (NIA / CIS)** | **${bIrrigatedHa.toFixed(2)} ha** | **${irrPct}%** | ${bIrrigatedCount} parcels |\n| **Rainfed Lowland (Salig sa Ulan)** | **${bRainfedHa.toFixed(2)} ha** | **${rainPct}%** | ${bRainfedCount} parcels |\n| **Kinatibuk-ang Sukod** | **${bTotalHa.toFixed(2)} ha** | **100%** | **${bParcels.length} parcels** |\n\n> 💡 **Pagpatin-aw:** Sa ${mentionedBrgy.name}, **${irrPct}%** sa basakan naserbisyohan sa **Balagawan Communal Irrigators Association (BCIA)**. Tungod niini, sila makatala og hangtod duha ka cropping cycles kada tuig kon itandi sa mga rainfed nga salig lamang sa seasonal nga ulan.`
        };
      }
    }

    // 3. Largest parcel / landholder query ("Kinsa ang pinakadako ug luna?", "kinadak-an ug area", "largest farm")
    if (q.includes('pinakadako') || q.includes('kinadak-an') || q.includes('kinadak an') || q.includes('largest') || q.includes('pinakamalaki')) {
      const pool = lastMatchedParcels.length > 0 ? lastMatchedParcels : parcels;
      if (pool.length > 0) {
        const sorted = [...pool].sort((a, b) => (b.weightKg || 0) - (a.weightKg || 0));
        const topParcel = sorted[0];

        if (lang === 'tagalog') {
          return {
            text: `Ang magsasaka na may pinakamalaking parsela sa ating talaan ay si:\n\n> 👨‍🌾 **Pangalan:** **${formatFarmerDisplayName(topParcel)}**\n> 📍 **Lokasyon:** Brgy. **${topParcel.barangay}** (${topParcel.farmLocation || topParcel.address})\n> 📐 **Laki:** **${topParcel.weightKg} ektarya**\n> 🌾 **Binhi:** ${topParcel.breed || 'NSIC Rc 480'}\n> 🏷️ **RSBSA Code:** \`${topParcel.swineNameOrId || 'RSBSA Rehistrado'}\` • Tag: \`${topParcel.tagNumber}\`\n\nAng lupang ito ay opisyal nang na-georeference ng ating LFT field team.`,
            actions: [
              {
                type: 'action:locate_parcel',
                parcel: topParcel,
                label: `📍 View on GIS Map (${topParcel.tagNumber})`,
                iconType: 'map'
              },
              {
                type: 'action:view_record',
                parcel: topParcel,
                label: '📄 Open Farmer Record',
                iconType: 'eartags'
              }
            ],
            matchedParcels: [topParcel]
          };
        } else if (lang === 'english') {
          return {
            text: `The farmer holding the largest individual parcel in the registry is:\n\n> 👨‍🌾 **Farmer:** **${formatFarmerDisplayName(topParcel)}**\n> 📍 **Location:** Brgy. **${topParcel.barangay}** (${topParcel.farmLocation || topParcel.address})\n> 📐 **Parcel Area:** **${topParcel.weightKg} hectares**\n> 🌾 **Rice Variety:** ${topParcel.breed || 'NSIC Rc 480'}\n> 🏷️ **RSBSA Reference:** \`${topParcel.swineNameOrId || 'RSBSA Registered'}\` • Parcel ID: \`${topParcel.tagNumber}\`\n\nThe parcel boundary polygon is verified in the municipal GIS layer.`,
            actions: [
              {
                type: 'action:locate_parcel',
                parcel: topParcel,
                label: `📍 View on GIS Map (${topParcel.tagNumber})`,
                iconType: 'map'
              },
              {
                type: 'action:view_record',
                parcel: topParcel,
                label: '📄 Open Farmer Record',
                iconType: 'eartags'
              }
            ],
            matchedParcels: [topParcel]
          };
        } else {
          return {
            text: `Ang mag-uuma nga may kinadak-ang luna sa atong talaan mao si:\n\n> 👨‍🌾 **Pangalan:** **${formatFarmerDisplayName(topParcel)}**\n> 📍 **Lokasyon:** Brgy. **${topParcel.barangay}** (${topParcel.farmLocation || topParcel.address})\n> 📐 **Gidak-on:** **${topParcel.weightKg} ka ektarya**\n> 🌾 **Binhi:** ${topParcel.breed || 'NSIC Rc 480'}\n> 🏷️ **RSBSA Code:** \`${topParcel.swineNameOrId || 'RSBSA Rehistrado'}\` • Tag: \`${topParcel.tagNumber}\`\n\nKini nga luna opisyal nang na-georeference sa LFT field team.`,
            actions: [
              {
                type: 'action:locate_parcel',
                parcel: topParcel,
                label: `📍 View on GIS Map (${topParcel.tagNumber})`,
                iconType: 'map'
              },
              {
                type: 'action:view_record',
                parcel: topParcel,
                label: '📄 Open Farmer Record',
                iconType: 'eartags'
              }
            ],
            matchedParcels: [topParcel]
          };
        }
      }
    }

    // 4. Seasonal status / Crop Stage situation ("Unsay sitwasyon sa planting karon nga season?")
    if (q.includes('sitwasyon') || q.includes('planting') || q.includes('karon nga season') || q.includes('season status') || q.includes('growth stage') || q.includes('crop stage')) {
      const stagesMap: Record<string, number> = {};
      parcels.forEach((p) => {
        const stage = p.healthStatus || 'Active Tillering';
        stagesMap[stage] = (stagesMap[stage] || 0) + 1;
      });

      if (lang === 'tagalog') {
        return {
          text: `Narito ang kasalukuyang sitwasyon ng pagtatanim para sa **${ACTIVE_SEASON}** sa buong Silago:\n\n> 📅 **Aktibong Season:** Wet Season 2026 (Hunyo hanggang Nobyembre 2026)\n> 🌾 **Yugto ng Pananim:**\n> - **Active Crop (Tillering):** **${stagesMap['Active Crop (Tillering)'] || stagesMap['Tillering'] || 16} parsela** (may average na 35–50 Days After Sowing)\n> - **Panicle Initiation:** 1 parsela papasok sa reproductive phase\n\n### Payo ng DA-MAO para sa mga Magsasaka:\n1. **Lalim ng Tubig:** Panatilihin ang 3–5 cm na lalim ng tubig sa mga sakahang may irigasyon habang nasa tillering stage upang mapigilan ang pagtubo ng damo.\n2. **Paglalagay ng Abono:** Maglagay ng nitrogen side-dress bago ang panicle initiation (50–55 DAS).\n3. **Tinatayang Pag-aani:** Ang rurok ng pag-aani ay inaasahan sa pagitan ng **Oktubre 15 at Nobyembre 15, 2026**.`
        };
      } else if (lang === 'english') {
        return {
          text: `Here is the current operational situation for **${ACTIVE_SEASON}** across Silago:\n\n> 📅 **Active Crop Cycle:** Wet Season 2026 (June – November 2026)\n> 🌾 **Growth Stages:**\n> - **Tillering (Vegetative Stage):** **${stagesMap['Active Crop (Tillering)'] || stagesMap['Tillering'] || 16} parcels** (averaging 35–50 Days After Sowing)\n> - **Panicle Initiation:** 1 parcel entering reproductive phase\n\n### MAO Technical Advisories:\n1. **Water Depth:** Maintain 3–5 cm ponding depth in NIA-serviced sectors during active tillering to suppress weed competition.\n2. **Fertilizer Top-Dress:** Side-dress nitrogen fertilizer prior to panicle initiation (50–55 DAS).\n3. **Harvest Horizon:** Peak harvest window is anticipated between **October 15 and November 15, 2026**.`
        };
      } else {
        return {
          text: `Mao kini ang kasamtangang sitwasyon sa planting alang sa **${ACTIVE_SEASON}**:\n\n> 📅 **Aktibong Panahon:** Wet Season 2026 (Hunyo hangtod Nobyembre)\n> 🌾 **Kahimtang sa Tanom:**\n> - **Active Crop (Tillering):** **${stagesMap['Active Crop (Tillering)'] || stagesMap['Tillering'] || 16} ka basakan** (nag-edad og 35–50 ka adlaw human mapugas / DAS)\n> - **Vegetative & Panicle Initiation:** 1 ka basakan\n\n### Rekomendasyon sa MAO para sa Mag-uuma:\n1. **Irigasyon:** Huptan ang 3–5 cm nga giladmon sa tubig sa basakan atol sa tillering phase aron mapugngan ang pagtubo sa sagbot.\n2. **Abono:** I-apply ang ikaduhang hugna sa abono (Urea + Complete) sa dili pa moabot ang panicle initiation (55–60 DAS).\n3. **Gidahom nga Ani:** Ang ting-ani gilauman nga mosugod sa **Oktubre hangtod sayong bahin sa Nobyembre 2026**.`
        };
      }
    }

    return null;
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // A. Explicit Language Switch command (e.g. "tagalog tayo", "in bisaya please", "speak english", "ilisi ug binisaya")
    const explicitSwitch = detectExplicitLanguageSwitch(query);
    if (explicitSwitch) {
      setActiveLanguage(explicitSwitch.lang);
      setIsLanguageLocked(true);

      if (explicitSwitch.isOnlySwitch) {
        const politeName = formatPoliteGreetingName(dynamicUserObj.name, dynamicUserObj.role);
        let switchAck = '';
        if (explicitSwitch.lang === 'tagalog') {
          switchAck = `Sige, ${politeName}! Mag-Tagalog tayo mula ngayon. Paano kita matutulungan tungkol sa ating mga palayan, mapa, o talaan ng mga magsasaka sa Silago?`;
        } else if (explicitSwitch.lang === 'bisaya') {
          switchAck = `Sige, ${politeName}! Mag-Binisaya ta sugod karon. Unsa may akong ikaabag kanimo bahin sa atong mga basakan, mapa, ug mga mag-uuma sa Silago?`;
        } else {
          switchAck = `Sure, ${politeName}! I will now assist you in English. What would you like to know about our rice farms, GIS map, and agricultural records in Silago?`;
        }

        const botMsg: ChatMessage = {
          id: `bot-lang-${Date.now()}`,
          sender: 'assistant',
          text: switchAck,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, botMsg]);
        return;
      }
    }

    // B. Dynamic Language Matching if not explicitly locked
    let currentLang: SupportedLanguage = activeLanguage;
    if (explicitSwitch) {
      currentLang = explicitSwitch.lang;
    } else if (!isLanguageLocked) {
      const detected = detectLanguageFromText(query);
      if (detected) {
        currentLang = detected;
        setActiveLanguage(detected);
      }
    }

    setIsLoading(true);
    setStreamingText('');

    try {
      const totalAreaHa = parcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
      const parcelsSummary = parcels.map((p) => ({
        tag: p.tagNumber,
        farmer: p.raiserName,
        rsbsa: p.swineNameOrId,
        barangay: p.barangay,
        areaHa: p.weightKg,
        variety: p.breed,
        ecosystem: p.purpose,
        stage: p.healthStatus,
        location: p.farmLocation || p.address,
        hasCoordinates: Boolean(p.lat && p.lng && (p.lat !== 0 || p.lng !== 0)),
        gpsCoordinates: p.lat && p.lng && (p.lat !== 0 || p.lng !== 0) ? `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}` : 'None',
        tenure: p.batchNumber
      }));

      const barangaysSummary = BARANGAYS.map((b) => ({
        name: b.name,
        terrain: b.terrain,
        puroks: b.puroks,
        focalPerson: b.focalPerson
      }));

      const lftSummary = (lftAccounts || []).map((lft) => ({
        name: lft.name,
        assignedBarangays: lft.assignedBarangays || [lft.barangay],
        contact: lft.contactNumber,
        status: lft.status
      }));

      const systemPrompt = `You are "RiceSsistant", an intelligent GIS and Agricultural Registry Guide integrated into the "Rice Farm Registry and Georeferencing System" for the Municipality of Silago, Southern Leyte (DA-MAO).

### ROLE & IDENTITY:
- You assist the Municipal Agriculture Administrator ("Temporary Administrator" / "Sir Temporary Administrator") and LFT Field Officers.
- You provide insights regarding rice farmer profiles, RSBSA registration, parcel hectares, barangay distributions, and GIS polygon mapping.
- Your default language is Cebuano/Bisaya. You seamlessly switch to English or Tagalog if the user communicates in those languages.

### CRITICAL OPERATIONAL RULES & VALIDATIONS:

1. ANTI-DUPLICATION ENFORCEMENT:
   - Always emphasize and enforce uniqueness for:
     a. RSBSA Reference Number (e.g., standard format: 08-64-16-002-XXXXXX).
     b. Full Farmer Name (Family Name, Given Name, Middle Name).
     c. Parcel Reference IDs.
   - When asked about registration or adding farms, explicitly remind users:
     "Pahibalo: Likayan ang duplicate records. Ang RSBSA number ug tibuok ngalan kinahanglang talagsaon (unique) sa database."

2. CONTACT NUMBER VALIDATION:
   - Contact numbers must ONLY contain numeric digits (0–9) and optional standard dashes (-).
   - Never allow letters or invalid characters in contact numbers.
   - Standard format: 11 digits starting with "09" (e.g., 0917-555-1234 or 09XXXXXXXXX).

3. REALTIME & SESSION INTEGRITY:
   - Inform users that records synchronize automatically across all devices via Supabase Realtime—there is no need for manual page refreshing.
   - Guide users without requiring page reloads to prevent session reset or accidental logout.

4. QUICK ACTION COMMANDS:
   When user intents align with specific actions, output structured suggestions at the end of your response:
   - GIS Map intent -> [ACTION: OPEN_GIS_MAP] ("Ablihi ang GIS Map")
   - Registry / Records intent -> [ACTION: OPEN_RECORDS] ("Rice Farm Records")
   - New registration intent -> [ACTION: OPEN_REGISTRATION] ("+ Mag-rehistro og Basakan")
   - Other specific actions:
     * Executive Dashboard: [ACTION:nav:dashboard]
     * Official Reports: [ACTION:nav:reports]
     * LFT Accounts: [ACTION:nav:accounts]
     * System Settings: [ACTION:nav:settings]
     * Locate Parcel: [ACTION:locate_parcel:TAG_NUMBER]
     * Filter Records: [ACTION:filter_records:FARMER_NAME_OR_TERM]
     * Filter Barangay on Map: [ACTION:map_barangay:BarangayName]
     * Filter Barangay in Reports: [ACTION:report_barangay:BarangayName]

5. TONE & BEHAVIOR:
   - Professional, respectful, responsive, and grounded in DA-MAO agricultural field operations.
   - Address the user respectfully (e.g., "Sir Temporary Administrator" or "Field Officer").
   - Never hallucinate non-existent records, fake parcels, or unregistered farmers. If data is not found, advise verifying via the Rice Farm Records table.
   - Out-of-Scope Queries: If the user asks about topics outside Silago DA-MAO agriculture, politely redirect back to the Silago Rice Registry.

### LIVE DATABASE KNOWLEDGE & CONTEXT:
- Municipality: Municipality of Silago, Southern Leyte (15 Agricultural Barangays: Aguami, Balagawan, Catmon, Hingatungan, Imelda, Katipunan, Lagoma, Mercedes, Poblacion District 1, Poblacion District 2, Puntana, Salvacion, San Isidro, San Roque, Tuburan).
- Active Cropping Season: ${ACTIVE_SEASON}
- Total Registered Parcels: ${parcels.length}
- Total Cultivated Area: ${totalAreaHa.toFixed(2)} hectares
- Active Authenticated User: ${dynamicUserObj.name || 'Temporary Administrator'} (${dynamicUserObj.role || 'Municipal Agriculture Administrator'}) at ${dynamicUserObj.office || 'DA-MAO Silago'}
- DA-MAO Office & Hotline: Schedule: ${officeContactInfo?.schedule || 'Mon-Fri 8:00 AM - 5:00 PM'} • Hotline: ${officeContactInfo?.hotline || '(053) 572-8812'} • Mobile: ${officeContactInfo?.mobile || '0917-822-4911'}
- Assigned LFT Field Officers: ${JSON.stringify(lftSummary)}
- 15 Barangays Directory: ${JSON.stringify(barangaysSummary)}
- Master Parcels & RSBSA Records:
${JSON.stringify(parcelsSummary)}`;

      // Multi-Turn Conversation History
      const chatHistory = messages
        .filter((m) => m.text && m.text.trim())
        .slice(-10)
        .map((m) => ({
          role: m.sender === 'user' ? ('user' as const) : ('model' as const),
          parts: [{ text: m.text }]
        }));

      chatHistory.push({
        role: 'user',
        parts: [{ text: query }]
      });

      let accumulated = '';
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: chatHistory,
          systemInstruction: systemPrompt,
          stream: true
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`API response status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (json.fallback || !response.ok) {
          const fallback = getFallbackPersonaResponse(query, currentLang);
          simulateSmoothStreaming(fallback.text, fallback.actions, fallback.farmerResults);
          return;
        }
        if (json.text) {
          const { cleanText: parsedCleanText, actions: parsedActions } = parseActionTagsAndCleanText(
            json.text,
            parcels,
            currentLang
          );
          const finalText = parsedCleanText
            .replace(/^Mahitungod sa imong pangutana bahin sa [^\n:]+[:\n]+/i, '')
            .replace(/^Kaugnay ng iyong katanungan tungkol sa [^\n:]+[:\n]+/i, '')
            .replace(/^Regarding your query on [^\n:]+[:\n]+/i, '')
            .trim();
          const searchDirectMatches = searchParcelsDatabase(query, parcels);
          const attachedCards = searchDirectMatches.length > 0 && searchDirectMatches.length <= 4 ? searchDirectMatches : undefined;
          if (searchDirectMatches.length >= 1 && searchDirectMatches.length <= 3) {
            const topP = searchDirectMatches[0];
            if (!parsedActions.some((a) => a.type === 'action:locate_parcel')) {
              parsedActions.unshift({
                type: 'action:locate_parcel',
                parcel: topP,
                label: currentLang === 'english' ? '📍 Locate on Map' : '📍 I-locate sa Mapa',
                iconType: 'map'
              });
            }
            if (!parsedActions.some((a) => a.type === 'action:filter_records')) {
              parsedActions.push({
                type: 'action:filter_records',
                parcel: topP,
                searchTerm: topP.raiserName,
                label: currentLang === 'english' ? '📋 Filter Records' : '📋 I-filter sa Records',
                iconType: 'eartags'
              });
            }
          }
          setMessages((prev) => [
            ...prev,
            {
              id: `bot-${Date.now()}`,
              sender: 'assistant',
              text: finalText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actions: parsedActions.length > 0 ? parsedActions : undefined,
              farmerResults: attachedCards
            }
          ]);
          return;
        }
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.substring(6);
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                const cleanStream = accumulated.replace(/\[ACTION:[a-zA-Z0-9_: -]+\]/gi, '');
                setStreamingText(cleanStream);
              } else if (parsed.error) {
                console.warn('Streaming error notice:', parsed.error);
              }
            } catch {
              // ignore parse errors for raw chunks
            }
          }
        }
      }

      if (!accumulated.trim()) {
        throw new Error('Empty response from AI stream');
      }

      const { cleanText: parsedCleanText, actions: parsedActions } = parseActionTagsAndCleanText(
        accumulated,
        parcels,
        currentLang
      );

      // Strip any residual canned preambles if generated by LLM
      const finalText = parsedCleanText
        .replace(/^Mahitungod sa imong pangutana bahin sa [^\n:]+[:\n]+/i, '')
        .replace(/^Kaugnay ng iyong katanungan tungkol sa [^\n:]+[:\n]+/i, '')
        .replace(/^Regarding your query on [^\n:]+[:\n]+/i, '')
        .trim();

      // Check if any specific farmer parcel was discussed or searched in query to attach rich card if relevant
      const searchDirectMatches = searchParcelsDatabase(query, parcels);
      const attachedCards = searchDirectMatches.length > 0 && searchDirectMatches.length <= 4 ? searchDirectMatches : undefined;
      if (searchDirectMatches.length >= 1 && searchDirectMatches.length <= 3) {
        const topP = searchDirectMatches[0];
        if (!parsedActions.some((a) => a.type === 'action:locate_parcel')) {
          parsedActions.unshift({
            type: 'action:locate_parcel',
            parcel: topP,
            label: currentLang === 'english' ? '📍 Locate on Map' : '📍 I-locate sa Mapa',
            iconType: 'map'
          });
        }
        if (!parsedActions.some((a) => a.type === 'action:filter_records')) {
          parsedActions.push({
            type: 'action:filter_records',
            parcel: topP,
            searchTerm: topP.raiserName,
            label: currentLang === 'english' ? '📋 Filter Records' : '📋 I-filter sa Records',
            iconType: 'eartags'
          });
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: finalText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: parsedActions.length > 0 ? parsedActions : undefined,
          farmerResults: attachedCards
        }
      ]);
    } catch (_err: any) {
      const fallback = getFallbackPersonaResponse(query, currentLang);
      simulateSmoothStreaming(fallback.text, fallback.actions, fallback.farmerResults);
    } finally {
      setIsLoading(false);
      setStreamingText(null);
    }
  };

  // Simulated smooth typing effect for fallback
  const simulateSmoothStreaming = (fullText: string, actions?: ChatAction[], farmerResults?: FarmParcel[]) => {
    setIsLoading(true);
    let index = 0;
    const step = Math.max(2, Math.floor(fullText.length / 25));

    const interval = setInterval(() => {
      index += step;
      if (index >= fullText.length) {
        clearInterval(interval);
        setStreamingText(null);
        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: fullText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actions: actions,
            farmerResults: farmerResults
          }
        ]);
      } else {
        setStreamingText(fullText.slice(0, index));
      }
    }, 20);
  };

  // Fallback Persona Response generator: Dynamic Intent-Based Answering (Direct & Relevant)
  const getFallbackPersonaResponse = (
    query: string,
    lang: SupportedLanguage = activeLanguage
  ): { text: string; actions?: ChatAction[]; farmerResults?: FarmParcel[] } => {
    const q = query.toLowerCase().trim();
    const totalAreaHa = parcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
    const politeName = formatPoliteGreetingName(dynamicUserObj?.name, dynamicUserObj?.role);

    // 0. Strict Out-of-Scope Redirection in fallback
    if (isOutOfScopeQuery(query)) {
      return getOutOfScopeResponse(politeName, lang);
    }

    // 1. Confusion or casual follow-ups: "bat ganon", "ngano man", "ha?", "why so?"
    if (isConfusionOrCasualFollowUp(query)) {
      if (lang === 'tagalog') {
        return {
          text: `Naiintindihan ko, ${politeName}! Kung may bahagi sa naunang talaan o datos ng palayan na kailangan nating linawin, ako na mismo ang maghahanap at mag-eexplain. Aling bahagi ng talaan o mapa ang nais mong balikan natin?`
        };
      }
      if (lang === 'english') {
        return {
          text: `I completely understand, ${politeName}! If anything in the recent parcel records or GIS data needs clarification, I am right here to help double-check the figures. What specific record or barangay should we review?`
        };
      }
      return {
        text: `Nakasabot ko, ${politeName}! Kon aduna may bahin sa talaan sa basakan o mapa nga naglibog kanimo, ako dayong susihon pag-usab para nimo. Unsa may partikular nga mag-uuma o barangay nga atong balikan?`
      };
    }

    // 2. Greeting & Casual Conversational check (e.g. "kumusta ka?", "kumusta", "how are you", "hi", "hello")
    if (isGreetingOrCourtesy(query)) {
      if (q.includes('kumusta') || q.includes('kamusta') || q.includes('how are you') || q.includes('musta')) {
        if (lang === 'tagalog') {
          return {
            text: `Mabuti naman, laging handang tumulong dito sa DA-MAO Silago! Ano ang ating aasikasuhin ngayon sa ating rice registry o sa mapa, ${politeName}?`
          };
        }
        if (lang === 'english') {
          return {
            text: `I'm doing great, always ready to help here at DA-MAO Silago! What shall we look into today in our rice registry or on the map, ${politeName}?`
          };
        }
        return {
          text: `Maayo man, andam kanunay motabang dinhi sa DA-MAO Silago! Unsay atong atimanon karon sa atong rice registry o sa mapa, ${politeName}?`
        };
      }
      return { text: getGreetingResponse(query, politeName, lang) };
    }

    // 3. User identity & location origin inquiry (e.g. "taga asa ko?", "who am I?", "kinsa ko?")
    if (isUserIdentityQuery(query)) {
      return { text: getUserIdentityResponse(query, dynamicUserObj, lang) };
    }

    // 4. Bot Identity & Role inquiry (e.g. "unsay trabaho nimo?", "what is your job?", "who are you?", "kinsa ka?")
    const isBotIdentityQuery =
      q.includes('unsay trabaho nimo') ||
      q.includes('unsa imong trabaho') ||
      q.includes('unsay imong trabaho') ||
      q.includes('unsa imong katungdanan') ||
      q.includes('unsay imong katungdanan') ||
      q.includes('unsa imong gamit') ||
      q.includes('unsay imong gamit') ||
      q.includes('kinsa ka') ||
      q.includes('kinsa man ka') ||
      q.includes('kinsa diay ka') ||
      q.includes('ano ang trabaho mo') ||
      q.includes('anong trabaho mo') ||
      q.includes('ano ang ginagawa mo') ||
      q.includes('sino ka') ||
      q.includes('what is your job') ||
      q.includes('what do you do') ||
      q.includes('who are you') ||
      q.includes('what can you do');

    if (isBotIdentityQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Ako si **RiceSsistant**, ang iyong digital partner dito sa Silago Rice Registry & GIS portal. Tumutulong ako sa iyo sa pag-navigate sa sistema, pagsubay sa RSBSA records ng mga magsasaka, pag-analisa sa mga basakan sa 15 na barangay, at pag-guide sa paggamit ng ating GIS map.`,
          actions: [
            { type: 'nav:map', tab: 'map', label: '🗺️ Buksan ang GIS Map', iconType: 'map' },
            { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
            { type: 'action:add_parcel', label: '➕ Mag-rehistro ng Basakan', iconType: 'add_parcel' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `I am **RiceSsistant**, your digital co-worker here at the Silago Rice Registry & GIS portal. I assist you with system navigation, looking up farmer RSBSA records, analyzing rice parcels across our 15 barangays, and guiding you through our interactive GIS map.`,
          actions: [
            { type: 'nav:map', tab: 'map', label: '🗺️ Open GIS Map', iconType: 'map' },
            { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
            { type: 'action:add_parcel', label: '➕ Enroll New Farm', iconType: 'add_parcel' }
          ]
        };
      }
      return {
        text: `Ako si **RiceSsistant**, imong digital partner dinhi sa Silago Rice Registry & GIS portal. Motabang ko nimo sa pag-navigate sa sistema, pagsubay sa RSBSA records sa mga mag-uuma, pag-analisar sa mga basakan sa 15 ka barangay, ug pag-guide sa paggamit sa atong GIS map.`,
        actions: [
          { type: 'nav:map', tab: 'map', label: '🗺️ Ablihi ang GIS Map', iconType: 'map' },
          { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records', iconType: 'eartags' },
          { type: 'action:add_parcel', label: '➕ Mag-rehistro og Basakan', iconType: 'add_parcel' }
        ]
      };
    }

    // 5. System Exploration & Direct Navigation (e.g. "Gusto ko motan-aw sa mapa", "Ablihi ang records")
    const isMapNavQuery =
      q.includes('gusto ko motan-aw sa mapa') ||
      q.includes('gusto ko motan aw sa mapa') ||
      q.includes('gusto ko makakita sa mapa') ||
      q.includes('gusto kong makita ang mapa') ||
      q.includes('gusto kong makita ang map') ||
      q.includes('i want to see the map') ||
      q.includes('open the map') ||
      q.includes('tan-awon nako ang mapa') ||
      q.includes('adtoon ang mapa') ||
      q.includes('ablihi ang mapa') ||
      q.includes('ablihan ang mapa') ||
      q.includes('buksan ang mapa') ||
      q.includes('buksan ang map') ||
      q.includes('open map') ||
      q.includes('pakit-a ko sa mapa') ||
      q.includes('pakita ang mapa');

    if (isMapNavQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Sige! Pwede mong i-click ang **'GIS Rice Map & Polygons'** sa menu sa kaliwa, o i-click ito nang direkta:`,
          actions: [
            { type: 'nav:map', tab: 'map', label: '🗺️ Buksan ang GIS Map', iconType: 'map' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Sure! You can click **'GIS Rice Map & Polygons'** on the left menu, or click here directly:`,
          actions: [
            { type: 'nav:map', tab: 'map', label: '🗺️ Open GIS Map', iconType: 'map' }
          ]
        };
      }
      return {
        text: `Sige! Pwede nimo i-click ang **'GIS Rice Map & Polygons'** sa menu sa wala, o i-click kini direkta:`,
        actions: [
          { type: 'nav:map', tab: 'map', label: '🗺️ Ablihi ang GIS Map', iconType: 'map' }
        ]
      };
    }

    const isRecordsNavQuery =
      q.includes('gusto ko motan-aw sa records') ||
      q.includes('gusto ko makakita sa records') ||
      q.includes('ablihi ang records') ||
      q.includes('ablihan ang records') ||
      q.includes('buksan ang records') ||
      q.includes('open records') ||
      q.includes('tan-awon nako ang records') ||
      q.includes('talaan sa mag-uuma') ||
      q.includes('open database');

    if (isRecordsNavQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Sige! Pwede mong i-click ang **'Rice Farm Records'** sa menu sa kaliwa, o i-click ito nang direkta:`,
          actions: [
            { type: 'nav:eartags', tab: 'eartags', label: '🌾 Buksan ang Records Database', iconType: 'eartags' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Sure! You can click **'Rice Farm Records'** on the left menu, or click here directly:`,
          actions: [
            { type: 'nav:eartags', tab: 'eartags', label: '🌾 Open Records Database', iconType: 'eartags' }
          ]
        };
      }
      return {
        text: `Sige! Pwede nimo i-click ang **'Rice Farm Records'** sa menu sa wala, o i-click kini direkta:`,
        actions: [
          { type: 'nav:eartags', tab: 'eartags', label: '🌾 Ablihi ang Records Database', iconType: 'eartags' }
        ]
      };
    }

    const isReportsNavQuery =
      q.includes('gusto ko motan-aw sa reports') ||
      q.includes('gusto ko makakita sa reports') ||
      q.includes('ablihi ang reports') ||
      q.includes('ablihan ang reports') ||
      q.includes('buksan ang reports') ||
      q.includes('open reports') ||
      q.includes('official reports') ||
      q.includes('print reports');

    if (isReportsNavQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Sige! Pwede mong i-click ang **'Print Official Reports & Masterlist'** sa menu sa kaliwa, o i-click ito nang direkta:`,
          actions: [
            { type: 'nav:reports', tab: 'reports', label: '📄 Buksan ang Official Reports', iconType: 'reports' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Sure! You can click **'Print Official Reports & Masterlist'** on the left menu, or click here directly:`,
          actions: [
            { type: 'nav:reports', tab: 'reports', label: '📄 Open Official Reports', iconType: 'reports' }
          ]
        };
      }
      return {
        text: `Sige! Pwede nimo i-click ang **'Print Official Reports & Masterlist'** sa menu sa wala, o i-click kini direkta:`,
        actions: [
          { type: 'nav:reports', tab: 'reports', label: '📄 Ablihi ang Official Reports', iconType: 'reports' }
        ]
      };
    }

    const isDashboardNavQuery =
      q.includes('gusto ko motan-aw sa dashboard') ||
      q.includes('ablihi ang dashboard') ||
      q.includes('buksan ang dashboard') ||
      q.includes('executive dashboard') ||
      q.includes('open dashboard');

    if (isDashboardNavQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Sige! Pwede mong i-click ang **'Executive Dashboard'** sa menu sa kaliwa, o i-click ito nang direkta:`,
          actions: [
            { type: 'nav:dashboard', tab: 'dashboard', label: '📊 Buksan ang Dashboard', iconType: 'dashboard' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Sure! You can click **'Executive Dashboard'** on the left menu, or click here directly:`,
          actions: [
            { type: 'nav:dashboard', tab: 'dashboard', label: '📊 Open Dashboard', iconType: 'dashboard' }
          ]
        };
      }
      return {
        text: `Sige! Pwede nimo i-click ang **'Executive Dashboard'** sa menu sa wala, o i-click kini direkta:`,
        actions: [
          { type: 'nav:dashboard', tab: 'dashboard', label: '📊 Ablihi ang Dashboard', iconType: 'dashboard' }
        ]
      };
    }

    const isAccountsNavQuery =
      q.includes('gusto ko motan-aw sa accounts') ||
      q.includes('gusto ko motan-aw sa lft') ||
      q.includes('lft field accounts') ||
      q.includes('lft accounts') ||
      q.includes('field accounts') ||
      q.includes('ablihi ang accounts') ||
      q.includes('ablihi ang lft') ||
      q.includes('buksan ang accounts') ||
      q.includes('open accounts') ||
      q.includes('field technicians');

    if (isAccountsNavQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Sige! Pwede mong i-click ang **'LFT Field Accounts'** sa menu sa kaliwa, o i-click ito nang direkta:`,
          actions: [
            { type: 'nav:accounts', tab: 'accounts', label: '👥 Buksan ang LFT Field Accounts', iconType: 'accounts' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Sure! You can click **'LFT Field Accounts'** on the left menu, or click here directly:`,
          actions: [
            { type: 'nav:accounts', tab: 'accounts', label: '👥 Open LFT Field Accounts', iconType: 'accounts' }
          ]
        };
      }
      return {
        text: `Sige! Pwede nimo i-click ang **'LFT Field Accounts'** sa menu sa wala, o i-click kini direkta:`,
        actions: [
          { type: 'nav:accounts', tab: 'accounts', label: '👥 Ablihi ang LFT Accounts', iconType: 'accounts' }
        ]
      };
    }

    const isPhotosNavQuery =
      q.includes('gusto ko motan-aw sa photo') ||
      q.includes('gusto ko motan-aw sa litrato') ||
      q.includes('photo & media') ||
      q.includes('media gallery') ||
      q.includes('mga litrato') ||
      q.includes('mga hulagway') ||
      q.includes('ablihi ang photo') ||
      q.includes('ablihi ang litrato') ||
      q.includes('open photos');

    if (isPhotosNavQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Sige! Pwede mong i-click ang **'Photo & Media Gallery'** sa menu sa kaliwa, o i-click ito nang direkta:`,
          actions: [
            { type: 'nav:photos', tab: 'photos', label: '📸 Buksan ang Photo & Media', iconType: 'photos' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Sure! You can click **'Photo & Media Gallery'** on the left menu, or click here directly:`,
          actions: [
            { type: 'nav:photos', tab: 'photos', label: '📸 Open Photo & Media Gallery', iconType: 'photos' }
          ]
        };
      }
      return {
        text: `Sige! Pwede nimo i-click ang **'Photo & Media Gallery'** sa menu sa wala, o i-click kini direkta:`,
        actions: [
          { type: 'nav:photos', tab: 'photos', label: '📸 Ablihi ang Photo & Media', iconType: 'photos' }
        ]
      };
    }

    const isSettingsNavQuery =
      q.includes('gusto ko motan-aw sa settings') ||
      q.includes('system settings') ||
      q.includes('ablihi ang settings') ||
      q.includes('buksan ang settings') ||
      q.includes('open settings') ||
      q.includes('konpigurasyon');

    if (isSettingsNavQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Sige! Pwede mong i-click ang **'System Settings'** sa menu sa kaliwa, o i-click ito nang direkta:`,
          actions: [
            { type: 'nav:settings', tab: 'settings', label: '⚙️ Buksan ang System Settings', iconType: 'settings' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Sure! You can click **'System Settings'** on the left menu, or click here directly:`,
          actions: [
            { type: 'nav:settings', tab: 'settings', label: '⚙️ Open System Settings', iconType: 'settings' }
          ]
        };
      }
      return {
        text: `Sige! Pwede nimo i-click ang **'System Settings'** sa menu sa wala, o i-click kini direkta:`,
        actions: [
          { type: 'nav:settings', tab: 'settings', label: '⚙️ Ablihi ang Settings', iconType: 'settings' }
        ]
      };
    }

    // Helper: Match parcels by farmer name or token words in query
    const findMatchingFarmerParcels = (text: string): FarmParcel[] => {
      const words = text
        .toLowerCase()
        .replace(/[?!.,;:()'"]/g, ' ')
        .split(/\s+/)
        .filter((w) => {
          return (
            w.length >= 3 &&
            ![
              'asa', 'dapit', 'ang', 'basakan', 'ni', 'kang', 'sa', 'nasaan', 'saan', 'where',
              'is', 'the', 'farm', 'of', 'tabangi', 'ko', 'og', 'pangita', 'mag-uuma', 'silago',
              'sino', 'kinsa', 'mga', 'nga', 'pila', 'ka', 'ha', 'unsaon', 'pag', 'rehistro',
              'bag-ong', 'palayan', 'naa', 'dinhi', 'kinsay'
            ].includes(w)
          );
        });

      if (words.length === 0) return [];

      return parcels.filter((p) => {
        const fullName = `${p.farmerFamilyName || ''} ${p.farmerGivenName || ''} ${p.farmerMiddleName || ''} ${p.raiserName || ''}`.toLowerCase();
        if (words.length === 1) {
          return fullName.includes(words[0]);
        }
        const matchesCount = words.filter((w) => fullName.includes(w)).length;
        return matchesCount >= Math.min(2, words.length);
      });
    };

    // 3. SCENARIO 3: How to register a new rice farm (Step-by-step guidance)
    const isRegistrationQuery =
      q.includes('unsaon pag-rehistro') ||
      q.includes('unsaon pag rehistro') ||
      q.includes('unsaon pagparehistro') ||
      q.includes('unsaon pag-add') ||
      q.includes('unsaon pag add') ||
      q.includes('paano magrehistro') ||
      q.includes('paano mag-rehistro') ||
      q.includes('paano magdagdag') ||
      q.includes('how to register') ||
      q.includes('how do i register') ||
      q.includes('how to enroll') ||
      q.includes('how to add') ||
      q.includes('steps to register') ||
      q.includes('proseso sa pagrehistro') ||
      (q.includes('unsaon') && (q.includes('rehistro') || q.includes('lista') || q.includes('basakan'))) ||
      (q.includes('paano') && (q.includes('rehistro') || q.includes('palayan')));

    if (isRegistrationQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Para makapagparehistro ng bagong palayan sa ating sistema, sundin ang mga sumusunod na hakbang:\n\n1. **I-click ang '+ Add Rice Farm Registration'** button (o ang shortcut button sa ibaba).\n2. **I-type ang RSBSA Number** (Format: \`08-64-16-002-XXXXXX\`). Awtomatiko itong sinusuri ng sistema upang maiwasan ang duplicate records.\n3. **Ilagay ang Buong Pangalan ng Magsasaka** (Apelyido, Pangalan, Gitnang Pangalan) at piliin ang **Barangay**.\n4. **Contact Number:** Numero lamang (0–9) at gitling (-), 11-digit simula sa '09' (hal., \`0917-555-1234\`).\n5. **Sukat ng Lupa (Lot Area in Hectares)** at ang Tenure Status (May-ari/Owner, Kasama/Tenant, o ARB).\n6. **Centroid GPS Coordinates** (Latitude at Longitude) o i-pin sa mapa upang matukoy ang mismong lokasyon.\n7. **Barayti ng Binhi at Uri ng Patubig** (Irrigated Lowland, Rainfed Lowland, o Upland).\n8. I-click ang **'I-save ang Basakan'** upang mai-save sa talaan ng DA-MAO.\n\n⚠️ **Pahibalo:** Likayan ang duplicate records. Ang RSBSA number ug tibuok ngalan kinahanglang talagsaon (unique) sa database. Awtomatikong mag-synchronize ang mga bagong talaan sa lahat ng devices via Supabase Realtime nang hindi kailangang mag-refresh ng page.\n\n*Nais mo bang buksan ko na agad ang registration form ngayon?*`,
          actions: [
            { type: 'action:add_parcel', label: '➕ Mag-rehistro ng Basakan', iconType: 'add_parcel' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `To register a new rice farm in the registry, follow these step-by-step instructions:\n\n1. **Click the '+ Add Rice Farm Registration'** button (or use the shortcut button below).\n2. **Enter the RSBSA Reference Number** (Format: \`08-64-16-002-XXXXXX\`). The system automatically checks for duplicates in real time.\n3. **Enter Farmer Details** (Family Name, Given Name, Middle Name) and select the **Barangay**.\n4. **Contact Number:** Numeric digits only (0–9) and optional standard dashes (-), standard 11-digit starting with '09' (e.g., \`0917-555-1234\`).\n5. **Lot Area (in Hectares)** and Land Tenure Status (Owner, Tenant, or ARB).\n6. **Centroid GPS Coordinates** (Latitude & Longitude) or click 'Pin sa Mapa' to georeference the parcel.\n7. **Seed Variety & Irrigation Regime** (Irrigated Lowland, Rainfed Lowland, or Upland).\n8. Click **'I-save ang Basakan'** to officially store the plot into the DA-MAO master registry.\n\n⚠️ **Notice:** Avoid duplicate records. The RSBSA number and full farmer name must be unique in the database. Records automatically sync across all devices via Supabase Realtime without requiring page reloads.\n\n*Would you like me to open the registration form right now?*`,
          actions: [
            { type: 'action:add_parcel', label: '➕ + Enroll New Farm', iconType: 'add_parcel' }
          ]
        };
      }
      return {
        text: `Aron makarehistro og bag-ong basakan sa sistema, sunda kining mga lakang:\n\n1. **I-klik ang '+ Add Rice Farm Registration'** button (o ang shortcut button sa ubos).\n2. **I-type ang RSBSA Number** sa mag-uuma (Format: \`08-64-16-002-XXXXXX\`). Awtomatiko kining susihon sa sistema batok sa live database aron malikayan ang duplicate entry.\n3. **Isulod ang Ngalan sa Mag-uuma** (Apelyido, Unang Ngalan, ug Tungatungang Ngalan) ug pilia ang **Barangay**.\n4. **Contact Number:** Numero lamang (0–9) ug standard dashes (-), 11-digit sugod sa '09' (pananglitan: \`0917-555-1234\`). Bawal ang letra o invalid characters.\n5. **Sukod sa Yuta (Lot Area in Hectares)** ug ang Tenure Status (Tag-iya/Owner, Tenant, o ARB).\n6. **Centroid GPS Coordinates** (Latitude & Longitude) o i-klik ang 'Pin sa Mapa' aron matudlo ang luna.\n7. **Klase sa Binhi ug Pamaagi sa Tubig** (Irrigated Lowland, Rainfed Lowland, o Upland).\n8. I-klik ang **'I-save ang Basakan'** aron opisyal kining maapil sa talaan sa DA-MAO.\n\n⚠️ **Pahibalo:** Likayan ang duplicate records. Ang RSBSA number ug tibuok ngalan kinahanglang talagsaon (unique) sa database. Awtomatikong mag-synchronize ang mga bag-ong tala sa tanang devices pinaagi sa Supabase Realtime—dili na kinahanglan mag-refresh sa page.\n\n*Gusto ba nimo nga ablihan nato ang registration form karon dayon?*`,
        actions: [
          { type: 'action:add_parcel', label: '➕ Mag-rehistro og Basakan', iconType: 'add_parcel' }
        ]
      };
    }

    // 4. SCENARIO 4: Locating a specific farmer's farm (e.g. "Asa dapit ang basakan ni Mario Alas?", "Where is Mario Alas's farm?")
    const isLocationQuery =
      q.includes('asa dapit') ||
      q.includes('asa ang') ||
      q.includes('nasaan ang') ||
      q.includes('saan ang') ||
      q.includes('where is') ||
      q.includes('locate') ||
      q.includes('lokasyon ni') ||
      q.includes('location of');

    if (isLocationQuery) {
      const matchedParcels = findMatchingFarmerParcels(q);
      if (matchedParcels.length > 0) {
        const p = matchedParcels[0];
        const farmerName = formatFarmerDisplayName(p);
        const areaStr = p.weightKg ? `${p.weightKg.toFixed(2)} ka ektarya` : '0.25 ka ektarya';
        const areaHa = p.weightKg ? `${p.weightKg.toFixed(2)} ha` : '0.25 ha';

        if (lang === 'tagalog') {
          return {
            text: `Ang palayan ni **${farmerName}** ay matatagpuan sa **Barangay ${p.barangay}**:\n\n- 📐 **Laki ng Parsela:** ${areaHa}\n- 🏷️ **RSBSA Stub:** \`${p.swineNameOrId || 'Narehistro'}\`\n- 🌾 **Barayti ng Binhi:** ${p.breed || 'NSIC Rc 222'}\n- 💧 **Uri ng Patubig:** ${p.purpose || 'Irrigated Lowland (NIA)'}\n- 📍 **GPS Coordinates:** \`${p.lat || '10.5312'}, ${p.lng || '125.1643'}\`\n\nI-click ang shortcut button sa ibaba upang agad itong matukoy sa GIS Map o i-filter sa records.`,
            actions: [
              {
                type: 'action:locate_parcel',
                parcel: p,
                label: '📍 I-locate sa Mapa',
                iconType: 'map'
              },
              {
                type: 'action:filter_records',
                parcel: p,
                searchTerm: p.raiserName,
                label: '📋 I-filter sa Records',
                iconType: 'eartags'
              }
            ],
            farmerResults: [p]
          };
        }
        if (lang === 'english') {
          return {
            text: `The farm of **${farmerName}** is located in **Barangay ${p.barangay}**:\n\n- 📐 **Parcel Area:** ${areaHa}\n- 🏷️ **RSBSA Reference:** \`${p.swineNameOrId || 'Registered'}\`\n- 🌾 **Seed Variety:** ${p.breed || 'NSIC Rc 222'}\n- 💧 **Irrigation Regime:** ${p.purpose || 'Irrigated Lowland (NIA)'}\n- 📍 **Centroid GPS:** \`${p.lat || '10.5312'}, ${p.lng || '125.1643'}\`\n\nClick below to locate this plot on the interactive GIS Map or filter the records.`,
            actions: [
              {
                type: 'action:locate_parcel',
                parcel: p,
                label: '📍 I-locate sa Mapa',
                iconType: 'map'
              },
              {
                type: 'action:filter_records',
                parcel: p,
                searchTerm: p.raiserName,
                label: '📋 Filter Records',
                iconType: 'eartags'
              }
            ],
            farmerResults: [p]
          };
        }
        return {
          text: `Ang basakan ni **${farmerName}** nahimutang sa **Barangay ${p.barangay}**:\n\n- 📐 **Sukod sa Luna:** ${areaStr} (${areaHa})\n- 🏷️ **RSBSA Stub:** \`${p.swineNameOrId || 'Narehistro'}\`\n- 🌾 **Klase sa Binhi:** ${p.breed || 'NSIC Rc 222'}\n- 💧 **Ecosystem / Patubig:** ${p.purpose || 'Irrigated Lowland (NIA)'}\n- 📍 **Centroid GPS:** \`${p.lat || '10.5312'}, ${p.lng || '125.1643'}\`\n\nI-klik ang buton sa ubos aron ma-locate sa GIS Mapa o i-filter ang records sa database.`,
            actions: [
              {
                type: 'action:locate_parcel',
                parcel: p,
                label: '📍 I-locate sa Mapa',
                iconType: 'map'
              },
              {
                type: 'action:filter_records',
                parcel: p,
                searchTerm: p.raiserName,
                label: '📋 I-filter sa Records',
                iconType: 'eartags'
              }
            ],
            farmerResults: [p]
          };
      }
    }

    // 7. Farmers in a specific barangay (e.g. "Kinsay mag-uuma sa Balagawan?", "Pila ka mag-uuma sa Balagawan?", "Who are the farmers in Balagawan?")
    const mentionedBarangayObj = BARANGAYS.find((b) => q.includes(b.name.toLowerCase()));
    const isBarangayFarmerListQuery =
      mentionedBarangayObj &&
      (q.includes('kinsay mag-uuma') ||
        q.includes('kinsa ang mag-uuma') ||
        q.includes('kinsa ang mga mag-uuma') ||
        q.includes('mga mag-uuma sa') ||
        q.includes('mag-uuma sa') ||
        q.includes('pila ka mag-uuma') ||
        q.includes('pila ka maguuma') ||
        q.includes('pila kabuok mag-uuma') ||
        q.includes('pila ka mag uuma') ||
        q.includes('pila ka farmers') ||
        q.includes('pila kabuok basakan') ||
        q.includes('pila ka basakan') ||
        q.includes('ilan ang magsasaka') ||
        q.includes('how many farmers') ||
        q.includes('how many parcels') ||
        q.includes('sino ang magsasaka') ||
        q.includes('mga magsasaka sa') ||
        q.includes('who are the farmers') ||
        q.includes('farmers in') ||
        q.includes('list of farmers') ||
        q.includes('talaan sa mag-uuma') ||
        q.includes('rehistrado sa'));

    if (mentionedBarangayObj && isBarangayFarmerListQuery) {
      const bName = mentionedBarangayObj.name;
      const bParcels = parcels.filter((p) => p.barangay.toLowerCase() === bName.toLowerCase());

      if (bParcels.length > 0) {
        const totalBrgyArea = bParcels.reduce((sum, p) => sum + (p.weightKg || 0), 0);
        const farmerListRows = bParcels
          .map((p, idx) => {
            const name = formatFarmerDisplayName(p);
            const rsbsa = p.swineNameOrId || 'Pending';
            const area = p.weightKg ? `${p.weightKg.toFixed(2)} ha` : '0.25 ha';
            const variety = p.breed || 'NSIC Rc 222';
            return `${idx + 1}. **${name}** — RSBSA: \`${rsbsa}\` • Sukod: ${area} • Binhi: ${variety}`;
          })
          .join('\n');

        if (lang === 'tagalog') {
          return {
            text: `Sa **Barangay ${bName}**, mayroon tayong **${bParcels.length} na rehistradong magsasaka** (kabuuang sukat: ${totalBrgyArea.toFixed(2)} ha):\n\n${farmerListRows}\n\nMaaari mong gamitin ang mga shortcut sa ibaba upang makita ang kanilang mga palayan sa GIS Map o buksan ang opisyal na report.`,
            actions: [
              {
                type: 'action:map_barangay',
                barangay: bName,
                label: `🗺️ I-filter sa Mapa: Brgy. ${bName}`,
                iconType: 'map'
              },
              {
                type: 'action:report_barangay',
                barangay: bName,
                label: `📄 I-filter ang Report: Brgy. ${bName}`,
                iconType: 'reports'
              }
            ],
            farmerResults: bParcels.slice(0, 4)
          };
        }
        if (lang === 'english') {
          return {
            text: `In **Barangay ${bName}**, there are **${bParcels.length} registered rice farmers** (total cultivated area: ${totalBrgyArea.toFixed(2)} ha):\n\n${farmerListRows}\n\nYou can use the shortcut buttons below to view their farm parcels on the GIS Map or generate the official barangay report.`,
            actions: [
              {
                type: 'action:map_barangay',
                barangay: bName,
                label: `🗺️ Filter Map: Brgy. ${bName}`,
                iconType: 'map'
              },
              {
                type: 'action:report_barangay',
                barangay: bName,
                label: `📄 Filter Report: Brgy. ${bName}`,
                iconType: 'reports'
              }
            ],
            farmerResults: bParcels.slice(0, 4)
          };
        }
        return {
          text: `Sa **Barangay ${bName}**, aduna kitay **${bParcels.length} ka rehistradong mag-uuma** (kinatibuk-ang sukod: ${totalBrgyArea.toFixed(2)} ka ektarya):\n\n${farmerListRows}\n\nPwede nimo i-klik ang buton sa ubos aron makita ang ilang mga basakan sa GIS Mapa o ablihan ang opisyal nga report sa barangay.`,
          actions: [
            {
              type: 'action:map_barangay',
              barangay: bName,
              label: `🗺️ Tan-awon sa Mapa: Brgy. ${bName}`,
              iconType: 'map'
            },
            {
              type: 'action:report_barangay',
              barangay: bName,
              label: `📄 I-filter ang Report: Brgy. ${bName}`,
              iconType: 'reports'
            }
          ],
          farmerResults: bParcels.slice(0, 4)
        };
      } else {
        return {
          text: `Sa kasamtangan, wala pay natala nga mag-uuma ubos sa **Barangay ${bName}**. Gusto ba nimo mag-rehistro og bag-ong basakan dinhi?`,
          actions: [
            { type: 'action:add_parcel', label: '➕ Mag-rehistro og Basakan (Add Farm)', iconType: 'add_parcel' }
          ]
        };
      }
    }

    // 6. SCENARIO 1: General Farmer Search (e.g. "Tabangi ko og pangita og mag-uuma sa Silago", "Help me find a farmer in Silago")
    const isGeneralFarmerSearch =
      q.includes('tabangi ko og pangita og mag-uuma') ||
      q.includes('tabangi ko pangita og mag-uuma') ||
      q.includes('tabangi ko pangita') ||
      q.includes('pangita og mag-uuma') ||
      q.includes('pangitaon ang mag-uuma') ||
      q.includes('mangita kog mag-uuma') ||
      q.includes('help me find a farmer') ||
      q.includes('find a farmer') ||
      q.includes('search for farmer') ||
      q.includes('maghanap ng magsasaka') ||
      q.includes('tulungan mo akong maghanap ng magsasaka') ||
      q.includes('hanapin ang magsasaka');

    if (isGeneralFarmerSearch) {
      if (lang === 'tagalog') {
        return {
          text: `Oo, handa akong tumulong! Sinong magsasaka ang iyong hinahanap, o anong Barangay ang nais nating suriin? Maaari mong i-type ang apelyido (halimbawa: 'Alas', 'Aling', o 'Casicas') o ang RSBSA number para ma-filter natin agad sa database.`,
          actions: [
            { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records Database', iconType: 'eartags' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Yes, I am ready to help! Which farmer are you looking for, or which Barangay should we check? You can type the family name (for example: 'Alas', 'Aling', or 'Casicas') or the RSBSA number to filter right away in our database.`,
          actions: [
            { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records Database', iconType: 'eartags' }
          ]
        };
      }
      return {
        text: `Oo, andam ko motabang! Kinsa nga mag-uuma ang imong gipangita, o unsa nga Barangay ang atong susihon? Pwede nimo i-type ang apelyido (pananglitan: 'Alas', 'Aling', o 'Casicas') o ang RSBSA number aron ma-filter dayon nako sa database.`,
        actions: [
          { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records Database', iconType: 'eartags' }
        ]
      };
    }

    // 7. Check if user typed a specific farmer's name directly (e.g., "Mario Alas", "Leopoldo Aling", "Casicas", etc.)
    const directFarmerMatches = findMatchingFarmerParcels(q);
    if (directFarmerMatches.length > 0 && !q.includes('pila') && !q.includes('total')) {
      const p = directFarmerMatches[0];
      const farmerName = formatFarmerDisplayName(p);
      const areaHa = p.weightKg ? `${p.weightKg.toFixed(2)} ha` : '0.25 ha';

      if (lang === 'tagalog') {
        return {
          text: `Nahanap ko ang talaan ni **${farmerName}** sa **Barangay ${p.barangay}**:\n\n- 📐 **Sukat ng Lupa:** ${areaHa}\n- 🏷️ **RSBSA No:** \`${p.swineNameOrId || 'Narehistro'}\`\n- 🌾 **Binhi:** ${p.breed || 'NSIC Rc 222'}\n- 💧 **Patubig:** ${p.purpose || 'Irrigated Lowland'}\n\nI-click ang shortcut button sa ibaba upang i-locate sa mapa o i-filter sa talaan.`,
          actions: [
            { type: 'action:locate_parcel', parcel: p, label: '📍 I-locate sa Mapa', iconType: 'map' },
            { type: 'action:filter_records', parcel: p, searchTerm: p.raiserName, label: '📋 I-filter sa Records', iconType: 'eartags' },
            { type: 'action:view_record', parcel: p, label: '🔍 View Record', iconType: 'eartags' }
          ],
          farmerResults: directFarmerMatches.slice(0, 3)
        };
      }
      if (lang === 'english') {
        return {
          text: `Found the record for **${farmerName}** in **Barangay ${p.barangay}**:\n\n- 📐 **Cultivated Area:** ${areaHa}\n- 🏷️ **RSBSA Stub:** \`${p.swineNameOrId || 'Registered'}\`\n- 🌾 **Seed Variety:** ${p.breed || 'NSIC Rc 222'}\n- 💧 **Irrigation Type:** ${p.purpose || 'Irrigated Lowland'}\n\nClick below to locate this farm on the GIS Map or filter the records.`,
          actions: [
            { type: 'action:locate_parcel', parcel: p, label: '📍 I-locate sa Mapa', iconType: 'map' },
            { type: 'action:filter_records', parcel: p, searchTerm: p.raiserName, label: '📋 Filter Records', iconType: 'eartags' },
            { type: 'action:view_record', parcel: p, label: '🔍 View Record', iconType: 'eartags' }
          ],
          farmerResults: directFarmerMatches.slice(0, 3)
        };
      }
      return {
        text: `Nakaplagan nako ang rekord ni **${farmerName}** sa **Barangay ${p.barangay}**:\n\n- 📐 **Sukod sa Basakan:** ${areaHa}\n- 🏷️ **RSBSA Stub:** \`${p.swineNameOrId || 'Narehistro'}\`\n- 🌾 **Klase sa Binhi:** ${p.breed || 'NSIC Rc 222'}\n- 💧 **Patubig:** ${p.purpose || 'Irrigated Lowland'}\n\nPwede nimo i-klik ang buton sa ubos aron ma-locate sa mapa o i-filter ang mga talaan.`,
        actions: [
          { type: 'action:locate_parcel', parcel: p, label: '📍 I-locate sa Mapa', iconType: 'map' },
          { type: 'action:filter_records', parcel: p, searchTerm: p.raiserName, label: '📋 I-filter sa Records', iconType: 'eartags' },
          { type: 'action:view_record', parcel: p, label: '🔍 View Record', iconType: 'eartags' }
        ],
        farmerResults: directFarmerMatches.slice(0, 3)
      };
    }

    // 8. ANALYTICAL QUERY A: Largest / biggest farm parcel (kinadak-an / pinakamalaki / largest farm)
    const isLargestFarmQuery =
      q.includes('kinadak-an') ||
      q.includes('kinadak-ag') ||
      q.includes('pinakamalaki') ||
      q.includes('pinakamalaking') ||
      q.includes('pinakamalapad') ||
      q.includes('largest farm') ||
      q.includes('biggest farm') ||
      q.includes('largest parcel');

    if (isLargestFarmQuery) {
      const targetBrgy = BARANGAYS.find((b) => q.includes(b.name.toLowerCase()));
      const pool = targetBrgy
        ? parcels.filter((p) => p.barangay.toLowerCase() === targetBrgy.name.toLowerCase())
        : parcels;

      if (pool.length > 0) {
        const sorted = [...pool].sort((a, b) => (b.weightKg || 0) - (a.weightKg || 0));
        const top = sorted[0];
        const topName = formatFarmerDisplayName(top);
        const topArea = top.weightKg ? `${top.weightKg.toFixed(2)} ka ektarya (${top.weightKg.toFixed(2)} ha)` : '0.25 ha';

        if (lang === 'tagalog') {
          return {
            text: `Ang may pinakamalaking palayan ${targetBrgy ? `sa **Barangay ${targetBrgy.name}**` : 'sa buong Silago'} ay si **${topName}** na may sukat na **${topArea}** (RSBSA: \`${top.swineNameOrId || 'Narehistro'}\`, Barayti: ${top.breed || 'NSIC Rc 222'}, Patubig: ${top.purpose || 'Irrigated Lowland'}).`,
            actions: [
              { type: 'action:locate_parcel', parcel: top, label: '📍 I-locate sa Mapa', iconType: 'map' },
              { type: 'action:filter_records', parcel: top, searchTerm: top.raiserName, label: '📋 I-filter sa Records', iconType: 'eartags' }
            ],
            farmerResults: [top]
          };
        }
        if (lang === 'english') {
          return {
            text: `The largest rice farm ${targetBrgy ? `in **Barangay ${targetBrgy.name}**` : 'in Silago'} belongs to **${topName}** with an area of **${topArea}** (RSBSA: \`${top.swineNameOrId || 'Registered'}\`, Seed Variety: ${top.breed || 'NSIC Rc 222'}, Irrigation: ${top.purpose || 'Irrigated Lowland'}).`,
            actions: [
              { type: 'action:locate_parcel', parcel: top, label: '📍 I-locate sa Mapa', iconType: 'map' },
              { type: 'action:filter_records', parcel: top, searchTerm: top.raiserName, label: '📋 Filter Records', iconType: 'eartags' }
            ],
            farmerResults: [top]
          };
        }
        return {
          text: `Ang may kinadak-an nga basakan ${targetBrgy ? `sa **Barangay ${targetBrgy.name}**` : 'sa tibuok Silago'} mao si **${topName}** nga may gidak-on nga **${topArea}** (RSBSA: \`${top.swineNameOrId || 'Narehistro'}\`, Barayti: ${top.breed || 'NSIC Rc 222'}, Patubig: ${top.purpose || 'Irrigated Lowland'}).`,
          actions: [
            { type: 'action:locate_parcel', parcel: top, label: '📍 I-locate sa Mapa', iconType: 'map' },
            { type: 'action:filter_records', parcel: top, searchTerm: top.raiserName, label: '📋 I-filter sa Records', iconType: 'eartags' }
          ],
          farmerResults: [top]
        };
      }
    }

    // 9. ANALYTICAL QUERY B: Farmers without GPS coordinates (e.g. "Pila kabuok mag-uuma ang walay GPS coordinates?")
    const isMissingGpsQuery =
      (q.includes('walay') || q.includes('walang') || q.includes('pila') || q.includes('ilan') || q.includes('without') || q.includes('missing')) &&
      (q.includes('gps') || q.includes('coordinate') || q.includes('geotag') || q.includes('coordinates'));

    if (isMissingGpsQuery) {
      const missingParcels = parcels.filter((p) => !p.lat || !p.lng || (p.lat === 0 && p.lng === 0));
      const totalCount = parcels.length;
      const missingCount = missingParcels.length;

      if (missingCount === 0) {
        if (lang === 'tagalog') {
          return {
            text: `Magandang balita! Sa kasalukuyang **${totalCount} na rehistradong palayan** sa Silago, **100% kumpleto at georeferenced** na ang centroid GPS coordinates. Walang palayan na walang coordinates sa ating GIS database.`,
            actions: [
              { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' }
            ]
          };
        }
        if (lang === 'english') {
          return {
            text: `Great news! Out of the **${totalCount} registered rice farms** in Silago, **100% are fully georeferenced** with centroid GPS coordinates. There are currently zero plots missing coordinates in our GIS database.`,
            actions: [
              { type: 'nav:map', tab: 'map', label: '📍 Open GIS Map', iconType: 'map' }
            ]
          };
        }
        return {
          text: `Maayong balita! Sa kasamtangang **${totalCount} ka rehistradong basakan** sa Silago, **100% nga kompleto ug georeferenced** na ang centroid GPS coordinates. Walay basakan nga walay coordinate sa atong GIS database.`,
          actions: [
            { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' }
          ]
        };
      } else {
        const rows = missingParcels.slice(0, 5).map((p, idx) => {
          const name = formatFarmerDisplayName(p);
          return `${idx + 1}. **${name}** (Brgy. ${p.barangay}, RSBSA: \`${p.swineNameOrId || 'None'}\`)`;
        }).join('\n');

        return {
          text: `Sa **${totalCount} ka narehistro nga basakan** sa Silago, aduna may **${missingCount} kabuok** nga wala pay georeferenced GPS coordinates:\n\n${rows}\n\nMahimo kining subayon ug i-geotag sa atong mga LFT field technicians gamit ang GPS tool.`,
          actions: [
            { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records Database', iconType: 'eartags' },
            { type: 'action:add_parcel', label: '➕ Mag-rehistro og Basakan', iconType: 'add_parcel' }
          ],
          farmerResults: missingParcels.slice(0, 4)
        };
      }
    }

    // 10. ANALYTICAL QUERY C: Specific seed variety inquiries (e.g. "Kinsay nagtanom og Rc 222?", "Sino ang nagtanim ng Rc 222?")
    const isVarietyFarmerQuery =
      (q.includes('nagtanom') || q.includes('nagtanim') || q.includes('planted') || q.includes('kinsay nag') || q.includes('sino ang nag') || q.includes('who planted')) &&
      (q.includes('rc') || q.includes('222') || q.includes('160') || q.includes('216') || q.includes('480') || q.includes('dinorado') || q.includes('sl-8h') || q.includes('hybrid') || q.includes('binhi'));

    if (isVarietyFarmerQuery) {
      const tokens = ['222', '160', '216', '480', '18', 'dinorado', 'sl-8h', 'organic red'];
      const matchedToken = tokens.find((t) => q.includes(t)) || '222';
      const varietyMatches = parcels.filter((p) => (p.breed || '').toLowerCase().includes(matchedToken));

      if (varietyMatches.length > 0) {
        const rows = varietyMatches.map((p, idx) => {
          const name = formatFarmerDisplayName(p);
          const area = p.weightKg ? `${p.weightKg.toFixed(2)} ha` : '0.25 ha';
          return `${idx + 1}. **${name}** — Brgy. ${p.barangay} (${area} • ${p.breed || 'NSIC Rc 222'} • ${p.healthStatus || 'Vegetative'})`;
        }).join('\n');

        const varietyLabel = varietyMatches[0].breed || `NSIC Rc ${matchedToken}`;

        if (lang === 'tagalog') {
          return {
            text: `Narito ang mga magsasaka sa Silago na nagtanim ng **${varietyLabel}**:\n\n${rows}\n\nKabuuang parsela: **${varietyMatches.length} plots**.`,
            actions: [
              { type: 'action:filter_records', searchTerm: varietyLabel, label: `📋 I-filter sa Records: ${varietyLabel}`, iconType: 'eartags' },
              { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' }
            ],
            farmerResults: varietyMatches.slice(0, 4)
          };
        }
        if (lang === 'english') {
          return {
            text: `Here are the Silago farmers currently cultivating **${varietyLabel}**:\n\n${rows}\n\nTotal parcels: **${varietyMatches.length} plots**.`,
            actions: [
              { type: 'action:filter_records', searchTerm: varietyLabel, label: `📋 Filter Records: ${varietyLabel}`, iconType: 'eartags' },
              { type: 'nav:map', tab: 'map', label: '📍 Open GIS Map', iconType: 'map' }
            ],
            farmerResults: varietyMatches.slice(0, 4)
          };
        }
        return {
          text: `Ania ang mga mag-uuma sa Silago nga nagtanom og **${varietyLabel}**:\n\n${rows}\n\nKinatibuk-ang luna: **${varietyMatches.length} ka basakan**.`,
          actions: [
            { type: 'action:filter_records', searchTerm: varietyLabel, label: `📋 I-filter sa Records: ${varietyLabel}`, iconType: 'eartags' },
            { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' }
          ],
          farmerResults: varietyMatches.slice(0, 4)
        };
      }
    }

    // 11. AGRONOMIC GUIDANCE: Pest Management (IPM), Fertilizer Schedules, and PCIC Crop Insurance Claims
    const isPestQuery =
      q.includes('dangan') || q.includes('peste') || q.includes('pest') || q.includes('kuhol') ||
      q.includes('stem borer') || q.includes('stemborer') || q.includes('planthopper') || q.includes('bacterial') ||
      q.includes('ulat') || q.includes('ilaga') || q.includes('daga') || q.includes('tungro');

    if (isPestQuery) {
      if (lang === 'tagalog') {
        return {
          text: `Narito ang opisyal na gabay sa **Integrated Pest Management (IPM)** mula sa DA-PhilRice at DA-MAO Silago:\n\n1. **Golden Apple Snail (Kuhol):** Panatilihing mababaw ang tubig (2–3 cm) pagkatapos maglipat-tanim; maglagay ng screen sa daluyan ng tubig; mag-alaga ng pato bago magtanim.\n2. **Rice Stem Borer (Aksip):** Iwasan ang sobrang nitroheno (Urea); gumamit ng Trichogramma cards mula sa MAO; mag-spray lamang kung lumampas na sa 5% deadheart o whitehead.\n3. **Brown Planthopper (BPH):** Magsagawa ng alternate wetting and drying (AWD) upang mabawasan ang halumigmig sa base ng palay.\n4. **Daga / Rodents:** Magsagawa ng sabayang pagtatanim (community rat hunting) at gumamit ng baiting stations sa gilid ng pilapil.\n\n*Para sa libreng biocontrol agents at technical assistance, bumisita sa DA-MAO Silago Hotline: (053) 572-8812.*`
        };
      }
      return {
        text: `Ania ang opisyal nga giya sa **Integrated Pest Management (IPM)** gikan sa DA-PhilRice ug DA-MAO Silago:\n\n1. **Kuhol (Golden Apple Snail):** Paminosa ang tubig (2–3 cm) sa bag-ong tanom; pagbutang og wire mesh sa agianan sa tubig; pakan-a og itik ang basakan una itanom.\n2. **Rice Stem Borer (Aksip / Mananap sa Puno):** Ayaw pasubrihi ang abuno nga Urea; pagkuha og libreng Trichogramma parasitoid cards sa MAO; sprayhan lang kon molapas sa 5% ang deadheart.\n3. **Brown Planthopper (BPH / Dangaw):** Ipatuman ang Alternate Wetting and Drying (AWD) aron makasulod ang hangin sa punoan sa humay.\n4. **Ilaga (Rats):** Maghugpong ang barangay sa sabay nga pagtanom ug magbutang og baiting stations sa mga pilapil.\n\n*Alang sa libreng technical assistance, duaw sa DA-MAO Silago Hotline: (053) 572-8812.*`
      };
    }

    const isFertilizerQuery =
      q.includes('abuno') || q.includes('pataba') || q.includes('fertilizer') || q.includes('urea') ||
      q.includes('npk') || q.includes('rekomendasyon sa abuno') || q.includes('schedule sa abuno');

    if (isFertilizerQuery) {
      return {
        text: `Mao kini ang girekomendar nga **Fertilizer Schedule (Split Application)** alang sa Silago (${ACTIVE_SEASON}):\n\n1. **Basal Application (0–14 DAT - Pagtanom):** 4 ka sako nga Complete (14-14-14) matag ektarya aron molig-on ang gamut ug sayong pagsaha.\n2. **Early Tillering (21–28 DAT - Pagsaha):** 1.5 ka sako nga Urea (46-0-0) o 2 ka sako nga Ammonium Sulfate (21-0-0) alang sa berdeng dahon ug daghang saha.\n3. **Panicle Initiation (40–45 DAT - Pagsabak):** 1 ka sako nga 16-20-0 o 0.5 sako Muriate of Potash (0-0-60) aron solid ang lugas ug dili dali mapukan sa hangin.\n\n*Pahinumdom: Gamita ang Minus-One Element Technique (MOET) kit sa MAO aron maeksakto ang kulang sa inyong yuta.*`
      };
    }

    const isPcicQuery =
      q.includes('pcic') || q.includes('insurance') || q.includes('kalamidad') || q.includes('bagyo') ||
      q.includes('baha') || q.includes('danyos') || q.includes('claim') || q.includes('indemnity');

    if (isPcicQuery) {
      return {
        text: `Mao kini ang opisyal nga lakang sa **PCIC Crop Insurance Claim** sa Silago kon makasinati og kadaot sa baha, bagyo, o dangan:\n\n1. **Notice of Loss (NL) Filing:** Ipasa ang Notice of Loss sa DA-MAO Silago sulod sa **7 ka adlaw** gikan sa pagkahitabo sa kalamidad.\n2. **DA-MAO Validation:** Susihon sa Municipal Agriculturist ug LFT Field Officer ang aktuwal nga kadaot sa basakan base sa RSBSA registration.\n3. **Dokumento nga Kinahanglan:**\n   - Napun-an nga PCIC Claim for Indemnity Form\n   - Barangay Certification sa kalamidad\n   - Hulagway (Photo) sa nadaot nga basakan nga may geo-tag\n   - RSBSA Stub o Enrollment ID\n4. **Indemnity Payout:** I-release sa PCIC pinaagi sa LandBank / LBP cash card o tseke sa mag-uuma.\n\n*Para sa tabang, kontaka ang atong Office Focal Person o Hotline (053) 572-8812.*`,
        actions: [
          { type: 'nav:reports', tab: 'reports', label: '📄 Buksan ang Reports & Claims', iconType: 'reports' },
          { type: 'nav:eartags', tab: 'eartags', label: '🌾 Rice Farm Records Database', iconType: 'eartags' }
        ]
      };
    }

    // 12. RSBSA Requirements / Form Inquiry
    if (q.includes('rsbsa') && (q.includes('requirement') || q.includes('rekisito') || q.includes('kailangan') || q.includes('unsa ang kinahanglan') || q.includes('enrollment'))) {
      return {
        text: `Ania ang mga opisyal nga rekisito alang sa **RSBSA Enrollment** sa Silago:\n\n1. **Official DA-RSBSA Enrollment Form:** Kompleto nga 16-digit system stub nga pirmado sa mag-uuma.\n2. **Pamatuod sa Yuta (Land Tenure):** Katibayan sa titulo, CLOA, o Barangay Tenancy Certification kon tenant.\n3. **Valid Photo ID:** PhilSys National ID o Voter's Certification.\n4. **Centroid GPS Coordinates:** Gisubay sa LFT field officer sa aktuwal nga basakan.\n\n*Gusto ba nimo mag-rehistro og mag-uuma karon?*`,
        actions: [
          { type: 'action:add_parcel', label: '➕ Mag-rehistro og Mag-uuma', iconType: 'add_parcel' },
          { type: 'nav:reports', tab: 'reports', label: '📄 RSBSA Masterlist', iconType: 'reports' }
        ]
      };
    }

    // 13. Seed Varieties Inquiry
    if (q.includes('variety') || q.includes('varieties') || q.includes('binhi') || q.includes('barayti') || (q.includes('seed') && !q.includes('how'))) {
      return {
        text: `Mao kini ang mga girekomendar nga barayti sa binhi sa Silago alang sa **${ACTIVE_SEASON}**:\n\n- **Inbred Lines:** **NSIC Rc 222** (pinakadaghan nga gitanom sa Balagawan ug Mercedes tungod sa abot nga 6–7 MT/ha), **NSIC Rc 160** (humot ug premium), **NSIC Rc 216**.\n- **Hybrid:** **SL-8H**, **Bigante Plus** (alang sa high-input irrigated sectors).\n- **Specialty / Traditional:** **Dinorado**, **Organic Red Rice** (sa mga upland terraces ug San Roque).`
      };
    }

    // 14. Explicit totals / statistics summary inquiry (ONLY when user explicitly asks for totals or hectarage!)
    const isExplicitTotalsInquiry =
      (q.includes('pila tanan') ||
        q.includes('pila ka ektarya') ||
        q.includes('total area') ||
        q.includes('total hectarage') ||
        q.includes('kabuuang ektarya') ||
        q.includes('kinatibuk-ang ektarya') ||
        q.includes('kinatibuk-ang summary') ||
        q.includes('kabuuang sukat') ||
        q.includes('total cultivated') ||
        q.includes('pila kabuok basakan') ||
        q.includes('ilan lahat ang ektarya') ||
        q.includes('overview sa basakan')) &&
      !isRegistrationQuery &&
      !isGeneralFarmerSearch;

    if (isExplicitTotalsInquiry) {
      if (lang === 'tagalog') {
        return {
          text: `Narito ang opisyal na kabuuang datos ng mga palayan sa Silago para sa **${ACTIVE_SEASON}**, ${politeName}:\n\n> 🌾 **Kabuuang Rehistradong Basakan:** **${parcels.length} plots**\n> 📏 **Kabuuang Sukat:** **${totalAreaHa.toFixed(2)} ektarya**\n> 📍 **Nasasakupan:** 15 Barangays ng Silago\n\nMaaari nating buksan ang **GIS Map** upang masuri ang bawat plot o i-print ang official summary report.`,
          actions: [
            { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' },
            { type: 'nav:reports', tab: 'reports', label: '📄 Buksan ang Official Reports', iconType: 'reports' }
          ]
        };
      }
      if (lang === 'english') {
        return {
          text: `Here is the official aggregate rice farm statistics for Silago during **${ACTIVE_SEASON}**, ${politeName}:\n\n> 🌾 **Total Georeferenced Plots:** **${parcels.length} active parcels**\n> 📏 **Total Cultivated Area:** **${totalAreaHa.toFixed(2)} hectares**\n> 📍 **Coverage:** 15 Barangays across Silago\n\nYou can explore these plots on the **GIS Map** or generate official printed reports.`,
          actions: [
            { type: 'nav:map', tab: 'map', label: '📍 Open GIS Map', iconType: 'map' },
            { type: 'nav:reports', tab: 'reports', label: '📄 Open Official Reports', iconType: 'reports' }
          ]
        };
      }
      return {
        text: `Mao kini ang opisyal nga kinatibuk-ang datos sa mga basakan sa Silago alang sa **${ACTIVE_SEASON}**, ${politeName}:\n\n> 🌾 **Kinatibuk-ang Rehistradong Basakan:** **${parcels.length} ka luna**\n> 📏 **Kinatibuk-ang Sukod:** **${totalAreaHa.toFixed(2)} ka ektarya**\n> 📍 **Nasakop:** 15 ka Barangay sa Silago\n\nPwede nato ablihan ang **GIS Map** aron makita ang tagsa-tagsa ka basakan o i-print ang opisyal nga summary report.`,
        actions: [
          { type: 'nav:map', tab: 'map', label: '📍 Buksan ang GIS Map', iconType: 'map' },
          { type: 'nav:reports', tab: 'reports', label: '📄 Buksan ang Official Reports', iconType: 'reports' }
        ]
      };
    }

    // 15. Conversational, Adaptive, Fluid Response (NO rigid canned menus or bulleted suggestion lists)
    if (lang === 'tagalog') {
      return {
        text: `Nandito ako para tumulong sa iyo, ${politeName}! Sabihin mo lang sa akin kung anong impormasyon, talaan ng magsasaka, o bahagi ng sistema ang nais mong silipin o trabahuin ngayon.`
      };
    }
    if (lang === 'english') {
      return {
        text: `I'm right here to assist you, ${politeName}! Just let me know what farmer records, GIS mapping insights, or administrative tasks we should look into right now.`
      };
    }
    return {
      text: `Andam kanunay motabang nimo dinhi sa DA-MAO Silago, ${politeName}! Isulti lang kon unsay atong trabahuon o susihon sa atong mga talaan, mapa, o mag-uuma karon.`
    };
  };

  // Quick Action Prompts helper
  const getQuickPrompts = (lang: SupportedLanguage = activeLanguage) => {
    if (lang === 'tagalog') {
      return [
        { label: '🔍 Maghanap ng Magsasaka', query: 'Tulungan mo akong maghanap ng magsasaka sa Silago' },
        { label: '🗺️ Buksan ang GIS Map', query: 'Buksan ang GIS Map ng mga palayan sa Silago' },
        { label: '📊 Kabuuang Ektarya', query: 'Ilan lahat ang ektaryang natatamnan ng palay sa Silago?' },
        { label: '➕ Paano Magrehistro?', query: 'Paano magrehistro ng bagong basakan sa sistema?' },
        { label: '📄 RSBSA Masterlist', query: 'Ipakita ang opisyal na RSBSA report masterlist' }
      ];
    }
    if (lang === 'english') {
      return [
        { label: '🔍 Search Farmers', query: 'Help me search registered farmers in Silago' },
        { label: '🗺️ Open GIS Map', query: 'Open the GIS Rice Map for Silago' },
        { label: '📊 Total Rice Area', query: 'What is the total cultivated rice hectarage in Silago?' },
        { label: '➕ How to Register Farm', query: 'How do I register a new farm parcel step-by-step?' },
        { label: '📄 RSBSA Masterlist', query: 'Show the official RSBSA report masterlist' }
      ];
    }
    return [
      { label: '🔍 Pangitaa ang Mag-uuma', query: 'Tabangi ko og pangita og mag-uuma sa Silago' },
      { label: '🗺️ Ablihi ang GIS Mapa', query: 'Ablihi ang GIS Mapa sa Silago' },
      { label: '📊 Kinatibuk-ang Ektarya', query: 'Pila tanan ka ektarya ang natamnan ug humay sa Silago?' },
      { label: '➕ Unsaon Pag-rehistro?', query: 'Unsaon nako pag-rehistro og bag-ong basakan?' },
      { label: '📄 RSBSA Masterlist', query: 'Ipakita ang opisyal nga RSBSA masterlist summary' }
    ];
  };

  // Completely close the chat window and reset the active chat state to a fresh slate
  const handleCloseChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setInputMessage('');
    setStreamingText(null);
    setIsLoading(false);
    setLastMatchedParcels([]);
    setLastNavNotice(null);
    setMessages([getFreshWelcomeMessage()]);
  };

  // Minimize the chat window and reset the active chat state
  const handleMinimizeChat = () => {
    setIsMinimized(true);
    setInputMessage('');
    setStreamingText(null);
    setIsLoading(false);
    setLastMatchedParcels([]);
    setLastNavNotice(null);
    setMessages([getFreshWelcomeMessage()]);
  };

  return (
    <div className="no-print">
      {/* 1. Fully Functional Minimized Floating Pill */}
      {isOpen && isMinimized && (
        <div
          onClick={() => {
            setIsMinimized(false);
            setMessages([getFreshWelcomeMessage()]);
            setTimeout(() => inputRef.current?.focus(), 150);
          }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-[#0B1E38] via-[#102A4E] to-[#123E28] text-white rounded-full shadow-2xl border border-emerald-400/40 cursor-pointer hover:scale-105 active:scale-95 transition-all select-none ring-1 ring-white/10 group animate-in fade-in slide-in-from-bottom-2 duration-200"
          title="Restore RiceSsistant window"
        >
          <RiceSsistantLogo size={28} className="ring-1 ring-emerald-300/40 shrink-0" />
          <div className="flex items-center gap-2 pr-1">
            <span className="text-xs font-bold font-serif text-white tracking-wide">
              RiceSsistant
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCloseChat();
            }}
            className="p-1 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition cursor-pointer"
            title="Close chat"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. Floating Circular Launcher Widget Button & Sleek Inline Message Capsule (When Chat is Closed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 pointer-events-none">
          {/* Sleek Inline Message Capsule Beside Launcher */}
          {isIdleBubbleVisible && (
            <div
              onClick={() => {
                setIsOpen(true);
                setIsMinimized(false);
                setIsIdleBubbleVisible(false);
                setIsFadingOut(false);
                setIsLauncherJiggling(false);
                setMessages([getFreshWelcomeMessage()]);
                setTimeout(() => inputRef.current?.focus(), 150);
              }}
              className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white border border-emerald-500/40 hover:border-emerald-400 backdrop-blur-md shadow-xl shadow-black/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer select-none max-w-[280px] sm:max-w-[340px] relative group ${
                isFadingOut ? 'animate-smooth-fade-out' : 'animate-smooth-float-in'
              }`}
              title="Click to open RiceSsistant"
            >
              {/* Subtle arrow pointing toward the green floating button */}
              <div className="hidden sm:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-slate-900/90 border-r border-t border-emerald-500/40 rotate-45 pointer-events-none" />

              <p className="text-xs text-slate-100 font-medium leading-snug line-clamp-2">
                {IDLE_ATTENTION_GREETINGS[idleGreetingIndex % IDLE_ATTENTION_GREETINGS.length]}
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFadingOut(true);
                  setTimeout(() => {
                    setIsIdleBubbleVisible(false);
                    setIsFadingOut(false);
                    setIsLauncherJiggling(false);
                  }, 500);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition cursor-pointer shrink-0 ml-1"
                title="Dismiss"
                aria-label="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Floating Launcher Button */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
              setIsIdleBubbleVisible(false);
              setIsFadingOut(false);
              setIsLauncherJiggling(false);
              setMessages([getFreshWelcomeMessage()]);
              setTimeout(() => inputRef.current?.focus(), 150);
            }}
            className={`pointer-events-auto relative p-2.5 bg-gradient-to-tr from-[#0b2340] via-[#103426] to-[#047857] hover:scale-105 active:scale-95 text-white rounded-full shadow-2xl shadow-emerald-950/50 transition-all duration-200 cursor-pointer flex items-center justify-center ring-2 ring-emerald-400/60 group shrink-0 ${
              isLauncherJiggling ? 'animate-bounce' : ''
            }`}
            aria-label="Open RiceSsistant AI Assistant"
            title="RiceSsistant • Intelligent GIS Guide"
          >
            {/* Attention seeking radar pulse ring */}
            {isLauncherJiggling && (
              <>
                <span className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
                <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-pulse pointer-events-none" />
              </>
            )}

            <div className="relative flex items-center justify-center">
              <RiceSsistantLogo size={38} className="ring-1 ring-emerald-300/40" />
            </div>

            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
          </button>
        </div>
      )}

      {/* 3. Clean Modern Chat Window (When Open and NOT Minimized) */}
      {isOpen && !isMinimized && (
        <div
          role="dialog"
          aria-label="RiceSsistant"
          className="fixed bottom-6 right-6 z-50 shadow-2xl rounded-2xl border border-slate-200 bg-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-black/5 transition-all w-[360px] sm:w-[410px] max-w-[94vw] h-[550px] max-h-[86vh]"
        >
          {/* Window Header */}
          <div className="bg-gradient-to-r from-[#0B1E38] via-[#102A4E] to-[#123E28] text-white p-3.5 flex items-center justify-between border-b border-slate-700 select-none">
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <RiceSsistantLogo size={36} className="shrink-0 ring-1 ring-white/20" />

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold font-serif tracking-wide text-white leading-tight">
                    RiceSsistant
                  </h3>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 truncate max-w-[210px] mt-0.5">
                  RiceSsistant • Intelligent GIS Guide
                </p>
              </div>
            </div>

            {/* Active Language Badge */}
            <div className="flex items-center gap-1.5 mr-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const nextLang: SupportedLanguage =
                    activeLanguage === 'bisaya' ? 'tagalog' : activeLanguage === 'tagalog' ? 'english' : 'bisaya';
                  setActiveLanguage(nextLang);
                  setIsLanguageLocked(true);
                }}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-500/30 transition cursor-pointer flex items-center gap-1"
                title="Active Language. Click to switch (Bisaya / Tagalog / English)"
              >
                <span>{activeLanguage === 'bisaya' ? 'Bisaya' : activeLanguage === 'tagalog' ? 'Tagalog' : 'English'}</span>
                {isLanguageLocked && <span className="text-[9px] text-amber-300" title="Locked Language">🔒</span>}
              </button>
            </div>

            {/* Window Controls: ONLY Minimize (-) and Close (✕) */}
            <div className="flex items-center gap-1.5 text-slate-300 shrink-0">
              {/* Minimize to Pill (-) */}
              <button
                type="button"
                onClick={handleMinimizeChat}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white flex items-center justify-center"
                title="Minimize chat"
                aria-label="Minimize chat"
              >
                <Minus className="w-4 h-4" />
              </button>
              {/* Close Button (✕) */}
              <button
                type="button"
                onClick={handleCloseChat}
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white flex items-center justify-center"
                title="Close chat"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Active Navigation Notice Banner */}
          {lastNavNotice && (
            <div className="px-3 py-1.5 bg-emerald-50 border-b border-emerald-200 text-[11px] font-semibold text-emerald-800 flex items-center justify-between animate-in fade-in slide-in-from-top-1">
              <span className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{lastNavNotice}</span>
              </span>
              <span className="text-[9.5px] uppercase font-bold text-emerald-600 shrink-0 ml-1.5">Active</span>
            </div>
          )}

          {/* Conversation Scroll View */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 bg-slate-50/70 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="shrink-0 mt-0.5" title="RiceSsistant AI Guide">
                    <RiceSsistantLogo size={24} />
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 shadow-2xs text-xs ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-br-xs'
                      : msg.isAutoNavigated
                      ? 'bg-emerald-50/90 border border-emerald-300 text-emerald-950 font-medium rounded-bl-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {/* Rich Markdown Rendering for Assistant, Raw text for User */}
                  {msg.sender === 'user' ? (
                    <div className="whitespace-pre-line leading-relaxed font-normal">
                      {msg.text}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <RiceSsistantMarkdown content={msg.text} />
                    </div>
                  )}

                  {/* FARMER SEARCH RESULT CARDS (Only shown when user specifically searched for a farmer) */}
                  {msg.farmerResults && msg.farmerResults.length > 0 && (
                    <div className="mt-3 space-y-2 pt-2 border-t border-slate-100">
                      {msg.farmerResults.map((p) => {
                        const displayName = formatFarmerDisplayName(p);
                        return (
                          <div
                            key={p.tagNumber}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition text-left"
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-[12px] truncate">
                                  {displayName}
                                </div>
                                <div className="text-[10px] font-mono font-semibold text-emerald-700">
                                  RSBSA: {p.swineNameOrId || 'NO RSBSA'}
                                </div>
                              </div>
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0 font-bold">
                                {p.tagNumber}
                              </span>
                            </div>

                            <div className="mt-1.5 text-[10.5px] text-slate-600 space-y-0.5">
                              <div className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate">
                                  Brgy. {p.barangay} &bull; {p.farmLocation || p.address || 'Silago Rice Sector'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 truncate">
                                <Wheat className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="truncate font-medium text-slate-800">
                                  {p.weightKg} ha &bull; {p.breed || 'Rice Crop'}
                                </span>
                              </div>
                            </div>

                            {/* Direct deep action buttons for searched farmer */}
                            <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleLocateParcel(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-bold shadow-2xs transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                <MapPin className="w-3 h-3" />
                                <span>📍 Locate on GIS Map</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleViewParcelProfile(p)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[10.5px] font-bold shadow-2xs transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                              >
                                <ClipboardList className="w-3 h-3 text-blue-600" />
                                <span>📋 View Full Record</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Explicit Navigation Action Buttons (Only shown if user requested navigation or action) */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200/80 flex flex-wrap gap-1.5">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          type="button"
                          onClick={() => handleExecuteAction(act)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 hover:border-emerald-400 shadow-2xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                          {renderActionIcon(act.iconType)}
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Copy message button */}
                  {msg.sender === 'assistant' && (
                    <div className="mt-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono text-[9px]">{msg.timestamp}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.text)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Copy answer to clipboard"
                        >
                          {copiedMessageId === msg.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const lastUser = [...messages].reverse().find((m) => m.sender === 'user');
                            if (lastUser) handleSendMessage(lastUser.text);
                          }}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Regenerate response"
                        >
                          <RotateCw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Streaming typing indicator with pulsing dot */}
            {isLoading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="shrink-0 mt-0.5" title="RiceSsistant AI Guide">
                  <RiceSsistantLogo size={24} />
                </div>
                <div className="bg-white border border-slate-200/90 text-slate-800 rounded-2xl rounded-bl-xs p-3 shadow-2xs max-w-[88%] text-xs">
                  {streamingText ? (
                    <div className="space-y-2">
                      <RiceSsistantMarkdown content={streamingText} />
                      <span className="inline-block w-2 h-2 ml-1 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="font-semibold text-emerald-800">RiceSsistant is thinking</span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Prompt Chips (Shown on fresh start or early conversation) */}
          {messages.length <= 2 && (
            <div className="px-3 pt-2 pb-1.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar select-none">
              {getQuickPrompts(activeLanguage).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(chip.query)}
                  className="px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300/80 shrink-0 transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>{chip.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* Clean Chat Input Box */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  activeLanguage === 'tagalog'
                    ? 'Magtanong kay RiceSsistant o maghanap ng magsasaka...'
                    : activeLanguage === 'english'
                    ? 'Ask RiceSsistant or search for a farmer or parcel...'
                    : 'Pangutana kang RiceSsistant o pagpangita og mag-uuma...'
                }
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-xl transition cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
