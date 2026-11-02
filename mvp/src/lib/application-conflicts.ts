import type { VolunteerShift } from "@/data/events";
import type { VolunteerApplication } from "@/lib/applications";

export type ScheduleEvent = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  shifts: VolunteerShift[];
};

export const OPEN_APPLICATION_STATUSES = [
  "Pending",
  "Shortlisted",
  "Approved",
] as const;

export type ApplicationConflict = {
  kind: "same-event" | "schedule";
  application: VolunteerApplication;
  eventTitle: string;
  message: string;
};

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export function isOpenApplication(application: VolunteerApplication) {
  return OPEN_APPLICATION_STATUSES.includes(
    application.status as (typeof OPEN_APPLICATION_STATUSES)[number]
  );
}

export function dayKey(value: string | undefined | null): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const long = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (long) {
    const month = MONTHS[long[2].toLowerCase()];
    if (month) return `${Number(long[3])}-${month}-${Number(long[1])}`;
  }

  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${Number(iso[1])}-${Number(iso[2])}-${Number(iso[3])}`;

  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return `raw:${raw.toLowerCase()}`;
  const date = new Date(parsed);
  if (Number.isNaN(date.getTime())) return `raw:${raw.toLowerCase()}`;
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function minutesFromLabel(value: string) {
  const match = value.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toLowerCase();
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

type TimeWindow = { start: number; end: number };

function windowFromTimes(startTime: string, endTime: string): TimeWindow | null {
  const start = minutesFromLabel(startTime);
  const end = minutesFromLabel(endTime);
  if (start === null || end === null) return null;
  return { start, end: end <= start ? end + 24 * 60 : end };
}

function windowsOverlap(left: TimeWindow, right: TimeWindow) {
  return left.start < right.end && right.start < left.end;
}

function windowsFromText(values: string[]) {
  const windows: TimeWindow[] = [];
  for (const value of values) {
    const match = value.match(
      /(\d{1,2}:\d{2}\s*[ap]m)\s*[–-]\s*(\d{1,2}:\d{2}\s*[ap]m)/i
    );
    if (!match) continue;
    const window = windowFromTimes(match[1], match[2]);
    if (window) windows.push(window);
  }
  return windows;
}

function windowsFromEvent(event: ScheduleEvent, selectedShifts?: VolunteerShift[]) {
  if (selectedShifts?.length) {
    const fromShifts = selectedShifts
      .map((shift) => windowFromTimes(shift.startTime, shift.endTime))
      .filter((item): item is TimeWindow => Boolean(item));
    if (fromShifts.length) return fromShifts;
  }
  const whole = windowFromTimes(event.startTime, event.endTime);
  return whole ? [whole] : [];
}

function windowsFromApplication(
  application: VolunteerApplication,
  catalog: ScheduleEvent[]
) {
  const fromShifts = windowsFromText([
    ...(application.preferredShifts ?? []),
    application.availability ?? "",
  ]);
  if (fromShifts.length) return fromShifts;
  const event = catalog.find((item) => item.id === application.eventId);
  if (event) return windowsFromEvent(event);
  return [];
}

export function findApplicationConflict(
  existing: VolunteerApplication[],
  candidate: ScheduleEvent,
  catalog: ScheduleEvent[],
  selectedShifts?: VolunteerShift[]
): ApplicationConflict | null {
  const open = existing.filter(isOpenApplication);
  if (!open.length) return null;

  const sameEvent = open.find((item) => item.eventId === candidate.id);
  if (sameEvent) {
    return {
      kind: "same-event",
      application: sameEvent,
      eventTitle: sameEvent.eventTitle || candidate.title,
      message: `You already have a ${sameEvent.status.toLowerCase()} application for ${sameEvent.eventTitle} as ${sameEvent.role}. You cannot apply for another role at this event.`,
    };
  }

  const candidateWindows = windowsFromEvent(candidate, selectedShifts);
  const candidateDay = dayKey(candidate.date);
  if (!candidateDay || !candidateWindows.length) return null;

  for (const application of open) {
    const other =
      catalog.find((item) => item.id === application.eventId) ?? null;
    const otherDay = dayKey(other?.date || application.eventDate);
    if (!otherDay || otherDay !== candidateDay) continue;

    const otherWindows = windowsFromApplication(application, catalog);
    if (!otherWindows.length) continue;

    const overlaps = candidateWindows.some((left) =>
      otherWindows.some((right) => windowsOverlap(left, right))
    );
    if (!overlaps) continue;

    const title = other?.title || application.eventTitle;
    return {
      kind: "schedule",
      application,
      eventTitle: title,
      message: `You already applied for ${title} on ${other?.date || application.eventDate}. You cannot apply for another event at the same date and time.`,
    };
  }

  return null;
}
