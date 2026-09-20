export type ApplicationStatus =
  | "Pending"
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

export function getApplications(username: string): VolunteerApplication[] {
  if (typeof window === "undefined") return seedApplications;

  try {
    const raw = window.localStorage.getItem(keyFor(username));
    if (!raw) return seedApplications;
    const parsed = JSON.parse(raw) as VolunteerApplication[];
    return Array.isArray(parsed) ? parsed : seedApplications;
  } catch {
    return seedApplications;
  }
}

export function saveApplications(
  username: string,
  applications: VolunteerApplication[]
) {
  window.localStorage.setItem(keyFor(username), JSON.stringify(applications));
}

export function addApplication(
  username: string,
  application: Omit<VolunteerApplication, "id" | "submittedDate" | "status">
) {
  const current = getApplications(username);
  const duplicate = current.find(
    (item) =>
      item.eventId === application.eventId &&
      item.status !== "Withdrawn" &&
      item.status !== "Rejected"
  );

  if (duplicate) {
    return { application: duplicate, created: false };
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
  return { application: next, created: true };
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
