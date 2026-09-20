export type ViewSource = "card" | "details" | "billboard";

export type ViewRecord = {
  eventId: string;
  viewedAt: number;
  source: ViewSource;
};

const STORAGE_KEY = "svp_view_history";
export const VIEW_HISTORY_EVENT = "svp-view-history";

const MAX_RECORDS = 40;

function canUseStorage() {
  return typeof window !== "undefined";
}

export function getViewHistory(): ViewRecord[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as ViewRecord[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (record) =>
        record &&
        typeof record.eventId === "string" &&
        typeof record.viewedAt === "number"
    );
  } catch {
    return [];
  }
}

export function getViewedEventIds() {
  return [...new Set(getViewHistory().map((record) => record.eventId))];
}

export function recordEventView(eventId: string, source: ViewSource) {
  if (!canUseStorage()) return;

  const next: ViewRecord[] = [
    { eventId, viewedAt: Date.now(), source },
    ...getViewHistory().filter((record) => record.eventId !== eventId),
  ].slice(0, MAX_RECORDS);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(VIEW_HISTORY_EVENT));
}

export function clearViewHistory() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(VIEW_HISTORY_EVENT));
}
