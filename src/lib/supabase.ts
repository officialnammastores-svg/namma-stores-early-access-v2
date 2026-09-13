import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Vite injects these public client credentials at build time.
// Never use a Supabase service-role key in browser code.
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    /^https:\/\/[^\s/]+\.supabase\.co(?:\/)?$/i.test(supabaseUrl) &&
    supabaseAnonKey.length > 20,
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        // Keep the SDK's built-in PostgREST retry behavior enabled for transient failures.
        retry: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    client = null;
  }
} else if (import.meta.env.DEV) {
  console.warn(
    '⚠️ [Namma Stores] Supabase credentials not found or invalid. ' +
      'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local for live database integration.',
  );
}

export const supabase = client;
