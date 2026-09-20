import Link from "next/link";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";

const steps = [
  {
    title: "Sign in with your student username",
    body: "Use a username such as a1234567. Keep me signed in if you are on a private device.",
  },
  {
    title: "Complete your profile",
    body: "Add skills, availability and access needs. Clubs use this when they review applications.",
  },
  {
    title: "Apply, then track the outcome",
    body: "Applications stay on My Applications. Approved roles appear as shifts with times and meeting points.",
  },
];

export default function CurrentStudentsPage() {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <SiteHeader active="students" />

      <section className="relative overflow-hidden bg-[#f3f1ed]">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-purple-700" />
        <div className="relative mx-auto max-w-7xl px-6 py-20">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
            Current students
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-6xl">
            Your campus volunteering, in one student portal.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-700">
            Discover student-club events, apply for roles, check shifts and
            build a rating other clubs can trust. This is an educational
            prototype, not an official university production service.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/discover"
              className="bg-black px-7 py-3.5 font-semibold text-white transition hover:bg-purple-700"
            >
              Browse events
            </Link>
            <Link
              href="/login"
              className="border border-black px-7 py-3.5 font-semibold transition hover:bg-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-semibold">How current students use the portal</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="border border-gray-200 p-7">
              <p className="text-sm font-bold text-purple-700">0{index + 1}</p>
              <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
              <p className="mt-3 leading-7 text-gray-600">{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#171717] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-semibold">Student username</h2>
            <p className="mt-3 leading-7 text-gray-300">
              Demo sign-in expects a username starting with a, then seven
              digits — for example a1991246.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Club events only</h2>
            <p className="mt-3 leading-7 text-gray-300">
              Opportunities in this version are hosted by student clubs. Filter
              Discover by club, campus, category or tag.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Need help?</h2>
            <p className="mt-3 leading-7 text-gray-300">
              Briefings, cancellations and access questions are covered on
              Volunteer support.
            </p>
            <Link
              href="/volunteer-support"
              className="mt-4 inline-block font-semibold text-purple-300 hover:text-white"
            >
              Open volunteer support →
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
