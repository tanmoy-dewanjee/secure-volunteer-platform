import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/supabase/require-admin";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { eventFromRow, type EventRow } from "@/lib/supabase/map";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin("events.read");
  if (gate.error) return gate.error;
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local" });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ source: "local" });

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    source: "supabase",
    event: eventFromRow(data as EventRow),
  });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const gate = await requireAdmin("events.write");
  if (gate.error) return gate.error;
  const { id } = await context.params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ source: "local", ok: true });

  const { error } = await supabase
    .from("events")
    .update({ deleted_at: new Date().toISOString(), status: "Closed" })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    id: `aud-${Date.now()}`,
    at: new Date().toLocaleString("en-AU"),
    who: gate.session!.username,
    action: "event.delete",
    target: id,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local",
  });

  return NextResponse.json({ source: "supabase", ok: true });
}
