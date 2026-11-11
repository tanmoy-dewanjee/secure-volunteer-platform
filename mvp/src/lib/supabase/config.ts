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

export function supabaseProjectHost() {
  try {
    return new URL(supabaseUrl()).host;
  } catch {
    return "";
  }
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

export function studentEmailsForUsername(username: string) {
  const id = username.trim().toLowerCase();
  if (id.includes("@")) return [id];
  return [`${id}@adelaide.edu.au`, `${id}@student.adelaide.edu.au`];
}

export function usernameFromEmail(email: string) {
  const local = email.trim().toLowerCase().split("@")[0] ?? "";
  return local;
}

export async function adminCreateUser(input: {
  email: string;
  password: string;
  metadata: Record<string, string>;
}) {
  const supabase = getSupabaseAuthAdmin();
  if (supabase) {
    const created = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: input.metadata,
    });
    if (!created.error && created.data.user) return created;
    if (
      created.error &&
      !/api key|not allowed|unauthorized|jwt/i.test(created.error.message)
    ) {
      return created;
    }
  }

  const url = supabaseUrl();
  const key = secretKey();
  if (!url || !key) {
    return {
      data: { user: null },
      error: { message: "Account creation is not available." },
    };
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: input.metadata,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    msg?: string;
    message?: string;
    error_description?: string;
    user?: { id?: string };
  };
  const userId = payload.id || payload.user?.id;
  if (!response.ok || !userId) {
    return {
      data: { user: null },
      error: {
        message:
          payload.msg ||
          payload.message ||
          payload.error_description ||
          "Could not create user",
      },
    };
  }
  return {
    data: { user: { id: userId } },
    error: null,
  };
}
