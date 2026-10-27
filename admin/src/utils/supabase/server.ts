import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv, supabaseCookieOptions } from "@/utils/supabase/env";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function createClient(cookieStore?: CookieStore) {
  const store = cookieStore ?? (await cookies());
  const { url, key } = getSupabaseEnv();
  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  return createServerClient(url, key, {
    cookieOptions: supabaseCookieOptions(),
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set(name, value, options)
          );
        } catch {
          // Called from a Server Component. Proxy refreshes the session.
        }
      },
    },
  });
};
