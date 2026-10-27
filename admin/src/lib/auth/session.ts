import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import type { AdminRole } from "@/lib/models";
import {
  ADMIN_AUDIENCE,
  ADMIN_COOKIE,
  ADMIN_IDLE_MS,
} from "@/lib/security/constants";

export const MFA_COOKIE = "svp_admin_mfa";

export type AdminToken = {
  sub: string;
  username: string;
  role: AdminRole;
  displayName: string;
};

function secretKey() {
  const secret =
    process.env.ADMIN_SESSION_SECRET || "dev-admin-session-secret-change-me";
  return new TextEncoder().encode(secret);
}

function cookieSecure() {
  return process.env.COOKIE_SECURE === "true";
}

export async function signAdminToken(payload: AdminToken, minutes = 15) {
  return new SignJWT({
    username: payload.username,
    role: payload.role,
    displayName: payload.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setAudience(ADMIN_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${minutes}m`)
    .sign(secretKey());
}

export async function readAdminToken(token: string): Promise<AdminToken | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      audience: ADMIN_AUDIENCE,
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role as AdminRole,
      displayName: String(payload.displayName ?? payload.username),
    };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "strict" as const,
    path: "/",
    maxAge: Math.floor(ADMIN_IDLE_MS / 1000),
  };
}

export async function getSessionFromCookies() {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return readAdminToken(token);
}

export async function setSessionCookie(payload: AdminToken) {
  const token = await signAdminToken(payload);
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, sessionCookieOptions());
  jar.delete(MFA_COOKIE);
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  jar.delete(MFA_COOKIE);
}
