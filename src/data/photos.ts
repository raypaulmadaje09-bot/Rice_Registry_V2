import { BackgroundPreset, FarmParcel } from '../types';

export const DEFAULT_BG_PHOTO = '';
export const DEFAULT_RICE_PHOTO = '';
export const DEFAULT_SLSU_PHOTO = '';

export const RICE_DEFAULTS = {
  centerTitle: "SILAGO RICE PRODUCTION & RESEARCH CENTER",
  centerSubtitle: "Silago Model Rice Farm & Certified Inbred Seed Complex",
  badgeTag: "SILAGO RICE DEMONSTRATION COMPLEX",
  topTags: "• HIGH YIELD • CERTIFIED SEED • CLIMATE RESILIENT •",
  motto: "• CLIMATE RESILIENT • CERTIFIED SEED • HIGH YIELD •",
  caption: "High-yield palay demonstration, climate-resilient inbred seed repository & farmer field school",
  programName: "DA-MAO Silago Rice Program"
};

export const SLSU_DEFAULTS = {
  universityName: RICE_DEFAULTS.centerTitle,
  motto: RICE_DEFAULTS.motto,
  year: "Rice Program",
  centerTitle: RICE_DEFAULTS.centerTitle,
  centerSubtitle: RICE_DEFAULTS.centerSubtitle,
  caption: RICE_DEFAULTS.caption,
  badgeTag: RICE_DEFAULTS.badgeTag,
  topTags: RICE_DEFAULTS.topTags
};

const makeAgriculturalWallpaperSvg = (
  skyTop: string,
  skyBottom: string,
  farHill: string,
  midHill: string,
  terraceDark: string,
  terraceMid: string,
  terraceLight: string,
  sunColor: string
) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 900' preserveAspectRatio='xMidYMid slice'><defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='${skyTop}'/><stop offset='100%' stop-color='${skyBottom}'/></linearGradient><radialGradient id='glow' cx='75%' cy='24%' r='28%'><stop offset='0%' stop-color='${sunColor}' stop-opacity='0.95'/><stop offset='100%' stop-color='${sunColor}' stop-opacity='0'/></radialGradient></defs><rect width='1600' height='900' fill='url(%23sky)'/><rect width='1600' height='900' fill='url(%23glow)'/><path d='M0 440 Q320 300 660 410 T1320 350 L1600 390 L1600 900 L0 900 Z' fill='${farHill}' opacity='0.82'/><path d='M0 520 Q360 390 780 490 T1600 430 L1600 900 L0 900 Z' fill='${midHill}' opacity='0.9'/><path d='M0 600 C380 510 740 650 1160 560 C1380 515 1510 535 1600 555 L1600 900 L0 900 Z' fill='${terraceDark}'/><path d='M0 680 C340 610 760 725 1220 640 C1410 605 1530 625 1600 640 L1600 900 L0 900 Z' fill='${terraceMid}'/><path d='M0 765 C390 705 830 805 1280 735 C1450 710 1545 725 1600 735 L1600 900 L0 900 Z' fill='${terraceLight}'/><path d='M0 840 C420 795 860 865 1340 815 C1485 800 1555 810 1600 818 L1600 900 L0 900 Z' fill='${terraceDark}' opacity='0.72'/></svg>`;
  return `data:image/svg+xml;utf8,${svg.replace(/#/g, '%23')}`;
};

export const PRESET_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'preset-silago-dawn',
    name: 'Silago Rice Terraces Dawn',
    url: makeAgriculturalWallpaperSvg('#d8efe2', '#eef7f1', '#6b9d83', '#3c7a5c', '#145338', '#1d6b48', '#2f8a5e', '#fde68a'),
    timestamp: 'Built-in 16:9 Preset',
    source: 'preset'
  },
  {
    id: 'preset-irrigated-paddy',
    name: 'Irrigated Emerald Paddy',
    url: makeAgriculturalWallpaperSvg('#cfe8ea', '#e7f4f1', '#5a8f7b', '#2f6d58', '#0f4c3a', '#18664d', '#298365', '#bae6fd'),
    timestamp: 'Built-in 16:9 Preset',
    source: 'preset'
  },
  {
    id: 'preset-golden-harvest',
    name: 'Golden Harvest Fields',
    url: makeAgriculturalWallpaperSvg('#f5ebd2', '#fbf6e9', '#8a9c6d', '#687f49', '#5a6b2c', '#889437', '#b5a846', '#fcd34d'),
    timestamp: 'Built-in 16:9 Preset',
    source: 'preset'
  },
  {
    id: 'preset-mountain-palay',
    name: 'Southern Leyte Highland Valley',
    url: makeAgriculturalWallpaperSvg('#dce7f2', '#eff5f9', '#6c8596', '#3d6370', '#1e4942', '#2b6155', '#3e7c6a', '#e0f2fe'),
    timestamp: 'Built-in 16:9 Preset',
    source: 'preset'
  }
];

export interface SlsuPreset {
  id: string;
  name: string;
  desc: string;
  url: string;
}

export const SLSU_EXTENSION_PRESETS: SlsuPreset[] = [];
export const RICE_EXTENSION_PRESETS: SlsuPreset[] = [];

export function getLandPhoto(parcel: Partial<FarmParcel>): string {
  if (parcel.fieldPhotoUrl && parcel.fieldPhotoUrl.trim() !== '') return parcel.fieldPhotoUrl;
  if (parcel.landPhotoUrl && parcel.landPhotoUrl.trim() !== '') return parcel.landPhotoUrl;
  if (parcel.photoUrl && parcel.photoUrl.trim() !== '') return parcel.photoUrl;
  return '';
}

export function getFarmerPhoto(parcel: Partial<FarmParcel>): string {
  if (parcel.photoUrl && parcel.photoUrl.trim() !== '') return parcel.photoUrl;
  if (parcel.farmerPhotoUrl && parcel.farmerPhotoUrl.trim() !== '') return parcel.farmerPhotoUrl;
  return '';
}
