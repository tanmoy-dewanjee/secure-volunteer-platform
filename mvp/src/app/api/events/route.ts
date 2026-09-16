import { NextRequest, NextResponse } from "next/server";

import { jsonError, readSession } from "@/lib/auth/session";
import {
  createEvent,
  listEvents,
  toPublicEvent,
  writeAudit,
} from "@/lib/db/store";
import { validateEventWrite } from "@/lib/validation/events";

export async function GET(request: NextRequest) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");

  const { searchParams } = request.nextUrl;
  const events = listEvents({
    q: searchParams.get("q") ?? undefined,
    location: searchParams.get("location") ?? undefined,
    department: searchParams.get("department") ?? undefined,
  });
  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");
  if (user.role !== "admin") return jsonError(403, "forbidden");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "validation_error", "Invalid JSON body");
  }

  const parsed = validateEventWrite((body ?? {}) as Record<string, unknown>);
  if (typeof parsed === "string") {
    return jsonError(400, "validation_error", parsed);
  }

  const event = createEvent({
    ...parsed,
    createdBy: user.id,
  });
  writeAudit({
    actorId: user.id,
    action: "event.create",
    entityType: "event",
    entityId: event.id,
    metadata: { title: event.title },
  });

  return NextResponse.json(toPublicEvent(event), { status: 201 });
}
