import { NextResponse } from "next/server";

import { getEvent } from "@/data/events";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { eventFromRow, type EventRow } from "@/lib/supabase/map";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (data) {
        return NextResponse.json({
          source: "supabase",
          event: eventFromRow(data as EventRow),
        });
      }
    }
  }

  const event = getEvent(id);
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ source: "local", event });
}
