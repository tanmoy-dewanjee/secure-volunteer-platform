import type { AdminRole } from "@/lib/models";

export const DEMO_ADMIN_PASSWORD = "Coordinator1!";

export const STUDENT_ID_PATTERN = /^a\d{7}$/i;

export type AdminAccount = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: AdminRole;
};

export const adminAccounts: AdminAccount[] = [
  {
    id: "admin-super",
    username: "super.admin",
    displayName: "Maya Chen",
    email: "super.admin@clubs.example.edu.au",
    role: "super_admin",
  },
  {
    id: "admin-rotaract",
    username: "rotaract.admin",
    displayName: "Jordan Blake",
    email: "rotaract.admin@clubs.example.edu.au",
    role: "event_coordinator",
  },
  {
    id: "admin-viewer",
    username: "viewer.admin",
    displayName: "Sam Okonkwo",
    email: "viewer.admin@clubs.example.edu.au",
    role: "viewer",
  },
];

export function findAdminAccount(username: string) {
  const key = username.trim().toLowerCase();
  return adminAccounts.find((account) => account.username === key) ?? null;
}

export function isStudentUsername(username: string) {
  return STUDENT_ID_PATTERN.test(username.trim());
}
