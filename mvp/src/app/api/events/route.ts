import { NextResponse } from "next/server";

import { events as seedEvents } from "@/data/events";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { eventFromRow, type EventRow } from "@/lib/supabase/map";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", events: seedEvents });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ source: "local", events: seedEvents });
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
      events: seedEvents,
    });
  }

  const byId = new Map(seedEvents.map((event) => [event.id, event]));
  for (const row of (data as EventRow[]) ?? []) {
    byId.set(row.id, eventFromRow(row));
  }

  return NextResponse.json({
    source: data?.length ? "supabase" : "local",
    events: [...byId.values()].sort((a, b) => b.trendingScore - a.trendingScore),
  });
}
