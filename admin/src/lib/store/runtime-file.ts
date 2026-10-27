import fs from "fs";
import path from "path";

import type { Event } from "@/data/events";
import type { AttendanceAssignment } from "@/lib/attendance";

function runtimeDir() {
  const cwd = process.cwd();
  const folder = path.basename(cwd);
  const root =
    folder === "mvp" || folder === "admin" ? path.join(cwd, "..") : cwd;
  return path.join(root, ".runtime");
}

function filePath(name: string) {
  return path.join(runtimeDir(), `${name}.json`);
}

export function readRuntime<T>(name: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath(name), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeRuntime<T>(name: string, value: T) {
  fs.mkdirSync(runtimeDir(), { recursive: true });
  fs.writeFileSync(filePath(name), JSON.stringify(value, null, 2), "utf8");
}

export function listRuntimeEvents(): Event[] {
  const items = readRuntime<Event[]>("events", []);
  return Array.isArray(items) ? items : [];
}

export function upsertRuntimeEvent(event: Event) {
  const items = listRuntimeEvents().filter((item) => item.id !== event.id);
  writeRuntime("events", [event, ...items]);
  return event;
}

export function listRuntimeAssignments(filter?: {
  username?: string;
  eventId?: string;
}): AttendanceAssignment[] {
  const items = readRuntime<AttendanceAssignment[]>("assignments", []);
  const all = Array.isArray(items) ? items : [];
  return all.filter((item) => {
    if (
      filter?.username &&
      item.volunteerUsername?.toLowerCase() !== filter.username.toLowerCase()
    ) {
      return false;
    }
    if (filter?.eventId && item.eventId !== filter.eventId) return false;
    return true;
  });
}

export function upsertRuntimeAssignment(assignment: AttendanceAssignment) {
  const items = listRuntimeAssignments();
  const next = [
    assignment,
    ...items.filter((item) => item.id !== assignment.id),
  ];
  writeRuntime("assignments", next);
  return assignment;
}

export function mergeAssignments(
  primary: AttendanceAssignment[],
  extra: AttendanceAssignment[]
) {
  const byId = new Map(primary.map((item) => [item.id, item]));
  for (const item of extra) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()];
}

export type RuntimeVolunteer = {
  id: string;
  name: string;
  studentUsername: string;
  email: string;
  phone: string;
  studentId: string;
  campus: string;
  skills: string[];
  hours: number;
  eventsAttended: number;
  noShows: number;
  reliability: number;
  status: "Active" | "Suspended";
  notes: string;
};

export function listRuntimeVolunteers(): RuntimeVolunteer[] {
  const items = readRuntime<RuntimeVolunteer[]>("volunteers", []);
  return Array.isArray(items) ? items : [];
}

export function upsertRuntimeVolunteer(volunteer: RuntimeVolunteer) {
  const items = listRuntimeVolunteers();
  const next = [
    volunteer,
    ...items.filter(
      (item) =>
        item.id !== volunteer.id &&
        item.studentUsername !== volunteer.studentUsername
    ),
  ];
  writeRuntime("volunteers", next);
  return volunteer;
}
