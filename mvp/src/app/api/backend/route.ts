import { NextResponse } from "next/server";

import {
  hasSupabaseSecret,
  isSupabaseConfigured,
  supabaseProjectHost,
} from "@/lib/supabase/config";

export async function GET() {
  return NextResponse.json({
    supabase: isSupabaseConfigured(),
    secret: hasSupabaseSecret(),
    project: supabaseProjectHost() || null,
    portal: "student",
  });
}
