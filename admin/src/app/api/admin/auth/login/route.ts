import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DEMO_ADMIN_PASSWORD,
  findAdminAccount,
  isStudentUsername,
} from "@/lib/auth/accounts";
import { isTrustedOrigin } from "@/lib/security/origin";
import {
  clearLoginFailures,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/auth/lockout";
import { setSessionCookie } from "@/lib/auth/session";

const bodySchema = z.object({
  username: z.string().trim().min(1).max(80),
  password: z.string().min(1).max(200),
});

const GENERIC = "Sign-in details were not recognised.";

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: GENERIC }, { status: 400 });
  }

  const key = `${ip}:${parsed.username.toLowerCase()}`;
  if (loginBlocked(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  if (isStudentUsername(parsed.username)) {
    recordLoginFailure(key);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  const account = findAdminAccount(parsed.username);
  if (!account || parsed.password !== DEMO_ADMIN_PASSWORD) {
    recordLoginFailure(key);
    return NextResponse.json({ error: GENERIC }, { status: 401 });
  }

  clearLoginFailures(key);
  await setSessionCookie({
    sub: account.id,
    username: account.username,
    role: account.role,
    displayName: account.displayName,
  });
  return NextResponse.json({
    mfaRequired: false,
    ok: true,
    role: account.role,
  });
}
