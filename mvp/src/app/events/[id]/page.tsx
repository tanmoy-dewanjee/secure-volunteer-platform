import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import EventRow from "@/components/browse/EventRow";
import EventViewTracker from "@/components/EventViewTracker";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import {
  events,
  getEvent,
  getEventHost,
  getEventHostLabel,
} from "@/data/events";
import { getSimilarEvents } from "@/lib/recommendations";

type EventDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { id } = await params;
  const event = getEvent(id);

  if (!event) {
    notFound();
  }

  const host = getEventHost(event);
  const similar = getSimilarEvents(event, events);
  const canApply = event.status === "Open" && event.placesAvailable > 0;

  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader />
      <EventViewTracker eventId={event.id} />

      <section className="relative min-h-[42vh] overflow-hidden bg-[#f3f1ed]">
        <Image
          src={event.bannerImage}
          alt={event.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative mx-auto flex min-h-[42vh] max-w-7xl flex-col justify-end px-6 pb-10 pt-20 lg:px-10">
          <Link
            href="/discover"
            className="mb-6 text-sm font-semibold text-white hover:underline"
          >
            ← Back to browse
          </Link>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-200">
            {event.category}
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
            {event.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">{event.tagline}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">
        <div>
          <p className="text-lg leading-8 text-gray-700">{event.description}</p>

          <div className="mt-8 flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>

          <h2 className="mt-12 text-2xl font-semibold">Volunteer roles</h2>
          <div className="mt-5 space-y-4">
            {event.roles.map((role) => (
              <article
                key={role.id}
                className="border border-gray-200 bg-white p-5"
              >
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

          <h2 className="mt-12 text-2xl font-semibold">Shifts</h2>
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

          <h2 className="mt-12 text-2xl font-semibold">Requirements</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-gray-700">
            {event.requirements.map((requirement) => (
              <li key={requirement}>{requirement}</li>
            ))}
          </ul>
        </div>

        <aside>
          <div className="border border-gray-200 bg-[#f7f7f7] p-7">
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
              Event details
            </p>
            <dl className="mt-6 space-y-5 text-sm">
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

            {canApply ? (
              <Link
                href={`/events/${event.id}/apply`}
                className="mt-8 block bg-black px-6 py-3 text-center font-semibold text-white transition hover:bg-purple-700"
              >
                Apply to volunteer
              </Link>
            ) : (
              <p className="mt-8 border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                Applications are not open for this event yet.
              </p>
            )}
          </div>
        </aside>
      </section>

      <div className="border-t border-gray-200 bg-white pb-16 pt-8">
        <EventRow
          title="More like this"
          subtitle="Similar events based on category, campus and host type"
          events={similar}
        />
      </div>

      <SiteFooter />
    </main>
  );
}
