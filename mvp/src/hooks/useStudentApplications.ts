"use client";

import { useEffect, useState } from "react";

import { useSession } from "@/hooks/useSession";
import {
  fetchApplications,
  getApplications,
  type VolunteerApplication,
} from "@/lib/applications";

export function useStudentApplications() {
  const { session, ready: sessionReady } = useSession();
  const [applications, setApplications] = useState<VolunteerApplication[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!sessionReady) return;
    if (!session) {
      setApplications([]);
      setReady(true);
      return;
    }
    setApplications(getApplications(session.username));
    void fetchApplications(session.username).then((items) => {
      setApplications(items);
      setReady(true);
    });
  }, [session, sessionReady]);

  return { applications, session, ready };
}
