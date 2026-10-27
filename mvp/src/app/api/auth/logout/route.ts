import { jsonOk, requireTrustedOrigin } from "@/lib/security/http";
import { clearPendingMfaCookie } from "@/lib/security/pending";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const originError = requireTrustedOrigin(request);
  if (originError) return originError;

  await clearPendingMfaCookie();
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch {
      /* session already empty */
    }
  }
  return jsonOk({ ok: true });
}
