"use client";

import { useEffect, useState } from "react";

import {
  SESSION_EVENT,
  apiLogout,
  apiSession,
  type ApiUser,
} from "@/lib/api";

export function useSession() {
  const [session, setSession] = useState<ApiUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      try {
        const user = await apiSession();
        if (!cancelled) setSession(user);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    sync();
    window.addEventListener(SESSION_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(SESSION_EVENT, sync);
    };
  }, []);

  return {
    session,
    ready,
    signedIn: Boolean(session),
    isAdmin: session?.role === "admin",
    signOut: async () => {
      await apiLogout();
      setSession(null);
    },
  };
}
