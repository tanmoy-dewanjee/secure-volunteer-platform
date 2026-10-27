import { jsonError, jsonOk, requireTrustedOrigin } from "@/lib/security/http";
import {
  clearLoginFailures,
  clientKey,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/security/lockout";
import { pendingUsernameFromCookies } from "@/lib/security/pending";
import { getAuthenticatedUsername } from "@/lib/security/student-session";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { verifyTotp } from "@/lib/totp";

type StoredMfa = {
  secret?: string;
  recoveryCode?: string;
  enabled?: boolean;
  enrolledAt?: number;
};

function mfaFromProfileData(data: unknown): StoredMfa {
  if (!data || typeof data !== "object") return {};
  const mfa = (data as { mfa?: StoredMfa }).mfa;
  return mfa && typeof mfa === "object" ? mfa : {};
}

async function loadProfile(username: string) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, profile_data")
    .eq("username", username)
    .maybeSingle();
  return data;
}

async function saveMfa(
  profileId: string,
  currentData: Record<string, unknown>,
  mfa: StoredMfa
) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;
  await supabase
    .from("profiles")
    .update({
      profile_data: {
        ...currentData,
        mfa,
      },
    })
    .eq("id", profileId);
}

function validRecovery(stored: string | undefined, code: string) {
  if (!stored) return false;
  return code.replace(/\s/g, "").toUpperCase() === stored.toUpperCase();
}

async function actorUsername() {
  return (
    (await pendingUsernameFromCookies()) ||
    (await getAuthenticatedUsername())
  );
}

export async function GET() {
  const username = await actorUsername();
  if (!username) {
    return jsonError("Unauthorised", 401);
  }

  if (!isSupabaseConfigured()) {
    return jsonOk({ source: "local", enabled: false });
  }

  const profile = await loadProfile(username);
  const mfa = mfaFromProfileData(profile?.profile_data);
  return jsonOk({
    source: "supabase",
    enabled: Boolean(mfa.enabled && mfa.secret),
  });
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const username = await actorUsername();
  if (!username) {
    return jsonError("Unauthorised", 401);
  }

  const key = clientKey(request, `mfa:${username}`);
  if (loginBlocked(key)) {
    return jsonError("Too many attempts. Try again in 15 minutes.", 429);
  }

  let body: {
    action?: string;
    username?: string;
    code?: string;
    secret?: string;
    recoveryCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid payload.", 400);
  }

  if (body.username && body.username.trim().toLowerCase() !== username) {
    recordLoginFailure(key);
    return jsonError("Forbidden", 403);
  }

  if (!isSupabaseConfigured()) {
    return jsonError("Two-factor setup is not available.", 503);
  }

  const profile = await loadProfile(username);
  const currentData =
    profile?.profile_data && typeof profile.profile_data === "object"
      ? (profile.profile_data as Record<string, unknown>)
      : {};
  const stored = mfaFromProfileData(currentData);
  const code = body.code ?? "";

  if (body.action === "enable") {
    const secret = body.secret || stored.secret;
    const recoveryCode = body.recoveryCode || stored.recoveryCode;
    if (!secret) {
      return jsonError("Authenticator setup is missing.", 400);
    }
    const ok =
      (await verifyTotp(secret, code)) || validRecovery(recoveryCode, code);
    if (!ok) {
      recordLoginFailure(key);
      return jsonError("That code is not valid. Try the latest 6-digit code.", 401);
    }
    if (profile?.id) {
      await saveMfa(String(profile.id), currentData, {
        secret,
        recoveryCode: recoveryCode || "",
        enabled: true,
        enrolledAt: Date.now(),
      });
    }
    clearLoginFailures(key);
    return jsonOk({ source: "supabase", ok: true, enabled: true });
  }

  if (body.action === "disable") {
    const sessionUser = await getAuthenticatedUsername();
    if (sessionUser !== username) {
      return jsonError("Unauthorised", 401);
    }
    if (profile?.id && stored.secret) {
      await saveMfa(String(profile.id), currentData, {
        ...stored,
        enabled: false,
      });
    }
    return jsonOk({ source: "supabase", ok: true, enabled: false });
  }

  if (body.action === "verify") {
    if (!stored.enabled || !stored.secret) {
      recordLoginFailure(key);
      return jsonError("Two-factor authentication is not set up yet.", 401);
    }
    const ok =
      (await verifyTotp(stored.secret, code)) ||
      validRecovery(stored.recoveryCode, code);
    if (!ok) {
      recordLoginFailure(key);
      return jsonError("That authentication code is not valid.", 401);
    }
    clearLoginFailures(key);
    return jsonOk({ source: "supabase", ok: true, enabled: true });
  }

  return jsonError("Unknown action.", 400);
}
