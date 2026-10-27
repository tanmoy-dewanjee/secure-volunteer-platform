import type { Event, VolunteerShift } from "@/data/events";
import {
  findApplicationConflict,
  type ApplicationConflict,
} from "@/lib/application-conflicts";

export type ApplicationStatus =
  | "Pending"
  | "Shortlisted"
  | "Approved"
  | "Rejected"
  | "Withdrawn";

export type VolunteerApplication = {
  id: string;
  eventId: string;
  eventTitle: string;
  role: string;
  campus: string;
  eventDate: string;
  submittedDate: string;
  status: ApplicationStatus;
  availability?: string;
  preferredShifts?: string[];
  extraAnswers?: Record<string, string>;
  motivation?: string;
};

export const seedApplications: VolunteerApplication[] = [
  {
    id: "app-ingenuity",
    eventId: "ingenuity-2026",
    eventTitle: "Ingenuity 2026",
    role: "Registration Support",
    campus: "Adelaide City",
    eventDate: "11 November 2026",
    submittedDate: "13 September 2026",
    status: "Pending",
  },
  {
    id: "app-wellbeing",
    eventId: "wellbeing-expo",
    eventTitle: "Student Wellbeing Expo",
    role: "Welcome Volunteer",
    campus: "Mawson Lakes",
    eventDate: "18 November 2026",
    submittedDate: "10 September 2026",
    status: "Approved",
  },
  {
    id: "app-peer",
    eventId: "peer-mentor",
    eventTitle: "Peer Mentor Welcome Day",
    role: "Orientation Support",
    campus: "Magill",
    eventDate: "25 November 2026",
    submittedDate: "5 September 2026",
    status: "Rejected",
  },
];

const keyFor = (username: string) => `svp_applications_${username}`;

function isApplication(value: unknown): value is VolunteerApplication {
  if (!value || typeof value !== "object") return false;
  const item = value as VolunteerApplication;
  return Boolean(item.id && item.eventId && item.status);
}

export function getApplications(username: string): VolunteerApplication[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(keyFor(username));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isApplication) : [];
  } catch {
    return [];
  }
}

export function saveApplications(
  username: string,
  applications: VolunteerApplication[]
) {
  window.localStorage.setItem(keyFor(username), JSON.stringify(applications));
}

export function mergeApplications(
  remote: VolunteerApplication[],
  local: VolunteerApplication[]
) {
  const byId = new Map<string, VolunteerApplication>();
  for (const item of remote) byId.set(item.id, item);
  for (const item of local) {
    if (!byId.has(item.id)) byId.set(item.id, item);
  }
  return [...byId.values()].sort((a, b) => {
    if (a.submittedDate === b.submittedDate) return a.id > b.id ? -1 : 1;
    return a.submittedDate > b.submittedDate ? -1 : 1;
  });
}

export function addApplication(
  username: string,
  application: Omit<VolunteerApplication, "id" | "submittedDate" | "status">,
  catalog: Event[] = [],
  selectedShifts?: VolunteerShift[]
) {
  const current = getApplications(username);
  const candidate = catalog.find((item) => item.id === application.eventId) ?? {
    id: application.eventId,
    title: application.eventTitle,
    date: application.eventDate,
    startTime: "12:00 AM",
    endTime: "11:59 PM",
    shifts: [],
  };
  const conflict = findApplicationConflict(
    current,
    candidate,
    catalog,
    selectedShifts
  );

  if (conflict) {
    return { application: conflict.application, created: false, conflict };
  }

  const next: VolunteerApplication = {
    ...application,
    id: `app-${Date.now()}`,
    submittedDate: new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    status: "Pending",
  };

  saveApplications(username, [next, ...current]);
  return { application: next, created: true as const, conflict: null };
}

export function withdrawApplication(username: string, id: string) {
  const next = getApplications(username).map((application) =>
    application.id === id && application.status === "Pending"
      ? { ...application, status: "Withdrawn" as const }
      : application
  );
  saveApplications(username, next);
  return next;
}

export async function fetchApplications(username: string) {
  const local = getApplications(username);
  try {
    const response = await fetch(
      `/api/applications?username=${encodeURIComponent(username)}`,
      { credentials: "include", cache: "no-store" }
    );
    if (response.ok) {
      const payload = (await response.json()) as {
        applications?: VolunteerApplication[];
      };
      const remote = Array.isArray(payload.applications)
        ? payload.applications.filter(isApplication)
        : [];
      const merged = mergeApplications(remote, local);
      saveApplications(username, merged);
      return merged;
    }
  } catch {
    // Local cache remains the fallback.
  }
  return local;
}

export async function persistApplication(
  username: string,
  name: string,
  application: Omit<VolunteerApplication, "id" | "submittedDate" | "status">,
  catalog: Event[] = [],
  selectedShifts?: VolunteerShift[]
) {
  const result = addApplication(username, application, catalog, selectedShifts);
  if (!result.created) {
    return result;
  }
  try {
    const response = await fetch("/api/applications", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        name,
        application: result.application,
        selectedShiftIds: selectedShifts?.map((shift) => shift.id) ?? [],
      }),
    });
    const payload = (await response.json()) as {
      created?: boolean;
      application?: VolunteerApplication;
      conflict?: ApplicationConflict;
      error?: string;
    };
    if (response.status === 409 || payload.conflict) {
      saveApplications(
        username,
        getApplications(username).filter((item) => item.id !== result.application.id)
      );
      return {
        application: payload.conflict?.application ?? result.application,
        created: false,
        conflict: payload.conflict ?? result.conflict,
      };
    }
    if (response.ok && payload.application && isApplication(payload.application)) {
      const current = getApplications(username).filter(
        (item) =>
          item.id !== result.application.id &&
          item.id !== payload.application?.id
      );
      saveApplications(username, [payload.application, ...current]);
      return {
        application: payload.application,
        created: payload.created !== false && result.created,
        conflict: null,
      };
    }
  } catch {
    // Already stored locally.
  }
  return result;
}

export async function persistWithdraw(username: string, id: string) {
  const next = withdrawApplication(username, id);
  try {
    await fetch(`/api/applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, status: "Withdrawn" }),
    });
  } catch {
    // Already stored locally.
  }
  return next;
}
