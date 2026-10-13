import { createClient } from "@/utils/supabase/client";

export async function signOutStudentSession() {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    return;
  }
}

export async function signInStudentSession(username: string, password: string) {
  try {
    const supabase = createClient();
    const key = username.trim().toLowerCase();
    const emails = key.includes("@")
      ? [key]
      : [`${key}@adelaide.edu.au`, `${key}@student.adelaide.edu.au`];
    for (const email of emails) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error) return true;
    }
  } catch {
    return false;
  }
  return false;
}
