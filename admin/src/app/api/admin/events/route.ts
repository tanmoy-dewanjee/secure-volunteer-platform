import { NextResponse } from "next/server";

import { events as seedEvents, type Event } from "@/data/events";
import { listRuntimeEvents, upsertRuntimeEvent } from "@/lib/store/runtime-file";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { eventFromRow, eventToRow, type EventRow } from "@/lib/supabase/map";

function mergeEvents(layers: Event[][]) {
  const byId = new Map<string, Event>();
  for (const layer of layers) {
    for (const event of layer) byId.set(event.id, event);
  }
  return [...byId.values()].sort((a, b) => b.trendingScore - a.trendingScore);
}

export async function GET() {
  const gate = await requireAdmin("events.read");
  if (gate.error) return gate.error;

  const stored = listRuntimeEvents();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      events: mergeEvents([seedEvents, stored]),
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      events: mergeEvents([seedEvents, stored]),
    });
  }

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .is("deleted_at", null)
    .order("trending_score", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        source: "local",
        events: mergeEvents([seedEvents, stored]),
        warning: error.message,
      },
      { status: 200 }
    );
  }

  if (!data?.length) {
    const rows = seedEvents.map(eventToRow);
    await supabase.from("events").upsert(rows);
    return NextResponse.json({
      source: "supabase",
      seeded: true,
      events: mergeEvents([seedEvents, stored]),
    });
  }

  return NextResponse.json({
    source: "supabase",
    events: mergeEvents([
      seedEvents,
      (data as EventRow[]).map(eventFromRow),
      stored,
    ]),
  });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin("events.write", request);
  if (gate.error) return gate.error;

  let event: Event;
  try {
    event = (await request.json()) as Event;
  } catch {
    return NextResponse.json({ error: "Invalid event payload." }, { status: 400 });
  }

  if (!event?.id || !event.title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  upsertRuntimeEvent(event);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", event, ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ source: "local", event, ok: true });
  }

  const { error } = await supabase.from("events").upsert(eventToRow(event));
  if (error) {
    return NextResponse.json({
      source: "local",
      event,
      ok: true,
      warning: error.message,
    });
  }

  await supabase.from("audit_logs").insert({
    id: `aud-${Date.now()}`,
    at: new Date().toLocaleString("en-AU"),
    who: gate.session!.username,
    action: "event.update",
    target: event.title,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local",
  });

  return NextResponse.json({ source: "supabase", event, ok: true });
}
