"use client";

import EventEditor from "@/components/events/EventEditor";
import AdminShell from "@/components/layout/AdminShell";
import { blankEvent } from "@/lib/store/events";

export default function NewEventPage() {
  return (
    <AdminShell>
      <EventEditor initial={blankEvent()} />
    </AdminShell>
  );
}
