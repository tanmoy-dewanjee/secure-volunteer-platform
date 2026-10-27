import { NextResponse, type NextRequest } from "next/server";

import { readAdminToken } from "@/lib/auth/session";
import { ADMIN_COOKIE, PUBLIC_PATHS } from "@/lib/security/constants";
import { updateSession } from "@/utils/supabase/middleware";

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseResponse = await updateSession(request);

  if (
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/student")
  ) {
    if (pathname.startsWith("/api/student")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return supabaseResponse;
  }

  if (isPublic(pathname)) {
    return supabaseResponse;
  }

  const raw = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = raw ? await readAdminToken(raw) : null;
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return copyCookies(supabaseResponse, NextResponse.redirect(login));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
