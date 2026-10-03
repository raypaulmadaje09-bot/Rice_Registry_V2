import { createClient } from '@supabase/supabase-js';

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

// Browser or in-memory auth storage provider
const browserAuthStorage = typeof window !== 'undefined' && window.localStorage
  ? window.localStorage
  : memoryAuthStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: browserAuthStorage,
  },
});
export default supabase;
