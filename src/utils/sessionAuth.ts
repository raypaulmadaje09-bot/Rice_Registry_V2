/**
 * Session-scoped authentication storage helpers.
 *
 * Keeps authenticated staff/admin sessions in browser `sessionStorage` with a
 * per-tab Supabase storageKey so that closing Chrome or opening a new Chrome
 * window/tab always returns to an unauthenticated login prompt for security,
 * while still preserving same-tab page refreshes and OAuth redirects.
 */

export const AUTH_SESSION_KEYS = [
  'silago_rice_auth_user',
  'silago_rice_user_session',
  'silago_rice_auth_session',
  'rice_registry_user_session',
  'silago_current_user',
] as const;

export const ACTIVE_TAB_STORAGE_KEY = 'silago_active_tab';
const TAB_AUTH_SCOPE_KEY = 'silago_tab_auth_scope';

/**
 * Removes any legacy persistent auth or Supabase tokens from `localStorage`
 * so prior browser sessions cannot auto-restore across new Chrome sessions.
 */
export function clearLegacyLocalAuthStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    AUTH_SESSION_KEYS.forEach((key) => window.localStorage.removeItem(key));
    window.localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);

    const keysToDelete: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (/^sb-.*-auth-token/.test(key) || /^silago-auth-/.test(key))) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore storage access errors in restricted environments
  }
}

/**
 * Returns a unique Supabase Auth storageKey scoped to the current browser tab's
 * `sessionStorage`, preventing cross-tab / cross-window BroadcastChannel auto-login.
 */
export function getTabAuthStorageKey(): string {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return 'silago-auth-memory';
  }
  try {
    let scope = window.sessionStorage.getItem(TAB_AUTH_SCOPE_KEY);
    if (!scope) {
      scope =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      window.sessionStorage.setItem(TAB_AUTH_SCOPE_KEY, scope);
    }
    return `silago-auth-${scope}`;
  } catch {
    return 'silago-auth-memory';
  }
}

export function clearSessionUserKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    AUTH_SESSION_KEYS.forEach((key) => {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
    });
  } catch {
    // Ignore storage access errors
  }
}

export function readSessionUser<T extends { username?: string }>(): T | null {
  if (typeof window === 'undefined') return null;
  clearLegacyLocalAuthStorage();
  try {
    let raw: string | null = null;
    for (const key of AUTH_SESSION_KEYS) {
      raw = window.sessionStorage.getItem(key);
      if (raw) break;
    }
    if (!raw) return null;

    const savedUser = JSON.parse(raw) as T;
    if (
      savedUser?.username === 'temp_admin' ||
      savedUser?.username === 'temp_lft' ||
      (savedUser?.username === 'silago.test' && !import.meta.env.DEV)
    ) {
      clearSessionUserKeys();
      return null;
    }
    return savedUser;
  } catch {
    return null;
  }
}

export function writeSessionUser(user: Record<string, any> | null): void {
  if (typeof window === 'undefined') return;
  clearLegacyLocalAuthStorage();
  try {
    if (user) {
      const safeUser = { ...user };
      delete safeUser.password;
      const serialized = JSON.stringify(safeUser);
      AUTH_SESSION_KEYS.forEach((key) => window.sessionStorage.setItem(key, serialized));
    } else {
      clearSessionUserKeys();
    }
  } catch {
    // Ignore storage access errors
  }
}

export function hasActiveSessionUser(): boolean {
  return readSessionUser() !== null;
}

export function readSessionActiveTab(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    window.localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
    return window.sessionStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function writeSessionActiveTab(tab: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
    window.sessionStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
  } catch {
    // Ignore storage access errors
  }
}

export function clearSessionActiveTab(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
    window.sessionStorage.removeItem(ACTIVE_TAB_STORAGE_KEY);
  } catch {
    // Ignore storage access errors
  }
}
