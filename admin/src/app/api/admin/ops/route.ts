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
import { getOps, type OpsState } from "@/lib/store/ops";

export async function GET() {
  const gate = await requireAdmin("events.read");
  if (gate.error) return gate.error;

  const local = getOps();
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ops: local });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ source: "local", ops: local });
  }

  const [apps, vols, audit, anns, swaps] = await Promise.all([
    supabase.from("applications").select("*").order("created_at", { ascending: false }),
    supabase.from("volunteer_directory").select("*"),
    supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("announcements").select("*"),
    supabase.from("shift_swaps").select("*"),
  ]);

  const empty =
    !apps.data?.length &&
    !vols.data?.length &&
    !audit.data?.length;

  if (empty) {
    await seedOps(local);
    return NextResponse.json({ source: "supabase", seeded: true, ops: local });
  }

  const ops: OpsState = {
    applications: (apps.data ?? []).map(applicationFromRow),
    volunteers: (vols.data ?? []).map(volunteerFromRow),
    audit: (audit.data ?? []).map(auditFromRow),
    announcements: (anns.data ?? []).map(announcementFromRow),
    swaps: (swaps.data ?? []).map(swapFromRow),
  };

  return NextResponse.json({ source: "supabase", ops });
}

export async function PUT(request: Request) {
  const gate = await requireAdmin("applications.write");
  if (gate.error) return gate.error;

  let ops: OpsState;
  try {
    ops = (await request.json()) as OpsState;
  } catch {
    return NextResponse.json({ error: "Invalid ops payload." }, { status: 400 });
  }

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
    await supabase.from("applications").upsert(ops.applications.map(applicationToRow));
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
