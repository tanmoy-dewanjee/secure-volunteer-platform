import {
  LOCKOUT_MS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
} from "@/lib/security/constants";

type Attempt = { at: number; count: number; lockedUntil: number };

const attempts = new Map<string, Attempt>();

export function clientKey(request: Request, username = "") {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  return `${ip}:${username.trim().toLowerCase()}`;
}

export function loginBlocked(key: string) {
  const row = attempts.get(key);
  if (!row) return false;
  if (row.lockedUntil > Date.now()) return true;
  if (Date.now() - row.at > LOGIN_WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return false;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const row = attempts.get(key);
  if (!row || now - row.at > LOGIN_WINDOW_MS) {
    attempts.set(key, { at: now, count: 1, lockedUntil: 0 });
    return;
  }
  const count = row.count + 1;
  attempts.set(key, {
    at: now,
    count,
    lockedUntil: count >= LOGIN_MAX_ATTEMPTS ? now + LOCKOUT_MS : 0,
  });
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
