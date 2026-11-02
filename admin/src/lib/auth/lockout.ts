import {
  LOCKOUT_MS,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
} from "@/lib/security/constants";
import { readRuntime, writeRuntime } from "@/lib/store/runtime-file";

export const LOCKOUT_MESSAGE = "Too many attempts. Try again in 15 minutes.";

type Attempt = { at: number; count: number; lockedUntil: number };
type Store = Record<string, Attempt>;

const FILE = "login-lockout-admin";
const GLOBAL_KEY = "__svpAdminLockout";

type GlobalLockout = typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, Attempt>;
};

function cache() {
  const g = globalThis as GlobalLockout;
  if (!g[GLOBAL_KEY]) {
    const raw = readRuntime<Store>(FILE, {});
    g[GLOBAL_KEY] = new Map(
      Object.entries(raw && typeof raw === "object" ? raw : {})
    );
  }
  return g[GLOBAL_KEY]!;
}

function persist() {
  const now = Date.now();
  const next: Store = {};
  for (const [key, row] of cache()) {
    if (row.lockedUntil > now || now - row.at <= LOGIN_WINDOW_MS) {
      next[key] = row;
    } else {
      cache().delete(key);
    }
  }
  try {
    writeRuntime(FILE, next);
  } catch {
    /* Memory still holds the lockout if disk is unavailable. */
  }
}

export function loginBlocked(key: string) {
  const row = cache().get(key);
  if (!row) return false;
  if (row.lockedUntil > Date.now()) return true;
  if (Date.now() - row.at > LOGIN_WINDOW_MS) {
    cache().delete(key);
    persist();
    return false;
  }
  return false;
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const row = cache().get(key);
  if (!row || now - row.at > LOGIN_WINDOW_MS) {
    cache().set(key, { at: now, count: 1, lockedUntil: 0 });
    persist();
    return false;
  }
  const count = row.count + 1;
  const locked = count >= LOGIN_MAX_ATTEMPTS;
  cache().set(key, {
    at: now,
    count,
    lockedUntil: locked ? now + LOCKOUT_MS : 0,
  });
  persist();
  return locked;
}

export function clearLoginFailures(key: string) {
  if (!cache().has(key)) return;
  cache().delete(key);
  persist();
}
