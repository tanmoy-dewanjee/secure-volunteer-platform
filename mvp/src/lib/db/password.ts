import { createHash, randomBytes, timingSafeEqual } from "crypto";

/** Local-store password hashing (demo). Supabase Auth replaces this in production. */
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
  return `${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split("$");
  if (!salt || !expected) return false;
  const actual = createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}
