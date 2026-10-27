import { NextResponse } from "next/server";

import { demoStudentProfile } from "@/data/volunteer-progress";
import { jsonError, plainText, requireTrustedOrigin } from "@/lib/security/http";
import { requireStudentUsername } from "@/lib/security/student-session";
import {
  getRuntimeProfile,
  upsertRuntimeProfile,
} from "@/lib/store/runtime-file";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/config";
import { profileFromRow } from "@/lib/supabase/map";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("username");
  const gate = await requireStudentUsername(requested);
  if (gate.error) return gate.error;
  const username = gate.username!;

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
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

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
    return jsonError("Invalid payload.", 400);
  }

  const gate = await requireStudentUsername(body.username);
  if (gate.error) return gate.error;
  const username = gate.username!;
  if (!body.profile) {
    return jsonError("username and profile are required.", 400);
  }

  const profile = {
    ...body.profile,
    fullName: plainText(body.profile.fullName, 120),
    campus: plainText(body.profile.campus, 80),
    bio: plainText(body.profile.bio, 2000),
    availability: plainText(body.profile.availability, 400),
    emergencyContact: plainText(body.profile.emergencyContact, 200),
    accessibility: plainText(body.profile.accessibility, 400),
    skills: Array.isArray(body.profile.skills)
      ? body.profile.skills.map((skill) => plainText(skill, 40)).filter(Boolean).slice(0, 20)
      : [],
  };

  upsertRuntimeProfile(username, profile);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", ok: true });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ source: "local", ok: true });

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: profile.fullName,
      campus: profile.campus,
      bio: profile.bio,
      skills: profile.skills,
      availability: profile.availability,
      emergency_contact: profile.emergencyContact,
      accessibility: profile.accessibility,
    })
    .eq("username", username);

  if (error) {
    return NextResponse.json({
      source: "local",
      ok: true,
    });
  }

  return NextResponse.json({ source: "supabase", ok: true });
}
