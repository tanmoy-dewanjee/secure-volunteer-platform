import { NextResponse } from "next/server";

import { adminAccounts, isStudentUsername } from "@/lib/auth/accounts";
import { listStoredAdmins, roleLabel } from "@/lib/auth/directory";
import { passwordError } from "@/lib/security/password";
import { requireAdmin } from "@/lib/supabase/require-admin";
import {
  getSupabaseAdmin,
  getSupabaseAuthAdmin,
  hasSupabaseSecret,
} from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

const USERNAME_PATTERN = /^[a-z][a-z0-9._-]{2,31}$/;

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    },
  });
}

export async function GET() {
  const gate = await requireAdmin("admins.manage");
  if (gate.error) return gate.error;
  const protectedUsernames = new Set(
    adminAccounts.map((account) => account.username)
  );
  const accounts = await listStoredAdmins();
  return json({
    accounts: accounts.map((account) => ({
      ...account,
      roleLabel: roleLabel(account.role),
      canRemove:
        account.role === "event_coordinator" &&
        !protectedUsernames.has(account.username),
    })),
  });
}

export async function POST(request: Request) {
  const gate = await requireAdmin("admins.manage", request);
  if (gate.error) return gate.error;

  if (!hasSupabaseSecret()) {
    return json({ error: "Supabase is not configured." }, 503);
  }

  let body: {
    displayName?: string;
    username?: string;
    email?: string;
    password?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Check the coordinator details." }, 400);
  }

  const displayName = body.displayName?.trim() ?? "";
  const username = body.username?.trim().toLowerCase() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";

  if (displayName.length < 2 || displayName.length > 120) {
    return json({ error: "Enter the coordinator’s name." }, 400);
  }
  if (!USERNAME_PATTERN.test(username) || isStudentUsername(username)) {
    return json(
      {
        error:
          "Username must be 3–32 characters, start with a letter, and not be a student ID.",
      },
      400
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }
  const strengthError = passwordError(password, {
    username,
    email,
    name: displayName,
  });
  if (strengthError) {
    return json({ error: strengthError }, 400);
  }

  const auth = getSupabaseAuthAdmin();
  const supabase = getSupabaseAdmin();
  if (!auth || !supabase) {
    return json({ error: "Supabase is not configured." }, 503);
  }

  const existing = await listStoredAdmins();
  if (
    existing.some(
      (account) => account.username === username || account.email.toLowerCase() === email
    )
  ) {
    return json({ error: "That username or email is already an admin." }, 409);
  }

  const created = await auth.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      portal: "admin",
      role: "event_coordinator",
      username,
      display_name: displayName,
    },
  });
  if (created.error || !created.data.user) {
    return json(
      {
        error: created.error?.message?.includes("already")
          ? "That email is already registered."
          : "Could not create that coordinator.",
      },
      400
    );
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: created.data.user.id,
    username,
    display_name: displayName,
    email,
    portal: "admin",
    role: "event_coordinator",
  });
  if (profileError) {
    await auth.auth.admin.deleteUser(created.data.user.id);
    return json({ error: "Could not save that coordinator profile." }, 400);
  }

  await supabase.from("audit_logs").insert({
    id: `aud-admin-${Date.now()}`,
    at: new Date().toLocaleString("en-AU"),
    who: gate.session?.username || "super.admin",
    action: "admin.invite",
    target: username,
    ip: request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "",
  });

  return json({
    ok: true,
    account: {
      id: created.data.user.id,
      username,
      displayName,
      email,
      role: "event_coordinator",
      roleLabel: roleLabel("event_coordinator"),
      canRemove: true,
    },
  });
}

export async function DELETE(request: Request) {
  const gate = await requireAdmin("admins.manage", request);
  if (gate.error) return gate.error;

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) return json({ error: "Coordinator id is required." }, 400);

  const auth = getSupabaseAuthAdmin();
  const supabase = getSupabaseAdmin();
  if (!auth || !supabase) {
    return json({ error: "Supabase is not configured." }, 503);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, role, portal")
    .eq("id", id)
    .maybeSingle();
  if (
    !profile ||
    profile.portal !== "admin" ||
    profile.role !== "event_coordinator" ||
    adminAccounts.some((account) => account.username === profile.username)
  ) {
    return json({ error: "Only club coordinators can be removed." }, 400);
  }

  const { error } = await auth.auth.admin.deleteUser(id);
  if (error) {
    return json({ error: "Could not remove that coordinator." }, 400);
  }

  return json({ ok: true });
}
