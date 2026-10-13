import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnv, supabaseCookieOptions } from "@/utils/supabase/env";

export const createClient = () => {
  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  return createBrowserClient(url, key, {
    cookieOptions: supabaseCookieOptions(),
  });
};
