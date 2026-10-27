import fs from "fs";
import path from "path";

export type SharedApplication = {
  id: string;
  eventId: string;
  eventTitle: string;
  volunteerUsername: string;
  volunteerName: string;
  volunteerId: string;
  role: string;
  campus: string;
  eventDate: string;
  submittedDate: string;
  status: string;
  availability: string;
  preferredShifts: string[];
  extraAnswers: Record<string, string>;
  motivation: string;
  skills: string[];
  notes: string;
  history: Array<{
    at: string;
    from: string | null;
    to: string;
    by: string;
  }>;
};

function storeDir() {
  const cwd = process.cwd();
  const folder = path.basename(cwd);
  const root =
    folder === "mvp" || folder === "admin" ? path.join(cwd, "..") : cwd;
  return path.join(root, ".runtime");
}

function storePath() {
  return path.join(storeDir(), "applications.json");
}

function readAll(): SharedApplication[] {
  try {
    const raw = fs.readFileSync(storePath(), "utf8");
    const parsed = JSON.parse(raw) as SharedApplication[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(applications: SharedApplication[]) {
  const dir = storeDir();
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(storePath(), JSON.stringify(applications, null, 2), "utf8");
}

export function listSharedApplications(username?: string) {
  const all = readAll();
  if (!username) return all;
  const key = username.trim().toLowerCase();
  return all.filter((item) => item.volunteerUsername.toLowerCase() === key);
}

export function upsertSharedApplication(application: SharedApplication) {
  const all = readAll();
  const index = all.findIndex((item) => item.id === application.id);
  const next =
    index >= 0
      ? all.map((item, i) => (i === index ? application : item))
      : [application, ...all];
  writeAll(next);
  return application;
}

export function updateSharedApplicationStatus(
  id: string,
  status: string,
  username?: string
) {
  const all = readAll();
  let changed: SharedApplication | null = null;
  const next = all.map((item) => {
    if (item.id !== id) return item;
    if (
      username &&
      item.volunteerUsername.toLowerCase() !== username.toLowerCase()
    ) {
      return item;
    }
    changed = {
      ...item,
      status,
      history: [
        ...item.history,
        {
          at: new Date().toLocaleString("en-AU"),
          from: item.status,
          to: status,
          by: username || "system",
        },
      ],
    };
    return changed;
  });
  if (changed) writeAll(next);
  return changed;
}

export function upsertSharedApplications(applications: SharedApplication[]) {
  const byId = new Map(readAll().map((item) => [item.id, item]));
  for (const item of applications) {
    byId.set(item.id, item);
  }
  writeAll([...byId.values()]);
}
