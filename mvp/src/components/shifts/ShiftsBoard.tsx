"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getShiftStatuses,
  resolveShiftStatus,
  seedShifts,
  setShiftStatus,
  type ShiftStatus,
} from "@/data/shifts";
import { useSession } from "@/hooks/useSession";

function statusClass(status: ShiftStatus) {
  if (status === "Completed") return "bg-green-100 text-green-800";
  if (status === "Checked in") return "bg-purple-100 text-purple-800";
  return "bg-amber-100 text-amber-800";
}

export default function ShiftsBoard() {
  const { session } = useSession();
  const [statuses, setStatuses] = useState<Record<string, ShiftStatus>>({});

  useEffect(() => {
    if (session) setStatuses(getShiftStatuses(session.username));
  }, [session]);

  const items = useMemo(
    () =>
      seedShifts.map((shift) => ({
        ...shift,
        status: resolveShiftStatus(shift, statuses),
      })),
    [statuses]
  );

  const upcoming = items.filter((shift) => shift.status !== "Completed");
  const past = items.filter((shift) => shift.status === "Completed");

  const checkIn = (shiftId: string) => {
    if (!session) return;
    setStatuses(setShiftStatus(session.username, shiftId, "Checked in"));
  };

  return (
    <>
      <section className="bg-[#f3f1ed]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
            Student / Volunteer Portal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            My Shifts
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-gray-600">
            Approved roles, times and meeting points. Check in on the day so
            the host club can record attendance and hours.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
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
              <article
                key={shift.id}
                className="border border-gray-200 bg-white p-7"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`px-3 py-1 text-sm font-semibold ${statusClass(shift.status)}`}
                  >
                    {shift.status}
                  </span>
                  <span className="text-sm text-gray-500">{shift.clubName}</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold">{shift.eventTitle}</h3>
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
                <div className="mt-6 flex flex-wrap gap-4">
                  {shift.status === "Upcoming" ? (
                    <button
                      type="button"
                      onClick={() => checkIn(shift.id)}
                      className="bg-black px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
                    >
                      Check in
                    </button>
                  ) : (
                    <span className="font-semibold text-purple-700">
                      Checked in for this shift
                    </span>
                  )}
                  <Link
                    href={`/events/${shift.eventId}`}
                    className="px-5 py-3 font-semibold text-purple-700 hover:underline"
                  >
                    Event details
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>

        <h2 className="mt-16 text-3xl font-semibold">Past shifts</h2>
        <div className="mt-8 space-y-6">
          {past.map((shift) => (
            <article
              key={shift.id}
              className="border border-gray-200 bg-[#f7f7f7] p-7"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className={statusClass("Completed") + " px-3 py-1 text-sm font-semibold"}>
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
