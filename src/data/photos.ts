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

export const PRESET_BACKGROUNDS: BackgroundPreset[] = [];

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
