import Link from "next/link";
import { notFound } from "next/navigation";

import AuthGuard from "@/components/AuthGuard";
import ApplicationForm from "@/components/ApplicationForm";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { getEvent, getEventHost } from "@/data/events";

type ApplyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;
  const event = getEvent(id);

  if (!event) {
    notFound();
  }

  const host = getEventHost(event);
  const canApply = event.status === "Open" && event.placesAvailable > 0;

  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader />

      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Link
            href={`/events/${event.id}`}
            className="text-sm font-semibold text-purple-700 hover:underline"
          >
            ← Back to event details
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-purple-700">
              Volunteer application
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
              Apply for {event.title}
            </h1>
            <p className="mt-5 leading-7 text-gray-600">
              Complete the base application, choose your shifts, then answer any
              extra questions this club has set for this event.
            </p>

            <div className="mt-10">
              {canApply ? (
                <AuthGuard>
                  <ApplicationForm event={event} />
                </AuthGuard>
              ) : (
                <div className="border border-amber-200 bg-amber-50 p-8">
                  <h2 className="text-2xl font-semibold">Applications not open</h2>
                  <p className="mt-3 leading-7 text-gray-700">
                    This opportunity cannot accept applications yet. You can
                    still view the event details and check back later.
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside>
            <div className="border border-gray-200 bg-[#f7f7f7] p-7">
              <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">
                Event summary
              </p>
              <h2 className="mt-4 text-2xl font-semibold">{event.title}</h2>
              <div className="mt-6 space-y-5 text-sm">
                <div>
                  <p className="font-semibold text-gray-500">Host</p>
                  <p className="mt-1 text-base">{host?.name}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Date</p>
                  <p className="mt-1 text-base">{event.date}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-500">Time</p>
                  <p className="mt-1 text-base">
                    {event.startTime} – {event.endTime}
                  </p>
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
                        <span className="mt-1 block text-sm text-gray-500">
                          {shift.placesAvailable} places
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                {event.requirements.length > 0 ? (
                  <div>
                    <p className="font-semibold text-gray-500">Requirements</p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6">
                      {event.requirements.map((requirement) => (
                        <li key={requirement}>{requirement}</li>
                      ))}
                    </ul>
                  </div>
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
