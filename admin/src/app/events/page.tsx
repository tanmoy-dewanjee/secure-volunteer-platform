"use client";

import EventBoard from "@/components/events/EventBoard";
import AdminShell from "@/components/layout/AdminShell";
import { useAdminData } from "@/hooks/useAdminData";

export default function EventsPage() {
  const { events } = useAdminData();
  return (
    <AdminShell>
      <div className="px-4 py-8 lg:px-8">
        <EventBoard events={events} />
      </div>
    </AdminShell>
  );
}
