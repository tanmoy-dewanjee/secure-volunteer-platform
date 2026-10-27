"use client";

import { useEffect, useState } from "react";

import { type Event } from "@/data/events";
import {
  ADMIN_EVENTS_EVENT,
  getAdminEvents,
  persistAdminEvent,
  archiveAdminEvent,
  duplicateAdminEvent,
} from "@/lib/store/events";
import {
  ADMIN_OPS_EVENT,
  appendAudit,
  getOps,
  setOps,
  type OpsState,
} from "@/lib/store/ops";

export function useAdminData() {
  const [events, setEvents] = useState<Event[]>([]);
  const [ops, setOpsState] = useState<OpsState>(getOps());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refreshEvents = () => setEvents(getAdminEvents());
    const refreshOps = () => setOpsState(getOps());

    const hydrate = async () => {
      try {
        const [eventRes, opsRes] = await Promise.all([
          fetch("/api/admin/events"),
          fetch("/api/admin/ops"),
        ]);
        if (eventRes.ok) {
          const payload = (await eventRes.json()) as {
            source?: string;
            events?: Event[];
          };
          if (payload.source === "supabase" && Array.isArray(payload.events)) {
            setEvents(payload.events);
          } else {
            refreshEvents();
          }
        } else {
          refreshEvents();
        }
        if (opsRes.ok) {
          const payload = (await opsRes.json()) as {
            source?: string;
            ops?: OpsState;
          };
          if (payload.source === "supabase" && payload.ops) {
            setOpsState(payload.ops);
          } else {
            refreshOps();
          }
        } else {
          refreshOps();
        }
      } catch {
        refreshEvents();
        refreshOps();
      }
      setReady(true);
    };

    void hydrate();
    window.addEventListener(ADMIN_EVENTS_EVENT, refreshEvents);
    window.addEventListener(ADMIN_OPS_EVENT, refreshOps);
    return () => {
      window.removeEventListener(ADMIN_EVENTS_EVENT, refreshEvents);
      window.removeEventListener(ADMIN_OPS_EVENT, refreshOps);
    };
  }, []);

  return {
    events,
    ops,
    ready,
    saveEvent: persistAdminEvent,
    archiveEvent: archiveAdminEvent,
    duplicateEvent: duplicateAdminEvent,
    updateOps: setOps,
    log: appendAudit,
  };
}
