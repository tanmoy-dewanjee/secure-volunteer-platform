import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/supabase/require-admin";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  announcementFromRow,
  announcementToRow,
  applicationFromRow,
  applicationToRow,
  auditFromRow,
  auditToRow,
  swapFromRow,
  swapToRow,
  volunteerFromRow,
  volunteerToRow,
} from "@/lib/supabase/map";
import {
  listSharedApplications,
  upsertSharedApplications,
  type SharedApplication,
} from "@/lib/store/server-applications";
import { listRuntimeVolunteers } from "@/lib/store/runtime-file";
import {
  getOps,
  type AdminApplication,
  type OpsState,
} from "@/lib/store/ops";

export const dynamic = "force-dynamic";

function sharedToAdmin(item: SharedApplication): AdminApplication {
  return {
    id: item.id,
    eventId: item.eventId,
    eventTitle: item.eventTitle,
    volunteerId: item.volunteerId || item.volunteerUsername,
    volunteerName: item.volunteerName,
    role: item.role,
    campus: item.campus,
    status: item.status as AdminApplication["status"],
    submitted: item.submittedDate,
    availability: item.availability,
    skills: item.skills,
    answers: item.extraAnswers,
    notes: item.notes,
    history: item.history as AdminApplication["history"],
  };
}

function adminToShared(item: AdminApplication, username?: string): SharedApplication {
  const volunteerUsername = username || item.volunteerId;
  return {
    id: item.id,
    eventId: item.eventId,
    eventTitle: item.eventTitle,
    volunteerUsername,
    volunteerName: item.volunteerName,
    volunteerId: item.volunteerId,
    role: item.role,
    campus: item.campus,
    eventDate: "",
    submittedDate: item.submitted,
    status: item.status,
    availability: item.availability,
    preferredShifts: [],
    extraAnswers: item.answers,
    motivation: "",
    skills: item.skills,
    notes: item.notes,
    history: item.history,
  };
}

function mergeById<T extends { id: string }>(primary: T[], extra: T[]) {
  const seen = new Set(primary.map((item) => item.id));
  return [...primary, ...extra.filter((item) => !seen.has(item.id))];
}

function mergeApplications(
  primary: AdminApplication[],
  extra: AdminApplication[]
) {
  return mergeById(primary, extra);
}

async function loadRemoteApplications() {
  if (!isSupabaseConfigured()) return [] as AdminApplication[];
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const rpc = await supabase.rpc("list_all_applications");
  if (!rpc.error && Array.isArray(rpc.data)) {
    return rpc.data.map((row) =>
      applicationFromRow(row as Record<string, unknown>)
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => applicationFromRow(row as Record<string, unknown>));
}

export async function GET() {
  const gate = await requireAdmin("events.read");
  if (gate.error) return gate.error;

  const local = getOps();
  const fromFile = listSharedApplications().map(sharedToAdmin);
  const fromDb = await loadRemoteApplications();
  const submitted = mergeApplications(fromDb, fromFile);
  const applications = mergeApplications(submitted, local.applications);
  const fromVolunteers = listRuntimeVolunteers().map((item) => ({
    id: item.id,
    name: item.name,
    studentUsername: item.studentUsername,
    email: item.email,
    phone: item.phone,
    studentId: item.studentId,
    campus: item.campus,
    skills: item.skills,
    hours: item.hours,
    eventsAttended: item.eventsAttended,
    noShows: item.noShows,
    reliability: item.reliability,
    status: item.status,
    notes: item.notes,
  }));

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      source: submitted.length ? "live" : "local",
      ops: {
        ...local,
        applications,
        volunteers: mergeById(fromVolunteers, local.volunteers),
      },
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      source: submitted.length ? "live" : "local",
      ops: {
        ...local,
        applications,
        volunteers: mergeById(fromVolunteers, local.volunteers),
      },
    });
  }

  const [vols, audit, anns, swaps] = await Promise.all([
    supabase.from("volunteer_directory").select("*"),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("announcements").select("*"),
    supabase.from("shift_swaps").select("*"),
  ]);

  const ops: OpsState = {
    applications,
    volunteers: mergeById(
      fromVolunteers,
      vols.data?.length ? vols.data.map(volunteerFromRow) : local.volunteers
    ),
    audit: audit.data?.length ? audit.data.map(auditFromRow) : local.audit,
    announcements: anns.data?.length
      ? anns.data.map(announcementFromRow)
      : local.announcements,
    swaps: swaps.data?.length ? swaps.data.map(swapFromRow) : local.swaps,
  };

  return NextResponse.json({
    source: submitted.length || vols.data?.length ? "supabase" : "local",
    ops,
  });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin("applications.write", request);
  if (gate.error) return gate.error;

  let ops: OpsState;
  try {
    ops = (await request.json()) as OpsState;
  } catch {
    return NextResponse.json({ error: "Invalid ops payload." }, { status: 400 });
  }

  upsertSharedApplications(
    ops.applications.map((item) =>
      adminToShared(
        item,
        ops.volunteers.find((person) => person.id === item.volunteerId)
          ?.studentUsername
      )
    )
  );

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true });
  }

  await seedOps(ops);
  return NextResponse.json({ source: "supabase", ok: true });
}

async function seedOps(ops: OpsState) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  if (ops.applications.length) {
    await supabase.from("applications").upsert(
      ops.applications.map((item) =>
        applicationToRow(
          item,
          ops.volunteers.find((person) => person.id === item.volunteerId)
            ?.studentUsername
        )
      )
    );
  }
  if (ops.volunteers.length) {
    await supabase.from("volunteer_directory").upsert(ops.volunteers.map(volunteerToRow));
  }
  if (ops.audit.length) {
    await supabase.from("audit_logs").upsert(ops.audit.map(auditToRow));
  }
  if (ops.announcements.length) {
    await supabase.from("announcements").upsert(ops.announcements.map(announcementToRow));
  }
  if (ops.swaps.length) {
    await supabase.from("shift_swaps").upsert(ops.swaps.map(swapToRow));
  }
}
