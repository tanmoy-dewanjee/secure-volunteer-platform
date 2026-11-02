import { createAdminClient } from "@supabase/server/core";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function trimEnv(value?: string) {
  return value?.trim() || "";
}

function jwtRole(token: string) {
  try {
    const part = token.split(".")[1];
    if (!part) return "";
    const json = Buffer.from(
      part.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(json) as { role?: string };
    return payload.role || "";
  } catch {
    return "";
  }
}

function isUsableSecret(value?: string) {
  const key = trimEnv(value);
  if (key.length < 20) return false;
  if (key.startsWith("sb_publishable_") || key.startsWith("sb_anon_")) {
    return false;
  }
  if (key.startsWith("sb_secret_")) return true;
  if (key.startsWith("eyJ")) {
    const role = jwtRole(key);
    return role === "service_role" || role === "supabase_admin";
  }
  return false;
}

function supabaseUrl() {
  return (
    trimEnv(process.env.SUPABASE_URL) ||
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)
  );
}

function publicKey() {
  return (
    trimEnv(process.env.SUPABASE_PUBLISHABLE_KEY) ||
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) ||
    trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}

function secretKey() {
  return (
    [process.env.SUPABASE_SECRET_KEY, process.env.SUPABASE_SERVICE_ROLE_KEY].find(
      isUsableSecret
    ) || ""
  );
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
