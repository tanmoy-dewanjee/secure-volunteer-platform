import { findAdminAccount } from "@/lib/auth/accounts";
import { createClient } from "@/utils/supabase/client";

export async function signOutAdminSession() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    return;
  }
}

export async function signInAdminSession(username: string, password: string) {
  try {
    const account = findAdminAccount(username);
    const email = account?.email || username.trim().toLowerCase();
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return !error;
  } catch {
    return false;
  }
}
