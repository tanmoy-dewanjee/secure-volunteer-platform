import { jsonError } from "@/lib/security/http";
import { isSupabaseConfigured, usernameFromEmail } from "@/lib/supabase/config";
import { createClient } from "@/utils/supabase/server";

export async function getAuthenticatedStudent() {
  if (!isSupabaseConfigured()) return null;
  try {
    const client = await createClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return null;
    const meta = data.user.user_metadata as {
      username?: string;
      display_name?: string;
    } | undefined;
    const username =
      meta?.username?.trim().toLowerCase() ||
      usernameFromEmail(data.user.email || "");
    if (!username) return null;
    return {
      username,
      name: meta?.display_name?.trim() || username,
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUsername() {
  return (await getAuthenticatedStudent())?.username ?? null;
}

export async function requireStudentUsername(requested?: string | null) {
  const wanted = requested?.trim().toLowerCase() || "";

  if (!isSupabaseConfigured()) {
    if (!wanted) {
      return { username: null, error: jsonError("username is required", 400) };
    }
    return { username: wanted, error: null };
  }

  const username = await getAuthenticatedUsername();
  if (!username) {
    return { username: null, error: jsonError("Unauthorised", 401) };
  }
  if (wanted && wanted !== username) {
    return { username: null, error: jsonError("Forbidden", 403) };
  }
  return { username, error: null };
}
