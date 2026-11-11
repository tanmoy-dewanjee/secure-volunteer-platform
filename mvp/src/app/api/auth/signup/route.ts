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
  adminCreateUser,
  getSupabaseAnon,
  getSupabaseAuthAdmin,
  isSupabaseConfigured,
  usernameFromEmail,
} from "@/lib/supabase/config";
import type { SupabaseClient } from "@supabase/supabase-js";

function signupErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
    return "That email is already registered. Sign in, or use forgot password.";
  }
  if (lower.includes("password")) {
    return "Choose a stronger password that meets the listed requirements.";
  }
  if (lower.includes("database")) {
    return "That student ID is already in use. Try your a-number email such as a1234567@adelaide.edu.au.";
  }
  if (lower.includes("email")) {
    return "Check the student email and try again.";
  }
  if (
    lower.includes("api key") ||
    lower.includes("not allowed") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden")
  ) {
    return "Account creation is not available.";
  }
  return "Could not create that account. Try a different student email.";
}

async function availableUsername(supabase: SupabaseClient, base: string) {
  const root = base.slice(0, 24);
  const { data } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", root)
    .maybeSingle();
  if (!data) return root;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = `${root}-${crypto.randomUUID().slice(0, 8)}`;
    const { data: taken } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", candidate)
      .maybeSingle();
    if (!taken) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
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

  if (!isSupabaseConfigured()) {
    return jsonError("Account creation is not available.", 503);
  }

  const supabase = getSupabaseAuthAdmin() ?? getSupabaseAnon();
  if (!supabase) {
    return jsonError("Account creation is not available.", 503);
  }

  const account = await availableUsername(supabase, username);
  const metadata = {
    portal: "student",
    role: "student",
    username: account,
    display_name: name,
  };

  type CreatedAccount = {
    data: { user: { id: string } | null };
    error: { message?: string } | null;
  };

  let created: CreatedAccount = await adminCreateUser({
    email,
    password,
    metadata,
  });
  if (created.error && /database error/i.test(created.error.message || "")) {
    created = await adminCreateUser({
      email,
      password,
      metadata: {
        ...metadata,
        username: `${username}-${crypto.randomUUID().slice(0, 8)}`,
      },
    });
  }

  if ((created.error || !created.data.user) && getSupabaseAnon()) {
    const signed = await getSupabaseAnon()!.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (!signed.error && signed.data.user) {
      created = {
        data: { user: { id: signed.data.user.id } },
        error: null,
      };
    } else if (signed.error) {
      created = {
        data: { user: null },
        error: { message: signed.error.message },
      };
    }
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

  let profileUsername = account;
  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    username: profileUsername,
    display_name: name,
    email,
    portal: "student",
    role: "student",
  });
  if (profileError) {
    profileUsername = `${username}-${data.user.id.slice(0, 6)}`;
    await supabase.from("profiles").upsert({
      id: data.user.id,
      username: profileUsername,
      display_name: name,
      email,
      portal: "student",
      role: "student",
    });
  }

  clearLoginFailures(key);
  try {
    await setPendingMfaCookie(profileUsername);
  } catch {
    /* Signup still succeeds if the pending-MFA cookie cannot be signed. */
  }
  return jsonOk({
    source: "supabase",
    username: profileUsername,
    name,
    email,
    mfaRequired: true,
  });
}
