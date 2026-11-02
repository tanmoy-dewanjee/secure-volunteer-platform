import { NextResponse } from "next/server";

import { updateSharedApplicationStatus } from "@/lib/store/server-applications";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/supabase/require-admin";

const STATUSES = [
  "Pending",
  "Shortlisted",
  "Approved",
  "Rejected",
  "Withdrawn",
] as const;

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const gate = await requireAdmin("applications.write", request);
  if (gate.error) return gate.error;

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const id = body.id?.trim();
  const status = body.status?.trim();
  if (!id || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json(
      { error: "id and status are required." },
      { status: 400 }
    );
  }

  updateSharedApplicationStatus(id, status, gate.session?.username);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ source: "local", ok: true });
  }

  const { error } = await supabase
    .from("applications")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
