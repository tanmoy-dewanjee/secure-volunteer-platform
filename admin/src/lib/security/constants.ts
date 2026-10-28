export const ADMIN_AUDIENCE = "admin-portal" as const;
export const STUDENT_AUDIENCE = "student-portal" as const;

export const ADMIN_COOKIE = "svp_admin_session";
export const ADMIN_CSRF_COOKIE = "svp_admin_csrf";

export const STUDENT_COOKIE = "svp_student_session";

export const SESSION_HOURS = 4;
export const ADMIN_IDLE_MS = SESSION_HOURS * 60 * 60 * 1000;
export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_MAX_ATTEMPTS = 5;
export const LOCKOUT_MS = 15 * 60 * 1000;

export const PUBLIC_PATHS = [
  "/login",
  "/api/admin/auth/login",
  "/api/admin/auth/mfa",
  "/api/admin/auth/logout",
];
