"use client";

import { useMemo, useState } from "react";

import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { maskPhone, maskStudentId } from "@/lib/security/pii";
import {
  appendAudit,
  getOps,
  setOps,
  type DirectoryVolunteer,
} from "@/lib/store/ops";

export default function VolunteerDirectory({
  volunteers,
}: {
  volunteers: DirectoryVolunteer[];
}) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return volunteers.filter((item) =>
      `${item.name} ${item.campus} ${item.skills.join(" ")}`.toLowerCase().includes(needle)
    );
  }, [volunteers, query]);
  const open = volunteers.find((item) => item.id === openId);

  const reveal = (person: DirectoryVolunteer) => {
    setRevealed((current) => ({ ...current, [person.id]: true }));
    appendAudit({
      at: new Date().toLocaleString("en-AU"),
      who: "rotaract.admin",
      action: "volunteer.pii_reveal",
      target: person.name,
      ip: "127.0.0.1",
    });
    toast("Contact details revealed. This was written to the audit log.");
  };

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Directory
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Volunteers</h1>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search name, campus or skill"
        className="mt-4 max-w-md rounded-md border border-gray-200 px-4 py-3 outline-none focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200"
      />
      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-4 py-3 font-semibold">Name</th>
              <th className="px-4 py-3 font-semibold">Campus</th>
              <th className="px-4 py-3 font-semibold">Hours</th>
              <th className="px-4 py-3 font-semibold">No-shows</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Phone</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => setOpenId(row.id)}
                    className="font-semibold hover:text-purple-700"
                  >
                    {row.name}
                  </button>
                </td>
                <td className="px-4 py-3">{row.campus}</td>
                <td className="px-4 py-3">{row.hours}</td>
                <td className="px-4 py-3">{row.noShows}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {revealed[row.id] ? row.phone : maskPhone(row.phone)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="h-full w-full max-w-lg overflow-y-auto bg-white p-6">
            <div className="flex justify-between">
              <h2 className="text-2xl font-semibold">{open.name}</h2>
              <button type="button" onClick={() => setOpenId(null)} className="font-semibold">
                Close
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">{open.campus} · {open.email}</p>
            <p className="mt-4 text-sm">
              Student ID:{" "}
              {revealed[open.id] ? open.studentId : maskStudentId(open.studentId)}
            </p>
            <p className="mt-1 text-sm">
              Phone: {revealed[open.id] ? open.phone : maskPhone(open.phone)}
            </p>
            <button
              type="button"
              onClick={() => reveal(open)}
              className="mt-3 text-sm font-semibold text-[#7C00E8]"
            >
              Reveal contact (logged)
            </button>
            <p className="mt-4 text-sm">
              {open.hours} hours · {open.eventsAttended} events · reliability{" "}
              {open.reliability}%
            </p>
            <p className="mt-3 text-sm text-gray-600">{open.notes || "No notes."}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                className="border border-black px-4 py-2 text-sm font-semibold"
                onClick={() => toast("Message queued for the demo inbox.")}
              >
                Message
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-semibold text-red-700"
                onClick={() => {
                  const ops = getOps();
                  setOps({
                    ...ops,
                    volunteers: ops.volunteers.map((item) =>
                      item.id === open.id
                        ? {
                            ...item,
                            status: item.status === "Active" ? "Suspended" : "Active",
                          }
                        : item
                    ),
                  });
                  toast(
                    open.status === "Active" ? "Volunteer suspended." : "Volunteer reactivated."
                  );
                }}
              >
                {open.status === "Active" ? "Suspend" : "Reactivate"}
              </button>
              <button
                type="button"
                className="bg-black px-4 py-2 text-sm font-semibold text-white"
                onClick={() => toast("Hours summary downloaded (demo).")}
              >
                Export hours
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
