import { createClient } from '@supabase/supabase-js';

/**
 * Browser-safe Supabase client.
 *
 * Only the project URL and publishable key belong in VITE_* variables.
 * Never put a service_role key or any other secret in frontend environment
 * variables. Database and Storage access must still be protected by RLS and
 * server-side Edge Functions.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabasePublishableKey &&
    !supabasePublishableKey.includes('REPLACE_WITH_YOUR_REAL_KEY'),
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** Returns the client or a clear setup error instead of failing mysteriously. */
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase belum dikonfigurasi. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di .env.local.',
    );
  }

  return supabase;
}
