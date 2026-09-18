"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { useSession } from "@/hooks/useSession";
import { apiCreateEvent, apiGetEvent, apiUpdateEvent } from "@/lib/api";
import { DEPARTMENTS, LOCATIONS } from "@/lib/db/types";

type Props = {
  mode: "create" | "edit";
  eventId?: string;
};

export default function EventForm({ mode, eventId }: Props) {
  const router = useRouter();
  const { ready, signedIn, isAdmin } = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<string>(LOCATIONS[0]);
  const [department, setDepartment] = useState<string>(DEPARTMENTS[0]);
  const [startsAt, setStartsAt] = useState("2026-11-01T09:00");
  const [endsAt, setEndsAt] = useState("2026-11-01T12:00");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!signedIn || !isAdmin) {
      router.replace("/login");
      return;
    }
    if (mode === "edit" && eventId) {
      apiGetEvent(eventId)
        .then((event) => {
          if (!event) {
            setError("Event not found");
            return;
          }
          setTitle(event.title);
          setDescription(event.description);
          setLocation(event.location);
          setDepartment(event.department);
          setStartsAt(event.startsAt.slice(0, 16));
          setEndsAt(event.endsAt.slice(0, 16));
        })
        .catch((err) =>
          setError(err instanceof Error ? err.message : "Could not load event")
        );
    }
  }, [ready, signedIn, isAdmin, mode, eventId, router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = {
      title,
      description,
      location,
      department,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    };
    try {
      if (mode === "create") {
        await apiCreateEvent(payload);
      } else if (eventId) {
        await apiUpdateEvent(eventId, payload);
      }
      router.push("/admin/events");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFB] text-[#140F50]">
      <SiteHeader active="admin" />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/admin/events" className="text-sm text-[#1448FF]">
          ← Back to list
        </Link>
        <h1 className="mt-4 text-3xl font-bold">
          {mode === "create" ? "Create event" : "Edit event"}
        </h1>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4 bg-white p-6 border border-gray-200">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold">
              Title
            </label>
            <input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border px-3 py-2"
              required
              maxLength={120}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-semibold">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full border px-3 py-2"
              rows={5}
              required
              maxLength={4000}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
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
                {DEPARTMENTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startsAt" className="block text-sm font-semibold">
                Starts at
              </label>
              <input
                id="startsAt"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="mt-1 w-full border px-3 py-2"
                required
              />
            </div>
            <div>
              <label htmlFor="endsAt" className="block text-sm font-semibold">
                Ends at
              </label>
              <input
                id="endsAt"
                type="datetime-local"
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="mt-1 w-full border px-3 py-2"
                required
              />
            </div>
          </div>
          {error ? (
            <p className="text-sm text-[#D32362]" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="bg-[#1448FF] px-5 py-3 font-semibold text-white hover:bg-[#0C2B99] disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save event"}
          </button>
        </form>
      </div>
      <SiteFooter />
    </main>
  );
}
