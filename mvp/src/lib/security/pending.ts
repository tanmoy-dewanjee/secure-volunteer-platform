import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

import { STUDENT_MFA_COOKIE } from "@/lib/security/constants";

function secret() {
  const value =
    process.env.STUDENT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("STUDENT_SESSION_SECRET is required");
    }
    return "dev-student-session-secret-change-me";
  }
  return value;
}

function cookieSecure() {
  return (
    process.env.COOKIE_SECURE === "true" || process.env.NODE_ENV === "production"
  );
}

export function signPendingMfa(username: string, minutes = 10) {
  const exp = Date.now() + minutes * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ u: username, exp })).toString(
    "base64url"
  );
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function readPendingMfa(token: string): string | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const left = Buffer.from(expected);
  const right = Buffer.from(sig);
  if (left.length !== right.length) return null;
  if (!timingSafeEqual(left, right)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as {
      u?: string;
      exp?: number;
    };
    if (!payload.u || typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }
    return payload.u;
  } catch {
    return null;
  }
}

export async function setPendingMfaCookie(username: string) {
  const jar = await cookies();
  jar.set(STUDENT_MFA_COOKIE, signPendingMfa(username), {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "strict",
    path: "/",
    maxAge: 10 * 60,
  });
}

export async function clearPendingMfaCookie() {
  const jar = await cookies();
  jar.delete(STUDENT_MFA_COOKIE);
}

export async function pendingUsernameFromCookies() {
  const jar = await cookies();
  const token = jar.get(STUDENT_MFA_COOKIE)?.value;
  if (!token) return null;
  return readPendingMfa(token);
}
