"use client";

import { useEffect, useState } from "react";

import { events as seedEvents, type Event } from "@/data/events";
import {
  EVENT_CATALOG_EVENT,
  getCatalogEvent,
  getCatalogEvents,
} from "@/lib/event-catalog";

export function useEventCatalog() {
  const [catalog, setCatalog] = useState<Event[]>(seedEvents);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setCatalog(getCatalogEvents());

    const hydrate = async () => {
      try {
        const response = await fetch("/api/events");
        if (response.ok) {
          const payload = (await response.json()) as {
            source?: string;
            events?: Event[];
          };
          if (Array.isArray(payload.events) && payload.events.length > 0) {
            setCatalog(payload.events);
            setReady(true);
            return;
          }
        }
      } catch {
        // Fall through to the local catalogue.
      }
      refresh();
      setReady(true);
    };

    void hydrate();
    window.addEventListener(EVENT_CATALOG_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVENT_CATALOG_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return { events: catalog, ready };
}

export function useCatalogEvent(id: string) {
  const { events, ready } = useEventCatalog();
  const event = events.find((item) => item.id === id) ?? getCatalogEvent(id);
  return { event, ready };
}
