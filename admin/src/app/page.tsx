"use client";

import DashboardView from "@/components/dashboard/DashboardView";
import AdminShell from "@/components/layout/AdminShell";
import { useAdminData } from "@/hooks/useAdminData";

export default function DashboardPage() {
  const { events, ops } = useAdminData();
  return (
    <AdminShell>
      <DashboardView
        events={events}
        applications={ops.applications}
        audit={ops.audit}
        volunteerCount={ops.volunteers.filter((item) => item.status === "Active").length}
      />
    </AdminShell>
  );
}
