import { NextRequest } from "next/server";

import { jsonError, readSession } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");
  return NextResponse.json(user);
}
