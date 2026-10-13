import { events as seedEvents, type Event } from "@/data/events";

const STORAGE_KEY = "svp_event_catalog";
export const EVENT_CATALOG_EVENT = "svp-event-catalog";

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
  window.dispatchEvent(new Event(EVENT_CATALOG_EVENT));
}

export function getCatalogEvents(): Event[] {
  const byId = new Map(seedEvents.map((event) => [event.id, event]));
  for (const override of loadOverrides()) {
    byId.set(override.id, override);
  }
  return [...byId.values()].sort((a, b) => b.trendingScore - a.trendingScore);
}

export function getCatalogEvent(id: string) {
  return getCatalogEvents().find((event) => event.id === id);
}

export function saveCatalogEvent(event: Event) {
  const overrides = loadOverrides().filter((item) => item.id !== event.id);
  overrides.push(event);
  writeOverrides(overrides);
  return event;
}

export function isCustomEvent(id: string) {
  return loadOverrides().some((event) => event.id === id) &&
    !seedEvents.some((event) => event.id === id);
}

export function createEventId(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `${slug || "event"}-${Date.now().toString().slice(-6)}`;
}
