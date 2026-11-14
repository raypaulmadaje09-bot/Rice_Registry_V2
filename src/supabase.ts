import { createClient } from '@supabase/supabase-js';
import { clearLegacyLocalAuthStorage, getTabAuthStorageKey } from './utils/sessionAuth';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL ||
  (import.meta as any).env?.SUPABASE_URL ||
  'https://fzimfyncnshbnyuzncfz.supabase.co';
const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
  (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
  (import.meta as any).env?.SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_oXGHvsTTPJ5SEsovLZUg9g_COAFGzNu';

// In-memory auth storage provider
export const memoryAuthStorage = {
  _store: new Map<string, string>(),
  getItem: (key: string): string | null => memoryAuthStorage._store.get(key) ?? null,
  setItem: (key: string, value: string): void => {
    memoryAuthStorage._store.set(key, value);
  },
  removeItem: (key: string): void => {
    memoryAuthStorage._store.delete(key);
  },
};

clearLegacyLocalAuthStorage();

// Browser sessionStorage (isolated per tab/window/browser run) or in-memory fallback
const browserAuthStorage = typeof window !== 'undefined' && window.sessionStorage
  ? window.sessionStorage
  : memoryAuthStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: getTabAuthStorageKey(),
    storage: browserAuthStorage,
  },
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});
export default supabase;
