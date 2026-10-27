import { createClient } from "@/utils/supabase/client";
import { studentEmailsForUsername } from "@/lib/supabase/config";

function recoveryRedirect() {
  return `${window.location.origin}/auth/callback?next=/reset-password`;
}

export async function signOutStudentSession() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    return;
  }
}

export async function signInStudentSession(username: string, password: string) {
  try {
    const supabase = createClient();
    const key = username.trim().toLowerCase();
    const emails = key.includes("@")
      ? [key]
      : [`${key}@adelaide.edu.au`, `${key}@student.adelaide.edu.au`];
    for (const email of emails) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) return true;
    }
  } catch {
    return false;
  }
  return false;
}

export async function requestStudentPasswordReset(username: string) {
  const supabase = createClient();
  const emails = studentEmailsForUsername(username);
  const redirectTo = recoveryRedirect();
  let sent = false;
  let lastError = "";

  for (const email of emails) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      lastError = error.message;
      continue;
    }
    sent = true;
  }

  return { sent, lastError };
}

export async function establishRecoverySessionFromUrl() {
  const supabase = createClient();
  const hash = window.location.hash.replace(/^#/, "");
  const hashParams = new URLSearchParams(hash);
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const type = hashParams.get("type");

  if (type === "recovery" && accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (!error) {
      window.history.replaceState({}, "", window.location.pathname);
      return true;
    }
  }

  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function updateStudentPassword(password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false as const, error: error.message };
  }
  await supabase.auth.signOut();
  return { ok: true as const };
}
