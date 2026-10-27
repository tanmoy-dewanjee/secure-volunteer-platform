import {
  jsonError,
  jsonOk,
  requireTrustedOrigin,
} from "@/lib/security/http";
import {
  clientKey,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/security/lockout";
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
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const key = clientKey(request, "forgot");
  if (loginBlocked(key)) {
    return jsonError("Too many attempts. Try again in 15 minutes.", 429);
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Enter your university username.", 400);
  }

  const username = body.username?.trim().toLowerCase() ?? "";
  const looksLikeId = /^a\d{7}$/i.test(username);
  const looksLikeEmail = username.includes("@");
  if (!username || (!looksLikeId && !looksLikeEmail)) {
    recordLoginFailure(key);
    return jsonOk({
      ok: true,
      message: "If an account exists, a reset email will be sent.",
    });
  }

  if (!isSupabaseConfigured()) {
    return jsonOk({
      ok: true,
      message: "If an account exists, a reset email will be sent.",
    });
  }

  const mapped = studentEmailsForUsername(username);
  const supabase = getSupabaseAdmin() ?? getSupabaseAnon();
  if (!supabase) {
    return jsonOk({
      ok: true,
      message: "If an account exists, a reset email will be sent.",
    });
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
    return jsonOk({
      ok: true,
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

  return jsonOk({
    ok: true,
    message: "If an account exists, a reset email will be sent.",
  });
}
