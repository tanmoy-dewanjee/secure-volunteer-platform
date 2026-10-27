import { NextResponse } from "next/server";

import { jsonError, requireTrustedOrigin } from "@/lib/security/http";
import { requireStudentUsername } from "@/lib/security/student-session";
import { updateSharedApplicationStatus } from "@/lib/store/server-applications";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  let body: { username?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid payload.", 400);
  }

  const gate = await requireStudentUsername(body.username);
  if (gate.error) return gate.error;
  const username = gate.username!;
  if (body.status !== "Withdrawn") {
    return jsonError("Only pending withdraw is supported.", 400);
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
    return NextResponse.json({ source: "local", ok: true });
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
