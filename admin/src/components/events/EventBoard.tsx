"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import {
  campusOptions,
  categoryOptions,
  getEventHost,
  statusOptions,
  type Event,
} from "@/data/events";
import { archiveAdminEvent, duplicateAdminEvent } from "@/lib/store/events";

type View = "table" | "card" | "calendar";

export default function EventBoard({ events }: { events: Event[] }) {
  const toast = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [campus, setCampus] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("trending");
  const [view, setView] = useState<View>("table");
  const [page, setPage] = useState(0);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const next = events.filter((event) => {
      if (status !== "all" && event.status !== status) return false;
      if (campus !== "all" && event.campus !== campus) return false;
      if (category !== "all" && event.category !== category) return false;
      if (!needle) return true;
      return `${event.title} ${event.location} ${event.tags.join(" ")}`
        .toLowerCase()
        .includes(needle);
    });
    next.sort((a, b) => {
      if (sort === "az") return a.title.localeCompare(b.title);
      if (sort === "places") return b.placesAvailable - a.placesAvailable;
      return b.trendingScore - a.trendingScore;
    });
    return next;
  }, [events, query, status, campus, category, sort]);

  const pageSize = 8;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const slice = filtered.slice(page * pageSize, page * pageSize + pageSize);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
            Catalogue
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Events</h1>
          <p className="mt-2 text-sm text-gray-500">
            {filtered.length} matching · same catalogue students browse
          </p>
        </div>
        <Link
          href="/events/new"
          className="bg-black px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
        >
          Create event
        </Link>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_repeat(4,9rem)_auto]">
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="Search title, tag, venue"
          className="rounded-md border border-gray-200 px-4 py-3 outline-none focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200"
        />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectClass}>
          <option value="all">All status</option>
          {statusOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={campus} onChange={(event) => setCampus(event.target.value)} className={selectClass}>
          <option value="all">All campuses</option>
          {campusOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className={selectClass}>
          <option value="all">All categories</option>
          {categoryOptions.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)} className={selectClass}>
          <option value="trending">Trending</option>
          <option value="places">Most places</option>
          <option value="az">A to Z</option>
        </select>
        <div className="flex rounded-md border border-gray-200">
          {(["table", "card", "calendar"] as View[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setView(item)}
              className={`px-3 py-2 text-sm capitalize ${
                view === item ? "bg-black text-white" : "hover:bg-[#f3f1ed]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white px-8 py-14 text-center">
          <h2 className="text-xl font-semibold">No events match</h2>
          <p className="mt-3 text-gray-600">Clear a filter or create a new event.</p>
        </div>
      ) : view === "card" ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {slice.map((event, index) => (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="result-card overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <div className="relative aspect-[16/9] bg-gray-100">
                <Image src={event.posterImage} alt="" fill className="object-cover" sizes="400px" />
              </div>
              <div className="p-5">
                <StatusBadge status={event.status} />
                <h2 className="mt-3 font-semibold">{event.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {getEventHost(event)?.shortName} · {event.campus}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {event.date} · {event.placesAvailable} places
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : view === "calendar" ? (
        <Calendar events={filtered} />
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-[#fafafa]">
              <tr>
                <th className="px-4 py-3 font-semibold">Event</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Campus</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Places</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {slice.map((event) => (
                <tr key={event.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/events/${event.id}`} className="font-semibold hover:text-purple-700">
                      {event.title}
                    </Link>
                    <p className="text-xs text-gray-500">{getEventHost(event)?.shortName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={event.status} />
                  </td>
                  <td className="px-4 py-3">{event.campus}</td>
                  <td className="px-4 py-3">{event.date}</td>
                  <td className="px-4 py-3">{event.placesAvailable}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/events/${event.id}/edit`} className="font-semibold text-[#7C00E8]">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          duplicateAdminEvent(event.id);
                          toast("Event duplicated as a draft.");
                        }}
                        className="font-semibold text-gray-700 hover:underline"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(event.id)}
                        className="font-semibold text-red-700 hover:underline"
                      >
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view !== "calendar" && pages > 1 ? (
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((value) => value - 1)}
            className="border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= pages - 1}
            onClick={() => setPage((value) => value + 1)}
            className="border border-gray-200 px-3 py-2 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {confirmId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5">
          <div className="w-full max-w-md bg-white p-7" role="dialog" aria-modal="true">
            <div className="h-1.5 w-16 bg-[#7C00E8]" />
            <h2 className="mt-5 text-2xl font-semibold">Archive this event?</h2>
            <p className="mt-3 leading-7 text-gray-600">
              Students will no longer see it as open. You can still open it from Closed.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  archiveAdminEvent(confirmId);
                  toast("Event archived.");
                  setConfirmId(null);
                }}
                className="bg-black px-5 py-3 font-semibold text-white hover:bg-purple-700"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => setConfirmId(null)}
                className="border border-black px-5 py-3 font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Calendar({ events }: { events: Event[] }) {
  const groups = new Map<string, Event[]>();
  for (const event of events) {
    const list = groups.get(event.date) ?? [];
    list.push(event);
    groups.set(event.date, list);
  }
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[...groups.entries()].map(([date, list]) => (
        <section key={date} className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold">{date}</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {list.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="hover:text-purple-700">
                  {event.title}
                </Link>
                <span className="block text-gray-500">
                  {event.startTime}–{event.endTime} · {event.campus}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const selectClass =
  "rounded-md border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#7C00E8]";
