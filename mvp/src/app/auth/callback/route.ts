import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/reset-password";
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid`);
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/forgot-password?error=invalid`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    return NextResponse.redirect(`${origin}/forgot-password?error=invalid`);
  }
}
