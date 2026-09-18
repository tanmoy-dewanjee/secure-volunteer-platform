"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { useSession } from "@/hooks/useSession";
import {
  apiDeleteEvent,
  apiListEvents,
  rememberReturnPath,
  type ApiEvent,
} from "@/lib/api";

export default function AdminEventsPage() {
  const router = useRouter();
  const { ready, signedIn, isAdmin } = useSession();
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    try {
      setEvents(await apiListEvents());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load events");
    }
  };

  useEffect(() => {
    if (!ready) return;
    if (!signedIn) {
      rememberReturnPath("/admin/events");
      router.replace("/login");
      return;
    }
    if (!isAdmin) {
      router.replace("/discover");
      return;
    }
    load();
  }, [ready, signedIn, isAdmin, router]);

  const handleDelete = async (event: ApiEvent) => {
    if (!window.confirm(`Delete “${event.title}”? Students will no longer see it.`)) {
      return;
    }
    setBusyId(event.id);
    try {
      await apiDeleteEvent(event.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFB] text-[#140F50]">
      <SiteHeader active="admin" />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Admin — events</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create, edit, and soft-delete events. Mutations are audited.
            </p>
          </div>
          <Link
            href="/admin/events/new"
            className="bg-[#1448FF] px-5 py-3 font-semibold text-white hover:bg-[#0C2B99]"
          >
            Create event
          </Link>
        </div>

        {error ? (
          <p className="mt-6 text-sm text-[#D32362]" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="mt-8 space-y-4">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex flex-wrap items-start justify-between gap-4 border border-gray-200 bg-white p-5"
            >
              <div>
                <h2 className="text-xl font-semibold">{event.title}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {event.location} · {event.department}
                </p>
                <p className="mt-2 text-sm">{event.description}</p>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/events/${event.id}/edit`}
                  className="border border-[#1448FF] px-3 py-2 text-sm text-[#1448FF]"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  disabled={busyId === event.id}
                  onClick={() => handleDelete(event)}
                  className="bg-[#D32362] px-3 py-2 text-sm text-white disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {events.length === 0 ? (
            <li className="border border-dashed border-gray-300 bg-white p-8 text-center text-gray-600">
              No events yet. Create one to seed the student explore list.
            </li>
          ) : null}
        </ul>
      </div>
      <SiteFooter />
    </main>
  );
}
