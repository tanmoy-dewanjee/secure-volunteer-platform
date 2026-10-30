"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import EventGrid from "@/components/browse/EventGrid";
import EventViewTracker from "@/components/EventViewTracker";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import EventMap from "@/components/maps/EventMap";
import {
  canApplyToEvent,
  getEventCoordinates,
  getEventHost,
  getEventHostLabel,
} from "@/data/events";
import type { StudentProfileData } from "@/data/volunteer-progress";
import { useCatalogEvent, useEventCatalog } from "@/hooks/useEventCatalog";
import { useSession } from "@/hooks/useSession";
import { useStudentApplications } from "@/hooks/useStudentApplications";
import { findApplicationConflict } from "@/lib/application-conflicts";
import {
  getSimilarEvents,
  type VolunteerHints,
} from "@/lib/recommendations";

export default function EventDetailsView({ eventId }: { eventId: string }) {
  const { event, ready } = useCatalogEvent(eventId);
  const { events } = useEventCatalog();
  const { applications } = useStudentApplications();
  const { session, signedIn } = useSession();
  const [volunteerHints, setVolunteerHints] = useState<VolunteerHints | undefined>();

  useEffect(() => {
    if (!signedIn || !session?.username) {
      setVolunteerHints(undefined);
      return;
    }
    let cancelled = false;
    void fetch(`/api/profile?username=${encodeURIComponent(session.username)}`)
      .then((response) => response.json())
      .then((payload: { profile?: StudentProfileData }) => {
        if (cancelled || !payload.profile) return;
        setVolunteerHints({
          campus: payload.profile.campus,
          department: payload.profile.department,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [signedIn, session?.username]);

  const similar = useMemo(() => {
    if (!event) return [];
    return getSimilarEvents(event, events, volunteerHints);
  }, [event, events, volunteerHints]);

  if (!event && !ready) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />
        <p className="px-6 py-16 text-center text-gray-600">Loading event...</p>
      </main>
    );
  }

  if (!event) {
    notFound();
  }

  const host = getEventHost(event);
  const canApply = canApplyToEvent(event);
  const coords = getEventCoordinates(event);
  const inProgress = event.status === "In progress";
  const applyConflict = findApplicationConflict(
    applications,
    event,
    events.length ? events : [event]
  );

  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader />
      <EventViewTracker eventId={event.id} />

      <section className="relative overflow-hidden bg-[#f3f1ed]">
        <div className="relative min-h-[180px] md:min-h-[220px]">
          <Image
            src={event.bannerImage}
            alt={event.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative mx-auto flex min-h-[180px] max-w-7xl flex-col justify-end px-6 py-6 md:min-h-[220px] lg:px-10">
            <Link
              href="/discover"
              className="mb-3 text-sm font-semibold text-white hover:underline"
            >
              ← Back to browse
            </Link>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-200">
              {event.category}
              {inProgress ? " · Happening now" : ""}
            </p>
            <h1 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-4xl">
              {event.title}
            </h1>
            <p className="mt-2 max-w-2xl text-white/90">{event.tagline}</p>
          </div>
        </div>
      </section>

      {inProgress ? (
        <div className="bg-purple-700 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3 lg:px-10">
            <p className="font-semibold">
              This event is in progress. Volunteers should go to the meeting point below.
            </p>
            <span className="text-sm text-purple-100">
              {event.startTime} – {event.endTime}
            </span>
          </div>
        </div>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <div>
          <p className="leading-7 text-gray-700">{event.description}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-semibold">Where to go</h2>
          <p className="mt-2 text-gray-600">{event.location}</p>
          <div className="mt-4">
            <EventMap lat={coords.lat} lng={coords.lng} label={event.campus} />
            {typeof event.lat === "number" && typeof event.lng === "number" ? null : (
              <p className="mt-2 text-sm text-gray-500">
                Approximate campus location. Use the written meeting point above
                if a precise pin was not added.
              </p>
            )}
          </div>

          <h2 className="mt-10 text-2xl font-semibold">Volunteer roles</h2>
          <div className="mt-5 space-y-4">
            {event.roles.map((role) => (
              <article key={role.id} className="border border-gray-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold">{role.title}</h3>
                  <span className="text-sm font-semibold text-purple-700">
                    {role.placesAvailable} places
                  </span>
                </div>
                <p className="mt-2 leading-7 text-gray-600">{role.description}</p>
              </article>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-semibold">Shifts</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {event.shifts.map((shift) => (
              <article
                key={shift.id}
                className="border border-gray-200 bg-[#f7f7f7] p-5"
              >
                <h3 className="font-semibold">{shift.label}</h3>
                <p className="mt-2 text-sm text-gray-600">
                  {shift.startTime} – {shift.endTime}
                </p>
                <p className="mt-3 text-sm font-semibold text-purple-700">
                  {shift.placesAvailable} places
                </p>
              </article>
            ))}
          </div>

          <h2 className="mt-10 text-2xl font-semibold">Requirements</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
            {event.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
          {event.askResume ? (
            <p className="mt-4 text-sm text-gray-600">
              This club also asks volunteers to attach a resume on the application form.
            </p>
          ) : null}
        </div>

        <aside>
          <div className="border border-gray-200 bg-[#f7f7f7] p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
              Event details
            </p>
            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-gray-500">Status</dt>
                <dd className="mt-1 text-base">
                  {inProgress ? "In progress" : event.status}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Host</dt>
                <dd className="mt-1 text-base">
                  {host?.name}
                  <span className="mt-1 block text-sm text-gray-500">
                    {getEventHostLabel(event)}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Date</dt>
                <dd className="mt-1 text-base">{event.date}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Time</dt>
                <dd className="mt-1 text-base">
                  {event.startTime} – {event.endTime}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Location</dt>
                <dd className="mt-1 text-base leading-6">
                  {event.campus}
                  <span className="mt-1 block text-gray-500">{event.location}</span>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Volunteer places</dt>
                <dd className="mt-1 text-base">
                  {event.placesAvailable} of {event.capacity} remaining
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Apply by</dt>
                <dd className="mt-1 text-base">{event.applicationDeadline}</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-500">Access</dt>
                <dd className="mt-1 text-base leading-6 text-gray-600">
                  {event.accessibilityNotes}
                </dd>
              </div>
            </dl>

            {canApply && applyConflict ? (
              <div className="mt-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700">
                <p className="font-semibold">
                  {applyConflict.kind === "same-event"
                    ? "You already applied for this event"
                    : "This clashes with another application"}
                </p>
                <p className="mt-2 leading-6">{applyConflict.message}</p>
                <Link
                  href="/my-applications"
                  className="mt-3 inline-block font-semibold text-purple-700 hover:underline"
                >
                  View my applications →
                </Link>
              </div>
            ) : canApply ? (
              <Link
                href={`/events/${event.id}/apply`}
                className="mt-6 block bg-black px-6 py-3 text-center font-semibold text-white transition hover:bg-purple-700"
              >
                Apply to volunteer
              </Link>
            ) : inProgress ? (
              <p className="mt-6 border border-purple-200 bg-white px-4 py-3 text-sm text-gray-700">
                Applications are closed while this event is underway. Use the map
                to reach the volunteer meeting point.
              </p>
            ) : (
              <p className="mt-6 border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                Applications are not open for this event yet.
              </p>
            )}
          </div>
        </aside>
      </section>

      <div className="border-t border-gray-200 bg-white px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <EventGrid
            events={similar}
            title="More like this"
            subtitle="Similar events based on category, campus, host and your profile"
          />
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
