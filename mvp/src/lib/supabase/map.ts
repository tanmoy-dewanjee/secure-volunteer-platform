import type { Event } from "@/data/events";
import type { VolunteerApplication } from "@/lib/applications";
import type { VolunteerShiftAssignment, ShiftStatus } from "@/data/shifts";
import type { StudentProfileData } from "@/data/volunteer-progress";

export type EventRow = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  tags: string[];
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  campus: string;
  location: string;
  organisation_id: string;
  contact_email: string;
  capacity: number;
  places_available: number;
  status: Event["status"];
  requirements: string[];
  roles: Event["roles"];
  shifts: Event["shifts"];
  banner_image: string;
  poster_image: string;
  featured: boolean | null;
  trending_score: number;
  application_deadline: string;
  accessibility_notes: string;
  lat: number | null;
  lng: number | null;
  ask_resume: boolean | null;
  custom_fields: Event["customFields"];
};

export function eventToRow(event: Event): EventRow {
  return {
    id: event.id,
    title: event.title,
    tagline: event.tagline,
    category: event.category,
    tags: event.tags,
    description: event.description,
    date: event.date,
    start_time: event.startTime,
    end_time: event.endTime,
    campus: event.campus,
    location: event.location,
    organisation_id: event.organisationId,
    contact_email: event.contactEmail,
    capacity: event.capacity,
    places_available: event.placesAvailable,
    status: event.status,
    requirements: event.requirements,
    roles: event.roles,
    shifts: event.shifts,
    banner_image: event.bannerImage,
    poster_image: event.posterImage,
    featured: Boolean(event.featured),
    trending_score: event.trendingScore,
    application_deadline: event.applicationDeadline,
    accessibility_notes: event.accessibilityNotes,
    lat: typeof event.lat === "number" ? event.lat : null,
    lng: typeof event.lng === "number" ? event.lng : null,
    ask_resume: Boolean(event.askResume),
    custom_fields: event.customFields ?? [],
  };
}

export function eventFromRow(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    tagline: row.tagline ?? "",
    category: row.category,
    tags: row.tags ?? [],
    description: row.description,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    campus: row.campus,
    location: row.location ?? "",
    organisationId: row.organisation_id,
    contactEmail: row.contact_email,
    capacity: row.capacity,
    placesAvailable: row.places_available,
    status: row.status,
    requirements: row.requirements ?? [],
    roles: row.roles ?? [],
    shifts: row.shifts ?? [],
    bannerImage: row.banner_image,
    posterImage: row.poster_image,
    featured: Boolean(row.featured),
    trendingScore: row.trending_score,
    applicationDeadline: row.application_deadline,
    accessibilityNotes: row.accessibility_notes ?? "",
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    askResume: Boolean(row.ask_resume),
    customFields: row.custom_fields ?? [],
  };
}

export function applicationFromRow(row: Record<string, unknown>): VolunteerApplication {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    eventTitle: String(row.event_title),
    role: String(row.role),
    campus: String(row.campus),
    eventDate: String(row.event_date || ""),
    submittedDate: String(row.submitted_date),
    status: row.status as VolunteerApplication["status"],
    availability: String(row.availability || ""),
    preferredShifts: (row.preferred_shifts as string[]) ?? [],
    extraAnswers: (row.extra_answers as Record<string, string>) ?? {},
    motivation: String(row.motivation || ""),
  };
}

export function applicationToRow(
  username: string,
  name: string,
  application: VolunteerApplication
) {
  return {
    id: application.id,
    event_id: application.eventId,
    event_title: application.eventTitle,
    volunteer_username: username,
    volunteer_name: name,
    volunteer_id: username,
    role: application.role,
    campus: application.campus,
    event_date: application.eventDate,
    submitted_date: application.submittedDate,
    status: application.status,
    availability: application.availability ?? "",
    preferred_shifts: application.preferredShifts ?? [],
    extra_answers: application.extraAnswers ?? {},
    motivation: application.motivation ?? "",
    skills: [],
    notes: "",
    history: [
      {
        at: application.submittedDate,
        from: null,
        to: application.status,
        by: username,
      },
    ],
  };
}

export function shiftFromRow(row: Record<string, unknown>): VolunteerShiftAssignment & {
  status: ShiftStatus;
  qrToken?: string;
  volunteerUsername?: string;
} {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    eventTitle: String(row.event_title),
    clubName: String(row.club_name || ""),
    role: String(row.role),
    campus: String(row.campus),
    location: String(row.location || ""),
    date: String(row.date),
    startTime: String(row.start_time),
    endTime: String(row.end_time),
    meetingPoint: String(row.meeting_point || ""),
    notes: String(row.notes || ""),
    status: (row.status as ShiftStatus) || "Upcoming",
    qrToken: row.qr_token ? String(row.qr_token) : undefined,
    volunteerUsername: row.volunteer_username
      ? String(row.volunteer_username)
      : undefined,
  };
}

export function profileFromRow(
  row: Record<string, unknown>,
  fallback: StudentProfileData
): StudentProfileData {
  const extra = (row.profile_data as Partial<StudentProfileData>) ?? {};
  const department =
    typeof extra.department === "string" && extra.department.trim()
      ? extra.department.trim()
      : fallback.department;
  return {
    ...fallback,
    ...extra,
    fullName: String(row.display_name || fallback.fullName),
    studentId: String(row.username || fallback.studentId),
    email: String(row.email || fallback.email),
    campus: String(row.campus || fallback.campus),
    department,
    bio: String(row.bio || extra.bio || fallback.bio),
    skills: (row.skills as string[]) ?? extra.skills ?? fallback.skills,
    availability: String(row.availability || extra.availability || fallback.availability),
    emergencyContact: String(
      row.emergency_contact || extra.emergencyContact || fallback.emergencyContact
    ),
    accessibility: String(
      row.accessibility || extra.accessibility || fallback.accessibility
    ),
    hours: Number(row.hours ?? extra.hours ?? fallback.hours),
    eventsAttended: Number(
      row.events_attended ?? extra.eventsAttended ?? fallback.eventsAttended
    ),
    points: Number(row.points ?? extra.points ?? fallback.points),
  };
}
