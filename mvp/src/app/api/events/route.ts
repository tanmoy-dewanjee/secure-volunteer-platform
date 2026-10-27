import { NextResponse } from "next/server";

import { events as seedEvents, type Event } from "@/data/events";
import { listRuntimeEvents } from "@/lib/store/runtime-file";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { eventFromRow, type EventRow } from "@/lib/supabase/map";

function mergeEvents(layers: Event[][]) {
  const byId = new Map<string, Event>();
  for (const layer of layers) {
    for (const event of layer) byId.set(event.id, event);
  }
  return [...byId.values()].sort((a, b) => b.trendingScore - a.trendingScore);
}

export async function GET() {
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
    return NextResponse.json({
      source: "local",
      warning: error.message,
      events: mergeEvents([seedEvents, stored]),
    });
  }

  return NextResponse.json({
    source: data?.length || stored.length ? "supabase" : "local",
    events: mergeEvents([
      seedEvents,
      (data as EventRow[] | null)?.map(eventFromRow) ?? [],
      stored,
    ]),
  });
}
