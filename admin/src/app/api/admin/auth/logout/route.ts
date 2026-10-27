import { NextResponse } from "next/server";

import { clearSessionCookies } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Local demo logout still clears the admin JWT cookie.
  }
  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
