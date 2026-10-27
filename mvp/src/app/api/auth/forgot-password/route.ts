import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
  getSupabaseAnon,
  isSupabaseConfigured,
  studentEmailsForUsername,
  usernameFromEmail,
} from "@/lib/supabase/config";

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin") || "";
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const allowed = new Set(
    [configured, "http://localhost:3000", "http://127.0.0.1:3000"].filter(
      Boolean
    ) as string[]
  );
  if (origin && allowed.has(origin.replace(/\/$/, ""))) {
    return origin.replace(/\/$/, "");
  }
  return configured || "http://localhost:3000";
}

export async function POST(request: Request) {
  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase() ?? "";
  if (!username) {
    return NextResponse.json({ error: "Enter your university username." }, { status: 400 });
  }

  const looksLikeId = /^a\d{7}$/i.test(username);
  const looksLikeEmail = username.includes("@");
  if (!looksLikeId && !looksLikeEmail) {
    return NextResponse.json(
      { error: "Enter a student username such as a1234567, or your student email." },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      source: "local",
      message: "If an account exists, a reset email will be sent.",
    });
  }

  const mapped = studentEmailsForUsername(username);
  const supabase = getSupabaseAdmin() ?? getSupabaseAnon();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not available." }, { status: 500 });
  }

  const localId = looksLikeEmail ? usernameFromEmail(username) : username;
  const byUsername = await supabase
    .from("profiles")
    .select("email, portal")
    .eq("username", localId)
    .maybeSingle();
  let profile = byUsername.data;
  if (!profile && looksLikeEmail) {
    const byEmail = await supabase
      .from("profiles")
      .select("email, portal")
      .eq("email", username)
      .maybeSingle();
    profile = byEmail.data;
  }

  if (profile?.portal === "admin") {
    return NextResponse.json({
      ok: true,
      source: "supabase",
      message: "If an account exists, a reset email will be sent.",
    });
  }

  const emails = new Set(mapped);
  const profileEmail = profile?.email ? String(profile.email).toLowerCase() : "";
  if (profileEmail) emails.add(profileEmail);

  const redirectTo = `${allowedOrigin(request)}/auth/callback?next=/reset-password`;
  for (const email of emails) {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  }

  return NextResponse.json({
    ok: true,
    source: "supabase",
    message: "If an account exists, a reset email will be sent.",
  });
}
