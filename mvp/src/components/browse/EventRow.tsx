"use client";

import { useRef } from "react";

import EventPoster from "@/components/browse/EventPoster";
import type { Event } from "@/data/events";

type EventRowProps = {
  title: string;
  subtitle?: string;
  events: Event[];
};

export default function EventRow({ title, subtitle, events }: EventRowProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (events.length === 0) return null;

  const scroll = (direction: -1 | 1) => {
    const node = scrollerRef.current;
    if (!node) return;
    node.scrollBy({
      left: direction * Math.round(node.clientWidth * 0.86),
      behavior: "smooth",
    });
  };

  return (
    <section className="browse-fade-up relative">
      <div className="mb-4 px-6 lg:px-12">
        <h2 className="text-xl font-semibold text-[#171717] md:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
        ) : null}
      </div>

      <div className="group/row relative">
        {events.length > 3 ? (
          <>
            <button
              type="button"
              aria-label={`Scroll ${title} left`}
              onClick={() => scroll(-1)}
              className="absolute left-1 top-1/2 z-20 hidden h-24 w-10 -translate-y-1/2 items-center justify-center border border-gray-200 bg-white text-2xl text-[#171717] opacity-0 transition hover:bg-gray-50 group-hover/row:opacity-100 md:flex"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={`Scroll ${title} right`}
              onClick={() => scroll(1)}
              className="absolute right-1 top-1/2 z-20 hidden h-24 w-10 -translate-y-1/2 items-center justify-center border border-gray-200 bg-white text-2xl text-[#171717] opacity-0 transition hover:bg-gray-50 group-hover/row:opacity-100 md:flex"
            >
              ›
            </button>
          </>
        ) : null}

        <div
          ref={scrollerRef}
          className="browse-scroll flex gap-4 overflow-x-auto px-6 pb-8 pt-4 snap-x snap-mandatory lg:px-12"
        >
          {events.map((event) => (
            <EventPoster key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
