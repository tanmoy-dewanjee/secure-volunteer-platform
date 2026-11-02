import { createAdminClient } from "@supabase/server/core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl() {
  return process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function publicKey() {
  return (
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

function secretKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && (secretKey() || publicKey()));
}

export function hasSupabaseSecret() {
  return Boolean(supabaseUrl() && secretKey());
}

export function getSupabaseAnon(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = publicKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAuthAdmin(): SupabaseClient | null {
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const direct = getSupabaseAuthAdmin();
  if (direct) return direct;
  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) return null;
  try {
    return createAdminClient({
      env: {
        url,
        secretKeys: { default: key },
      },
    });
  } catch {
    return null;
  }
}

export function getSupabaseData(): SupabaseClient | null {
  return getSupabaseAdmin() ?? getSupabaseAnon();
}
