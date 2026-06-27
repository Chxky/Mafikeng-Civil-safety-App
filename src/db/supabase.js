import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Initialize Supabase client
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isLive = !!supabase;

// Set the user token for RLS policies
// eslint-disable-next-line no-unused-vars
export async function setRLSToken(token) {
  if (!supabase) return;
  // Supabase doesn't support custom GUCs via JS client directly,
  // so we use a PostgreSQL function or handle RLS differently.
  // For now, we'll pass token in RPC calls.
}
