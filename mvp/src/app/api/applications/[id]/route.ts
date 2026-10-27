import { NextResponse } from "next/server";

import { updateSharedApplicationStatus } from "@/lib/store/server-applications";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  let body: { username?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase();
  if (!username || body.status !== "Withdrawn") {
    return NextResponse.json(
      { error: "Only pending withdraw is supported." },
      { status: 400 }
    );
  }

  updateSharedApplicationStatus(id, "Withdrawn", username);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ source: "local", ok: true });

  const rpc = await supabase.rpc("update_application_status", {
    p_id: id,
    p_status: "Withdrawn",
    p_username: username,
  });
  if (!rpc.error) {
    return NextResponse.json({ source: "supabase", ok: true });
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: "Withdrawn" })
    .eq("id", id)
    .eq("volunteer_username", username)
    .eq("status", "Pending");

  if (error) {
    return NextResponse.json({ source: "local", ok: true, warning: error.message });
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
