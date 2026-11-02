import { jsonError, jsonOk, requireTrustedOrigin } from "@/lib/security/http";
import { passwordError } from "@/lib/security/password";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Check your details.", 400);
  }

  const password = body.password ?? "";
  const strengthError = passwordError(password);
  if (strengthError) {
    return jsonError(strengthError, 400);
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return jsonError("Reset session expired. Request a new link.", 401);
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return jsonError("Could not update that password.", 400);
    }
    await supabase.auth.signOut();
  } catch {
    return jsonError("Could not update that password.", 400);
  }

  return jsonOk({ ok: true });
}
