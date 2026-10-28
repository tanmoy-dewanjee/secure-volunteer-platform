import { NextResponse } from "next/server";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
};

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: NO_STORE });
}

export function jsonOk(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function isTrustedOrigin(request: Request, fallbackPort = "3000") {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method.toUpperCase())) {
    return true;
  }

  const allowed = new Set<string>();
  try {
    allowed.add(new URL(request.url).origin);
  } catch {
    /* ignore */
  }
  for (const extra of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.STUDENT_ORIGIN,
    "https://auvolunteers.online",
    "https://www.auvolunteers.online",
    `http://localhost:${fallbackPort}`,
    `http://127.0.0.1:${fallbackPort}`,
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
  return true;
}

export function requireTrustedOrigin(request: Request) {
  if (isTrustedOrigin(request)) return null;
  return jsonError("Forbidden", 403);
}

export function plainText(value: unknown, max: number) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").trim().slice(0, max);
}
