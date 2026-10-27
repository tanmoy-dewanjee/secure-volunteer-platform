import { NextResponse } from "next/server";

import { getSessionFromCookies } from "@/lib/auth/session";
import { hasPermission, type AdminRole } from "@/lib/models";

export async function requireAdmin(
  permission?: Parameters<typeof hasPermission>[1]
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }),
    };
  }
  if (permission && !hasPermission(session.role as AdminRole, permission)) {
    return {
      session: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session, error: null };
}
