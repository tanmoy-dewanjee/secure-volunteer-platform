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

export function isOpenApplication(application: VolunteerApplication) {
  return OPEN_APPLICATION_STATUSES.includes(
    application.status as (typeof OPEN_APPLICATION_STATUSES)[number]
  );
}

function dayKey(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) {
    const date = new Date(parsed);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
  return value.trim().toLowerCase();
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
  return whole ? [whole] : [{ start: 0, end: 24 * 60 }];
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
  return [{ start: 0, end: 24 * 60 }];
}

export function findApplicationConflict(
  existing: VolunteerApplication[],
  candidate: ScheduleEvent,
  catalog: ScheduleEvent[],
  selectedShifts?: VolunteerShift[]
): ApplicationConflict | null {
  const open = existing.filter(isOpenApplication);
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

  for (const application of open) {
    const other =
      catalog.find((item) => item.id === application.eventId) ?? null;
    const otherDay = dayKey(other?.date || application.eventDate);
    if (otherDay !== candidateDay) continue;

    const otherWindows = windowsFromApplication(application, catalog);
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
