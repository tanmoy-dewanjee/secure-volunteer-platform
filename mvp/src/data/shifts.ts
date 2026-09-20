export type ShiftStatus = "Upcoming" | "Checked in" | "Completed";

export type VolunteerShiftAssignment = {
  id: string;
  eventId: string;
  eventTitle: string;
  clubName: string;
  role: string;
  campus: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingPoint: string;
  notes: string;
};

export const seedShifts: VolunteerShiftAssignment[] = [
  {
    id: "shift-wellbeing",
    eventId: "wellbeing-expo",
    eventTitle: "Student Wellbeing Expo",
    clubName: "SMHC",
    role: "Welcome Volunteer",
    campus: "Mawson Lakes",
    location: "Mawson Lakes Campus, Building C Atrium",
    date: "18 November 2026",
    startTime: "10:00 AM",
    endTime: "3:00 PM",
    meetingPoint: "Building C foyer from 9:40 AM",
    notes: "Wear closed shoes and collect your lanyard at briefing.",
  },
  {
    id: "shift-ingenuity",
    eventId: "ingenuity-2026",
    eventTitle: "Ingenuity 2026",
    clubName: "AUES",
    role: "Registration Support",
    campus: "Adelaide City",
    location: "Adelaide Convention Centre, North Terrace",
    date: "11 November 2026",
    startTime: "9:00 AM",
    endTime: "1:00 PM",
    meetingPoint: "North Terrace registration desk",
    notes: "Coordinator briefing starts at 8:40 AM.",
  },
  {
    id: "shift-foodbank",
    eventId: "foodbank-packing",
    eventTitle: "Foodbank Packing Morning",
    clubName: "Rotaract",
    role: "Hamper Packing",
    campus: "Adelaide City",
    location: "Foodbank SA, Pooraka",
    date: "8 March 2026",
    startTime: "9:00 AM",
    endTime: "12:30 PM",
    meetingPoint: "Warehouse reception",
    notes: "This completed demo shift contributed hours and a host rating.",
  },
];

const keyFor = (username: string) => `svp_shift_status_${username}`;

export function getShiftStatuses(username: string): Record<string, ShiftStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(keyFor(username));
    return raw ? (JSON.parse(raw) as Record<string, ShiftStatus>) : {};
  } catch {
    return {};
  }
}

export function setShiftStatus(
  username: string,
  shiftId: string,
  status: ShiftStatus
) {
  const current = getShiftStatuses(username);
  const next = { ...current, [shiftId]: status };
  window.localStorage.setItem(keyFor(username), JSON.stringify(next));
  return next;
}

export function resolveShiftStatus(
  shift: VolunteerShiftAssignment,
  statuses: Record<string, ShiftStatus>
): ShiftStatus {
  if (statuses[shift.id]) return statuses[shift.id];
  const shiftTime = Date.parse(shift.date);
  if (!Number.isNaN(shiftTime) && shiftTime < Date.now() - 1000 * 60 * 60 * 24) {
    return "Completed";
  }
  return "Upcoming";
}
