import { NextResponse } from "next/server";

import {
  assignmentFromRow,
  parseQrPayload,
  stableToken,
  volunteerQrPayload,
  type AttendanceAssignment,
  type ShiftStatus,
} from "@/lib/attendance";
import { seedShifts } from "@/data/shifts";
import {
  listRuntimeAssignments,
  mergeAssignments,
  upsertRuntimeAssignment,
} from "@/lib/store/runtime-file";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";

const localTokens = new Map<string, string>();
const localStatus = new Map<string, { status: ShiftStatus; method: string; at: string }>();

function localAssignments(username: string): AttendanceAssignment[] {
  return seedShifts.map((shift) => {
    const token = localTokens.get(shift.id) ?? stableToken(shift.id);
    localTokens.set(shift.id, token);
    const extra = localStatus.get(`${username}:${shift.id}`);
    return {
      ...shift,
      volunteerUsername: username,
      status: extra?.status ?? (shift.id.includes("foodbank") ? "Completed" : "Upcoming"),
      qrToken: token,
      qrPayload: volunteerQrPayload(shift.id, token),
      checkedInAt: extra?.at ?? null,
      checkedOutAt: extra?.status === "Completed" ? extra.at : null,
      checkInMethod: extra?.method ?? "",
    };
  });
}

function applyLocal(
  username: string,
  shiftId: string,
  status: ShiftStatus,
  method: string
) {
  localStatus.set(`${username}:${shiftId}`, {
    status,
    method,
    at: new Date().toISOString(),
  });
}

function runtimeCheckIn(
  username: string,
  parsed: NonNullable<ReturnType<typeof parseQrPayload>>
) {
  const shifts = listRuntimeAssignments({ username });
  const match =
    parsed.kind === "volunteer"
      ? shifts.find(
          (item) => item.id === parsed.assignmentId && item.qrToken === parsed.token
        )
      : shifts.find(
          (item) => item.eventId === parsed.eventId && item.status !== "Completed"
        );
  if (!match) {
    return { error: "That QR does not match your shifts.", status: 404 as const };
  }
  const next = {
    ...match,
    status: "Checked in" as const,
    checkedInAt: new Date().toISOString(),
    checkInMethod: parsed.kind,
  };
  upsertRuntimeAssignment(next);
  return { ok: true as const, shift: next };
}

function localCheckIn(username: string, parsed: NonNullable<ReturnType<typeof parseQrPayload>>) {
  const shifts = localAssignments(username);
  const match =
    parsed.kind === "volunteer"
      ? shifts.find((item) => item.id === parsed.assignmentId && item.qrToken === parsed.token)
      : parsed.token === stableToken(`station:${parsed.eventId}`)
        ? shifts.find((item) => item.eventId === parsed.eventId && item.status !== "Completed")
        : undefined;
  if (!match) {
    return { error: "That QR does not match your shifts.", status: 404 as const };
  }
  if (parsed.kind === "volunteer" && match.volunteerUsername !== username) {
    return { error: "That volunteer QR belongs to another account.", status: 403 as const };
  }
  applyLocal(username, match.id, "Checked in", parsed.kind);
  return {
    ok: true,
    shift: { ...match, status: "Checked in" as const },
  };
}

async function logAttendance(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  row: {
    assignmentId: string;
    eventId: string;
    volunteerUsername: string;
    action: string;
    method: string;
    by: string;
  }
) {
  await supabase.from("attendance_logs").insert({
    id: `att-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    assignment_id: row.assignmentId,
    event_id: row.eventId,
    volunteer_username: row.volunteerUsername,
    action: row.action,
    method: row.method,
    by_username: row.by,
  });
}

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const stored = listRuntimeAssignments({ username });
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      shifts: stored,
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      shifts: stored,
    });
  }

  const { data, error } = await supabase
    .from("shift_assignments")
    .select("*")
    .eq("volunteer_username", username);

  if (error) {
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      warning: error.message,
      shifts: stored,
    });
  }

  const rows = (data ?? []).map(assignmentFromRow);
  const shifts = mergeAssignments(rows, stored);
  return NextResponse.json({
    source: rows.length ? "supabase" : stored.length ? "live" : "local",
    shifts,
  });
}

export async function POST(request: Request) {
  let body: { username?: string; payload?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase() ?? "";
  const parsed = parseQrPayload(body.payload || "");
  if (!username || !parsed) {
    return NextResponse.json(
      { error: "Scan the event station QR, or ask a coordinator to scan yours." },
      { status: 400 }
    );
  }

  const storedHit = runtimeCheckIn(username, parsed);
  if (!isSupabaseConfigured()) {
    if ("error" in storedHit && storedHit.error) {
      const local = localCheckIn(username, parsed);
      if ("error" in local && local.error) {
        return NextResponse.json({ error: local.error }, { status: local.status });
      }
      return NextResponse.json({ source: "local", ok: true, shift: local.shift });
    }
    return NextResponse.json({ source: "live", ok: true, shift: storedHit.shift });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Attendance is not available." }, { status: 500 });
  }

  if (parsed.kind === "volunteer") {
    const { data } = await supabase
      .from("shift_assignments")
      .select("*")
      .eq("id", parsed.assignmentId)
      .eq("qr_token", parsed.token)
      .maybeSingle();
    if (!data) {
      const stored = runtimeCheckIn(username, parsed);
      if (!("error" in stored)) {
        return NextResponse.json({ source: "live", ok: true, shift: stored.shift });
      }
      return NextResponse.json({ error: "Unknown volunteer QR." }, { status: 404 });
    }
    if (String(data.volunteer_username).toLowerCase() !== username) {
      return NextResponse.json({ error: "That volunteer QR belongs to another account." }, { status: 403 });
    }
    if (data.status === "Completed") {
      return NextResponse.json({ error: "This shift is already completed." }, { status: 409 });
    }
    await supabase
      .from("shift_assignments")
      .update({
        status: "Checked in",
        checked_in_at: new Date().toISOString(),
        check_in_method: "volunteer_qr",
      })
      .eq("id", data.id);
    upsertRuntimeAssignment(
      assignmentFromRow({
        ...data,
        status: "Checked in",
        checked_in_at: new Date().toISOString(),
        check_in_method: "volunteer_qr",
      })
    );
    await logAttendance(supabase, {
      assignmentId: String(data.id),
      eventId: String(data.event_id),
      volunteerUsername: username,
      action: "check_in",
      method: "volunteer_qr",
      by: username,
    });
    return NextResponse.json({ source: "supabase", ok: true, shift: assignmentFromRow({
      ...data,
      status: "Checked in",
    }) });
  }

  const { data: station } = await supabase
    .from("shift_stations")
    .select("*")
    .eq("event_id", parsed.eventId)
    .eq("token", parsed.token)
    .maybeSingle();
  if (!station) {
    const stored = runtimeCheckIn(username, parsed);
    if (!("error" in stored)) {
      return NextResponse.json({ source: "live", ok: true, shift: stored.shift });
    }
    return NextResponse.json({ error: "Unknown event station QR." }, { status: 404 });
  }

  const { data: assignment } = await supabase
    .from("shift_assignments")
    .select("*")
    .eq("event_id", parsed.eventId)
    .eq("volunteer_username", username)
    .neq("status", "Completed")
    .limit(1)
    .maybeSingle();
  if (!assignment) {
    return NextResponse.json(
      { error: "No upcoming shift for you at this event." },
      { status: 404 }
    );
  }

  await supabase
    .from("shift_assignments")
    .update({
      status: "Checked in",
      checked_in_at: new Date().toISOString(),
      check_in_method: "station_qr",
    })
    .eq("id", assignment.id);
  await logAttendance(supabase, {
    assignmentId: String(assignment.id),
    eventId: parsed.eventId,
    volunteerUsername: username,
    action: "check_in",
    method: "station_qr",
    by: username,
  });

  return NextResponse.json({
    source: "supabase",
    ok: true,
    shift: assignmentFromRow({ ...assignment, status: "Checked in" }),
  });
}
