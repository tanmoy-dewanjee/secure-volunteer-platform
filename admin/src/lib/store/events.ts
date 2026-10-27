import { events as seedEvents, type Event } from "@/data/events";

const STORAGE_KEY = "svp_admin_events";
export const ADMIN_EVENTS_EVENT = "svp-admin-events";

function canUseStore() {
  return typeof window !== "undefined";
}

function loadOverrides(): Event[] {
  if (!canUseStore()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Event[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOverrides(overrides: Event[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  window.dispatchEvent(new Event(ADMIN_EVENTS_EVENT));
}

export function getAdminEvents(): Event[] {
  const byId = new Map(seedEvents.map((event) => [event.id, event]));
  for (const override of loadOverrides()) {
    byId.set(override.id, override);
  }
  return [...byId.values()].sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getAdminEvent(id: string) {
  return getAdminEvents().find((event) => event.id === id);
}

export function saveAdminEvent(event: Event) {
  const overrides = loadOverrides().filter((item) => item.id !== event.id);
  overrides.push(event);
  writeOverrides(overrides);
  return event;
}

export async function persistAdminEvent(event: Event) {
  saveAdminEvent(event);
  try {
    await fetch("/api/admin/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch {
    // Local catalogue stays available if Supabase is offline.
  }
  return event;
}

export function archiveAdminEvent(id: string) {
  const event = getAdminEvent(id);
  if (!event) return null;
  const next = { ...event, status: "Closed" as const, placesAvailable: 0 };
  void persistAdminEvent(next);
  return next;
}

export function duplicateAdminEvent(id: string) {
  const event = getAdminEvent(id);
  if (!event) return null;
  const copy: Event = {
    ...event,
    id: createEventId(`${event.title} copy`),
    title: `${event.title} (copy)`,
    status: "Coming soon",
    featured: false,
    trendingScore: Math.max(40, event.trendingScore - 10),
  };
  void persistAdminEvent(copy);
  return copy;
}

export function isCustomEvent(id: string) {
  return (
    loadOverrides().some((event) => event.id === id) &&
    !seedEvents.some((event) => event.id === id)
  );
}

export function createEventId(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "event"}-${Date.now().toString().slice(-6)}`;
}

export function blankEvent(): Event {
  return {
    id: createEventId("new-event"),
    title: "",
    tagline: "",
    category: "Community",
    tags: [],
    description: "",
    date: "18 November 2026",
    startTime: "9:00 AM",
    endTime: "4:00 PM",
    campus: "Adelaide City",
    location: "",
    organisationId: "rotaract",
    contactEmail: "events@example.edu.au",
    capacity: 20,
    placesAvailable: 20,
    status: "Coming soon",
    requirements: ["Current Adelaide University student or approved volunteer"],
    roles: [
      {
        id: `role-${Date.now()}`,
        title: "Event Support",
        description: "Help coordinators with general operations.",
        placesAvailable: 8,
      },
    ],
    shifts: [
      {
        id: `shift-${Date.now()}`,
        label: "Full day",
        startTime: "9:00 AM",
        endTime: "4:00 PM",
        placesAvailable: 8,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80",
    trendingScore: 55,
    applicationDeadline: "1 November 2026",
    accessibilityNotes: "",
    lat: -34.9205,
    lng: 138.6062,
    askResume: false,
    customFields: [],
  };
}
