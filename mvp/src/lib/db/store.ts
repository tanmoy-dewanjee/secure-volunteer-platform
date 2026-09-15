import { randomUUID } from "crypto";

import { hashPassword } from "@/lib/db/password";
import type {
  AuditRecord,
  EventRecord,
  PublicEvent,
  UserRecord,
} from "@/lib/db/types";

type Store = {
  users: UserRecord[];
  events: EventRecord[];
  auditLogs: AuditRecord[];
};

const globalForStore = globalThis as unknown as { __svpStore?: Store };

function now() {
  return new Date().toISOString();
}

function seed(): Store {
  const adminId = "11111111-1111-4111-8111-111111111111";
  const studentId = "22222222-2222-4222-8222-222222222222";
  const stamped = now();

  const users: UserRecord[] = [
    {
      id: adminId,
      email: "admin@demo.local",
      displayName: "Demo Admin",
      role: "admin",
      passwordHash: hashPassword("AdminPass1234"),
      createdAt: stamped,
      updatedAt: stamped,
    },
    {
      id: studentId,
      email: "student@demo.local",
      displayName: "Demo Student",
      role: "student",
      passwordHash: hashPassword("StudentPass1234"),
      createdAt: stamped,
      updatedAt: stamped,
    },
  ];

  const events: EventRecord[] = [
    {
      id: "33333333-3333-4333-8333-333333333301",
      title: "Open Day wayfinding",
      description:
        "Help visitors find buildings and facilities during Open Day on Adelaide City campus.",
      location: "Adelaide City",
      department: "Student Life",
      startsAt: "2026-10-12T09:00:00.000Z",
      endsAt: "2026-10-12T15:00:00.000Z",
      createdBy: adminId,
      createdAt: stamped,
      updatedAt: stamped,
      deletedAt: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333302",
      title: "Library welcome desk",
      description:
        "Staff the welcome desk at Mawson Lakes library and answer basic questions.",
      location: "Mawson Lakes",
      department: "Libraries",
      startsAt: "2026-10-14T10:00:00.000Z",
      endsAt: "2026-10-14T14:00:00.000Z",
      createdBy: adminId,
      createdAt: stamped,
      updatedAt: stamped,
      deletedAt: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333303",
      title: "Student Life campus tour",
      description:
        "Lead short campus tours for new students around Adelaide City.",
      location: "Adelaide City",
      department: "Student Life",
      startsAt: "2026-10-16T11:00:00.000Z",
      endsAt: "2026-10-16T13:00:00.000Z",
      createdBy: adminId,
      createdAt: stamped,
      updatedAt: stamped,
      deletedAt: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333304",
      title: "Open Day information booth",
      description:
        "Answer questions at the Open Day information booth near the main lawn.",
      location: "Magill",
      department: "Student Life",
      startsAt: "2026-10-12T09:30:00.000Z",
      endsAt: "2026-10-12T12:30:00.000Z",
      createdBy: adminId,
      createdAt: stamped,
      updatedAt: stamped,
      deletedAt: null,
    },
    {
      id: "33333333-3333-4333-8333-333333333305",
      title: "Engineering lab helpers",
      description:
        "Support lab demonstrations for visiting Year 12 students at Mawson Lakes.",
      location: "Mawson Lakes",
      department: "Engineering",
      startsAt: "2026-10-20T13:00:00.000Z",
      endsAt: "2026-10-20T16:00:00.000Z",
      createdBy: adminId,
      createdAt: stamped,
      updatedAt: stamped,
      deletedAt: null,
    },
  ];

  return { users, events, auditLogs: [] };
}

function getStore(): Store {
  if (!globalForStore.__svpStore) {
    globalForStore.__svpStore = seed();
  }
  return globalForStore.__svpStore;
}

/** Reset store — used by unit tests only. */
export function resetStore() {
  globalForStore.__svpStore = seed();
}

export function toPublicEvent(event: EventRecord): PublicEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    department: event.department,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    createdBy: event.createdBy,
  };
}

export function getUserByEmail(email: string) {
  return getStore().users.find(
    (user) => user.email.toLowerCase() === email.toLowerCase()
  );
}

export function getUserById(id: string) {
  return getStore().users.find((user) => user.id === id);
}

export function createUser(input: {
  email: string;
  displayName: string;
  passwordHash: string;
  role?: UserRecord["role"];
}) {
  const stamped = now();
  const user: UserRecord = {
    id: randomUUID(),
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    role: input.role ?? "student",
    passwordHash: input.passwordHash,
    createdAt: stamped,
    updatedAt: stamped,
  };
  getStore().users.push(user);
  return user;
}

export function listEvents(filters?: {
  q?: string;
  location?: string;
  department?: string;
}) {
  let rows = getStore().events.filter((event) => event.deletedAt === null);
  if (filters?.location) {
    rows = rows.filter((event) => event.location === filters.location);
  }
  if (filters?.department) {
    rows = rows.filter((event) => event.department === filters.department);
  }
  if (filters?.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    rows = rows.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q)
    );
  }
  return rows.map(toPublicEvent);
}

export function getEventById(id: string, includeDeleted = false) {
  const event = getStore().events.find((row) => row.id === id);
  if (!event) return null;
  if (!includeDeleted && event.deletedAt) return null;
  return event;
}

export function createEvent(
  input: Omit<
    EventRecord,
    "id" | "createdAt" | "updatedAt" | "deletedAt"
  >
) {
  const stamped = now();
  const event: EventRecord = {
    ...input,
    id: randomUUID(),
    createdAt: stamped,
    updatedAt: stamped,
    deletedAt: null,
  };
  getStore().events.push(event);
  return event;
}

export function updateEvent(
  id: string,
  patch: Partial<
    Pick<
      EventRecord,
      | "title"
      | "description"
      | "location"
      | "department"
      | "startsAt"
      | "endsAt"
    >
  >
) {
  const event = getEventById(id);
  if (!event) return null;
  Object.assign(event, patch, { updatedAt: now() });
  return event;
}

export function softDeleteEvent(id: string) {
  const event = getEventById(id);
  if (!event) return null;
  event.deletedAt = now();
  event.updatedAt = event.deletedAt;
  return event;
}

export function writeAudit(input: Omit<AuditRecord, "id" | "createdAt">) {
  const row: AuditRecord = {
    ...input,
    id: randomUUID(),
    createdAt: now(),
  };
  getStore().auditLogs.push(row);
  return row;
}

export function listAudit(entityId?: string) {
  const rows = getStore().auditLogs;
  if (!entityId) return [...rows].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows
    .filter((row) => row.entityId === entityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function recommendationsFor(eventId: string) {
  const opened = getEventById(eventId);
  if (!opened) return null;

  const others = getStore().events.filter(
    (event) => event.deletedAt === null && event.id !== opened.id
  );

  const byLocation = others
    .filter((event) => event.location === opened.location)
    .slice(0, 3)
    .map(toPublicEvent);

  const used = new Set(byLocation.map((event) => event.id));

  const byDepartment = others
    .filter(
      (event) =>
        event.department === opened.department && !used.has(event.id)
    )
    .slice(0, 3)
    .map(toPublicEvent);

  byDepartment.forEach((event) => used.add(event.id));

  const tokens = opened.title
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3);

  const bySimilarity = others
    .filter((event) => !used.has(event.id))
    .map((event) => {
      const hay = event.title.toLowerCase();
      const score = tokens.reduce(
        (sum, token) => sum + (hay.includes(token) ? 1 : 0),
        0
      );
      return { event, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((row) => toPublicEvent(row.event));

  return {
    eventId: opened.id,
    byLocation,
    byDepartment,
    bySimilarity,
  };
}
