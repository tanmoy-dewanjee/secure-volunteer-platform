import { SignJWT, jwtVerify } from "jose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getUserById } from "@/lib/db/store";
import { hashPassword, verifyPassword } from "@/lib/db/password";
import type { PublicUser, Role } from "@/lib/db/types";

export { hashPassword, verifyPassword };

export const SESSION_COOKIE = "svp_session";

type SessionClaims = {
  sub: string;
  email: string;
  displayName: string;
  role: Role;
};

function secretKey() {
  const raw =
    process.env.SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "dev-only-session-secret-change-me";
  return new TextEncoder().encode(raw);
}

export function toPublicUser(user: {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  };
}

export async function createSessionToken(user: PublicUser) {
  return new SignJWT({
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  } satisfies Omit<SessionClaims, "sub">)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSession(
  request: NextRequest
): Promise<PublicUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = typeof payload.sub === "string" ? payload.sub : null;
    if (!id) return null;
    const user = getUserById(id);
    if (!user) return null;
    return toPublicUser(user);
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function jsonError(
  status: number,
  error: string,
  message?: string
) {
  return NextResponse.json(
    { error, ...(message ? { message } : {}) },
    { status }
  );
}
