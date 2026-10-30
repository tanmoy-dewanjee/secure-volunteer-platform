import { NextResponse } from "next/server";

import { events as seedEvents } from "@/data/events";
import { findApplicationConflict } from "@/lib/application-conflicts";
import type { VolunteerApplication } from "@/lib/applications";
import { jsonError, plainText, requireTrustedOrigin } from "@/lib/security/http";
import { requireStudentUsername } from "@/lib/security/student-session";
import {
  listSharedApplications,
  upsertSharedApplication,
  type SharedApplication,
} from "@/lib/store/server-applications";
import {
  listRuntimeEvents,
  upsertRuntimeVolunteer,
} from "@/lib/store/runtime-file";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  applicationFromRow,
  applicationToRow,
  eventToRow,
} from "@/lib/supabase/map";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

function toStudentApp(item: SharedApplication): VolunteerApplication {
  return {
    id: item.id,
    eventId: item.eventId,
    eventTitle: item.eventTitle,
    role: item.role,
    campus: item.campus,
    eventDate: item.eventDate,
    submittedDate: item.submittedDate,
    status: item.status as VolunteerApplication["status"],
    availability: item.availability,
    preferredShifts: item.preferredShifts,
    extraAnswers: item.extraAnswers,
    motivation: item.motivation,
  };
}

function toShared(
  username: string,
  name: string,
  application: VolunteerApplication
): SharedApplication {
  return {
    id: application.id,
    eventId: application.eventId,
    eventTitle: application.eventTitle,
    volunteerUsername: username,
    volunteerName: name,
    volunteerId: username,
    role: application.role,
    campus: application.campus,
    eventDate: application.eventDate,
    submittedDate: application.submittedDate,
    status: application.status,
    availability: application.availability ?? "",
    preferredShifts: application.preferredShifts ?? [],
    extraAnswers: application.extraAnswers ?? {},
    motivation: application.motivation ?? "",
    skills: [],
    notes: "",
    history: [
      {
        at: application.submittedDate,
        from: null,
        to: application.status,
        by: username,
      },
    ],
  };
}

function mergeById(
  remote: VolunteerApplication[],
  local: VolunteerApplication[]
) {
  const byId = new Map<string, VolunteerApplication>();
  for (const item of remote) byId.set(item.id, item);
  for (const item of local) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

async function ensureEvent(
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  application: VolunteerApplication
) {
  const seed = seedEvents.find((event) => event.id === application.eventId);
  if (seed) {
    await supabase.from("events").upsert(eventToRow(seed), { onConflict: "id" });
    return;
  }

  await supabase.from("events").upsert(
    {
      id: application.eventId,
      title: application.eventTitle,
      tagline: "",
      category: "General",
      tags: [],
      description: application.eventTitle,
      date: application.eventDate,
      start_time: "9:00 AM",
      end_time: "5:00 PM",
      campus: application.campus,
      location: "",
      organisation_id: "unknown",
      contact_email: "events@example.edu.au",
      capacity: 0,
      places_available: 0,
      status: "Open",
      banner_image: "/window.svg",
      poster_image: "/window.svg",
      featured: false,
      trending_score: 0,
      application_deadline: "",
      accessibility_notes: "",
    },
    { onConflict: "id" }
  );
}

async function getUserClient() {
  try {
    const client = await createClient();
    const { data } = await client.auth.getUser();
    return data.user ? client : null;
  } catch {
    return null;
  }
}

async function loadRemoteApplications(username: string) {
  if (!isSupabaseConfigured()) return { source: "local" as const, applications: [] as VolunteerApplication[] };

  // Prefer the signed-in user JWT so SECURITY DEFINER RPCs see auth.uid().
  const userClient = await getUserClient();
  if (userClient) {
    const rpc = await userClient.rpc("list_volunteer_applications", {
      p_username: username,
    });
    if (!rpc.error && Array.isArray(rpc.data)) {
      return {
        source: "supabase" as const,
        applications: rpc.data.map((row) =>
          applicationFromRow(row as Record<string, unknown>)
        ),
      };
    }

    const { data, error } = await userClient
      .from("applications")
      .select("*")
      .eq("volunteer_username", username)
      .order("created_at", { ascending: false });
    if (!error) {
      return {
        source: "supabase" as const,
        applications: (data ?? []).map((row) =>
          applicationFromRow(row as Record<string, unknown>)
        ),
      };
    }
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return { source: "local" as const, applications: [] as VolunteerApplication[] };

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("volunteer_username", username)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      source: "local" as const,
      applications: [] as VolunteerApplication[],
    };
  }

  return {
    source: "supabase" as const,
    applications: (data ?? []).map((row) =>
      applicationFromRow(row as Record<string, unknown>)
    ),
  };
}

async function saveRemoteApplication(
  username: string,
  name: string,
  application: VolunteerApplication
) {
  if (!isSupabaseConfigured()) {
    return { source: "local" as const, created: true, application };
  }

  const admin = getSupabaseAdmin();
  const userClient = await getUserClient();
  if (!admin && !userClient) {
    return { source: "local" as const, created: true, application };
  }

  // Event ensure still needs service role when RLS blocks student inserts.
  if (admin) {
    await ensureEvent(admin, application);
  }
  const row = applicationToRow(username, name, {
    ...application,
    status: "Pending",
  });

  if (userClient) {
    const rpc = await userClient.rpc("submit_volunteer_application", {
      payload: row,
    });
    if (!rpc.error && rpc.data && typeof rpc.data === "object") {
      const payload = rpc.data as {
        created?: boolean;
        application?: Record<string, unknown>;
      };
      return {
        source: "supabase" as const,
        created: payload.created !== false,
        application: payload.application
          ? applicationFromRow(payload.application)
          : { ...application, status: "Pending" },
      };
    }
  }

  const reader = admin ?? userClient!;
  const { data: existing } = await reader
    .from("applications")
    .select("id, status")
    .eq("volunteer_username", username)
    .eq("event_id", application.eventId)
    .in("status", ["Pending", "Shortlisted", "Approved"]);

  if (existing?.length) {
    return {
      source: "supabase" as const,
      created: false,
      application: { ...application, id: String(existing[0].id), status: "Pending" },
    };
  }

  const writer = userClient ?? admin!;
  const { error } = await writer.from("applications").insert(row);
  if (error) {
    return {
      source: "local" as const,
      created: true,
      application: { ...application, status: "Pending" },
    };
  }

  return {
    source: "supabase" as const,
    created: true,
    application: { ...application, status: "Pending" },
  };
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("username");
  const gate = await requireStudentUsername(requested);
  if (gate.error) return gate.error;
  const username = gate.username!;

  const remote = await loadRemoteApplications(username);
  const stored = listSharedApplications(username).map(toStudentApp);
  const applications = mergeById(remote.applications, stored);

  return NextResponse.json({
    source: remote.source,
    applications,
    warning: "warning" in remote ? remote.warning : undefined,
  });
}

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  let body: {
    username?: string;
    name?: string;
    application?: VolunteerApplication;
    selectedShiftIds?: string[];
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid payload.", 400);
  }

  const gate = await requireStudentUsername(body.username);
  if (gate.error) return gate.error;
  const username = gate.username!;
  const application = body.application;
  if (!application) {
    return jsonError("username and application are required.", 400);
  }

  const catalog = [...seedEvents, ...listRuntimeEvents()];
  const candidate =
    catalog.find((item) => item.id === application.eventId) ?? {
      id: application.eventId,
      title: application.eventTitle,
      date: application.eventDate,
      startTime: "12:00 AM",
      endTime: "11:59 PM",
      shifts: [],
    };
  const selectedShifts = candidate.shifts.filter((shift) =>
    (body.selectedShiftIds ?? []).includes(shift.id)
  );
  const existing = mergeById(
    (await loadRemoteApplications(username)).applications,
    listSharedApplications(username).map(toStudentApp)
  );
  const conflict = findApplicationConflict(
    existing.filter((item) => item.id !== application.id),
    candidate,
    catalog,
    selectedShifts
  );
  if (conflict) {
    return NextResponse.json(
      {
        error: conflict.message,
        created: false,
        conflict,
        application: conflict.application,
      },
      { status: 409 }
    );
  }

  const name = body.name || username;
  const sanitized: VolunteerApplication = {
    ...application,
    motivation: plainText(application.motivation ?? "", 4000),
    availability: plainText(application.availability ?? "", 400),
    role: plainText(application.role ?? "", 120),
  };
  const stored = upsertSharedApplication(toShared(username, name, sanitized));
  upsertRuntimeVolunteer({
    id: username,
    name,
    studentUsername: username,
    email: `${username}@adelaide.edu.au`,
    phone: "",
    studentId: username,
    campus: sanitized.campus,
    skills: [],
    hours: 0,
    eventsAttended: 0,
    noShows: 0,
    reliability: 100,
    status: "Active",
    notes: `Applied for ${sanitized.eventTitle}`,
  });
  const remote = await saveRemoteApplication(username, name, sanitized);

  return NextResponse.json({
    source: remote.source,
    created: remote.created,
    application: remote.application,
    stored: toStudentApp(stored),
    warning: "warning" in remote ? remote.warning : undefined,
  });
}
