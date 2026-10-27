import { NextResponse } from "next/server";

import { demoStudentProfile } from "@/data/volunteer-progress";
import {
  getRuntimeProfile,
  upsertRuntimeProfile,
} from "@/lib/store/runtime-file";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { profileFromRow } from "@/lib/supabase/map";

export async function GET(request: Request) {
  const username = new URL(request.url).searchParams.get("username")?.trim().toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "username is required" }, { status: 400 });
  }

  const stored = getRuntimeProfile(username);
  const localProfile = {
    ...demoStudentProfile,
    ...stored,
    studentId: username,
    fullName: stored?.fullName || demoStudentProfile.fullName,
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      source: stored ? "live" : "local",
      profile: localProfile,
    });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      source: stored ? "live" : "local",
      profile: localProfile,
    });
  }

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({
      source: stored ? "live" : "supabase",
      profile: localProfile,
    });
  }

  return NextResponse.json({
    source: "supabase",
    profile: {
      ...profileFromRow(data, demoStudentProfile),
      ...stored,
      studentId: username,
    },
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

  upsertRuntimeProfile(username, body.profile);

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
    return NextResponse.json({
      source: "local",
      ok: true,
      warning: error.message,
    });
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
