"use client";

import Link from "next/link";

import type { Event } from "@/data/events";
import type { AdminApplication, AuditRow } from "@/lib/store/ops";

export default function DashboardView({
  events,
  applications,
  audit,
  volunteerCount,
}: {
  events: Event[];
  applications: AdminApplication[];
  audit: AuditRow[];
  volunteerCount: number;
}) {
  const upcoming = events.filter((event) => event.status !== "Closed").length;
  const pending = applications.filter((item) => item.status === "Pending").length;
  const unfilled = events.filter(
    (event) => event.status === "Open" && event.placesAvailable > 0
  ).length;
  const live = events.filter((event) => event.status === "In progress").length;
  const hours = applications.filter((item) => item.status === "Approved").length * 4;

  const byStatus = ["Pending", "Shortlisted", "Approved", "Rejected", "Withdrawn"].map(
    (status) => ({
      status,
      count: applications.filter((item) => item.status === status).length,
    })
  );
  const maxStatus = Math.max(...byStatus.map((item) => item.count), 1);

  const attention = [
    ...events
      .filter((event) => event.status === "Open" && event.placesAvailable > 6)
      .slice(0, 2)
      .map((event) => `${event.title} still has ${event.placesAvailable} unfilled places`),
    ...applications
      .filter((item) => item.status === "Pending")
      .slice(0, 2)
      .map((item) => `${item.volunteerName} application for ${item.eventTitle} is still pending`),
    ...events
      .filter((event) => !event.location)
      .slice(0, 1)
      .map((event) => `${event.title} is missing a venue pin`),
  ];

  const kpis = [
    { label: "Upcoming events", value: upcoming, href: "/events" },
    { label: "Active volunteers", value: volunteerCount, href: "/volunteers" },
    { label: "Pending applications", value: pending, href: "/applications" },
    { label: "Events with open places", value: unfilled, href: "/events" },
    { label: "Hours this month", value: hours, href: "/reports" },
  ];

  return (
    <div className="px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Overview
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Dashboard</h1>
      {live > 0 ? (
        <p className="mt-2 text-sm text-purple-800">{live} event happening now on campus.</p>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className="result-card rounded-xl border border-gray-200 bg-white p-5 transition hover:-translate-y-1 hover:shadow-lg"
            style={{ animationDelay: `${index * 45}ms` }}
          >
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="mt-2 text-3xl font-semibold">{item.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Applications by status</h2>
          <ul className="mt-4 space-y-3">
            {byStatus.map((item) => (
              <li key={item.status}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.status}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 bg-gray-100">
                  <div
                    className="h-full bg-purple-700"
                    style={{ width: `${(item.count / maxStatus) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Shift fill by event</h2>
          <ul className="mt-4 space-y-3">
            {events.slice(0, 5).map((event) => {
              const filled = event.capacity
                ? Math.round(((event.capacity - event.placesAvailable) / event.capacity) * 100)
                : 0;
              return (
                <li key={event.id}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="truncate pr-3">{event.title}</span>
                    <span>{filled}%</span>
                  </div>
                  <div className="h-2 bg-gray-100">
                    <div
                      className={`h-full ${filled > 80 ? "bg-green-600" : "bg-[#18a999]"}`}
                      style={{ width: `${filled}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Needs attention</h2>
          <ul className="mt-4 space-y-3">
            {attention.length === 0 ? (
              <li className="text-sm text-gray-600">Nothing urgent right now.</li>
            ) : (
              attention.map((item) => (
                <li key={item} className="border-l-4 border-[#ee626b] bg-[#fafafa] px-4 py-3 text-sm">
                  {item}
                </li>
              ))
            )}
          </ul>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/events/new" className="bg-black px-5 py-3 text-center font-semibold text-white hover:bg-purple-700">
              Create event
            </Link>
            <Link href="/applications" className="border border-black px-5 py-3 text-center font-semibold hover:bg-[#f3f1ed]">
              Review applications
            </Link>
            <Link href="/communications" className="text-center font-semibold text-[#7C00E8] hover:underline">
              Send announcement
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Upcoming timeline</h2>
          <ol className="mt-4 space-y-4">
            {events.slice(0, 6).map((event) => (
              <li key={event.id} className="border-l-4 border-[#7C00E8] pl-4">
                <p className="text-xs text-gray-500">{event.date}</p>
                <Link href={`/events/${event.id}`} className="font-semibold hover:text-purple-700">
                  {event.title}
                </Link>
                <p className="text-sm text-gray-500">{event.campus}</p>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold">Recent activity</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {audit.slice(0, 6).map((row) => (
              <li key={row.id}>
                <span className="text-gray-500">{row.at}</span>
                <span className="mt-1 block">
                  {row.who} · {row.action} · {row.target}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
