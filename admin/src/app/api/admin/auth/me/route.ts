import { NextResponse } from "next/server";

import { listStoredAdmins, roleLabel } from "@/lib/auth/directory";
import { getSessionFromCookies } from "@/lib/auth/session";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const account = (await listStoredAdmins()).find(
    (item) => item.username === session.username
  );
  return NextResponse.json({
    ...session,
    email: account?.email ?? "",
    roleLabel: roleLabel(session.role),
  });
}
