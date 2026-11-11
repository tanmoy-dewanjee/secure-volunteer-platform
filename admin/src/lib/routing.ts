export const adminRoutes = {
  login: "/login",
  dashboard: "/",
  profile: "/profile",
  events: "/events",
  eventNew: "/events/new",
  event: (id: string) => `/events/${id}`,
  eventTab: (id: string, tab: EventTab) => `/events/${id}/${tab}`,
  volunteers: "/volunteers",
  volunteer: (id: string) => `/volunteers/${id}`,
  applications: "/applications",
  communications: "/communications",
  reports: "/reports",
  settings: "/settings",
  audit: "/settings/audit",
} as const;

export type EventTab =
  | "overview"
  | "shifts"
  | "volunteers"
  | "applications"
  | "attendance"
  | "announcements"
  | "reports";

export const eventTabs: { id: EventTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "shifts", label: "Shifts" },
  { id: "volunteers", label: "Volunteers" },
  { id: "applications", label: "Applications" },
  { id: "attendance", label: "Attendance" },
  { id: "announcements", label: "Announcements" },
  { id: "reports", label: "Reports" },
];

export const sidebarNav = [
  { href: "/", label: "Dashboard" },
  { href: "/profile", label: "Profile" },
  { href: "/events", label: "Events" },
  { href: "/applications", label: "Applications" },
  { href: "/volunteers", label: "Volunteers" },
  { href: "/communications", label: "Communications" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings", role: "super_admin" as const },
  { href: "/settings/audit", label: "Audit log" },
];

const knownAdminPrefixes = [
  "/",
  "/profile",
  "/events",
  "/applications",
  "/volunteers",
  "/communications",
  "/reports",
  "/settings",
] as const;

export function safeAdminNext(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/";
  }
  const path = next.split("?")[0] ?? next;
  if (
    knownAdminPrefixes.some(
      (prefix) => path === prefix || (prefix !== "/" && path.startsWith(`${prefix}/`))
    )
  ) {
    return next;
  }
  return "/";
}
