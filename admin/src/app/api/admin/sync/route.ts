import { NextResponse } from "next/server";

import { events as seedEvents } from "@/data/events";
import {
  DEMO_ADMIN_PASSWORD,
  adminAccounts,
} from "@/lib/auth/accounts";
import { getOps } from "@/lib/store/ops";
import { requireAdmin } from "@/lib/supabase/require-admin";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import {
  announcementToRow,
  applicationToRow,
  eventToRow,
  swapToRow,
  volunteerToRow,
} from "@/lib/supabase/map";

export async function GET() {
  const gate = await requireAdmin("events.read");
  if (gate.error) return gate.error;
  return NextResponse.json({
    configured: isSupabaseConfigured(),
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "missing",
  });
}

export async function POST(request: Request) {
  const gate = await requireAdmin("settings.manage", request);
  if (gate.error) {
    const coordinator = await requireAdmin("events.write", request);
    if (coordinator.error) return coordinator.error;
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error:
          "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Could not create Supabase client." }, { status: 500 });
  }

  const ops = getOps();
  const existing = await supabase.from("events").select("id");
  const have = new Set((existing.data ?? []).map((row) => String(row.id)));
  const missing = seedEvents.filter((event) => !have.has(event.id));
  const eventResult = missing.length
    ? await supabase.from("events").upsert(missing.map(eventToRow))
    : { error: null };
  if (eventResult.error) {
    return NextResponse.json({ error: eventResult.error.message }, { status: 500 });
  }

  await supabase.from("applications").upsert(
    ops.applications.map((item) =>
      applicationToRow(
        item,
        ops.volunteers.find((person) => person.id === item.volunteerId)?.studentUsername
      )
    )
  );
  await supabase.from("volunteer_directory").upsert(ops.volunteers.map(volunteerToRow));
  // audit_logs are append-only; seed migration already inserts demo rows (D1).
  await supabase.from("announcements").upsert(ops.announcements.map(announcementToRow));
  await supabase.from("shift_swaps").upsert(ops.swaps.map(swapToRow));

  for (const account of adminAccounts) {
    const created = await supabase.auth.admin.createUser({
      email: account.email,
      password: DEMO_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: {
        portal: "admin",
        role: account.role,
        username: account.username,
        display_name: account.displayName,
      },
    });
    // handle_new_user hardcodes student; elevate admin profiles explicitly (D2).
    const userId = created.data.user?.id;
    if (userId) {
      await supabase.from("profiles").upsert({
        id: userId,
        username: account.username,
        display_name: account.displayName,
        email: account.email,
        portal: "admin",
        role: account.role,
      });
    }
  }

  const demoStudent = await supabase.auth.admin.createUser({
    email: "a1991246@adelaide.edu.au",
    password: "Volunteer1!",
    email_confirm: true,
    user_metadata: {
      portal: "student",
      role: "student",
      username: "a1991246",
      display_name: "Alex Volunteer",
    },
  });
  if (demoStudent.data.user?.id) {
    await supabase.from("profiles").upsert({
      id: demoStudent.data.user.id,
      username: "a1991246",
      display_name: "Alex Volunteer",
      email: "a1991246@adelaide.edu.au",
      portal: "student",
      role: "student",
    });
  }

  return NextResponse.json({
    ok: true,
    source: "supabase",
    events: seedEvents.length,
    applications: ops.applications.length,
    volunteers: ops.volunteers.length,
  });
}
