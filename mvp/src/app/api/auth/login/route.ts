import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
  getSupabaseAnon,
  isSupabaseConfigured,
  studentEmailsForUsername,
  usernameFromEmail,
} from "@/lib/supabase/config";

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!username || password.length < 8) {
    return NextResponse.json({ error: "Check your sign-in details." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      source: "local",
      username: username.includes("@") ? usernameFromEmail(username) : username,
      name: usernameFromEmail(username),
    });
  }

  const supabase = getSupabaseAnon() ?? getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not available." }, { status: 500 });
  }

  const emails = studentEmailsForUsername(username);
  let lastError = "Sign-in details were not recognised.";

  for (const email of emails) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) {
      lastError = error?.message || lastError;
      continue;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, display_name, portal, role, profile_data")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.portal === "admin") {
      return NextResponse.json(
        { error: "This account belongs to the coordinator portal." },
        { status: 403 }
      );
    }

    const mfa = (profile?.profile_data as { mfa?: { enabled?: boolean; secret?: string } } | null)
      ?.mfa;
    return NextResponse.json({
      source: "supabase",
      username: profile?.username || usernameFromEmail(email),
      name: profile?.display_name || usernameFromEmail(email),
      mfaEnabled: Boolean(mfa?.enabled && mfa?.secret),
      accessToken: data.session?.access_token,
    });
  }

  return NextResponse.json({
    source: "local",
    warning: lastError,
    username: username.includes("@") ? usernameFromEmail(username) : username,
    name: usernameFromEmail(username),
  });
}
