"use client";

import Link from "next/link";
import { notFound } from "next/navigation";

import ApplicationForm from "@/components/ApplicationForm";
import AuthGuard from "@/components/AuthGuard";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { canApplyToEvent, getEventHost } from "@/data/events";
import { useCatalogEvent } from "@/hooks/useEventCatalog";

export default function EventApplyView({ eventId }: { eventId: string }) {
  const { event, ready } = useCatalogEvent(eventId);

  if (!event && !ready) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />
        <p className="px-6 py-16 text-center text-gray-600">Loading application...</p>
      </main>
    );
  }

  if (!event) {
    notFound();
  }

  const host = getEventHost(event);
  const canApply = canApplyToEvent(event);

  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader />

      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <Link
            href={`/events/${event.id}`}
            className="text-sm font-semibold text-purple-700 hover:underline"
          >
            ← Back to event details
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-purple-700">
              Volunteer application
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Apply for {event.title}
            </h1>
            <p className="mt-4 leading-7 text-gray-600">
              Complete the base application, choose your shifts, then answer any
              extra questions this club has set for this event.
            </p>

            <div className="mt-8">
              {canApply ? (
                <AuthGuard>
                  <ApplicationForm event={event} />
                </AuthGuard>
              ) : (
                <div className="border border-amber-200 bg-amber-50 p-8">
                  <h2 className="text-2xl font-semibold">Applications not open</h2>
                  <p className="mt-3 leading-7 text-gray-700">
                    {event.status === "In progress"
                      ? "This event is already underway, so new applications are closed."
                      : "This opportunity cannot accept applications yet."}
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside>
            <div className="border border-gray-200 bg-[#f7f7f7] p-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
                Event summary
              </p>
              <h2 className="mt-3 text-xl font-semibold">{event.title}</h2>
              <div className="mt-5 space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-500">Host</p>
                  <p className="mt-1 text-base">{host?.name}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Date</p>
                  <p className="mt-1 text-base">{event.date}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Location</p>
                  <p className="mt-1 text-base leading-6">{event.location}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Shifts</p>
                  <ul className="mt-2 space-y-2 text-base">
                    {event.shifts.map((shift) => (
                      <li key={shift.id}>
                        {shift.label}: {shift.startTime} – {shift.endTime}
                      </li>
                    ))}
                  </ul>
                </div>
                {event.askResume ? (
                  <p className="border border-purple-200 bg-white px-3 py-2 text-sm">
                    This event asks you to attach a resume.
                  </p>
                ) : null}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
