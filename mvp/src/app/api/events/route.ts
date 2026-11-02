import { NextResponse } from "next/server";

import { events as seedEvents, type Event } from "@/data/events";
import { listRuntimeEvents } from "@/lib/store/runtime-file";
import { getSupabaseAdmin, getSupabaseData } from "@/lib/supabase/config";
import { eventFromRow, eventToRow, type EventRow } from "@/lib/supabase/map";

function mergeEvents(layers: Event[][]) {
  const byId = new Map<string, Event>();
  for (const layer of layers) {
    for (const event of layer) byId.set(event.id, event);
  }
  return [...byId.values()].sort((a, b) => b.trendingScore - a.trendingScore);
}

export async function GET() {
  const stored = listRuntimeEvents();
  const supabase = getSupabaseData();
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
    return NextResponse.json({
      source: "local",
      events: mergeEvents([seedEvents, stored]),
    });
  }

  let rows = (data as EventRow[] | null) ?? [];
  const admin = getSupabaseAdmin();
  if (!rows.length && admin) {
    await admin.from("events").upsert(seedEvents.map(eventToRow));
    const seeded = await admin
      .from("events")
      .select("*")
      .is("deleted_at", null)
      .order("trending_score", { ascending: false });
    rows = (seeded.data as EventRow[] | null) ?? [];
  }

  if (!rows.length) {
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      events: mergeEvents([seedEvents, stored]),
    });
  }

  return NextResponse.json({
    source: "supabase",
    events: mergeEvents([rows.map(eventFromRow), stored]),
  });
}
