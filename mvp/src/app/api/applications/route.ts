import { NextResponse } from "next/server";

import { seedApplications, type VolunteerApplication } from "@/lib/applications";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { applicationFromRow, applicationToRow } from "@/lib/supabase/map";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", applications: seedApplications });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ source: "local", applications: seedApplications });
  }

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("volunteer_username", username)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({
      source: "local",
      applications: seedApplications,
      warning: error.message,
    });
  }

  return NextResponse.json({
    source: "supabase",
    applications: (data ?? []).map(applicationFromRow),
  });
}

export async function POST(request: Request) {
  let body: {
    username?: string;
    name?: string;
    application?: VolunteerApplication;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase();
  const application = body.application;
  if (!username || !application) {
    return NextResponse.json({ error: "username and application are required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", application, created: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ source: "local", application, created: true });
  }

  const { data: existing } = await supabase
    .from("applications")
    .select("id, status")
    .eq("volunteer_username", username)
    .eq("event_id", application.eventId)
    .in("status", ["Pending", "Shortlisted", "Approved"]);

  if (existing?.length) {
    return NextResponse.json({
      source: "supabase",
      created: false,
      application: { ...application, id: String(existing[0].id) },
    });
  }

  const row = applicationToRow(username, body.name || username, application);
  const { error } = await supabase.from("applications").insert(row);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source: "supabase", created: true, application });
}
