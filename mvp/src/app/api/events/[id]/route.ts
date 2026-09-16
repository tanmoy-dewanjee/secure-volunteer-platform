import { NextRequest, NextResponse } from "next/server";

import { jsonError, readSession } from "@/lib/auth/session";
import {
  getEventById,
  softDeleteEvent,
  toPublicEvent,
  updateEvent,
  writeAudit,
} from "@/lib/db/store";
import { validateEventWrite } from "@/lib/validation/events";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");

  const { id } = await params;
  const event = getEventById(id);
  if (!event) return jsonError(404, "not_found");
  return NextResponse.json(toPublicEvent(event));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");
  if (user.role !== "admin") return jsonError(403, "forbidden");

  const { id } = await params;
  if (!getEventById(id)) return jsonError(404, "not_found");

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

  const event = updateEvent(id, parsed);
  if (!event) return jsonError(404, "not_found");

  writeAudit({
    actorId: user.id,
    action: "event.update",
    entityType: "event",
    entityId: event.id,
    metadata: { fields: Object.keys(parsed) },
  });

  return NextResponse.json(toPublicEvent(event));
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const user = await readSession(request);
  if (!user) return jsonError(401, "unauthorized");
  if (user.role !== "admin") return jsonError(403, "forbidden");

  const { id } = await params;
  const event = softDeleteEvent(id);
  if (!event) return jsonError(404, "not_found");

  writeAudit({
    actorId: user.id,
    action: "event.delete",
    entityType: "event",
    entityId: event.id,
    metadata: { title: event.title },
  });

  return new NextResponse(null, { status: 204 });
}
