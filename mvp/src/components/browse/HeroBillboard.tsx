"use client";

import Image from "next/image";
import Link from "next/link";

import { getEventHost, type Event } from "@/data/events";
import { recordEventView } from "@/lib/view-history";

export default function HeroBillboard({ event }: { event: Event }) {
  const host = getEventHost(event);
  const canApply = event.status === "Open" && event.placesAvailable > 0;

  return (
    <section className="relative overflow-hidden bg-[#f3f1ed] text-[#171717]">
      <div className="absolute -right-32 -top-40 h-[460px] w-[460px] rounded-full bg-purple-700" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-2 lg:items-center lg:px-12 lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
            Featured opportunity
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            {event.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-gray-700">
            {event.tagline} {event.description}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="border border-black/10 bg-white px-3 py-1.5">
              {event.date}
            </span>
            <span className="border border-black/10 bg-white px-3 py-1.5">
              {event.campus}
            </span>
            <span className="border border-black/10 bg-white px-3 py-1.5">
              {host?.shortName ?? "Campus host"}
            </span>
            <span className="border border-black/10 bg-white px-3 py-1.5">
              {event.placesAvailable} places left
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={`/events/${event.id}`}
              onClick={() => recordEventView(event.id, "billboard")}
              className="bg-black px-7 py-3.5 font-semibold text-white transition hover:bg-purple-700"
            >
              View event
            </Link>
            {canApply ? (
              <Link
                href={`/events/${event.id}/apply`}
                onClick={() => recordEventView(event.id, "billboard")}
                className="border border-black px-7 py-3.5 font-semibold transition hover:bg-white"
              >
                Apply now
              </Link>
            ) : (
              <span className="border border-gray-300 px-7 py-3.5 font-semibold text-gray-400">
                Applications{" "}
                {event.status === "Coming soon" ? "opening soon" : "closed"}
              </span>
            )}
          </div>
        </div>

        <div className="relative min-h-[320px] overflow-hidden bg-white shadow-xl lg:min-h-[420px]">
          <Image
            src={event.bannerImage}
            alt={event.title}
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
