import { DEPARTMENTS, LOCATIONS } from "@/lib/db/types";

export type EventWriteInput = {
  title?: unknown;
  description?: unknown;
  location?: unknown;
  department?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
  createdBy?: unknown;
};

export function validateEventWrite(body: EventWriteInput) {
  if ("createdBy" in body && body.createdBy !== undefined) {
    return "createdBy cannot be set by the client";
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description =
    typeof body.description === "string" ? body.description.trim() : "";
  const location =
    typeof body.location === "string" ? body.location.trim() : "";
  const department =
    typeof body.department === "string" ? body.department.trim() : "";
  const startsAt =
    typeof body.startsAt === "string" ? body.startsAt.trim() : "";
  const endsAt = typeof body.endsAt === "string" ? body.endsAt.trim() : "";

  if (!title) return "title is required";
  if (title.length > 120) return "title must be at most 120 characters";
  if (!description) return "description is required";
  if (description.length > 4000)
    return "description must be at most 4000 characters";
  if (!location) return "location is required";
  if (!(LOCATIONS as readonly string[]).includes(location)) {
    return "location must be a known campus";
  }
  if (!department) return "department is required";
  if (!(DEPARTMENTS as readonly string[]).includes(department)) {
    return "department must be a known department";
  }
  if (!startsAt || Number.isNaN(Date.parse(startsAt))) {
    return "startsAt must be a valid date-time";
  }
  if (!endsAt || Number.isNaN(Date.parse(endsAt))) {
    return "endsAt must be a valid date-time";
  }
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    return "endsAt must be after startsAt";
  }

  return {
    title,
    description,
    location,
    department,
    startsAt: new Date(startsAt).toISOString(),
    endsAt: new Date(endsAt).toISOString(),
  };
}

export function validateRegister(body: {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
  role?: unknown;
}) {
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "email is required";
  }
  if (password.length < 12) return "password must be at least 12 characters";
  if (password.length > 72) return "password must be at most 72 characters";
  if (!displayName) return "displayName is required";
  if (displayName.length > 80) return "displayName must be at most 80 characters";

  return { email: email.toLowerCase(), password, displayName };
}
