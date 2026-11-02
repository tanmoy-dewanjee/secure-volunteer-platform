import type { AdminAccount } from "@/lib/auth/accounts";
import { adminAccounts, findAdminAccount } from "@/lib/auth/accounts";
import type { AdminRole } from "@/lib/models";
import {
  getSupabaseAdmin,
  getSupabaseAnon,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const ADMIN_ROLES: AdminRole[] = ["super_admin", "event_coordinator", "viewer"];

function isAdminRole(value: string): value is AdminRole {
  return ADMIN_ROLES.includes(value as AdminRole);
}

export function roleLabel(role: AdminRole) {
  if (role === "super_admin") return "Super admin";
  if (role === "event_coordinator") return "Club coordinator";
  return "Viewer";
}

export async function listStoredAdmins(): Promise<AdminAccount[]> {
  const byUsername = new Map<string, AdminAccount>();
  for (const account of adminAccounts) {
    byUsername.set(account.username, account);
  }
  if (!isSupabaseConfigured()) return [...byUsername.values()];

  const supabase = getSupabaseAdmin();
  if (!supabase) return [...byUsername.values()];

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, email, role")
    .eq("portal", "admin")
    .order("created_at", { ascending: true });
  if (error || !data) return [...byUsername.values()];

  for (const row of data) {
    const username = String(row.username || "").toLowerCase();
    const role = String(row.role || "");
    if (!username || !isAdminRole(role)) continue;
    byUsername.set(username, {
      id: String(row.id),
      username,
      displayName: String(row.display_name || username),
      email: String(row.email || ""),
      role,
    });
  }
  return [...byUsername.values()];
}

export async function authenticateStoredAdmin(
  username: string,
  password: string
): Promise<AdminAccount | null> {
  const demo = findAdminAccount(username);
  if (demo) return null;
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabaseAdmin();
  const anon = getSupabaseAnon();
  if (!supabase || !anon) return null;

  const key = username.trim().toLowerCase();
  const byUsername = await supabase
    .from("profiles")
    .select("id, username, display_name, email, role, portal")
    .eq("portal", "admin")
    .eq("username", key)
    .maybeSingle();
  const profile =
    byUsername.data ??
    (
      await supabase
        .from("profiles")
        .select("id, username, display_name, email, role, portal")
        .eq("portal", "admin")
        .eq("email", key)
        .maybeSingle()
    ).data;
  if (!profile?.email || !isAdminRole(String(profile.role))) return null;

  const { error } = await anon.auth.signInWithPassword({
    email: String(profile.email),
    password,
  });
  if (error) return null;

  return {
    id: String(profile.id),
    username: String(profile.username).toLowerCase(),
    displayName: String(profile.display_name || profile.username),
    email: String(profile.email),
    role: profile.role as AdminRole,
  };
}
