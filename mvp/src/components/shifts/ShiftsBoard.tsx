"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import QrCodeImage from "@/components/qr/QrCodeImage";
import QrScanField from "@/components/qr/QrScanField";
import { useSession } from "@/hooks/useSession";
import type { AttendanceAssignment, ShiftStatus } from "@/lib/attendance";

function statusClass(status: ShiftStatus) {
  if (status === "Completed") return "bg-green-100 text-green-800";
  if (status === "Checked in") return "bg-purple-100 text-purple-800";
  if (status === "No show") return "bg-red-100 text-red-800";
  return "bg-amber-100 text-amber-800";
}

export default function ShiftsBoard() {
  const { session } = useSession();
  const [assignments, setAssignments] = useState<AttendanceAssignment[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const response = await fetch(
      `/api/attendance?username=${encodeURIComponent(session.username)}`
    );
    const payload = (await response.json()) as { shifts?: AttendanceAssignment[] };
    if (Array.isArray(payload.shifts)) setAssignments(payload.shifts);
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const checkIn = async (payload: string) => {
    if (!session) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: session.username, payload }),
      });
      const data = (await response.json()) as {
        error?: string;
        shift?: AttendanceAssignment;
      };
      if (!response.ok) {
        setMessage(data.error || "Check-in failed.");
        return;
      }
      setMessage(`Checked in for ${data.shift?.eventTitle ?? "your shift"}.`);
      await load();
    } catch {
      setMessage("Could not reach attendance.");
    } finally {
      setBusy(false);
    }
  };

  const upcoming = useMemo(
    () => assignments.filter((shift) => shift.status !== "Completed"),
    [assignments]
  );
  const past = useMemo(
    () => assignments.filter((shift) => shift.status === "Completed"),
    [assignments]
  );

  return (
    <>
      <section className="bg-[#f3f1ed]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
            Student / Volunteer Portal
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">My Shifts</h1>
          <p className="mt-5 max-w-2xl leading-7 text-gray-600">
            Show your personal QR at the desk, or scan the event station QR when
            you arrive. Attendance is recorded against your assigned shift.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-6">
          <h2 className="text-xl font-semibold">Event station check-in</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Scan the printed station code at the event. Your volunteer QR stays
            on your phone for coordinators.
          </p>
          <div className="mt-4">
            <QrScanField
              onDetect={(value) => void checkIn(value)}
              placeholder="Scan station QR or paste SVP1.s..."
            />
          </div>
          {message ? <p className="mt-3 text-sm font-semibold text-purple-900">{message}</p> : null}
          {busy ? <p className="mt-2 text-sm text-gray-500">Recording attendance…</p> : null}
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-3xl font-semibold">Upcoming</h2>
          <Link
            href="/my-applications"
            className="font-semibold text-purple-700 hover:underline"
          >
            Back to applications →
          </Link>
        </div>

        <div className="mt-8 space-y-6">
          {upcoming.length === 0 ? (
            <p className="text-gray-600">No upcoming shifts yet.</p>
          ) : (
            upcoming.map((shift) => (
              <article key={shift.id} className="border border-gray-200 bg-white p-7">
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-semibold ${statusClass(shift.status)}`}>
                    {shift.status}
                  </span>
                  <span className="text-sm text-gray-500">{shift.clubName}</span>
                </div>
                <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_196px]">
                  <div>
                    <h3 className="text-2xl font-semibold">{shift.eventTitle}</h3>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                          Role
                        </p>
                        <p className="mt-2">{shift.role}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                          When
                        </p>
                        <p className="mt-2">
                          {shift.date}
                          <span className="mt-1 block text-gray-600">
                            {shift.startTime} – {shift.endTime}
                          </span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                          Location
                        </p>
                        <p className="mt-2">{shift.campus}</p>
                        <p className="mt-1 text-sm text-gray-600">{shift.location}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                          Meeting point
                        </p>
                        <p className="mt-2">{shift.meetingPoint}</p>
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-gray-600">{shift.notes}</p>
                    <Link
                      href={`/events/${shift.eventId}`}
                      className="mt-4 inline-block font-semibold text-purple-700 hover:underline"
                    >
                      Event details
                    </Link>
                  </div>
                  {shift.status === "Upcoming" ? (
                    <div className="border border-gray-200 bg-[#f7f7f7] p-3 text-center">
                      <QrCodeImage
                        value={shift.qrPayload}
                        label={`Volunteer QR for ${shift.eventTitle}`}
                        size={168}
                      />
                      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Your check-in QR
                      </p>
                    </div>
                  ) : (
                    <p className="self-center font-semibold text-purple-700">
                      Checked in
                      {shift.checkedInAt
                        ? ` at ${new Date(shift.checkedInAt).toLocaleTimeString("en-AU")}`
                        : ""}
                    </p>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        <h2 className="mt-16 text-3xl font-semibold">Past shifts</h2>
        <div className="mt-8 space-y-6">
          {past.map((shift) => (
            <article key={shift.id} className="border border-gray-200 bg-[#f7f7f7] p-7">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`${statusClass("Completed")} px-3 py-1 text-sm font-semibold`}>
                  Completed
                </span>
                <span className="text-sm text-gray-500">{shift.date}</span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold">{shift.eventTitle}</h3>
              <p className="mt-2 text-gray-600">
                {shift.role} · {shift.clubName} · {shift.campus}
              </p>
              <p className="mt-4 text-sm text-gray-600">{shift.notes}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
