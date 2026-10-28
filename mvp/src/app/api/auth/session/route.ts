import { jsonOk } from "@/lib/security/http";
import { getAuthenticatedStudent } from "@/lib/security/student-session";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return jsonOk({ configured: false, authenticated: false, username: null });
  }
  const student = await getAuthenticatedStudent();
  return jsonOk({
    configured: true,
    authenticated: Boolean(student),
    username: student?.username ?? null,
    name: student?.name ?? null,
  });
}
