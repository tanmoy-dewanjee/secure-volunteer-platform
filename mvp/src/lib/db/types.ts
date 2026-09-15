export type Role = "admin" | "student";

export type UserRecord = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

export type EventRecord = {
  id: string;
  title: string;
  description: string;
  location: string;
  department: string;
  startsAt: string;
  endsAt: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type AuditRecord = {
  id: string;
  actorId: string;
  action: "event.create" | "event.update" | "event.delete";
  entityType: "event";
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  displayName: string;
  role: Role;
};

export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  department: string;
  startsAt: string;
  endsAt: string;
  createdBy: string;
};

export const LOCATIONS = [
  "Adelaide City",
  "Mawson Lakes",
  "Magill",
  "Waite",
] as const;

export const DEPARTMENTS = [
  "Student Life",
  "Libraries",
  "Engineering",
  "Medicine",
  "Business",
] as const;
