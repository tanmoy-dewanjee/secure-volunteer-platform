export type AppStatus =
  | "Pending"
  | "Shortlisted"
  | "Approved"
  | "Rejected"
  | "Withdrawn";

export type AdminApplication = {
  id: string;
  eventId: string;
  eventTitle: string;
  volunteerId: string;
  volunteerName: string;
  role: string;
  campus: string;
  status: AppStatus;
  submitted: string;
  availability: string;
  skills: string[];
  answers: Record<string, string>;
  notes: string;
  history: { at: string; from: AppStatus | null; to: AppStatus; by: string }[];
};

export type DirectoryVolunteer = {
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

export type AuditRow = {
  id: string;
  at: string;
  who: string;
  action: string;
  target: string;
  ip: string;
};

export type AnnouncementRow = {
  id: string;
  subject: string;
  audience: string;
  at: string;
  status: "Sent" | "Scheduled";
};

export type SwapRow = {
  id: string;
  volunteerName: string;
  shift: string;
  kind: "Drop" | "Swap";
  status: "Pending" | "Approved" | "Rejected";
};

const OPS_KEY = "svp_admin_ops";
export const ADMIN_OPS_EVENT = "svp-admin-ops";

const seedVolunteers: DirectoryVolunteer[] = [
  {
    id: "vol-alex",
    name: "Alex Nguyen",
    studentUsername: "a1991246",
    email: "a1991246@adelaide.edu.au",
    phone: "0412 334 721",
    studentId: "a1991246",
    campus: "Adelaide City",
    skills: ["Welcome", "STEM"],
    hours: 24,
    eventsAttended: 6,
    noShows: 0,
    reliability: 98,
    status: "Active",
    notes: "",
  },
  {
    id: "vol-priya",
    name: "Priya Shah",
    studentUsername: "a1882201",
    email: "a1882201@adelaide.edu.au",
    phone: "0433 891 004",
    studentId: "a1882201",
    campus: "Mawson Lakes",
    skills: ["Wellbeing", "Support"],
    hours: 18,
    eventsAttended: 4,
    noShows: 1,
    reliability: 86,
    status: "Active",
    notes: "Late once at Wellbeing Expo briefing.",
  },
  {
    id: "vol-chris",
    name: "Chris Adeyemi",
    studentUsername: "a1773344",
    email: "a1773344@adelaide.edu.au",
    phone: "0408 112 993",
    studentId: "a1773344",
    campus: "Adelaide City",
    skills: ["Community", "Outdoors"],
    hours: 31,
    eventsAttended: 8,
    noShows: 0,
    reliability: 99,
    status: "Active",
    notes: "",
  },
  {
    id: "vol-jamie",
    name: "Jamie Cole",
    studentUsername: "a1664488",
    email: "a1664488@adelaide.edu.au",
    phone: "0491 570 006",
    studentId: "a1664488",
    campus: "Magill",
    skills: ["Mentoring"],
    hours: 6,
    eventsAttended: 1,
    noShows: 2,
    reliability: 54,
    status: "Suspended",
    notes: "Two no-shows. Review before approving again.",
  },
  {
    id: "vol-sam",
    name: "Sam Okonkwo",
    studentUsername: "a1556677",
    email: "a1556677@adelaide.edu.au",
    phone: "0422 776 310",
    studentId: "a1556677",
    campus: "Roseworthy",
    skills: ["Sport", "Welcome"],
    hours: 12,
    eventsAttended: 3,
    noShows: 0,
    reliability: 92,
    status: "Active",
    notes: "",
  },
];

const seedApplications: AdminApplication[] = [
  {
    id: "app-1",
    eventId: "ingenuity-2026",
    eventTitle: "Ingenuity 2026",
    volunteerId: "vol-alex",
    volunteerName: "Alex Nguyen",
    role: "Registration Support",
    campus: "Adelaide City",
    status: "Pending",
    submitted: "10 October 2026",
    availability: "Morning and afternoon",
    skills: ["Welcome", "STEM"],
    answers: { shirt: "M", dietary: "Vegetarian" },
    notes: "",
    history: [{ at: "10 Oct 2026", from: null, to: "Pending", by: "system" }],
  },
  {
    id: "app-2",
    eventId: "wellbeing-expo",
    eventTitle: "Student Wellbeing Expo",
    volunteerId: "vol-priya",
    volunteerName: "Priya Shah",
    role: "Welcome Volunteer",
    campus: "Mawson Lakes",
    status: "Shortlisted",
    submitted: "7 October 2026",
    availability: "Full day",
    skills: ["Wellbeing"],
    answers: { confidentiality: "Yes" },
    notes: "Strong fit for welcome role.",
    history: [
      { at: "7 Oct 2026", from: null, to: "Pending", by: "system" },
      { at: "11 Oct 2026", from: "Pending", to: "Shortlisted", by: "rotaract.admin" },
    ],
  },
  {
    id: "app-3",
    eventId: "ewb-community-build",
    eventTitle: "EWB Community Build Day",
    volunteerId: "vol-chris",
    volunteerName: "Chris Adeyemi",
    role: "Site Support",
    campus: "Mawson Lakes",
    status: "Approved",
    submitted: "2 October 2026",
    availability: "Morning",
    skills: ["STEM", "Hands-on"],
    answers: { shoes: "Yes", experience: "Some DIY" },
    notes: "",
    history: [
      { at: "2 Oct 2026", from: null, to: "Pending", by: "system" },
      { at: "8 Oct 2026", from: "Pending", to: "Approved", by: "super.admin" },
    ],
  },
  {
    id: "app-4",
    eventId: "peer-mentor",
    eventTitle: "Peer Mentor Welcome Day",
    volunteerId: "vol-jamie",
    volunteerName: "Jamie Cole",
    role: "Orientation Support",
    campus: "Magill",
    status: "Pending",
    submitted: "9 October 2026",
    availability: "Afternoon",
    skills: ["Mentoring"],
    answers: {},
    notes: "Reliability is low.",
    history: [{ at: "9 Oct 2026", from: null, to: "Pending", by: "system" }],
  },
  {
    id: "app-5",
    eventId: "foodbank-packing",
    eventTitle: "Foodbank Packing Morning",
    volunteerId: "vol-sam",
    volunteerName: "Sam Okonkwo",
    role: "Packing Volunteer",
    campus: "Adelaide City",
    status: "Approved",
    submitted: "1 October 2026",
    availability: "Morning",
    skills: ["Community"],
    answers: { seated: "Happy to stand or sit" },
    notes: "",
    history: [
      { at: "1 Oct 2026", from: null, to: "Pending", by: "system" },
      { at: "3 Oct 2026", from: "Pending", to: "Approved", by: "rotaract.admin" },
    ],
  },
];

const seedAudit: AuditRow[] = [
  {
    id: "aud-1",
    at: "12 Oct 2026 16:02",
    who: "rotaract.admin",
    action: "application.status",
    target: "Alex Nguyen",
    ip: "127.0.0.1",
  },
  {
    id: "aud-2",
    at: "12 Oct 2026 14:18",
    who: "super.admin",
    action: "event.update",
    target: "EWB Community Build Day",
    ip: "127.0.0.1",
  },
  {
    id: "aud-3",
    at: "11 Oct 2026 09:40",
    who: "rotaract.admin",
    action: "volunteer.pii_reveal",
    target: "Priya Shah",
    ip: "127.0.0.1",
  },
];

const seedAnnouncements: AnnouncementRow[] = [
  {
    id: "ann-1",
    subject: "Shift reminder: Foodbank Packing Morning",
    audience: "Foodbank Packing Morning",
    at: "11 Oct 2026",
    status: "Sent",
  },
];

const seedSwaps: SwapRow[] = [
  {
    id: "swap-1",
    volunteerName: "Priya Shah",
    shift: "Wellbeing Expo · Full day",
    kind: "Drop",
    status: "Pending",
  },
];

export type OpsState = {
  applications: AdminApplication[];
  volunteers: DirectoryVolunteer[];
  audit: AuditRow[];
  announcements: AnnouncementRow[];
  swaps: SwapRow[];
};

const emptyOps = (): OpsState => ({
  applications: seedApplications,
  volunteers: seedVolunteers,
  audit: seedAudit,
  announcements: seedAnnouncements,
  swaps: seedSwaps,
});

function readOps(): OpsState {
  if (typeof window === "undefined") return emptyOps();
  try {
    const raw = window.localStorage.getItem(OPS_KEY);
    if (!raw) return emptyOps();
    return { ...emptyOps(), ...(JSON.parse(raw) as OpsState) };
  } catch {
    return emptyOps();
  }
}

function writeOps(next: OpsState) {
  window.localStorage.setItem(OPS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ADMIN_OPS_EVENT));
}

export function getOps() {
  return readOps();
}

export function hydrateOps(next: OpsState) {
  writeOps(next);
}

export function setOps(next: OpsState) {
  writeOps(next);
  if (typeof window !== "undefined") {
    void fetch("/api/admin/ops", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    }).catch(() => undefined);
  }
}

export function appendAudit(row: Omit<AuditRow, "id">) {
  const ops = readOps();
  setOps({
    ...ops,
    audit: [{ ...row, id: `aud-${Date.now()}` }, ...ops.audit],
  });
}
