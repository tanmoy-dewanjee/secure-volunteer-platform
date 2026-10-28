"use client";

import { useEffect, useState } from "react";

import {
  SESSION_EVENT,
  getSession,
  signIn,
  signOut as clearSession,
  touchSession,
  type Session,
} from "@/lib/session";
import { signOutStudentSession } from "@/utils/supabase/session";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(getSession());
    sync();
    touchSession();
    setReady(true);

    void fetch("/api/auth/session")
      .then((response) => response.json())
      .then((payload: { authenticated?: boolean; username?: string; name?: string }) => {
        if (payload.authenticated && payload.username) {
          const next = signIn({
            username: payload.username,
            name: payload.name,
            keepSignedIn: getSession()?.keepSignedIn ?? true,
          });
          setSession(next);
        }
      })
      .catch(() => undefined);

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
