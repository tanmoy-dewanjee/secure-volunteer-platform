import {
  NEW_PASSWORD_MAX,
  NEW_PASSWORD_MIN,
} from "@/lib/security/constants";
import {
  jsonError,
  jsonOk,
  plainText,
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
  isSupabaseConfigured,
  usernameFromEmail,
} from "@/lib/supabase/config";

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  const key = clientKey(request, "signup");
  if (loginBlocked(key)) {
    return jsonError("Too many attempts. Try again in 15 minutes.", 429);
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

  if (
    name.length < 2 ||
    !studentEmail ||
    password.length < NEW_PASSWORD_MIN ||
    password.length > NEW_PASSWORD_MAX
  ) {
    recordLoginFailure(key);
    return jsonError("Check your details.", 400);
  }

  if (!isSupabaseConfigured()) {
    recordLoginFailure(key);
    return jsonError("Account creation is not available.", 503);
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    recordLoginFailure(key);
    return jsonError("Account creation is not available.", 503);
  }

  const created =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            portal: "student",
            role: "student",
            username,
            display_name: name,
          },
        })
      : await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              portal: "student",
              role: "student",
              username,
              display_name: name,
            },
          },
        });

  const { data, error } = created;
  if (error || !data.user) {
    recordLoginFailure(key);
    return jsonError("Could not create that account.", 400);
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    username,
    display_name: name,
    email,
    portal: "student",
    role: "student",
  });

  clearLoginFailures(key);
  await setPendingMfaCookie(username);
  return jsonOk({
    source: "supabase",
    username,
    name,
    email,
  });
}
