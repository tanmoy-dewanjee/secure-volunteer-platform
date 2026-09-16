import { NextRequest, NextResponse } from "next/server";

import {
  createSessionToken,
  jsonError,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth/session";
import { getUserByEmail } from "@/lib/db/store";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "validation_error", "Invalid JSON body");
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) {
    return jsonError(400, "validation_error", "email and password are required");
  }

  const user = getUserByEmail(email);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return jsonError(401, "unauthorized", "Invalid email or password");
  }

  const publicUser = toPublicUser(user);
  const token = await createSessionToken(publicUser);
  const response = NextResponse.json(publicUser);
  setSessionCookie(response, token);
  return response;
}
