"use client";

import { useParams } from "next/navigation";

import EventWorkspace from "@/components/events/EventWorkspace";
import AdminShell from "@/components/layout/AdminShell";
import { useAdminData } from "@/hooks/useAdminData";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const { events, ops, ready } = useAdminData();
  const event = events.find((item) => item.id === params.id);

  return (
    <AdminShell>
      {!ready ? (
        <p className="px-6 py-16 text-gray-500">Loading event...</p>
      ) : !event ? (
        <p className="px-6 py-16 text-gray-500">That event is not in the catalogue.</p>
      ) : (
        <EventWorkspace
          event={event}
          applications={ops.applications}
          volunteers={ops.volunteers}
          swaps={ops.swaps}
        />
      )}
    </AdminShell>
  );
}
