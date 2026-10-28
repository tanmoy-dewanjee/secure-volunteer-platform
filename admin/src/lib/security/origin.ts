const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

export function isTrustedOrigin(request: Request) {
  if (SAFE.has(request.method.toUpperCase())) return true;

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    /* ignore */
  }
  for (const extra of [
    process.env.ADMIN_ORIGIN,
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3010",
    "http://127.0.0.1:3010",
  ]) {
    if (extra) allowed.add(extra.replace(/\/$/, ""));
  }

  const site = request.headers.get("sec-fetch-site");
  if (site === "same-origin" || site === "none") return true;

  const origin = request.headers.get("origin");
  if (origin) return allowed.has(origin.replace(/\/$/, ""));
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return allowed.has(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  return false;
}
