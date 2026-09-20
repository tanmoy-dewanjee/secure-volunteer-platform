import Image from "next/image";
import Link from "next/link";

import { events, getEventHost } from "@/data/events";
import { studentClubs } from "@/data/organisations";

const accessLinks = [
  {
    href: "/discover",
    title: "Discover events",
    body: "Browse club opportunities, search tags and apply for a role.",
    delay: "landing-delay-1",
  },
  {
    href: "/profile",
    title: "Student profile",
    body: "Collect points, climb levels and build a rating clubs can trust.",
    delay: "landing-delay-2",
  },
  {
    href: "/login",
    title: "Sign in",
    body: "Open the student portal to manage applications and shifts.",
    delay: "landing-delay-3",
  },
  {
    href: "/my-applications",
    title: "My applications",
    body: "Track pending, approved and rejected volunteer applications.",
    delay: "landing-delay-4",
  },
];

const steps = [
  {
    number: "01",
    title: "Find a club event",
    body: "Search by club, campus, category or tag and open the details that interest you.",
  },
  {
    number: "02",
    title: "Apply for a role",
    body: "Choose a volunteer role and share your availability with the club coordinators.",
  },
  {
    number: "03",
    title: "Show up and contribute",
    body: "Once approved, your assigned activity will appear with the rest of your volunteering.",
  },
];

export default function LandingPage() {
  const featured = events.find((event) => event.featured) ?? events[0];
  const featuredHost = featured ? getEventHost(featured) : undefined;
  const openPlaces = events.reduce(
    (total, event) => total + event.placesAvailable,
    0
  );
  const previewEvents = [...events]
    .sort((a, b) => b.trendingScore - a.trendingScore)
    .slice(0, 4);

  const marqueeClubs = [...studentClubs, ...studentClubs];

  return (
    <div className="overflow-hidden bg-white text-[#171717]">
      <section className="relative overflow-hidden bg-[#f3f1ed]">
        <div className="landing-orb pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-purple-700" />
        <div className="landing-orb-slow pointer-events-none absolute -bottom-24 left-[18%] h-40 w-40 rounded-full bg-[#18a999]/80" />
        <div className="landing-orb pointer-events-none absolute right-[22%] top-24 h-16 w-16 rounded-full bg-[#ee626b]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <p className="landing-reveal text-sm font-bold uppercase tracking-[0.22em] text-purple-700">
              Student Volunteer Portal
            </p>
            <h1 className="landing-reveal landing-delay-1 mt-5 max-w-xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Volunteer with the
              <span className="block text-purple-700">clubs that move campus.</span>
            </h1>
            <p className="landing-reveal landing-delay-2 mt-6 max-w-lg text-lg leading-8 text-gray-700">
              A calmer way to discover student-club events, apply for roles and
              keep your volunteering in one place.
            </p>

            <form
              action="/discover"
              className="landing-reveal landing-delay-3 mt-8 flex w-full max-w-xl overflow-hidden border border-black/10 bg-white"
            >
              <label htmlFor="landing-search" className="sr-only">
                Search events and tags
              </label>
              <input
                id="landing-search"
                name="q"
                type="search"
                placeholder="Search events, tags or clubs"
                className="min-w-0 flex-1 px-5 py-4 outline-none"
              />
              <button
                type="submit"
                className="bg-black px-6 py-4 font-semibold text-white transition hover:bg-purple-700"
              >
                Search
              </button>
            </form>

            <div className="landing-reveal landing-delay-4 mt-6 flex flex-wrap gap-4">
              <Link
                href="/discover"
                className="bg-black px-7 py-3.5 font-semibold text-white transition hover:bg-purple-700"
              >
                Browse events
              </Link>
              <Link
                href="/signup"
                className="border border-black px-7 py-3.5 font-semibold transition hover:bg-white"
              >
                Create account
              </Link>
            </div>
          </div>

          {featured ? (
            <Link
              href={`/events/${featured.id}`}
              className="landing-reveal landing-delay-2 group relative isolate min-h-[420px] overflow-hidden bg-white shadow-xl"
            >
              <Image
                src={featured.bannerImage}
                alt={featured.title}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="landing-kenburns object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8 text-white">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-purple-200">
                  Featured · {featuredHost?.shortName}
                </p>
                <h2 className="mt-3 text-3xl font-semibold">{featured.title}</h2>
                <p className="mt-2 text-sm text-white/80">
                  {featured.date} · {featured.campus}
                </p>
              </div>
            </Link>
          ) : null}
        </div>
      </section>

      <div className="overflow-hidden border-y border-gray-200 bg-white py-4">
        <div className="landing-marquee flex w-max gap-12 px-6 text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
          {marqueeClubs.map((club, index) => (
            <span key={`${club.id}-${index}`}>{club.shortName}</span>
          ))}
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 border-y border-gray-200 py-10 md:grid-cols-3">
          <div className="landing-reveal">
            <p className="text-4xl font-semibold">{studentClubs.length}</p>
            <p className="mt-2 text-gray-600">Student clubs hosting events</p>
          </div>
          <div className="landing-reveal landing-delay-1">
            <p className="text-4xl font-semibold">{events.length}</p>
            <p className="mt-2 text-gray-600">Volunteer opportunities</p>
          </div>
          <div className="landing-reveal landing-delay-2">
            <p className="text-4xl font-semibold">{openPlaces}</p>
            <p className="mt-2 text-gray-600">Places currently available</p>
          </div>
        </div>
      </section>

      <section className="bg-[#f3f1ed] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
            Start here
          </p>
          <h2 className="mt-3 text-4xl font-semibold">Everything from one landing page</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-gray-700">
            Move into discovery, your profile, sign in or applications
            without hunting through the rest of the prototype.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {accessLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`landing-card landing-reveal ${item.delay} block bg-white p-8`}
              >
                <h3 className="text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 leading-7 text-gray-600">{item.body}</p>
                <span className="mt-6 inline-block font-semibold text-purple-700">
                  Continue →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
                Student clubs
              </p>
              <h2 className="mt-3 text-4xl font-semibold">Filter later by the club you care about</h2>
            </div>
            <Link
              href="/discover"
              className="font-semibold text-purple-700 hover:underline"
            >
              View all events →
            </Link>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {studentClubs.map((club, index) => (
              <Link
                key={club.id}
                href={`/discover?club=${club.id}`}
                className={`landing-card landing-reveal landing-delay-${(index % 4) + 1} border border-gray-200 bg-white p-6`}
              >
                <div className="h-1.5 w-12 bg-purple-700" />
                <h3 className="mt-5 text-xl font-semibold">{club.shortName}</h3>
                <p className="mt-2 text-sm font-medium text-purple-700">
                  {club.focus}
                </p>
                <p className="mt-3 leading-7 text-gray-600">{club.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#171717] py-20 text-white">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-300">
            How it works
          </p>
          <h2 className="mt-3 text-4xl font-semibold">Three quiet steps</h2>
          <div className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className={`landing-reveal landing-delay-${index + 1}`}
              >
                <p className="text-sm font-bold tracking-[0.18em] text-purple-300">
                  {step.number}
                </p>
                <h3 className="mt-4 text-2xl font-semibold">{step.title}</h3>
                <p className="mt-3 leading-7 text-gray-300">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
                Happening soon
              </p>
              <h2 className="mt-3 text-4xl font-semibold">A few events to start with</h2>
            </div>
            <Link
              href="/discover"
              className="bg-black px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Open full catalogue
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {previewEvents.map((event, index) => {
              const host = getEventHost(event);
              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className={`landing-card landing-reveal landing-delay-${index + 1} overflow-hidden border border-gray-200 bg-white`}
                >
                  <div className="relative h-40">
                    <Image
                      src={event.posterImage}
                      alt={event.title}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">
                      {host?.shortName}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold">{event.title}</h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {event.date} · {event.campus}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            {["STEM", "Wellbeing", "Community", "Sport", "Mentoring", "Outdoors"].map(
              (tag) => (
                <Link
                  key={tag}
                  href={`/discover?tag=${encodeURIComponent(tag)}`}
                  className="border border-gray-200 px-4 py-2 text-sm transition hover:border-purple-700 hover:text-purple-700"
                >
                  {tag}
                </Link>
              )
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
