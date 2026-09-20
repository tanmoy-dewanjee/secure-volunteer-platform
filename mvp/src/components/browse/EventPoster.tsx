"use client";

import Image from "next/image";
import Link from "next/link";

import { getEventHost, type Event } from "@/data/events";
import { recordEventView } from "@/lib/view-history";

type EventPosterProps = {
  event: Event;
  source?: "card" | "billboard";
};

function statusClass(status: Event["status"]) {
  if (status === "Open") return "bg-green-100 text-green-800";
  if (status === "Coming soon") return "bg-amber-100 text-amber-800";
  if (status === "Full") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-700";
}

export default function EventPoster({
  event,
  source = "card",
}: EventPosterProps) {
  const host = getEventHost(event);

  return (
    <Link
      href={`/events/${event.id}`}
      onClick={() => recordEventView(event.id, source)}
      className="group/poster relative w-[240px] shrink-0 snap-start sm:w-[280px] lg:w-[300px]"
    >
      <article className="poster-motion flex h-full flex-col overflow-hidden border border-gray-200 bg-white transition duration-300 ease-out group-hover/poster:-translate-y-1 group-hover/poster:shadow-lg">
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          <Image
            src={event.posterImage}
            alt={event.title}
            fill
            sizes="300px"
            className="poster-motion object-cover transition duration-500 group-hover/poster:scale-105"
          />
          <span
            className={`absolute left-3 top-3 px-2 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass(event.status)}`}
          >
            {event.status}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">
            {event.category}
          </p>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-snug text-[#171717]">
            {event.title}
          </h3>
          <p className="mt-2 truncate text-sm text-gray-600">
            {host?.shortName ?? "Campus host"} · {event.campus}
          </p>
          <p className="mt-1 text-sm text-gray-500">{event.date}</p>
          <p className="mt-4 text-sm text-gray-500">
            {event.placesAvailable > 0
              ? `${event.placesAvailable} places available`
              : "Applications opening soon"}
          </p>
        </div>
      </article>
    </Link>
  );
}
