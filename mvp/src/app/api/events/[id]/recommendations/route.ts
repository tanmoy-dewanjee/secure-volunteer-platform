import { NextRequest, NextResponse } from "next/server";

import { jsonError, readSession } from "@/lib/auth/session";
import { recommendationsFor } from "@/lib/db/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");

  const { id } = await params;
  const set = recommendationsFor(id);
  if (!set) return jsonError(404, "not_found");
  return NextResponse.json(set);
}
