import { NextRequest, NextResponse } from "next/server";

import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  jsonError,
  setSessionCookie,
  toPublicUser,
  verifyPassword,
} from "@/lib/auth/session";
import { createUser, getUserByEmail } from "@/lib/db/store";
import { validateRegister } from "@/lib/validation/events";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "validation_error", "Invalid JSON body");
  }

  const parsed = validateRegister(
    (body ?? {}) as {
      email?: unknown;
      password?: unknown;
      displayName?: unknown;
      role?: unknown;
    }
  );
  if (typeof parsed === "string") {
    return jsonError(400, "validation_error", parsed);
  }

  if (getUserByEmail(parsed.email)) {
    return jsonError(409, "conflict", "Email already registered");
  }

  // Public register is always student — ignore any role claim in the body.
  const user = createUser({
    email: parsed.email,
    displayName: parsed.displayName,
    passwordHash: hashPassword(parsed.password),
    role: "student",
  });

  const publicUser = toPublicUser(user);
  const token = await createSessionToken(publicUser);
  const response = NextResponse.json(publicUser, { status: 201 });
  setSessionCookie(response, token);
  return response;
}
