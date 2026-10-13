"use client";

import { useEffect, useState } from "react";

import {
  SESSION_EVENT,
  getSession,
  signOut as clearSession,
  type Session,
} from "@/lib/session";
import { signOutStudentSession } from "@/utils/supabase/session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    setReady(true);

    window.addEventListener(SESSION_EVENT, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(SESSION_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return {
    session,
    ready,
    signedIn: Boolean(session),
    signOut: () => {
      void signOutStudentSession();
      clearSession();
      setSession(null);
    },
  };
}
