"use client";

import { useParams } from "next/navigation";

import EventEditor from "@/components/events/EventEditor";
import AdminShell from "@/components/layout/AdminShell";
import { useAdminData } from "@/hooks/useAdminData";

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const { events, ready } = useAdminData();
  const event = events.find((item) => item.id === params.id);

  return (
    <AdminShell>
      {!ready ? (
        <p className="px-6 py-16 text-gray-500">Loading editor...</p>
      ) : !event ? (
        <p className="px-6 py-16 text-gray-500">That event is not in the catalogue.</p>
      ) : (
        <EventEditor initial={event} />
      )}
    </AdminShell>
  );
}
