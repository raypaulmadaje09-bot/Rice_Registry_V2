import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (import.meta as any).env?.VITE_SUPABASE_URL || 'https://encmfqxsjoqqpgqzukcf.supabase.co';
const supabaseAnonKey =
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_JOerKEU_MPilqt2GFQnbZg_kisfO6Mg';

// In-memory auth storage - strictly NO localStorage
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: memoryAuthStorage,
  },
});
export default supabase;
