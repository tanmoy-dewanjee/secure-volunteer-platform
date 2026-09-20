"use client";

import { useEffect } from "react";

import { recordEventView } from "@/lib/view-history";

export default function EventViewTracker({ eventId }: { eventId: string }) {
  useEffect(() => {
    recordEventView(eventId, "details");
  }, [eventId]);

  return null;
}
