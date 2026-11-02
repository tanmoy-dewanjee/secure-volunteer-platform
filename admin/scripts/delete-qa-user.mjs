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
const email = process.argv[2];
if (!url || !key || !email) {
  console.error("usage: node delete-qa-user.mjs <email>");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data } = await supabase.auth.admin.listUsers({ perPage: 200 });
const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.log("qa user already gone");
  process.exit(0);
}
await supabase.from("profiles").delete().eq("id", user.id);
const deleted = await supabase.auth.admin.deleteUser(user.id);
if (deleted.error) console.error("delete failed");
else console.log("qa user removed");
