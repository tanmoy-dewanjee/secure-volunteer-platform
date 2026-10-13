"use client";

import EventPoster from "@/components/browse/EventPoster";
import type { Event } from "@/data/events";

type EventGridProps = {
  events: Event[];
  title?: string;
  subtitle?: string;
  animate?: boolean;
};

export default function EventGrid({
  events,
  title,
  subtitle,
  animate = false,
}: EventGridProps) {
  if (events.length === 0) return null;

  return (
    <section>
      {title ? (
        <div className="mb-5">
          <h2 className="text-xl font-semibold md:text-2xl">{title}</h2>
          {subtitle ? (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </div>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {events.map((event, index) => (
          <div
            key={event.id}
            className={animate ? "result-card" : undefined}
            style={animate ? { animationDelay: `${Math.min(index, 12) * 45}ms` } : undefined}
          >
            <EventPoster event={event} layout="grid" />
          </div>
        ))}
      </div>
    </section>
  );
}
