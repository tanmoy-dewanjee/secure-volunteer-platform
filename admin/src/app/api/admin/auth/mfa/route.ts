import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

import {
  clearLoginFailures,
  loginBlocked,
  recordLoginFailure,
} from "@/lib/auth/lockout";
import { findAdminAccount } from "@/lib/auth/accounts";
import {
  beginAdminEnrollment,
  getAdminMfa,
  verifyAdminMfa,
} from "@/lib/auth/mfa-store";
import { MFA_COOKIE, readAdminToken, setSessionCookie } from "@/lib/auth/session";
import { isTrustedOrigin } from "@/lib/security/origin";

const bodySchema = z.object({
  code: z.string().min(1).max(16),
});

export async function POST(request: Request) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const jar = await cookies();
  const pending = jar.get(MFA_COOKIE)?.value;
  if (!pending) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  const token = await readAdminToken(pending);
  if (!token) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  const key = `mfa:${token.username}`;
  if (loginBlocked(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in 15 minutes." },
      { status: 429 }
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Enter the 6-digit authenticator code." }, { status: 400 });
  }

  const result = await verifyAdminMfa(token.username, parsed.code);
  if (!result.ok) {
    recordLoginFailure(key);
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  clearLoginFailures(key);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true, role: token.role });
}

export async function GET() {
  const jar = await cookies();
  const pending = jar.get(MFA_COOKIE)?.value;
  if (!pending) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  const token = await readAdminToken(pending);
  if (!token) {
    return NextResponse.json({ error: "Session expired. Sign in again." }, { status: 401 });
  }

  const existing = getAdminMfa(token.username);
  if (existing?.enabled) {
    return NextResponse.json({ enrolled: true });
  }

  const account = findAdminAccount(token.username);
  const enrollment = beginAdminEnrollment(
    token.username,
    account?.email || token.username
  );
  return NextResponse.json({ enrolled: false, enrollment });
}
