import { NextResponse } from "next/server";

import { getSessionFromCookies } from "@/lib/auth/session";
import { hasPermission, type AdminRole } from "@/lib/models";
import { isTrustedOrigin } from "@/lib/security/origin";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export async function requireAdmin(
  permission?: Parameters<typeof hasPermission>[1],
  request?: Request
) {
  if (request && !isTrustedOrigin(request)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE }),
    };
  }
  const session = await getSessionFromCookies();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorised" }, { status: 401, headers: NO_STORE }),
    };
  }
  if (permission && !hasPermission(session.role as AdminRole, permission)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403, headers: NO_STORE }),
    };
  }
  return { session, error: null };
}
