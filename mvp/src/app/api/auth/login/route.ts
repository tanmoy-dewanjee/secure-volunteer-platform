import { isDemoStudentAccount } from "@/lib/demo-accounts";
import {
  GENERIC_AUTH_ERROR,
} from "@/lib/security/constants";
import {
  jsonError,
  jsonOk,
  requireTrustedOrigin,
} from "@/lib/security/http";
import {
  clearLoginFailures,
  clientKey,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/security/lockout";
import { setPendingMfaCookie } from "@/lib/security/pending";
import {
  getSupabaseAdmin,
  getSupabaseAnon,
  isSupabaseConfigured,
  studentEmailsForUsername,
  usernameFromEmail,
} from "@/lib/supabase/config";

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError(GENERIC_AUTH_ERROR, 400);
  }

  const username = body.username?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!username || username.length > 80 || password.length < 1 || password.length > 200) {
    return jsonError(GENERIC_AUTH_ERROR, 400);
  }

  const key = clientKey(request, username);
  if (loginBlocked(key)) {
    return jsonError("Too many attempts. Try again in 15 minutes.", 429);
  }

  if (!isSupabaseConfigured()) {
    recordLoginFailure(key);
    return jsonError("Sign-in is not available.", 503);
  }

  const supabase = getSupabaseAnon() ?? getSupabaseAdmin();
  if (!supabase) {
    recordLoginFailure(key);
    return jsonError("Sign-in is not available.", 503);
  }

  const emails = studentEmailsForUsername(username);
  for (const email of emails) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      continue;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, portal, role, profile_data")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.portal === "admin") {
      recordLoginFailure(key);
      return jsonError(GENERIC_AUTH_ERROR, 401);
    }

    clearLoginFailures(key);
    const account = profile?.username || usernameFromEmail(email);
    const demo = isDemoStudentAccount(account);
    if (!demo) {
      await setPendingMfaCookie(account);
    }
    const mfa = (
      profile?.profile_data as
        | { mfa?: { enabled?: boolean; secret?: string } }
        | null
    )?.mfa;
    return jsonOk({
      source: "supabase",
      username: account,
      name: profile?.display_name || usernameFromEmail(email),
      mfaRequired: !demo,
      mfaEnabled: demo ? false : Boolean(mfa?.enabled && mfa?.secret),
    });
  }

  recordLoginFailure(key);
  return jsonError(GENERIC_AUTH_ERROR, 401);
}
