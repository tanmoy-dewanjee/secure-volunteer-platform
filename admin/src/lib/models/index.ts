export type IsoDateTime = string;
export type Uuid = string;

export type PortalAudience = "student-portal" | "admin-portal";

export type AdminRole = "super_admin" | "event_coordinator" | "viewer";

export type AdminUserStatus = "active" | "invited" | "suspended";

export type AdminUser = {
  id: Uuid;
  username: string;
  email: string;
  displayName: string;
  role: AdminRole;
  status: AdminUserStatus;
  mfaEnabled: boolean;
  mfaEnrolledAt: IsoDateTime | null;
  lastLoginAt: IsoDateTime | null;
  lastLoginIp: string | null;
  invitedBy: Uuid | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type VolunteerStatus = "active" | "suspended";

export type Volunteer = {
  id: Uuid;
  studentUsername: string;
  displayName: string;
  email: string;
  phoneMasked: string;
  phoneLast4: string;
  studentIdMasked: string;
  campus: string;
  skills: string[];
  tags: string[];
  status: VolunteerStatus;
  totalHours: number;
  eventsAttended: number;
  noShowCount: number;
  reliabilityScore: number;
  notes: InternalNote[];
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type EventStatus =
  | "draft"
  | "published"
  | "ongoing"
  | "completed"
  | "cancelled"
  | "archived";

export type EventVisibility = "public" | "unlisted" | "private";
export type EventLocationKind = "venue" | "online";

export type VolunteerRoleRequirement = {
  id: Uuid;
  title: string;
  description: string;
  slotsNeeded: number;
  requiredSkills: string[];
};

export type Event = {
  id: Uuid;
  title: string;
  description: string;
  category: string;
  bannerImage: string;
  locationKind: EventLocationKind;
  venue: string;
  campus: string;
  lat: number | null;
  lng: number | null;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  capacity: number;
  requiredSkills: string[];
  eligibility: string[];
  contactName: string;
  contactEmail: string;
  visibility: EventVisibility;
  status: EventStatus;
  askResume: boolean;
  createdBy: Uuid;
  publishedAt: IsoDateTime | null;
  cancelledAt: IsoDateTime | null;
  cancellationReason: string | null;
  archivedAt: IsoDateTime | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  roles: VolunteerRoleRequirement[];
};

export type ShiftStatus = "scheduled" | "in_progress" | "completed" | "cancelled";
export type ShiftFillStatus = "open" | "filling" | "full" | "overbooked";

export type Shift = {
  id: Uuid;
  eventId: Uuid;
  roleId: Uuid;
  label: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  slotsNeeded: number;
  location: string;
  supervisorName: string;
  notes: string;
  status: ShiftStatus;
  recurrenceGroupId: Uuid | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type AssignmentStatus =
  | "assigned"
  | "waitlisted"
  | "dropped"
  | "swapped"
  | "removed";

export type ShiftAssignment = {
  id: Uuid;
  shiftId: Uuid;
  eventId: Uuid;
  volunteerId: Uuid;
  status: AssignmentStatus;
  waitlistPosition: number | null;
  assignedBy: Uuid | null;
  assignedAt: IsoDateTime;
  clashWarning: boolean;
};

export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "approved"
  | "rejected"
  | "withdrawn";

export type Application = {
  id: Uuid;
  eventId: Uuid;
  roleId: Uuid;
  volunteerId: Uuid;
  status: ApplicationStatus;
  answers: Record<string, string>;
  availability: string;
  preferredShiftIds: Uuid[];
  motivation: string;
  resumeFileName: string | null;
  assignedShiftId: Uuid | null;
  rejectedReason: string | null;
  submittedAt: IsoDateTime;
  updatedAt: IsoDateTime;
  history: ApplicationStatusChange[];
};

export type ApplicationStatusChange = {
  id: Uuid;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actorId: Uuid;
  reason: string | null;
  at: IsoDateTime;
};

export type AttendanceMark =
  | "checked_in"
  | "checked_out"
  | "no_show"
  | "late"
  | "excused";

export type Attendance = {
  id: Uuid;
  shiftId: Uuid;
  assignmentId: Uuid;
  volunteerId: Uuid;
  mark: AttendanceMark;
  checkedInAt: IsoDateTime | null;
  checkedOutAt: IsoDateTime | null;
  hours: number;
  recordedBy: Uuid;
  method: "manual" | "qr";
  notes: string;
};

export type AnnouncementAudience =
  | "all_volunteers"
  | "event"
  | "shift"
  | "selected";

export type AnnouncementStatus = "draft" | "scheduled" | "sent" | "failed";

export type Announcement = {
  id: Uuid;
  subject: string;
  body: string;
  templateId: string | null;
  audience: AnnouncementAudience;
  eventId: Uuid | null;
  shiftId: Uuid | null;
  volunteerIds: Uuid[];
  status: AnnouncementStatus;
  scheduledFor: IsoDateTime | null;
  sentAt: IsoDateTime | null;
  createdBy: Uuid;
  createdAt: IsoDateTime;
};

export type AuditAction =
  | "auth.login"
  | "auth.logout"
  | "auth.mfa_enroll"
  | "auth.mfa_verify"
  | "auth.lockout"
  | "auth.force_logout"
  | "event.create"
  | "event.update"
  | "event.publish"
  | "event.cancel"
  | "event.duplicate"
  | "event.archive"
  | "shift.create"
  | "shift.update"
  | "shift.assign"
  | "shift.unassign"
  | "shift.waitlist_promote"
  | "attendance.mark"
  | "application.status"
  | "volunteer.suspend"
  | "volunteer.reactivate"
  | "volunteer.pii_reveal"
  | "announcement.send"
  | "admin.invite"
  | "admin.role_change"
  | "admin.mfa_reset"
  | "export.download";

export type AuditLogEntry = {
  id: Uuid;
  actorId: Uuid;
  actorUsername: string;
  action: AuditAction;
  entityType: string;
  entityId: Uuid | null;
  summary: string;
  metadata: Record<string, string | number | boolean | null>;
  ip: string;
  userAgent: string;
  at: IsoDateTime;
};

export type InternalNote = {
  id: Uuid;
  authorId: Uuid;
  body: string;
  createdAt: IsoDateTime;
};

export type SwapRequestStatus = "pending" | "approved" | "rejected";

export type ShiftSwapRequest = {
  id: Uuid;
  shiftId: Uuid;
  volunteerId: Uuid;
  kind: "drop" | "swap";
  targetShiftId: Uuid | null;
  reason: string;
  status: SwapRequestStatus;
  decidedBy: Uuid | null;
  createdAt: IsoDateTime;
};

export const ROLE_PERMISSIONS: Record<
  AdminRole,
  readonly (
    | "events.read"
    | "events.write"
    | "shifts.write"
    | "applications.write"
    | "volunteers.write"
    | "communications.send"
    | "reports.export"
    | "settings.manage"
    | "audit.read"
    | "pii.reveal"
  )[]
> = {
  super_admin: [
    "events.read",
    "events.write",
    "shifts.write",
    "applications.write",
    "volunteers.write",
    "communications.send",
    "reports.export",
    "settings.manage",
    "audit.read",
    "pii.reveal",
  ],
  event_coordinator: [
    "events.read",
    "events.write",
    "shifts.write",
    "applications.write",
    "volunteers.write",
    "communications.send",
    "reports.export",
    "audit.read",
    "pii.reveal",
  ],
  viewer: ["events.read", "audit.read"],
};

export function hasPermission(
  role: AdminRole,
  permission: (typeof ROLE_PERMISSIONS)[AdminRole][number]
) {
  return ROLE_PERMISSIONS[role].includes(permission);
}
