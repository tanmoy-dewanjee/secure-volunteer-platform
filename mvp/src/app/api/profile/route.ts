import { NextResponse } from "next/server";

import { demoStudentProfile } from "@/data/volunteer-progress";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { profileFromRow } from "@/lib/supabase/map";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      source: "local",
      profile: { ...demoStudentProfile, studentId: username },
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      source: "local",
      profile: { ...demoStudentProfile, studentId: username },
    });
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({
      source: "supabase",
      profile: { ...demoStudentProfile, studentId: username },
    });
  }

  return NextResponse.json({
    source: "supabase",
    profile: profileFromRow(data, demoStudentProfile),
  });
}

export async function PUT(request: Request) {
  let body: {
    username?: string;
    profile?: {
      fullName: string;
      campus: string;
      bio: string;
      skills: string[];
      availability: string;
      emergencyContact: string;
      accessibility: string;
    };
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const username = body.username?.trim().toLowerCase();
  if (!username || !body.profile) {
    return NextResponse.json({ error: "username and profile are required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ source: "local", ok: true });

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: body.profile.fullName,
      campus: body.profile.campus,
      bio: body.profile.bio,
      skills: body.profile.skills,
      availability: body.profile.availability,
      emergency_contact: body.profile.emergencyContact,
      accessibility: body.profile.accessibility,
    })
    .eq("username", username);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
