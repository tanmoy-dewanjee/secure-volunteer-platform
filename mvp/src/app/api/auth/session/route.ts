import { jsonOk } from "@/lib/security/http";
import { getAuthenticatedUsername } from "@/lib/security/student-session";

export async function GET() {
  const username = await getAuthenticatedUsername();
  return jsonOk({
    authenticated: Boolean(username),
    username: username || null,
  });
}
