"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import AttendanceBoard from "@/components/events/AttendanceBoard";
import EventMap from "@/components/maps/EventMap";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { getEventCoordinates, getEventHost, type Event } from "@/data/events";
import { eventTabs, type EventTab } from "@/lib/routing";
import type { AdminApplication, DirectoryVolunteer, SwapRow } from "@/lib/store/ops";
import { getOps, setOps } from "@/lib/store/ops";

export default function EventWorkspace({
  event,
  applications,
  volunteers,
  swaps,
}: {
  event: Event;
  applications: AdminApplication[];
  volunteers: DirectoryVolunteer[];
  swaps: SwapRow[];
}) {
  const toast = useToast();
  const [tab, setTab] = useState<EventTab>("overview");
  const coords = getEventCoordinates(event);
  const host = getEventHost(event);
  const relatedApps = applications.filter((item) => item.eventId === event.id);
  const fill = event.capacity
    ? Math.round(((event.capacity - event.placesAvailable) / event.capacity) * 100)
    : 0;

  const roster = useMemo(
    () =>
      event.shifts.map((shift) => {
        const needed = shift.placesAvailable;
        const assigned = relatedApps.filter(
          (item) => item.status === "Approved" && item.role
        ).length;
        const pct = needed ? Math.min(100, Math.round((assigned / Math.max(needed, 1)) * 100)) : 0;
        return { shift, assigned, needed, pct };
      }),
    [event.shifts, relatedApps]
  );

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-sm text-gray-500">
        <Link href="/events" className="hover:text-purple-700">
          Events
        </Link>{" "}
        / {event.title}
      </p>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{event.title}</h1>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            {host?.shortName} · {event.campus} · {event.date} · {event.startTime}–
            {event.endTime}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/events/${event.id}/edit`}
            className="bg-black px-5 py-3 font-semibold text-white hover:bg-purple-700"
          >
            Edit event
          </Link>
          <Link href="/communications" className="border border-black px-5 py-3 font-semibold">
            Announce
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {eventTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === item.id ? "bg-purple-700 text-white" : "bg-purple-50 text-purple-900"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="relative mb-5 aspect-[16/9] overflow-hidden bg-gray-100">
              <Image src={event.bannerImage} alt="" fill className="object-cover" sizes="800px" />
            </div>
            <p className="leading-7 text-gray-700">{event.description}</p>
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-600">
              {event.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {event.askResume ? (
              <p className="mt-4 text-sm font-semibold text-purple-900">
                Resume is required on the student application.
              </p>
            ) : null}
            {(event.customFields ?? []).length > 0 ? (
              <p className="mt-2 text-sm text-gray-600">
                {(event.customFields ?? []).length} custom volunteer questions.
              </p>
            ) : null}
          </article>
          <aside className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">Fill rate</p>
              <p className="mt-1 text-3xl font-semibold">{fill}%</p>
              <p className="mt-2 text-sm text-gray-500">
                {event.placesAvailable} places still open of {event.capacity}
              </p>
            </div>
            <EventMap lat={coords.lat} lng={coords.lng} label={event.location} />
          </aside>
        </div>
      ) : null}

      {tab === "shifts" ? (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-gray-500">
            Colour is fill: green full, amber filling, purple open. Station QR is
            bound to this event in the backend.
          </p>
          {roster.map(({ shift, assigned, needed, pct }) => (
            <article key={shift.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{shift.label}</h2>
                  <p className="text-sm text-gray-500">
                    {shift.startTime}–{shift.endTime} · {assigned}/{needed || shift.placesAvailable} filled
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden bg-gray-100">
                <div
                  className={`h-full ${
                    pct >= 100 ? "bg-green-600" : pct >= 50 ? "bg-amber-500" : "bg-purple-700"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </article>
          ))}
          <AttendanceBoard event={event} mode="shifts" />
          {swaps.filter((item) => item.status === "Pending").length > 0 ? (
            <section className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="font-semibold">Swap / drop queue</h2>
              {swaps
                .filter((item) => item.status === "Pending")
                .map((item) => (
                  <div key={item.id} className="mt-3 flex items-center justify-between gap-3 text-sm">
                    <span>
                      {item.volunteerName} · {item.kind} · {item.shift}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const ops = getOps();
                        setOps({
                          ...ops,
                          swaps: ops.swaps.map((row) =>
                            row.id === item.id ? { ...row, status: "Approved" } : row
                          ),
                        });
                        toast("Request approved. Waitlist will auto-promote if a slot frees.");
                      }}
                      className="font-semibold text-[#7C00E8]"
                    >
                      Approve
                    </button>
                  </div>
                ))}
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "volunteers" ? (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="px-4 py-3">Volunteer</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Reliability</th>
              </tr>
            </thead>
            <tbody>
              {volunteers.slice(0, 5).map((person) => (
                <tr key={person.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-semibold">{person.name}</td>
                  <td className="px-4 py-3">{person.hours}</td>
                  <td className="px-4 py-3">{person.reliability}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "applications" ? (
        <div className="mt-6 space-y-3">
          {relatedApps.length === 0 ? (
            <p className="text-gray-600">No applications for this event yet.</p>
          ) : (
            relatedApps.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.volunteerName}</p>
                    <p className="text-sm text-gray-500">
                      {item.role} · {item.status}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}

      {tab === "attendance" ? <AttendanceBoard event={event} mode="attendance" /> : null}

      {tab === "announcements" ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Event announcement</h2>
          <p className="mt-2 text-sm text-gray-600">
            Goes to volunteers assigned to {event.title}.
          </p>
          <Link
            href="/communications"
            className="mt-4 inline-block font-semibold text-[#7C00E8]"
          >
            Open composer →
          </Link>
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Stat label="Applications" value={String(relatedApps.length)} />
          <Stat label="Fill rate" value={`${fill}%`} />
          <Stat
            label="Approved"
            value={String(relatedApps.filter((item) => item.status === "Approved").length)}
          />
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}
