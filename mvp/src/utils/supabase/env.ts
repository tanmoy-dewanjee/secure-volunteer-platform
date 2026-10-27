export const SUPABASE_COOKIE = "sb-svp-student-auth";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

export function supabaseCookieOptions() {
  return {
    name: SUPABASE_COOKIE,
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure:
      process.env.COOKIE_SECURE === "true" ||
      process.env.NODE_ENV === "production",
  };
}

export function isSupabaseEnvReady() {
  const { url, key } = getSupabaseEnv();
  return Boolean(url && key);
}
