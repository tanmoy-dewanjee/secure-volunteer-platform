"use client";

import ApplicationInbox from "@/components/applications/ApplicationInbox";
import AdminShell from "@/components/layout/AdminShell";
import { useAdminData } from "@/hooks/useAdminData";

export default function ApplicationsPage() {
  const { events, ops } = useAdminData();
  return (
    <AdminShell>
      <ApplicationInbox
        applications={ops.applications}
        volunteers={ops.volunteers}
        events={events}
      />
    </AdminShell>
  );
}
