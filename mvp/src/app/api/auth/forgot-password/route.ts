import { isDemoStudentAccount } from "@/lib/demo-accounts";
import {
  jsonError,
  jsonOk,
  requireTrustedOrigin,
} from "@/lib/security/http";
import {
  clientKey,
  loginBlocked,
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
    [
      configured,
      "https://auvolunteers.online",
      "https://www.auvolunteers.online",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ].filter(Boolean) as string[]
  );
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    /* ignore */
  }
  if (origin && allowed.has(origin.replace(/\/$/, ""))) {
    return origin.replace(/\/$/, "");
  }
  return configured || "https://auvolunteers.online";
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
    return jsonOk({
      ok: true,
      message: "If an account exists, a reset email will be sent.",
    });
  }

  if (isDemoStudentAccount(username)) {
    return jsonOk({
      ok: true,
      demo: true,
      message:
        "Demo accounts use the published demo password. Sign in with a1991246 and Volunteer1!.",
    });
  }

  if (!isSupabaseConfigured()) {
    return jsonOk({
      ok: true,
      message: "If an account exists, a reset email will be sent.",
    });
  }

  const admin = getSupabaseAdmin();
  const mailer = getSupabaseAnon();
  if (!mailer) {
    return jsonOk({
      ok: true,
      message: "If an account exists, a reset email will be sent.",
    });
  }

  const localId = looksLikeEmail ? usernameFromEmail(username) : username;
  let profileEmail = "";
  if (admin) {
    const byUsername = await admin
      .from("profiles")
      .select("email, portal")
      .eq("username", localId)
      .maybeSingle();
    let profile = byUsername.data;
    if (!profile && looksLikeEmail) {
      const byEmail = await admin
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
    profileEmail = profile?.email ? String(profile.email).toLowerCase() : "";
  }

  const emails = new Set<string>();
  if (profileEmail) emails.add(profileEmail);
  else if (looksLikeEmail) emails.add(username);
  else studentEmailsForUsername(username).forEach((email) => emails.add(email));

  const redirectTo = `${allowedOrigin(request)}/auth/callback?next=/reset-password`;
  for (const email of emails) {
    const { error } = await mailer.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) {
      console.error("Password reset email failed:", error.message);
    }
  }

  return jsonOk({
    ok: true,
    message: "If an account exists, a reset email will be sent.",
  });
}
