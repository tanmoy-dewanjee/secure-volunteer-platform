import type { Event } from "@/data/events";
import type {
  AdminApplication,
  AnnouncementRow,
  AuditRow,
  DirectoryVolunteer,
  SwapRow,
} from "@/lib/store/ops";

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

export function applicationToRow(item: AdminApplication) {
  return {
    id: item.id,
    event_id: item.eventId,
    event_title: item.eventTitle,
    volunteer_username: item.volunteerId,
    volunteer_name: item.volunteerName,
    volunteer_id: item.volunteerId,
    role: item.role,
    campus: item.campus,
    submitted_date: item.submitted,
    status: item.status,
    availability: item.availability,
    extra_answers: item.answers,
    skills: item.skills,
    notes: item.notes,
    history: item.history,
    preferred_shifts: [],
  };
}

export function applicationFromRow(row: Record<string, unknown>): AdminApplication {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    eventTitle: String(row.event_title),
    volunteerId: String(row.volunteer_id || row.volunteer_username),
    volunteerName: String(row.volunteer_name),
    role: String(row.role),
    campus: String(row.campus),
    status: row.status as AdminApplication["status"],
    submitted: String(row.submitted_date),
    availability: String(row.availability || ""),
    skills: (row.skills as string[]) ?? [],
    answers: (row.extra_answers as Record<string, string>) ?? {},
    notes: String(row.notes || ""),
    history: (row.history as AdminApplication["history"]) ?? [],
  };
}

export function volunteerToRow(item: DirectoryVolunteer) {
  return {
    id: item.id,
    name: item.name,
    student_username: item.studentUsername,
    email: item.email,
    phone: item.phone,
    student_id: item.studentId,
    campus: item.campus,
    skills: item.skills,
    hours: item.hours,
    events_attended: item.eventsAttended,
    no_shows: item.noShows,
    reliability: item.reliability,
    status: item.status,
    notes: item.notes,
  };
}

export function volunteerFromRow(row: Record<string, unknown>): DirectoryVolunteer {
  return {
    id: String(row.id),
    name: String(row.name),
    studentUsername: String(row.student_username),
    email: String(row.email),
    phone: String(row.phone || ""),
    studentId: String(row.student_id),
    campus: String(row.campus),
    skills: (row.skills as string[]) ?? [],
    hours: Number(row.hours || 0),
    eventsAttended: Number(row.events_attended || 0),
    noShows: Number(row.no_shows || 0),
    reliability: Number(row.reliability || 0),
    status: (row.status as DirectoryVolunteer["status"]) || "Active",
    notes: String(row.notes || ""),
  };
}

export function auditToRow(item: AuditRow) {
  return {
    id: item.id,
    at: item.at,
    who: item.who,
    action: item.action,
    target: item.target,
    ip: item.ip,
  };
}

export function auditFromRow(row: Record<string, unknown>): AuditRow {
  return {
    id: String(row.id),
    at: String(row.at),
    who: String(row.who),
    action: String(row.action),
    target: String(row.target),
    ip: String(row.ip || ""),
  };
}

export function announcementToRow(item: AnnouncementRow) {
  return {
    id: item.id,
    subject: item.subject,
    audience: item.audience,
    at: item.at,
    status: item.status,
  };
}

export function announcementFromRow(row: Record<string, unknown>): AnnouncementRow {
  return {
    id: String(row.id),
    subject: String(row.subject),
    audience: String(row.audience),
    at: String(row.at),
    status: row.status as AnnouncementRow["status"],
  };
}

export function swapToRow(item: SwapRow) {
  return {
    id: item.id,
    volunteer_name: item.volunteerName,
    shift: item.shift,
    kind: item.kind,
    status: item.status,
  };
}

export function swapFromRow(row: Record<string, unknown>): SwapRow {
  return {
    id: String(row.id),
    volunteerName: String(row.volunteer_name),
    shift: String(row.shift),
    kind: row.kind as SwapRow["kind"],
    status: row.status as SwapRow["status"],
  };
}
