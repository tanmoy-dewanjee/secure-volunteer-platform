import { NextResponse } from "next/server";

import { seedShifts } from "@/data/shifts";
import { assignmentFromRow } from "@/lib/attendance";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", shifts: seedShifts });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ source: "local", shifts: seedShifts });
  }

  const { data, error } = await supabase
    .from("shift_assignments")
    .select("*")
    .eq("volunteer_username", username);

  if (error || !data?.length) {
    return NextResponse.json({ source: data ? "supabase" : "local", shifts: seedShifts });
  }

  return NextResponse.json({
    source: "supabase",
    shifts: data.map(assignmentFromRow),
  });
}

export async function PATCH(request: Request) {
  let body: { username?: string; shiftId?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.username || !body.shiftId || !body.status) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ source: "local", ok: true });

  const { error } = await supabase
    .from("shift_assignments")
    .update({ status: body.status })
    .eq("id", body.shiftId)
    .eq("volunteer_username", body.username.trim().toLowerCase());

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
