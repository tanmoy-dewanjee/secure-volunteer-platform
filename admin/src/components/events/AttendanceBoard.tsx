"use client";

import { useCallback, useEffect, useState } from "react";

import QrCodeImage from "@/components/qr/QrCodeImage";
import QrScanField from "@/components/qr/QrScanField";
import { useToast } from "@/components/ui/Toast";
import type { Event } from "@/data/events";
import type { AttendanceAssignment, ShiftStatus, StationRecord } from "@/lib/attendance";

type LogRow = {
  id: string;
  volunteer_username: string;
  action: string;
  method: string;
  at: string;
  by_username: string;
};

export default function AttendanceBoard({
  event,
  mode,
}: {
  event: Event;
  mode: "shifts" | "attendance";
}) {
  const toast = useToast();
  const [station, setStation] = useState<StationRecord | null>(null);
  const [assignments, setAssignments] = useState<AttendanceAssignment[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [source, setSource] = useState("local");

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/admin/attendance?eventId=${encodeURIComponent(event.id)}`
    );
    if (!response.ok) return;
    const payload = (await response.json()) as {
      source?: string;
      station?: StationRecord;
      assignments?: AttendanceAssignment[];
      logs?: LogRow[];
    };
    setSource(payload.source || "local");
    setStation(payload.station ?? null);
    setAssignments(payload.assignments ?? []);
    setLogs(payload.logs ?? []);
  }, [event.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const scan = async (token: string) => {
    const response = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const payload = (await response.json()) as {
      error?: string;
      assignment?: AttendanceAssignment;
    };
    if (!response.ok) {
      toast(payload.error || "Scan failed.");
      return;
    }
    toast(`Checked in ${payload.assignment?.volunteerUsername ?? "volunteer"}.`);
    await load();
  };

  const setStatus = async (shiftId: string, status: ShiftStatus) => {
    const response = await fetch("/api/admin/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "status", shiftId, status }),
    });
    if (!response.ok) {
      toast("Could not update attendance.");
      return;
    }
    toast(`Marked ${status.toLowerCase()}.`);
    await load();
  };

  if (mode === "shifts") {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {event.shifts.map((shift) => (
            <article key={shift.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="font-semibold">{shift.label}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {shift.startTime}–{shift.endTime} · {shift.placesAvailable} places
              </p>
            </article>
          ))}
          {assignments.length === 0 ? (
            <p className="text-sm text-gray-600">
              Approve applications to create shift assignments and volunteer QR codes.
            </p>
          ) : (
            assignments.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.volunteerUsername}</p>
                    <p className="text-sm text-gray-500">
                      {item.role} · {item.status}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500">{item.date}</span>
                </div>
              </article>
            ))
          )}
        </div>
        <aside className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold">Station QR</h2>
          <p className="mt-2 text-sm text-gray-600">
            Print this for the desk. Volunteers scan it on My Shifts. Source: {source}.
          </p>
          {station ? (
            <div className="mt-4 flex justify-center bg-[#f7f7f7] p-4">
              <QrCodeImage
                value={station.qrPayload}
                label={`Station QR for ${event.title}`}
                size={196}
              />
            </div>
          ) : null}
          <p className="mt-3 break-all font-mono text-xs text-gray-500">
            {station?.qrPayload}
          </p>
        </aside>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-semibold">Scan volunteer QR</h2>
        <p className="mt-2 text-sm text-gray-600">
          Point the camera at the student phone, or paste the SVP1.v payload.
        </p>
        <div className="mt-4">
          <QrScanField onDetect={(value) => void scan(value)} />
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#fafafa]">
            <tr>
              <th className="px-4 py-3">Volunteer</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Checked in</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-gray-500" colSpan={5}>
                  No assigned shifts yet. Approve an application to create one.
                </td>
              </tr>
            ) : (
              assignments.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold">{item.volunteerUsername}</td>
                  <td className="px-4 py-3">{item.role}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">
                    {item.checkedInAt
                      ? new Date(item.checkedInAt).toLocaleString("en-AU")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void setStatus(item.id, "Checked in")}
                        className="text-sm font-semibold text-purple-700"
                      >
                        Check in
                      </button>
                      <button
                        type="button"
                        onClick={() => void setStatus(item.id, "Completed")}
                        className="text-sm font-semibold"
                      >
                        Complete
                      </button>
                      <button
                        type="button"
                        onClick={() => void setStatus(item.id, "No show")}
                        className="text-sm font-semibold text-red-700"
                      >
                        No show
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {logs.length > 0 ? (
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold">Attendance log</h2>
          <ol className="mt-3 space-y-2 text-sm text-gray-600">
            {logs.map((item) => (
              <li key={item.id}>
                {new Date(item.at).toLocaleString("en-AU")} · {item.volunteer_username} ·{" "}
                {item.action.replace("_", " ")} via {item.method} ({item.by_username})
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
