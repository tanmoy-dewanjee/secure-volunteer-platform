export type ShiftStatus = "Upcoming" | "Checked in" | "Completed" | "No show";

export type AttendanceAssignment = {
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
  volunteerUsername: string;
  status: ShiftStatus;
  qrToken: string;
  qrPayload: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  checkInMethod: string;
};

export function volunteerQrPayload(assignmentId: string, token: string) {
  return `SVP1.v.${assignmentId}.${token}`;
}

export function stationQrPayload(eventId: string, token: string) {
  return `SVP1.s.${eventId}.${token}`;
}

export function parseQrPayload(raw: string) {
  const value = raw.trim();
  const parts = value.split(".");
  if (parts[0] !== "SVP1" || parts.length < 4) return null;
  if (parts[1] === "v") {
    return { kind: "volunteer" as const, assignmentId: parts[2], token: parts[3] };
  }
  if (parts[1] === "s") {
    return { kind: "station" as const, eventId: parts[2], token: parts[3] };
  }
  return null;
}

export function newToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function stableToken(seed: string) {
  const data = new TextEncoder().encode(`svp-qr:${seed}`);
  let hash = 0x811c9dc5;
  for (const byte of data) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, "0");
  return `${hex}${hex}${hex}${hex}`;
}

export function assignmentFromRow(
  row: Record<string, unknown>
): AttendanceAssignment {
  const id = String(row.id);
  const token = String(row.qr_token || stableToken(String(row.id)));
  return {
    id,
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
    volunteerUsername: String(row.volunteer_username || ""),
    status: (row.status as ShiftStatus) || "Upcoming",
    qrToken: token,
    qrPayload: volunteerQrPayload(id, token),
    checkedInAt: row.checked_in_at ? String(row.checked_in_at) : null,
    checkedOutAt: row.checked_out_at ? String(row.checked_out_at) : null,
    checkInMethod: String(row.check_in_method || ""),
  };
}
