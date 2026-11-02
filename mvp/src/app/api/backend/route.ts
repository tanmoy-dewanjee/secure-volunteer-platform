import { NextResponse } from "next/server";

import { hasSupabaseSecret, isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  return NextResponse.json({
    supabase: isSupabaseConfigured(),
    secret: hasSupabaseSecret(),
    portal: "student",
  });
}
