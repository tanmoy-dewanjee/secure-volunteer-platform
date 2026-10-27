"use client";

import AdminShell from "@/components/layout/AdminShell";
import VolunteerDirectory from "@/components/volunteers/VolunteerDirectory";
import { useAdminData } from "@/hooks/useAdminData";

export default function VolunteersPage() {
  const { ops } = useAdminData();
  return (
    <AdminShell>
      <VolunteerDirectory volunteers={ops.volunteers} />
    </AdminShell>
  );
}
