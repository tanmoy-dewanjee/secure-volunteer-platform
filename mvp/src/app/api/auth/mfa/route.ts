import { NextResponse } from "next/server";

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

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", enabled: false });
  }

  const profile = await loadProfile(username);
  const mfa = mfaFromProfileData(profile?.profile_data);
  return NextResponse.json({
    source: "supabase",
    enabled: Boolean(mfa.enabled && mfa.secret),
  });
}

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase() ?? "";
  const code = body.code ?? "";
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true, enabled: false });
  }

  const profile = await loadProfile(username);
  const currentData =
    profile?.profile_data && typeof profile.profile_data === "object"
      ? (profile.profile_data as Record<string, unknown>)
      : {};
  const stored = mfaFromProfileData(currentData);

  if (body.action === "enable") {
    const secret = body.secret || stored.secret;
    const recoveryCode = body.recoveryCode || stored.recoveryCode;
    if (!secret) {
      return NextResponse.json({ error: "Authenticator setup is missing." }, { status: 400 });
    }
    const ok =
      (await verifyTotp(secret, code)) || validRecovery(recoveryCode, code);
    if (!ok) {
      return NextResponse.json(
        { error: "That code is not valid. Try the latest 6-digit code." },
        { status: 401 }
      );
    }
    if (profile?.id) {
      await saveMfa(String(profile.id), currentData, {
        secret,
        recoveryCode: recoveryCode || "",
        enabled: true,
        enrolledAt: Date.now(),
      });
    }
    return NextResponse.json({ source: "supabase", ok: true, enabled: true });
  }

  if (body.action === "disable") {
    if (profile?.id && stored.secret) {
      await saveMfa(String(profile.id), currentData, {
        ...stored,
        enabled: false,
      });
    }
    return NextResponse.json({ source: "supabase", ok: true, enabled: false });
  }

  if (body.action === "verify") {
    if (!stored.enabled || !stored.secret) {
      return NextResponse.json(
        { error: "Two-factor authentication is not set up yet." },
        { status: 401 }
      );
    }
    const ok =
      (await verifyTotp(stored.secret, code)) ||
      validRecovery(stored.recoveryCode, code);
    if (!ok) {
      return NextResponse.json(
        { error: "That authentication code is not valid." },
        { status: 401 }
      );
    }
    return NextResponse.json({ source: "supabase", ok: true, enabled: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
