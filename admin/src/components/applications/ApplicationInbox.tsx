"use client";

import { useMemo, useState } from "react";

import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import type { Event } from "@/data/events";
import {
  getOps,
  setOps,
  type AdminApplication,
  type AppStatus,
  type DirectoryVolunteer,
} from "@/lib/store/ops";

const tabs: AppStatus[] = [
  "Pending",
  "Shortlisted",
  "Approved",
  "Rejected",
  "Withdrawn",
];

export default function ApplicationInbox({
  applications,
  volunteers,
  events: catalogue = [],
}: {
  applications: AdminApplication[];
  volunteers: DirectoryVolunteer[];
  events?: Event[];
}) {
  const toast = useToast();
  const [tab, setTab] = useState<AppStatus>("Pending");
  const [eventFilter, setEventFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("Not a fit for this role right now.");

  const events = [...new Set(applications.map((item) => item.eventTitle))];
  const rows = useMemo(
    () =>
      applications.filter(
        (item) =>
          item.status === tab &&
          (eventFilter === "all" || item.eventTitle === eventFilter)
      ),
    [applications, tab, eventFilter]
  );
  const open = applications.find((item) => item.id === openId);
  const profile = volunteers.find(
    (item) =>
      item.id === open?.volunteerId ||
      item.studentUsername === open?.volunteerId
  );

  const setStatus = (ids: string[], status: AppStatus) => {
    const ops = getOps();
    const current = applications.length ? applications : ops.applications;
    const nextApps = current.map((item) =>
      ids.includes(item.id)
        ? {
            ...item,
            status,
            history: [
              ...item.history,
              {
                at: new Date().toLocaleString("en-AU"),
                from: item.status,
                to: status,
                by: "rotaract.admin",
              },
            ],
          }
        : item
    );
    setOps({ ...ops, applications: nextApps });

    if (status === "Approved") {
      void Promise.all(
        ids.map((id) => {
          const app = applications.find((item) => item.id === id);
          if (!app) return Promise.resolve();
          const volunteer = volunteers.find((item) => item.id === app.volunteerId);
          const event = catalogue.find((item) => item.id === app.eventId);
          return fetch("/api/admin/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "assign",
              eventId: app.eventId,
              eventTitle: app.eventTitle,
              volunteerUsername:
                volunteer?.studentUsername || app.volunteerId,
              role: app.role,
              campus: app.campus || event?.campus,
              date: event?.date,
              startTime: event?.startTime,
              endTime: event?.endTime,
              location: event?.location,
            }),
          });
        })
      ).then(() => toast("Approved and assigned a shift with a volunteer QR."));
    } else {
      toast(`Updated to ${status}.`);
    }
    setSelected([]);
  };

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Inbox
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Applications</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === item ? "bg-purple-700 text-white" : "bg-purple-50 text-purple-900"
            }`}
          >
            {item} ({applications.filter((row) => row.status === item).length})
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={eventFilter}
          onChange={(event) => setEventFilter(event.target.value)}
          className="rounded-md border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="all">All events</option>
          {events.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        {selected.length > 0 ? (
          <>
            <button
              type="button"
              onClick={() => setStatus(selected, "Shortlisted")}
              className="border border-black px-4 py-2 text-sm font-semibold"
            >
              Shortlist selected
            </button>
            <button
              type="button"
              onClick={() => setStatus(selected, "Approved")}
              className="bg-black px-4 py-2 text-sm font-semibold text-white"
            >
              Approve selected
            </button>
          </>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white px-8 py-14 text-center text-gray-600">
          Nothing in {tab.toLowerCase()} for this filter.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="px-4 py-3" />
                <th className="px-4 py-3 font-semibold">Applicant</th>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onChange={() =>
                        setSelected((current) =>
                          current.includes(row.id)
                            ? current.filter((id) => id !== row.id)
                            : [...current, row.id]
                        )
                      }
                      className="accent-[#7C00E8]"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setOpenId(row.id)}
                      className="font-semibold hover:text-purple-700"
                    >
                      {row.volunteerName}
                    </button>
                  </td>
                  <td className="px-4 py-3">{row.eventTitle}</td>
                  <td className="px-4 py-3">{row.role}</td>
                  <td className="px-4 py-3">{row.submitted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <aside className="filter-drawer h-full w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700">
                  Application
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{open.volunteerName}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {open.eventTitle} · {open.role}
                </p>
              </div>
              <button type="button" onClick={() => setOpenId(null)} className="font-semibold">
                Close
              </button>
            </div>
            <div className="mt-4">
              <StatusBadge status={open.status} />
            </div>
            {profile ? (
              <p className="mt-4 text-sm text-gray-600">
                Reliability {profile.reliability}% · {profile.hours} hours ·{" "}
                {profile.noShows} no-shows · {profile.campus}
              </p>
            ) : null}
            <p className="mt-4 text-sm">
              <strong>Availability:</strong> {open.availability}
            </p>
            <p className="mt-2 text-sm">
              <strong>Skills:</strong> {open.skills.join(", ") || "—"}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              {Object.entries(open.answers).map(([key, value]) => (
                <p key={key}>
                  <strong className="capitalize">{key}:</strong> {value}
                </p>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">{open.notes || "No internal notes yet."}</p>
            <ol className="mt-4 space-y-2 text-xs text-gray-500">
              {open.history.map((item) => (
                <li key={`${item.at}-${item.to}`}>
                  {item.at} · {item.by} · {item.from ?? "new"} → {item.to}
                </li>
              ))}
            </ol>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-4 w-full border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatus([open.id], "Shortlisted")}
                className="border border-black px-4 py-2 text-sm font-semibold"
              >
                Shortlist
              </button>
              <button
                type="button"
                onClick={() => setStatus([open.id], "Approved")}
                className="bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={() => setStatus([open.id], "Rejected")}
                className="text-sm font-semibold text-red-700"
              >
                Reject
              </button>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
