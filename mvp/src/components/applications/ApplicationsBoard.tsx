"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSession } from "@/hooks/useSession";
import {
  getApplications,
  seedApplications,
  withdrawApplication,
  type ApplicationStatus,
  type VolunteerApplication,
} from "@/lib/applications";

const statusFilters: Array<"All" | ApplicationStatus> = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Withdrawn",
];

function statusClass(status: ApplicationStatus) {
  if (status === "Approved") return "bg-green-100 text-green-800";
  if (status === "Rejected") return "bg-red-100 text-red-800";
  if (status === "Withdrawn") return "bg-gray-100 text-gray-700";
  return "bg-amber-100 text-amber-800";
}

export default function ApplicationsBoard() {
  const { session } = useSession();
  const [status, setStatus] = useState<(typeof statusFilters)[number]>("All");
  const [applications, setApplications] =
    useState<VolunteerApplication[]>(seedApplications);

  useEffect(() => {
    if (session) {
      setApplications(getApplications(session.username));
    }
  }, [session]);

  const visible = useMemo(
    () =>
      applications.filter(
        (application) => status === "All" || application.status === status
      ),
    [applications, status]
  );

  const handleWithdraw = (id: string) => {
    if (!session) return;
    setApplications(withdrawApplication(session.username, id));
  };

  return (
    <>
      <section className="bg-[#f3f1ed]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
            Student / Volunteer Portal
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            My Applications
          </h1>
          <p className="mt-5 max-w-2xl leading-7 text-gray-600">
            Track every volunteer application, withdraw a pending request, or
            open an approved role in My Shifts.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h2 className="text-3xl font-semibold">Application history</h2>
            <p className="mt-2 text-gray-600">
              {visible.length}{" "}
              {visible.length === 1 ? "application" : "applications"}
            </p>
          </div>
          <Link
            href="/discover"
            className="bg-black px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            Find more opportunities
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {statusFilters.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStatus(option)}
              className={`px-3 py-1.5 text-sm font-medium ${
                status === option
                  ? "bg-purple-700 text-white"
                  : "border border-gray-200 hover:border-purple-700"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="mt-10 space-y-6">
          {visible.length === 0 ? (
            <div className="border border-gray-200 bg-gray-50 p-10 text-center">
              <h3 className="text-2xl font-semibold">No applications here</h3>
              <p className="mt-3 text-gray-600">
                Try another status, or apply from Discover.
              </p>
            </div>
          ) : (
            visible.map((application) => (
              <article
                key={application.id}
                className="border border-gray-200 bg-white p-7"
              >
                <div className="flex flex-col justify-between gap-7 lg:flex-row">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`px-3 py-1 text-sm font-semibold ${statusClass(application.status)}`}
                      >
                        {application.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Submitted {application.submittedDate}
                      </span>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold">
                      {application.eventTitle}
                    </h3>
                    <div className="mt-5 grid gap-5 text-sm sm:grid-cols-3">
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-gray-500">
                          Volunteer role
                        </p>
                        <p className="mt-2 text-base">{application.role}</p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-gray-500">
                          Campus
                        </p>
                        <p className="mt-2 text-base">{application.campus}</p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-wide text-gray-500">
                          Event date
                        </p>
                        <p className="mt-2 text-base">{application.eventDate}</p>
                      </div>
                    </div>
                    {application.preferredShifts &&
                    application.preferredShifts.length > 0 ? (
                      <div className="mt-5">
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                          Preferred shifts
                        </p>
                        <p className="mt-2 text-base">
                          {application.preferredShifts.join(" · ")}
                        </p>
                      </div>
                    ) : null}
                    {application.extraAnswers &&
                    Object.keys(application.extraAnswers).length > 0 ? (
                      <div className="mt-5">
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                          Extra answers
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-gray-700">
                          {Object.entries(application.extraAnswers).map(
                            ([label, answer]) => (
                              <li key={label}>
                                {label}: {answer}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    ) : null}
                    <p className="mt-6 border-t border-gray-200 pt-5 text-sm leading-6 text-gray-600">
                      {application.status === "Pending" &&
                        "Waiting for a club coordinator to review this application."}
                      {application.status === "Approved" &&
                        "Approved. Your assigned activity is in My Shifts."}
                      {application.status === "Rejected" &&
                        "Not approved for this opportunity. You can apply for another event."}
                      {application.status === "Withdrawn" &&
                        "You withdrew this application before a decision was made."}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-3">
                    <Link
                      href={`/events/${application.eventId}`}
                      className="font-semibold text-purple-700 hover:underline"
                    >
                      View event →
                    </Link>
                    {application.status === "Approved" ? (
                      <Link
                        href="/my-shifts"
                        className="font-semibold text-purple-700 hover:underline"
                      >
                        View shift →
                      </Link>
                    ) : null}
                    {application.status === "Pending" ? (
                      <button
                        type="button"
                        onClick={() => handleWithdraw(application.id)}
                        className="text-sm font-semibold text-gray-600 underline"
                      >
                        Withdraw application
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
