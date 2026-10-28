import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { events } from "../src/data/events";
import {
  DEMO_ADMIN_PASSWORD,
  adminAccounts,
} from "../src/lib/auth/accounts";
import { eventToRow } from "../src/lib/supabase/map";

type DemoStudent = {
  id: string;
  username: string;
  name: string;
  email: string;
  campus: string;
  phone: string;
  bio: string;
  skills: string[];
  availability: string;
  hours: number;
  eventsAttended: number;
  points: number;
};

const STUDENTS: DemoStudent[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    username: "a1991246",
    name: "Alex Nguyen",
    email: "a1991246@adelaide.edu.au",
    campus: "Adelaide City",
    phone: "0412 334 721",
    bio: "Engineering student who likes visitor-facing roles, STEM showcases and practical community builds.",
    skills: ["Welcome desk", "Crowd flow", "First aid awareness"],
    availability: "Weekday afternoons and most Saturdays.",
    hours: 24,
    eventsAttended: 6,
    points: 320,
  },
  {
    id: "11111111-1111-4111-8111-111111111112",
    username: "a1882201",
    name: "Priya Shah",
    email: "a1882201@adelaide.edu.au",
    campus: "Mawson Lakes",
    phone: "0433 891 004",
    bio: "Health student interested in welcome desks and wellbeing events.",
    skills: ["Wellbeing", "Support"],
    availability: "Weekends and Wednesday afternoons.",
    hours: 18,
    eventsAttended: 4,
    points: 210,
  },
  {
    id: "11111111-1111-4111-8111-111111111113",
    username: "a1773344",
    name: "Chris Adeyemi",
    email: "a1773344@adelaide.edu.au",
    campus: "Adelaide City",
    phone: "0408 112 993",
    bio: "Hands-on volunteer for community builds and outdoor roles.",
    skills: ["Community", "Outdoors"],
    availability: "Saturdays.",
    hours: 31,
    eventsAttended: 8,
    points: 410,
  },
  {
    id: "11111111-1111-4111-8111-111111111114",
    username: "a1664488",
    name: "Jamie Cole",
    email: "a1664488@adelaide.edu.au",
    campus: "Magill",
    phone: "0491 570 006",
    bio: "Peer mentoring interest. Reliability needs review.",
    skills: ["Mentoring"],
    availability: "Afternoons.",
    hours: 6,
    eventsAttended: 1,
    points: 40,
  },
  {
    id: "11111111-1111-4111-8111-111111111115",
    username: "a1556677",
    name: "Sam Okonkwo",
    email: "a1556677@adelaide.edu.au",
    campus: "Roseworthy",
    phone: "0422 776 310",
    bio: "Sports and welcome roles across regional campuses.",
    skills: ["Sport", "Welcome"],
    availability: "Most Saturdays.",
    hours: 12,
    eventsAttended: 3,
    points: 160,
  },
];

const ADMIN_IDS: Record<string, string> = {
  "super.admin": "22222222-2222-4222-8222-222222222221",
  "rotaract.admin": "22222222-2222-4222-8222-222222222222",
  "viewer.admin": "22222222-2222-4222-8222-222222222223",
};

function loadEnvFile(path: string) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    /* optional */
  }
}

function report(label: string, error: { message: string } | null) {
  if (error) {
    console.error(`${label}: ${error.message}`);
    return false;
  }
  console.log(label);
  return true;
}

async function findUserId(
  supabase: ReturnType<typeof createClient>,
  email: string
) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 200 });
  return data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    ?.id;
}

async function ensureUser(
  supabase: ReturnType<typeof createClient>,
  input: {
    id: string;
    email: string;
    password: string;
    username: string;
    displayName: string;
    portal: "student" | "admin";
    role: string;
  }
) {
  const existing = await findUserId(supabase, input.email);
  if (existing) return existing;
  const created = await supabase.auth.admin.createUser({
    id: input.id,
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      portal: input.portal,
      role: input.role,
      username: input.username,
      display_name: input.displayName,
    },
  });
  if (created.data.user?.id) return created.data.user.id;
  return (await findUserId(supabase, input.email)) || null;
}

async function main() {
  const root = resolve(process.cwd(), "..");
  loadEnvFile(resolve(root, "mvp/.env.local"));
  loadEnvFile(resolve(root, "admin/.env.local"));
  loadEnvFile(resolve(process.cwd(), ".env.local"));

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const eventRows = events.map(eventToRow);
  const eventsResult = await supabase.from("events").upsert(eventRows, {
    onConflict: "id",
  });
  report(`events upserted: ${eventRows.length}`, eventsResult.error);

  const userIds = new Map<string, string>();
  for (const student of STUDENTS) {
    const id = await ensureUser(supabase, {
      id: student.id,
      email: student.email,
      password: "Volunteer1!",
      username: student.username,
      displayName: student.name,
      portal: "student",
      role: "student",
    });
    if (id) userIds.set(student.username, id);
  }
  for (const account of adminAccounts) {
    const id = await ensureUser(supabase, {
      id: ADMIN_IDS[account.username],
      email: account.email,
      password: DEMO_ADMIN_PASSWORD,
      username: account.username,
      displayName: account.displayName,
      portal: "admin",
      role: account.role,
    });
    if (id) userIds.set(account.username, id);
  }
  console.log(`auth users ready: ${userIds.size}`);

  const profileRows = [
    ...STUDENTS.map((student) => ({
      id: userIds.get(student.username),
      username: student.username,
      display_name: student.name,
      email: student.email,
      portal: "student",
      role: "student",
      campus: student.campus,
      phone: student.phone,
      bio: student.bio,
      skills: student.skills,
      availability: student.availability,
      hours: student.hours,
      events_attended: student.eventsAttended,
      points: student.points,
      profile_data: {
        hours: student.hours,
        eventsAttended: student.eventsAttended,
        points: student.points,
      },
    })),
    ...adminAccounts.map((account) => ({
      id: userIds.get(account.username),
      username: account.username,
      display_name: account.displayName,
      email: account.email,
      portal: "admin",
      role: account.role,
      campus: "Adelaide City",
      phone: null,
      bio: `${account.displayName} (demo).`,
      skills: [],
      availability: null,
      hours: 0,
      events_attended: 0,
      points: 0,
      profile_data: {},
    })),
  ].filter((row) => row.id);

  const profilesResult = await supabase.from("profiles").upsert(profileRows, {
    onConflict: "id",
  });
  report(`profiles upserted: ${profileRows.length}`, profilesResult.error);

  const volunteers = [
    {
      id: "vol-alex",
      name: "Alex Nguyen",
      student_username: "a1991246",
      email: "a1991246@adelaide.edu.au",
      phone: "0412 334 721",
      student_id: "a1991246",
      campus: "Adelaide City",
      skills: ["Welcome", "STEM"],
      hours: 24,
      events_attended: 6,
      no_shows: 0,
      reliability: 98,
      status: "Active",
      notes: "",
    },
    {
      id: "vol-priya",
      name: "Priya Shah",
      student_username: "a1882201",
      email: "a1882201@adelaide.edu.au",
      phone: "0433 891 004",
      student_id: "a1882201",
      campus: "Mawson Lakes",
      skills: ["Wellbeing", "Support"],
      hours: 18,
      events_attended: 4,
      no_shows: 1,
      reliability: 86,
      status: "Active",
      notes: "Late once at Wellbeing Expo briefing.",
    },
    {
      id: "vol-chris",
      name: "Chris Adeyemi",
      student_username: "a1773344",
      email: "a1773344@adelaide.edu.au",
      phone: "0408 112 993",
      student_id: "a1773344",
      campus: "Adelaide City",
      skills: ["Community", "Outdoors"],
      hours: 31,
      events_attended: 8,
      no_shows: 0,
      reliability: 99,
      status: "Active",
      notes: "",
    },
    {
      id: "vol-jamie",
      name: "Jamie Cole",
      student_username: "a1664488",
      email: "a1664488@adelaide.edu.au",
      phone: "0491 570 006",
      student_id: "a1664488",
      campus: "Magill",
      skills: ["Mentoring"],
      hours: 6,
      events_attended: 1,
      no_shows: 2,
      reliability: 54,
      status: "Suspended",
      notes: "Two no-shows. Review before approving again.",
    },
    {
      id: "vol-sam",
      name: "Sam Okonkwo",
      student_username: "a1556677",
      email: "a1556677@adelaide.edu.au",
      phone: "0422 776 310",
      student_id: "a1556677",
      campus: "Roseworthy",
      skills: ["Sport", "Welcome"],
      hours: 12,
      events_attended: 3,
      no_shows: 0,
      reliability: 92,
      status: "Active",
      notes: "",
    },
  ];
  report(
    `volunteers upserted: ${volunteers.length}`,
    (await supabase.from("volunteer_directory").upsert(volunteers)).error
  );

  const applications = [
    {
      id: "app-1",
      event_id: "ingenuity-2026",
      event_title: "Ingenuity 2026",
      volunteer_username: "a1991246",
      volunteer_name: "Alex Nguyen",
      volunteer_id: "vol-alex",
      role: "Registration Support",
      campus: "Adelaide City",
      event_date: "11 November 2026",
      submitted_date: "10 October 2026",
      status: "Pending",
      availability: "Morning and afternoon",
      preferred_shifts: ["Morning registration (9:00 AM – 1:00 PM)"],
      extra_answers: { shirt: "M", dietary: "Vegetarian" },
      skills: ["Welcome", "STEM"],
      notes: "",
      history: [{ at: "10 Oct 2026", from: null, to: "Pending", by: "system" }],
    },
    {
      id: "app-2",
      event_id: "wellbeing-expo",
      event_title: "Student Wellbeing Expo",
      volunteer_username: "a1882201",
      volunteer_name: "Priya Shah",
      volunteer_id: "vol-priya",
      role: "Welcome Volunteer",
      campus: "Mawson Lakes",
      event_date: "18 November 2026",
      submitted_date: "7 October 2026",
      status: "Shortlisted",
      availability: "Full day",
      preferred_shifts: ["Full day (10:00 AM – 3:00 PM)"],
      extra_answers: { confidentiality: "Yes" },
      skills: ["Wellbeing"],
      notes: "Strong fit for welcome role.",
      history: [
        { at: "7 Oct 2026", from: null, to: "Pending", by: "system" },
        { at: "11 Oct 2026", from: "Pending", to: "Shortlisted", by: "rotaract.admin" },
      ],
    },
    {
      id: "app-3",
      event_id: "ewb-community-build",
      event_title: "EWB Community Build Day",
      volunteer_username: "a1773344",
      volunteer_name: "Chris Adeyemi",
      volunteer_id: "vol-chris",
      role: "Site Support",
      campus: "Mawson Lakes",
      event_date: "14 November 2026",
      submitted_date: "2 October 2026",
      status: "Approved",
      availability: "Morning",
      preferred_shifts: ["Build day (8:30 AM – 3:30 PM)"],
      extra_answers: { shoes: "Yes", experience: "Some DIY" },
      skills: ["STEM", "Hands-on"],
      notes: "",
      history: [
        { at: "2 Oct 2026", from: null, to: "Pending", by: "system" },
        { at: "8 Oct 2026", from: "Pending", to: "Approved", by: "super.admin" },
      ],
    },
    {
      id: "app-4",
      event_id: "peer-mentor",
      event_title: "Peer Mentor Welcome Day",
      volunteer_username: "a1664488",
      volunteer_name: "Jamie Cole",
      volunteer_id: "vol-jamie",
      role: "Orientation Support",
      campus: "Magill",
      event_date: "25 November 2026",
      submitted_date: "9 October 2026",
      status: "Pending",
      availability: "Afternoon",
      preferred_shifts: [],
      extra_answers: {},
      skills: ["Mentoring"],
      notes: "Reliability is low.",
      history: [{ at: "9 Oct 2026", from: null, to: "Pending", by: "system" }],
    },
    {
      id: "app-5",
      event_id: "foodbank-packing",
      event_title: "Foodbank Packing Morning",
      volunteer_username: "a1556677",
      volunteer_name: "Sam Okonkwo",
      volunteer_id: "vol-sam",
      role: "Packing Volunteer",
      campus: "Adelaide City",
      event_date: "12 October 2026",
      submitted_date: "1 October 2026",
      status: "Approved",
      availability: "Morning",
      preferred_shifts: ["Packing morning (9:00 AM – 12:30 PM)"],
      extra_answers: { seated: "Happy to stand or sit" },
      skills: ["Community"],
      notes: "",
      history: [
        { at: "1 Oct 2026", from: null, to: "Pending", by: "system" },
        { at: "3 Oct 2026", from: "Pending", to: "Approved", by: "rotaract.admin" },
      ],
    },
    {
      id: "app-6",
      event_id: "open-day-city",
      event_title: "City Campus Open Day",
      volunteer_username: "a1991246",
      volunteer_name: "Alex Nguyen",
      volunteer_id: "vol-alex",
      role: "Tour Guide",
      campus: "Adelaide City",
      event_date: "5 December 2026",
      submitted_date: "8 October 2026",
      status: "Approved",
      availability: "Morning",
      preferred_shifts: ["Morning tours"],
      extra_answers: {},
      skills: ["Welcome"],
      notes: "",
      history: [
        { at: "8 Oct 2026", from: null, to: "Pending", by: "system" },
        { at: "12 Oct 2026", from: "Pending", to: "Approved", by: "rotaract.admin" },
      ],
    },
    {
      id: "app-7",
      event_id: "harmony-week",
      event_title: "Harmony Week Festival",
      volunteer_username: "a1882201",
      volunteer_name: "Priya Shah",
      volunteer_id: "vol-priya",
      role: "Festival Welcome",
      campus: "Adelaide City",
      event_date: "17 March 2027",
      submitted_date: "11 October 2026",
      status: "Pending",
      availability: "Full day",
      preferred_shifts: [],
      extra_answers: {},
      skills: ["Wellbeing"],
      notes: "",
      history: [{ at: "11 Oct 2026", from: null, to: "Pending", by: "system" }],
    },
  ];
  report(
    `applications upserted: ${applications.length}`,
    (await supabase.from("applications").upsert(applications)).error
  );

  const shifts = [
    {
      id: "shift-wellbeing",
      event_id: "wellbeing-expo",
      event_title: "Student Wellbeing Expo",
      club_name: "SMHC",
      role: "Welcome Volunteer",
      campus: "Mawson Lakes",
      location: "Mawson Lakes Campus, Building C Atrium",
      date: "18 November 2026",
      start_time: "10:00 AM",
      end_time: "3:00 PM",
      meeting_point: "Building C foyer from 9:40 AM",
      notes: "Wear closed shoes and collect your lanyard at briefing.",
      volunteer_username: "a1882201",
      status: "Upcoming",
    },
    {
      id: "shift-ingenuity",
      event_id: "ingenuity-2026",
      event_title: "Ingenuity 2026",
      club_name: "AUES",
      role: "Registration Support",
      campus: "Adelaide City",
      location: "Adelaide Convention Centre, North Terrace",
      date: "11 November 2026",
      start_time: "9:00 AM",
      end_time: "1:00 PM",
      meeting_point: "North Terrace registration desk",
      notes: "Coordinator briefing starts at 8:40 AM.",
      volunteer_username: "a1991246",
      status: "Upcoming",
    },
    {
      id: "shift-foodbank",
      event_id: "foodbank-packing",
      event_title: "Foodbank Packing Morning",
      club_name: "Rotaract",
      role: "Hamper Packing",
      campus: "Adelaide City",
      location: "Foodbank SA, Pooraka",
      date: "8 March 2026",
      start_time: "9:00 AM",
      end_time: "12:30 PM",
      meeting_point: "Warehouse reception",
      notes: "Completed demo shift.",
      volunteer_username: "a1556677",
      status: "Completed",
    },
    {
      id: "shift-open-day",
      event_id: "open-day-city",
      event_title: "City Campus Open Day",
      club_name: "AUSA Crew",
      role: "Tour Guide",
      campus: "Adelaide City",
      location: "North Terrace Campus, Hub Central",
      date: "5 December 2026",
      start_time: "9:00 AM",
      end_time: "1:00 PM",
      meeting_point: "Hub Central information desk",
      notes: "Collect a radio at check-in.",
      volunteer_username: "a1991246",
      status: "Upcoming",
    },
  ];
  report(
    `shifts upserted: ${shifts.length}`,
    (await supabase.from("shift_assignments").upsert(shifts)).error
  );

  report(
    "announcements upserted: 3",
    (
      await supabase.from("announcements").upsert([
        {
          id: "ann-1",
          subject: "Shift reminder: Foodbank Packing Morning",
          audience: "Foodbank Packing Morning",
          at: "11 Oct 2026",
          status: "Sent",
        },
        {
          id: "ann-2",
          subject: "Ingenuity briefing pack is ready",
          audience: "Ingenuity 2026 volunteers",
          at: "12 Oct 2026",
          status: "Sent",
        },
        {
          id: "ann-3",
          subject: "Open Day tour-guide briefing",
          audience: "City Campus Open Day",
          at: "20 Nov 2026",
          status: "Scheduled",
        },
      ])
    ).error
  );

  report(
    "swaps upserted: 1",
    (
      await supabase.from("shift_swaps").upsert([
        {
          id: "swap-1",
          volunteer_name: "Priya Shah",
          shift: "Wellbeing Expo · Full day",
          kind: "Drop",
          status: "Pending",
        },
      ])
    ).error
  );

  report(
    "audit upserted: 4",
    (
      await supabase.from("audit_logs").upsert([
        {
          id: "aud-1",
          at: "12 Oct 2026 16:02",
          who: "rotaract.admin",
          action: "application.status",
          target: "Alex Nguyen",
          ip: "127.0.0.1",
          metadata: {},
        },
        {
          id: "aud-2",
          at: "12 Oct 2026 14:18",
          who: "super.admin",
          action: "event.update",
          target: "EWB Community Build Day",
          ip: "127.0.0.1",
          metadata: {},
        },
        {
          id: "aud-3",
          at: "11 Oct 2026 09:40",
          who: "rotaract.admin",
          action: "volunteer.pii_reveal",
          target: "Priya Shah",
          ip: "127.0.0.1",
          metadata: {},
        },
        {
          id: "aud-4",
          at: "13 Oct 2026 10:12",
          who: "super.admin",
          action: "event.publish",
          target: "Ingenuity 2026",
          ip: "127.0.0.1",
          metadata: {},
        },
      ])
    ).error
  );

  const { count } = await supabase
    .from("events")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);
  console.log(`events in database: ${count ?? 0}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
