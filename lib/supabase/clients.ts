import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Service-role clients for server-side data fetching across Mission Control's
// own Supabase project and the separate Nexus project. These must NEVER be
// imported from client components — they use the service_role key which
// bypasses RLS.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

let _mc: SupabaseClient | null = null;
let _nexus: SupabaseClient | null = null;

export function mcClient(): SupabaseClient {
  if (!_mc) {
    _mc = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } }
    );
  }
  return _mc;
}

export function nexusClient(): SupabaseClient {
  if (!_nexus) {
    _nexus = createClient(
      requireEnv('NEXUS_SUPABASE_URL'),
      requireEnv('NEXUS_SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } }
    );
  }
  return _nexus;
}
