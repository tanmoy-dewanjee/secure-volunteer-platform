import { NextResponse } from "next/server";

import {
  assignmentFromRow,
  newToken,
  parseQrPayload,
  stableToken,
  stationFromRow,
  stationQrPayload,
  type AttendanceAssignment,
  type ShiftStatus,
  type StationRecord,
} from "@/lib/attendance";
import {
  listRuntimeAssignments,
  mergeAssignments,
  upsertRuntimeAssignment,
} from "@/lib/store/runtime-file";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";

const localStations = new Map<string, StationRecord>();
const localAssignments = new Map<string, AttendanceAssignment>();

function seedLocalAssignments(eventId: string) {
  const seeds: Array<Record<string, unknown>> = [
    {
      id: "shift-wellbeing",
      event_id: "wellbeing-expo",
      event_title: "Student Wellbeing Expo",
      club_name: "SMHC",
      role: "Welcome Volunteer",
      campus: "Mawson Lakes",
      location: "Mawson Lakes Campus, Building C Atrium",
      date: "18 November 2026",
      start_time: "10:00 AM",
      end_time: "3:00 PM",
      meeting_point: "Building C foyer from 9:40 AM",
      notes: "Wear closed shoes and collect your lanyard at briefing.",
      volunteer_username: "a1991246",
      status: "Upcoming",
      qr_token: stableToken("shift-wellbeing"),
    },
    {
      id: "shift-ingenuity",
      event_id: "ingenuity-2026",
      event_title: "Ingenuity 2026",
      club_name: "AUES",
      role: "Registration Support",
      campus: "Adelaide City",
      location: "Adelaide Convention Centre, North Terrace",
      date: "11 November 2026",
      start_time: "9:00 AM",
      end_time: "1:00 PM",
      meeting_point: "North Terrace registration desk",
      notes: "Coordinator briefing starts at 8:40 AM.",
      volunteer_username: "a1882201",
      status: "Upcoming",
      qr_token: stableToken("shift-ingenuity"),
    },
    {
      id: "shift-foodbank",
      event_id: "foodbank-packing",
      event_title: "Foodbank Packing Morning",
      club_name: "Rotaract",
      role: "Hamper Packing",
      campus: "Adelaide City",
      location: "Foodbank SA, Pooraka",
      date: "8 March 2026",
      start_time: "9:00 AM",
      end_time: "12:30 PM",
      meeting_point: "Warehouse reception",
      notes: "This completed demo shift contributed hours and a host rating.",
      volunteer_username: "a1773344",
      status: "Completed",
      qr_token: stableToken("shift-foodbank"),
    },
  ];
  for (const row of seeds) {
    if (String(row.event_id) !== eventId) continue;
    const assignment = assignmentFromRow(row);
    if (!localAssignments.has(assignment.id)) {
      localAssignments.set(assignment.id, assignment);
    }
  }
}

function ensureLocalStation(eventId: string, label: string): StationRecord {
  const existing = localStations.get(eventId);
  if (existing) return existing;
  const token = stableToken(`station:${eventId}`);
  const record: StationRecord = {
    eventId,
    token,
    label,
    qrPayload: stationQrPayload(eventId, token),
  };
  localStations.set(eventId, record);
  return record;
}

async function writeLog(
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
  const gate = await requireAdmin("events.read");
  if (gate.error) return gate.error;

  const eventId = new URL(request.url).searchParams.get("eventId")?.trim();
  if (!eventId) {
    return NextResponse.json({ error: "eventId is required" }, { status: 400 });
  }

  const stored = listRuntimeAssignments({ eventId });
  if (!isSupabaseConfigured()) {
    seedLocalAssignments(eventId);
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      station: ensureLocalStation(eventId, "Event check-in"),
      assignments: mergeAssignments(
        stored,
        [...localAssignments.values()].filter((item) => item.eventId === eventId)
      ),
      logs: [],
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Attendance is not available." }, { status: 500 });
  }

  const stationLookup = await supabase
    .from("shift_stations")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();
  if (stationLookup.error) {
    seedLocalAssignments(eventId);
    return NextResponse.json({
      source: stored.length ? "live" : "local",
      warning: stationLookup.error.message,
      station: ensureLocalStation(eventId, "Event check-in"),
      assignments: mergeAssignments(
        stored,
        [...localAssignments.values()].filter((item) => item.eventId === eventId)
      ),
      logs: [],
    });
  }
  let stationRow = stationLookup.data;
  if (!stationRow) {
    const token = newToken();
    const inserted = await supabase
      .from("shift_stations")
      .upsert({
        event_id: eventId,
        token,
        label: "Event check-in",
      })
      .select("*")
      .maybeSingle();
    stationRow = inserted.data;
  }

  const [{ data: assignments }, { data: logs }] = await Promise.all([
    supabase.from("shift_assignments").select("*").eq("event_id", eventId),
    supabase
      .from("attendance_logs")
      .select("*")
      .eq("event_id", eventId)
      .order("at", { ascending: false })
      .limit(50),
  ]);

  return NextResponse.json({
    source: "supabase",
    station: stationRow ? stationFromRow(stationRow) : ensureLocalStation(eventId, "Event check-in"),
    assignments: mergeAssignments(
      (assignments ?? []).map(assignmentFromRow),
      stored
    ),
    logs: logs ?? [],
  });
}

export async function POST(request: Request) {
  const gate = await requireAdmin("events.write", request);
  if (gate.error) return gate.error;

  let body: {
    action?: string;
    token?: string;
    eventId?: string;
    shiftId?: string;
    status?: ShiftStatus;
    volunteerUsername?: string;
    eventTitle?: string;
    role?: string;
    campus?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const actor = gate.session?.username || "admin";

  if (body.action === "assign") {
    const eventId = body.eventId?.trim();
    const volunteerUsername = body.volunteerUsername?.trim().toLowerCase();
    if (!eventId || !volunteerUsername) {
      return NextResponse.json({ error: "eventId and volunteerUsername are required." }, { status: 400 });
    }
    const id = `shift-${eventId}-${volunteerUsername}`.slice(0, 80);
    const token = stableToken(id);
    const row = {
      id,
      event_id: eventId,
      event_title: body.eventTitle || eventId,
      club_name: "",
      role: body.role || "Volunteer",
      campus: body.campus || "",
      location: body.location || "",
      date: body.date || "",
      start_time: body.startTime || "",
      end_time: body.endTime || "",
      meeting_point: "",
      notes: "Assigned from application approval.",
      volunteer_username: volunteerUsername,
      status: "Upcoming",
      qr_token: token,
    };

    const assignment = assignmentFromRow(row);
    upsertRuntimeAssignment(assignment);
    localAssignments.set(id, assignment);

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ source: "local", ok: true, assignment });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Unavailable." }, { status: 500 });
    const { error } = await supabase.from("shift_assignments").upsert(row);
    if (error) {
      return NextResponse.json({
        source: "local",
        warning: error.message,
        ok: true,
        assignment,
      });
    }
    return NextResponse.json({ source: "supabase", ok: true, assignment });
  }

  if (body.action === "status") {
    if (!body.shiftId || !body.status) {
      return NextResponse.json({ error: "shiftId and status are required." }, { status: 400 });
    }
    const now = new Date().toISOString();
    const stored = listRuntimeAssignments().find((item) => item.id === body.shiftId);
    if (stored) {
      stored.status = body.status;
      if (body.status === "Checked in") stored.checkedInAt = now;
      if (body.status === "Completed") stored.checkedOutAt = now;
      upsertRuntimeAssignment(stored);
    }
    if (!isSupabaseConfigured()) {
      const current = localAssignments.get(body.shiftId);
      if (current) {
        current.status = body.status;
        if (body.status === "Checked in") current.checkedInAt = now;
        if (body.status === "Completed") current.checkedOutAt = now;
        localAssignments.set(body.shiftId, current);
      }
      return NextResponse.json({ source: stored ? "live" : "local", ok: true });
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) return NextResponse.json({ error: "Unavailable." }, { status: 500 });
    const patch: Record<string, string> = { status: body.status };
    if (body.status === "Checked in") {
      patch.checked_in_at = now;
      patch.check_in_method = "manual";
    }
    if (body.status === "Completed") patch.checked_out_at = now;
    const { data } = await supabase
      .from("shift_assignments")
      .update(patch)
      .eq("id", body.shiftId)
      .select("*")
      .maybeSingle();
    if (data) {
      await writeLog(supabase, {
        assignmentId: String(data.id),
        eventId: String(data.event_id),
        volunteerUsername: String(data.volunteer_username),
        action:
          body.status === "Checked in"
            ? "check_in"
            : body.status === "Completed"
              ? "complete"
              : "no_show",
        method: "manual",
        by: actor,
      });
    }
    return NextResponse.json({ source: "supabase", ok: true });
  }

  const parsed = parseQrPayload(body.token || "");
  if (!parsed || parsed.kind !== "volunteer") {
    return NextResponse.json(
      { error: "Scan a volunteer shift QR from the student phone." },
      { status: 400 }
    );
  }

  const runtimeHit = listRuntimeAssignments().find(
    (item) => item.id === parsed.assignmentId && item.qrToken === parsed.token
  );
  if (!isSupabaseConfigured()) {
    seedLocalAssignments("wellbeing-expo");
    seedLocalAssignments("ingenuity-2026");
    seedLocalAssignments("foodbank-packing");
    const hit =
      runtimeHit ||
      [...localAssignments.values()].find(
        (item) => item.id === parsed.assignmentId && item.qrToken === parsed.token
      );
    if (!hit) return NextResponse.json({ error: "Unknown volunteer QR." }, { status: 404 });
    hit.status = "Checked in";
    hit.checkedInAt = new Date().toISOString();
    hit.checkInMethod = "admin_scan";
    localAssignments.set(hit.id, hit);
    upsertRuntimeAssignment(hit);
    return NextResponse.json({ source: "local", ok: true, assignment: hit });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ error: "Unavailable." }, { status: 500 });

  const { data } = await supabase
    .from("shift_assignments")
    .select("*")
    .eq("id", parsed.assignmentId)
    .eq("qr_token", parsed.token)
    .maybeSingle();
  if (!data) {
    if (runtimeHit) {
      runtimeHit.status = "Checked in";
      runtimeHit.checkedInAt = new Date().toISOString();
      runtimeHit.checkInMethod = "admin_scan";
      upsertRuntimeAssignment(runtimeHit);
      return NextResponse.json({ source: "live", ok: true, assignment: runtimeHit });
    }
    return NextResponse.json({ error: "Unknown volunteer QR." }, { status: 404 });
  }

  await supabase
    .from("shift_assignments")
    .update({
      status: "Checked in",
      checked_in_at: new Date().toISOString(),
      check_in_method: "admin_scan",
    })
    .eq("id", data.id);
  await writeLog(supabase, {
    assignmentId: String(data.id),
    eventId: String(data.event_id),
    volunteerUsername: String(data.volunteer_username),
    action: "check_in",
    method: "admin_scan",
    by: actor,
  });

  return NextResponse.json({
    source: "supabase",
    ok: true,
    assignment: assignmentFromRow({ ...data, status: "Checked in" }),
  });
}
