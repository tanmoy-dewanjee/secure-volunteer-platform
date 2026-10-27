"use client";

import AdminShell from "@/components/layout/AdminShell";
import { useToast } from "@/components/ui/Toast";
import { useAdminData } from "@/hooks/useAdminData";

export default function ReportsPage() {
  return (
    <AdminShell>
      <ReportsInner />
    </AdminShell>
  );
}

function ReportsInner() {
  const toast = useToast();
  const { events, ops } = useAdminData();
  const approved = ops.applications.filter((item) => item.status === "Approved").length;
  const pending = ops.applications.filter((item) => item.status === "Pending").length;
  const hours = ops.volunteers.reduce((sum, item) => sum + item.hours, 0);
  const noShows = ops.volunteers.reduce((sum, item) => sum + item.noShows, 0);
  const fillAvg = events.length
    ? Math.round(
        events.reduce((sum, event) => {
          const filled = event.capacity
            ? (event.capacity - event.placesAvailable) / event.capacity
            : 0;
          return sum + filled;
        }, 0) /
          events.length *
          100
      )
    : 0;

  const download = (kind: string) => {
    const rows = [
      ["Event", "Status", "Campus", "Places open", "Applications"],
      ...events.map((event) => [
        event.title,
        event.status,
        event.campus,
        String(event.placesAvailable),
        String(ops.applications.filter((item) => item.eventId === event.id).length),
      ]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = kind === "pdf" ? "volunteer-hours.csv" : "event-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast(kind === "pdf" ? "Hours file downloaded." : "Event report downloaded.");
  };

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Insights
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Reports</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card label="Average fill rate" value={`${fillAvg}%`} />
        <Card label="Approved volunteers" value={String(approved)} />
        <Card label="Pending applications" value={String(pending)} />
        <Card label="Recorded hours" value={String(hours)} />
      </div>
      <p className="mt-4 text-sm text-gray-500">{noShows} no-shows on record across the directory.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Per-event report</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Applications, open places, status and campus for every catalogue event.
          </p>
          <button
            type="button"
            onClick={() => download("csv")}
            className="mt-6 bg-black px-5 py-3 font-semibold text-white hover:bg-purple-700"
          >
            Export CSV
          </button>
        </article>
        <article className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Volunteer hours</h2>
          <p className="mt-3 text-sm leading-6 text-gray-600">
            Hours, events attended and no-shows for certificates.
          </p>
          <button
            type="button"
            onClick={() => download("pdf")}
            className="mt-6 border border-black px-5 py-3 font-semibold hover:bg-[#f3f1ed]"
          >
            Export hours
          </button>
        </article>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
