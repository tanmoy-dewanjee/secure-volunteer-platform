import { NextRequest, NextResponse } from "next/server";

import { jsonError, readSession } from "@/lib/auth/session";
import { listAudit } from "@/lib/db/store";

export async function GET(request: NextRequest) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");
  if (user.role !== "admin") return jsonError(403, "forbidden");

  const entityId = request.nextUrl.searchParams.get("entityId") ?? undefined;
  const rows = listAudit(entityId);
  return NextResponse.json({ rows });
}
