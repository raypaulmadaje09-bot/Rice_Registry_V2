import { User, FarmParcel, LftAccount } from '../types';
import { getUserAssignedBarangays, matchBarangay } from '../data/barangays';

/**
 * Role-Based Access Control (RBAC) Permissions Engine
 * 
 * Hierarchy:
 * 1. Central Admin:
 *    - Full municipal authority across all 15 barangays
 *    - Can create, edit, approve, export, and delete any parcel
 *    - Can manage LFT accounts, system configurations, and GIS layers
 * 
 * 2. LFT Field Officer (Barangay Focal Person):
 *    - Scoped jurisdiction limited to their assigned barangay(s)
 *    - Can add and edit farm records, seasonal production, and GPS polygons in assigned barangays only
 *    - STRICT RESTRICTION: CANNOT delete records, modify system configurations, or edit other LFT accounts
 * 
 * 3. Public / Unauthenticated Visitor:
 *    - Read-only access to public GIS maps, overview statistics, and directory
 *    - STRICT RESTRICTION: All edit forms, add parcel dialogs, delete buttons, and admin actions are hidden/disabled
 */

export interface UserPermissions {
  isAuthenticated: boolean;
  isCentralAdmin: boolean;
  isLftOfficer: boolean;
  isPublicVisitor: boolean;
  canAddParcels: boolean;
  canManageLftAccounts: boolean;
  canConfigureSystemSettings: boolean;
  canDeleteParcels: boolean;
  canExportDatabase: boolean;
  assignedBarangays: string[] | null; // null represents all barangays (Central Admin)
}

/**
 * Computes the full permission set for the currently active user session
 */
export function getUserPermissions(user: User | null | undefined): UserPermissions {
  if (!user) {
    return {
      isAuthenticated: false,
      isCentralAdmin: false,
      isLftOfficer: false,
      isPublicVisitor: true,
      canAddParcels: false,
      canManageLftAccounts: false,
      canConfigureSystemSettings: false,
      canDeleteParcels: false,
      canExportDatabase: false,
      assignedBarangays: []
    };
  }

  const isCentralAdmin = user.role === 'Central Admin';
  const isLftOfficer = user.role === 'Barangay Focal Person';
  const assigned = getUserAssignedBarangays(user);

  return {
    isAuthenticated: true,
    isCentralAdmin,
    isLftOfficer,
    isPublicVisitor: false,
    canAddParcels: isCentralAdmin || isLftOfficer,
    canManageLftAccounts: isCentralAdmin,
    canConfigureSystemSettings: isCentralAdmin,
    canDeleteParcels: isCentralAdmin, // Only Central Admin can delete records
    canExportDatabase: isCentralAdmin || isLftOfficer,
    assignedBarangays: assigned
  };
}

/**
 * Checks if the user is authorized to create a parcel in a specific barangay
 */
export function canUserAddParcel(user: User | null | undefined, barangayName?: string): boolean {
  if (!user) return false;
  if (user.role === 'Central Admin') return true;
  if (user.role === 'Barangay Focal Person') {
    if (!barangayName) return true; // User can open add dialog, will be filtered to assigned barangays
    const assigned = getUserAssignedBarangays(user);
    if (!assigned || assigned.length === 0) return false;
    return assigned.some((b) => matchBarangay(barangayName, b));
  }
  return false;
}

/**
 * Checks if the user is authorized to edit a parcel in a specific barangay
 */
export function canUserEditParcel(user: User | null | undefined, parcelOrBarangay: FarmParcel | string): boolean {
  if (!user) return false;
  if (user.role === 'Central Admin') return true;
  if (user.role === 'Barangay Focal Person') {
    const barangayName = typeof parcelOrBarangay === 'string' ? parcelOrBarangay : parcelOrBarangay.barangay;
    const assigned = getUserAssignedBarangays(user);
    if (!assigned || assigned.length === 0) return false;
    return assigned.some((b) => matchBarangay(barangayName, b));
  }
  return false;
}

/**
 * Checks if the user is authorized to delete a parcel
 * STRICT: Only Central Admin is permitted to delete records!
 */
export function canUserDeleteParcel(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'Central Admin';
}

/**
 * Checks if the user can record or update seasonal production for a parcel
 */
export function canUserRecordSeasonalProduction(user: User | null | undefined, barangayName: string): boolean {
  if (!user) return false;
  if (user.role === 'Central Admin') return true;
  if (user.role === 'Barangay Focal Person') {
    const assigned = getUserAssignedBarangays(user);
    if (!assigned || assigned.length === 0) return false;
    return assigned.some((b) => matchBarangay(barangayName, b));
  }
  return false;
}

/**
 * Checks if the user is authorized to edit GIS boundary polygons for a barangay
 */
export function canUserEditGisPolygons(user: User | null | undefined, barangayName: string): boolean {
  if (!user) return false;
  if (user.role === 'Central Admin') return true;
  if (user.role === 'Barangay Focal Person') {
    const assigned = getUserAssignedBarangays(user);
    if (!assigned || assigned.length === 0) return false;
    return assigned.some((b) => matchBarangay(barangayName, b));
  }
  return false;
}

/**
 * Checks if the user can manage LFT technician accounts
 */
export function canUserManageLftAccounts(user: User | null | undefined): boolean {
  if (!user) return false;
  return user.role === 'Central Admin';
}

/**
 * Formats a clear RBAC warning message when an unauthorized action is attempted
 */
export function getRbacRestrictionMessage(user: User | null | undefined, action: 'add' | 'edit' | 'delete' | 'manage_lft' | 'settings', targetBarangay?: string): string {
  if (!user) {
    return 'Public Visitor Mode: You must be logged in with authorized municipal credentials to perform editing actions.';
  }

  if (action === 'delete') {
    return `Permission Denied: Deletion of registered farm records is strictly restricted to Central Admin. LFT Field Officers (${user.name}) cannot delete official records.`;
  }

  if (action === 'manage_lft' || action === 'settings') {
    return 'Permission Denied: Management of technician accounts and municipal system settings is restricted to Central Admin.';
  }

  const assigned = getUserAssignedBarangays(user);
  const assignedStr = assigned && assigned.length > 0 ? assigned.join(', ') : 'None';

  if (targetBarangay) {
    return `Jurisdictional Restriction: As an assigned LFT Field Officer (${user.name}), you are only authorized to manage records in your assigned sector: [${assignedStr}]. Barangay "${targetBarangay}" is outside your assigned area.`;
  }

  return `Jurisdictional Restriction: You are restricted to your assigned barangays: [${assignedStr}].`;
}
