import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function publicKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && publicKey());
}

export function getSupabaseAnon(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = publicKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || publicKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function studentEmailsForUsername(username: string) {
  const id = username.trim().toLowerCase();
  if (id.includes("@")) return [id];
  return [`${id}@adelaide.edu.au`, `${id}@student.adelaide.edu.au`];
}

export function usernameFromEmail(email: string) {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  return local;
}
