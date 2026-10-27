import { NextResponse } from "next/server";

import { seedShifts } from "@/data/shifts";
import { assignmentFromRow } from "@/lib/attendance";
import { jsonError, requireTrustedOrigin } from "@/lib/security/http";
import { requireStudentUsername } from "@/lib/security/student-session";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("username");
  const gate = await requireStudentUsername(requested);
  if (gate.error) return gate.error;
  const username = gate.username!;

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
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  let body: { username?: string; shiftId?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid payload.", 400);
  }

  const gate = await requireStudentUsername(body.username);
  if (gate.error) return gate.error;
  if (!body.shiftId || !body.status) {
    return jsonError("Missing fields.", 400);
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
    .eq("volunteer_username", gate.username);

  if (error) {
    return jsonError("Could not update that shift.", 500);
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
