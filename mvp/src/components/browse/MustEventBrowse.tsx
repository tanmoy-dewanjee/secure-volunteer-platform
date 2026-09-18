"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/hooks/useSession";
import {
  apiListEvents,
  rememberReturnPath,
  type ApiEvent,
} from "@/lib/api";
import { DEPARTMENTS, LOCATIONS } from "@/lib/db/types";

export default function MustEventBrowse() {
  const router = useRouter();
  const { ready, signedIn } = useSession();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [location, setLocation] = useState("");
  const [department, setDepartment] = useState("");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");

  const load = async (filters?: {
    q?: string;
    location?: string;
    department?: string;
  }) => {
    try {
      setEvents(await apiListEvents(filters));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events");
      setEvents([]);
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      rememberReturnPath("/discover");
      router.replace("/login");
      return;
    }
    load();
  }, [ready, signedIn, router]);

  const handleFilter = (event: FormEvent) => {
    event.preventDefault();
    load({
      q: q.trim() || undefined,
      location: location || undefined,
      department: department || undefined,
    });
  };

  const clearFilters = () => {
    setQ("");
    setLocation("");
    setDepartment("");
    load();
  };

  return (
    <section className="bg-[#FAFAFB] px-6 py-12 text-[#140F50]">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Explore events</h1>
        <p className="mt-2 text-sm text-gray-600">
          Filter by campus location and department. Open an event for
          recommendations.
        </p>

        <form
          onSubmit={handleFilter}
          className="mt-8 grid gap-4 border border-gray-200 bg-white p-5 sm:grid-cols-4"
        >
          <div className="sm:col-span-2">
            <label htmlFor="q" className="block text-sm font-semibold">
              Search
            </label>
            <input
              id="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1 w-full border px-3 py-2"
              placeholder="Title or description"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-semibold">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full border px-3 py-2"
            >
              <option value="">All campuses</option>
              {LOCATIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-semibold">
              Department
            </label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full border px-3 py-2"
            >
              <option value="">All departments</option>
              {DEPARTMENTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-4 flex gap-3">
            <button
              type="submit"
              className="bg-[#1448FF] px-4 py-2 font-semibold text-white"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="border border-[#1448FF] px-4 py-2 text-[#1448FF]"
            >
              Clear filters
            </button>
          </div>
        </form>

        {error ? (
          <p className="mt-6 text-sm text-[#D32362]" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="mt-8 space-y-4">
          {events.map((event) => (
            <li key={event.id} className="border border-gray-200 bg-white p-5">
              <h2 className="text-xl font-semibold">
                <Link href={`/events/${event.id}`} className="text-[#1448FF]">
                  {event.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {event.location} · {event.department}
              </p>
              <p className="mt-2 text-sm">{event.description}</p>
            </li>
          ))}
        </ul>

        {events.length === 0 && !error ? (
          <div className="mt-8 border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="font-semibold">No events match these filters.</p>
            <p className="mt-2 text-sm text-gray-600">
              Clear location or department, or ask staff to publish an event.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-[#1448FF] font-semibold"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
