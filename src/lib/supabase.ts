import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Retrieve public/publishable credentials from Vite environment
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  ''
).trim();

// Ensure both URL and public anon key are present and formatted correctly
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

let client: SupabaseClient | null = null;

if (isSupabaseConfigured) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    client = null;
  }
} else if (import.meta.env.DEV) {
  console.warn(
    '⚠️ [Namma Stores] Supabase credentials not found in environment. ' +
    'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local for live database integration.'
  );
}

export const supabase = client;
