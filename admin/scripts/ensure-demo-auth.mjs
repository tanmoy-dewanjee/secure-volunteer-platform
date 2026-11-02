import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(resolve(import.meta.dirname, "..", "..", "mvp", ".env.local"));
loadEnv(resolve(import.meta.dirname, "..", ".env.local"));

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase admin env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const students = [
  {
    email: "a1991246@adelaide.edu.au",
    username: "a1991246",
    name: "Alex Nguyen",
    password: "Volunteer1!",
  },
  {
    email: "a1882201@adelaide.edu.au",
    username: "a1882201",
    name: "Priya Shah",
    password: "Volunteer1!",
  },
];

async function findId(email) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 200 });
  return data.users.find((user) => user.email?.toLowerCase() === email)?.id ?? null;
}

for (const student of students) {
  let id = await findId(student.email);
  if (!id) {
    const created = await supabase.auth.admin.createUser({
      email: student.email,
      password: student.password,
      email_confirm: true,
      user_metadata: {
        portal: "student",
        role: "student",
        username: student.username,
        display_name: student.name,
      },
    });
    id = created.data.user?.id ?? null;
    if (created.error) console.error(student.username, "create failed");
  } else {
    const updated = await supabase.auth.admin.updateUserById(id, {
      password: student.password,
      email_confirm: true,
    });
    if (updated.error) console.error(student.username, "password reset failed");
  }
  if (!id) continue;
  const { data: profile } = await supabase
    .from("profiles")
    .select("profile_data")
    .eq("id", id)
    .maybeSingle();
  const profileData =
    profile?.profile_data && typeof profile.profile_data === "object"
      ? profile.profile_data
      : {};
  const { error } = await supabase.from("profiles").upsert({
    id,
    username: student.username,
    display_name: student.name,
    email: student.email,
    portal: "student",
    role: "student",
    profile_data: { ...profileData, mfa: { enabled: false } },
  });
  if (error) console.error(student.username, "profile failed");
  else console.log("demo student ready:", student.username);
}
