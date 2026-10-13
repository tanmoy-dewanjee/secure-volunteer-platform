import { NextResponse } from "next/server";

import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  usernameFromEmail,
} from "@/lib/supabase/config";

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!name || !email || password.length < 8) {
    return NextResponse.json({ error: "Check your details." }, { status: 400 });
  }

  const username = usernameFromEmail(email);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ source: "local", username, name, email });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Auth is not available." }, { status: 500 });
  }

  const canUseAdminApi = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const created = canUseAdminApi
    ? await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          portal: "student",
          role: "student",
          username,
          display_name: name,
        },
      })
    : await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            portal: "student",
            role: "student",
            username,
            display_name: name,
          },
        },
      });

  const { data, error } = created;
  if (error || !data.user) {
    return NextResponse.json(
      { error: error?.message || "Could not create that account." },
      { status: 400 }
    );
  }

  await supabase.from("profiles").upsert({
    id: data.user.id,
    username,
    display_name: name,
    email,
    portal: "student",
    role: "student",
  });

  return NextResponse.json({
    source: "supabase",
    username,
    name,
    email,
  });
}
