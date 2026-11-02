import { isDemoStudentAccount } from "@/lib/demo-accounts";
import { passwordError } from "@/lib/security/password";
import {
  jsonError,
  jsonOk,
  plainText,
  requireTrustedOrigin,
} from "@/lib/security/http";
import {
  LOCKOUT_MESSAGE,
  clearLoginFailures,
  clientKey,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/security/lockout";
import { setPendingMfaCookie } from "@/lib/security/pending";
import {
  getSupabaseAuthAdmin,
  hasSupabaseSecret,
  isSupabaseConfigured,
  usernameFromEmail,
} from "@/lib/supabase/config";

function signupErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
    return "That email is already registered. Sign in, or use forgot password.";
  }
  if (lower.includes("password")) {
    return "Choose a stronger password that meets the listed requirements.";
  }
  if (lower.includes("email")) {
    return "Check the student email and try again.";
  }
  return "Could not create that account. Try a different student email.";
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const key = clientKey(request, "signup");
  if (loginBlocked(key)) {
    return jsonError(LOCKOUT_MESSAGE, 429);
  }

  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Check your details.", 400);
  }

  const name = plainText(body.name, 120);
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  const username = usernameFromEmail(email);
  const studentEmail =
    /^[a-z0-9._%+-]+@student\.adelaide\.edu\.au$/i.test(email) ||
    /^a\d+@adelaide\.edu\.au$/i.test(email);

  const strengthError = passwordError(password, { name, email, username });
  if (name.length < 2 || !studentEmail) {
    const locked = recordLoginFailure(key);
    return jsonError(locked ? LOCKOUT_MESSAGE : "Check your details.", locked ? 429 : 400);
  }
  if (strengthError) {
    const locked = recordLoginFailure(key);
    return jsonError(locked ? LOCKOUT_MESSAGE : strengthError, locked ? 429 : 400);
  }

  if (isDemoStudentAccount(username)) {
    return jsonError(
      "That student ID is a shared demo account. Sign in with it, or use your own student email.",
      400
    );
  }

  if (!isSupabaseConfigured() || !hasSupabaseSecret()) {
    return jsonError("Account creation is not available.", 503);
  }

  const supabase = getSupabaseAuthAdmin();
  if (!supabase) {
    return jsonError("Account creation is not available.", 503);
  }

  const createWithUsername = (account: string) =>
    supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        portal: "student",
        role: "student",
        username: account,
        display_name: name,
      },
    });

  let created = await createWithUsername(username);
  if (created.error && /database error/i.test(created.error.message)) {
    created = await createWithUsername(
      `${username}-${crypto.randomUUID().slice(0, 8)}`
    );
  }

  const { data, error } = created;
  if (error || !data.user) {
    const locked = recordLoginFailure(key);
    console.error("Student signup failed:", error?.message);
    return jsonError(
      locked ? LOCKOUT_MESSAGE : signupErrorMessage(error?.message || ""),
      locked ? 429 : 400
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    username,
    display_name: name,
    email,
    portal: "student",
    role: "student",
  });
  if (profileError) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      username: `${username}-${data.user.id.slice(0, 6)}`,
      display_name: name,
      email,
      portal: "student",
      role: "student",
    });
  }

  clearLoginFailures(key);
  try {
    await setPendingMfaCookie(username);
  } catch {
    /* Signup still succeeds if the pending-MFA cookie cannot be signed. */
  }
  return jsonOk({
    source: "supabase",
    username,
    name,
    email,
    mfaRequired: true,
  });
}
