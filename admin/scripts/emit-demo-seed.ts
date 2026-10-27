import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { events, type Event } from "../src/data/events";

const here = dirname(fileURLToPath(import.meta.url));

function sqlStr(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlJson(value: unknown) {
  return `${sqlStr(JSON.stringify(value))}::jsonb`;
}

function sqlTextArray(values: string[]) {
  if (values.length === 0) return `'{}'::text[]`;
  return `ARRAY[${values.map(sqlStr).join(", ")}]::text[]`;
}

function sqlNum(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "null";
}

function eventRow(event: Event) {
  return `(
    ${sqlStr(event.id)},
    ${sqlStr(event.title)},
    ${sqlStr(event.tagline)},
    ${sqlStr(event.category)},
    ${sqlTextArray(event.tags)},
    ${sqlStr(event.description)},
    ${sqlStr(event.date)},
    ${sqlStr(event.startTime)},
    ${sqlStr(event.endTime)},
    ${sqlStr(event.campus)},
    ${sqlStr(event.location)},
    ${sqlStr(event.organisationId)},
    ${sqlStr(event.contactEmail)},
    ${event.capacity},
    ${event.placesAvailable},
    ${sqlStr(event.status)},
    ${sqlTextArray(event.requirements)},
    ${sqlJson(event.roles)},
    ${sqlJson(event.shifts)},
    ${sqlStr(event.bannerImage)},
    ${sqlStr(event.posterImage)},
    ${event.featured ? "true" : "false"},
    ${event.trendingScore},
    ${sqlStr(event.applicationDeadline)},
    ${sqlStr(event.accessibilityNotes)},
    ${sqlNum(event.lat)},
    ${sqlNum(event.lng)},
    ${event.askResume ? "true" : "false"},
    ${sqlJson(event.customFields ?? [])}
  )`;
}

const eventInserts = events.map(eventRow).join(",\n");

const sql = `-- Demo catalogue: accounts, events, applications, volunteers, shifts and audit.
-- Safe to re-run. Apply after 0001_init.sql in the Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.seed_demo_auth_user(
  p_id uuid,
  p_email text,
  p_password text,
  p_meta jsonb
) returns void
language plpgsql
security definer
set search_path = auth, public, extensions
as $$
begin
  if exists (select 1 from auth.users where id = p_id or email = p_email) then
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    p_meta,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_email,
    now(),
    now(),
    now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Demo auth accounts (passwords below are for the educational prototype only)
-- Students: Volunteer1!    Admins: Coordinator1!
-- ---------------------------------------------------------------------------
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111111',
  'a1991246@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1991246","display_name":"Alex Nguyen"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111112',
  'a1882201@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1882201","display_name":"Priya Shah"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111113',
  'a1773344@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1773344","display_name":"Chris Adeyemi"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111114',
  'a1664488@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1664488","display_name":"Jamie Cole"}'::jsonb
);
select public.seed_demo_auth_user(
  '11111111-1111-4111-8111-111111111115',
  'a1556677@adelaide.edu.au',
  'Volunteer1!',
  '{"portal":"student","role":"student","username":"a1556677","display_name":"Sam Okonkwo"}'::jsonb
);
select public.seed_demo_auth_user(
  '22222222-2222-4222-8222-222222222221',
  'super.admin@clubs.example.edu.au',
  'Coordinator1!',
  '{"portal":"admin","role":"super_admin","username":"super.admin","display_name":"Maya Chen"}'::jsonb
);
select public.seed_demo_auth_user(
  '22222222-2222-4222-8222-222222222222',
  'rotaract.admin@clubs.example.edu.au',
  'Coordinator1!',
  '{"portal":"admin","role":"event_coordinator","username":"rotaract.admin","display_name":"Jordan Blake"}'::jsonb
);
select public.seed_demo_auth_user(
  '22222222-2222-4222-8222-222222222223',
  'viewer.admin@clubs.example.edu.au',
  'Coordinator1!',
  '{"portal":"admin","role":"viewer","username":"viewer.admin","display_name":"Sam Okonkwo"}'::jsonb
);

insert into public.profiles (
  id, username, display_name, email, portal, role, campus, phone, bio, skills,
  availability, hours, events_attended, points, profile_data
) values
  (
    '11111111-1111-4111-8111-111111111111',
    'a1991246', 'Alex Nguyen', 'a1991246@adelaide.edu.au', 'student', 'student',
    'Adelaide City', '0412 334 721',
    'Engineering student who likes visitor-facing roles, STEM showcases and practical community builds.',
    ARRAY['Welcome desk','Crowd flow','First aid awareness']::text[],
    'Weekday afternoons and most Saturdays.', 24, 6, 320,
    '{"hours":24,"eventsAttended":6,"points":320}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111112',
    'a1882201', 'Priya Shah', 'a1882201@adelaide.edu.au', 'student', 'student',
    'Mawson Lakes', '0433 891 004',
    'Health student interested in welcome desks and wellbeing events.',
    ARRAY['Wellbeing','Support']::text[],
    'Weekends and Wednesday afternoons.', 18, 4, 210,
    '{}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111113',
    'a1773344', 'Chris Adeyemi', 'a1773344@adelaide.edu.au', 'student', 'student',
    'Adelaide City', '0408 112 993',
    'Hands-on volunteer for community builds and outdoor roles.',
    ARRAY['Community','Outdoors']::text[],
    'Saturdays.', 31, 8, 410,
    '{}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111114',
    'a1664488', 'Jamie Cole', 'a1664488@adelaide.edu.au', 'student', 'student',
    'Magill', '0491 570 006',
    'Peer mentoring interest. Reliability needs review.',
    ARRAY['Mentoring']::text[],
    'Afternoons.', 6, 1, 40,
    '{}'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111115',
    'a1556677', 'Sam Okonkwo', 'a1556677@adelaide.edu.au', 'student', 'student',
    'Roseworthy', '0422 776 310',
    'Sports and welcome roles across regional campuses.',
    ARRAY['Sport','Welcome']::text[],
    'Most Saturdays.', 12, 3, 160,
    '{}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222221',
    'super.admin', 'Maya Chen', 'super.admin@clubs.example.edu.au', 'admin', 'super_admin',
    'Adelaide City', null, 'University clubs office super admin (demo).',
    '{}'::text[], null, 0, 0, 0, '{}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'rotaract.admin', 'Jordan Blake', 'rotaract.admin@clubs.example.edu.au', 'admin', 'event_coordinator',
    'Adelaide City', null, 'Rotaract event coordinator (demo).',
    '{}'::text[], null, 0, 0, 0, '{}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222223',
    'viewer.admin', 'Sam Okonkwo', 'viewer.admin@clubs.example.edu.au', 'admin', 'viewer',
    'Adelaide City', null, 'Read-only coordinator (demo).',
    '{}'::text[], null, 0, 0, 0, '{}'::jsonb
  )
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  email = excluded.email,
  portal = excluded.portal,
  role = excluded.role,
  campus = excluded.campus,
  phone = excluded.phone,
  bio = excluded.bio,
  skills = excluded.skills,
  availability = excluded.availability,
  hours = excluded.hours,
  events_attended = excluded.events_attended,
  points = excluded.points,
  profile_data = excluded.profile_data,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Events from the student/admin catalogue
-- ---------------------------------------------------------------------------
insert into public.events (
  id, title, tagline, category, tags, description, date, start_time, end_time,
  campus, location, organisation_id, contact_email, capacity, places_available,
  status, requirements, roles, shifts, banner_image, poster_image, featured,
  trending_score, application_deadline, accessibility_notes, lat, lng,
  ask_resume, custom_fields
) values
${eventInserts}
on conflict (id) do update set
  title = excluded.title,
  tagline = excluded.tagline,
  category = excluded.category,
  tags = excluded.tags,
  description = excluded.description,
  date = excluded.date,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  campus = excluded.campus,
  location = excluded.location,
  organisation_id = excluded.organisation_id,
  contact_email = excluded.contact_email,
  capacity = excluded.capacity,
  places_available = excluded.places_available,
  status = excluded.status,
  requirements = excluded.requirements,
  roles = excluded.roles,
  shifts = excluded.shifts,
  banner_image = excluded.banner_image,
  poster_image = excluded.poster_image,
  featured = excluded.featured,
  trending_score = excluded.trending_score,
  application_deadline = excluded.application_deadline,
  accessibility_notes = excluded.accessibility_notes,
  lat = excluded.lat,
  lng = excluded.lng,
  ask_resume = excluded.ask_resume,
  custom_fields = excluded.custom_fields,
  deleted_at = null,
  updated_at = now();

insert into public.volunteer_directory (
  id, name, student_username, email, phone, student_id, campus, skills, hours,
  events_attended, no_shows, reliability, status, notes
) values
  ('vol-alex', 'Alex Nguyen', 'a1991246', 'a1991246@adelaide.edu.au', '0412 334 721', 'a1991246', 'Adelaide City', ARRAY['Welcome','STEM']::text[], 24, 6, 0, 98, 'Active', ''),
  ('vol-priya', 'Priya Shah', 'a1882201', 'a1882201@adelaide.edu.au', '0433 891 004', 'a1882201', 'Mawson Lakes', ARRAY['Wellbeing','Support']::text[], 18, 4, 1, 86, 'Active', 'Late once at Wellbeing Expo briefing.'),
  ('vol-chris', 'Chris Adeyemi', 'a1773344', 'a1773344@adelaide.edu.au', '0408 112 993', 'a1773344', 'Adelaide City', ARRAY['Community','Outdoors']::text[], 31, 8, 0, 99, 'Active', ''),
  ('vol-jamie', 'Jamie Cole', 'a1664488', 'a1664488@adelaide.edu.au', '0491 570 006', 'a1664488', 'Magill', ARRAY['Mentoring']::text[], 6, 1, 2, 54, 'Suspended', 'Two no-shows. Review before approving again.'),
  ('vol-sam', 'Sam Okonkwo', 'a1556677', 'a1556677@adelaide.edu.au', '0422 776 310', 'a1556677', 'Roseworthy', ARRAY['Sport','Welcome']::text[], 12, 3, 0, 92, 'Active', '')
on conflict (id) do update set
  name = excluded.name,
  student_username = excluded.student_username,
  email = excluded.email,
  phone = excluded.phone,
  campus = excluded.campus,
  skills = excluded.skills,
  hours = excluded.hours,
  events_attended = excluded.events_attended,
  no_shows = excluded.no_shows,
  reliability = excluded.reliability,
  status = excluded.status,
  notes = excluded.notes;

insert into public.applications (
  id, event_id, event_title, volunteer_username, volunteer_name, volunteer_id,
  role, campus, event_date, submitted_date, status, availability, preferred_shifts,
  extra_answers, skills, notes, history
) values
  (
    'app-1', 'ingenuity-2026', 'Ingenuity 2026', 'a1991246', 'Alex Nguyen', 'vol-alex',
    'Registration Support', 'Adelaide City', '11 November 2026', '10 October 2026',
    'Pending', 'Morning and afternoon', '["Morning registration (9:00 AM – 1:00 PM)"]'::jsonb,
    '{"shirt":"M","dietary":"Vegetarian"}'::jsonb, ARRAY['Welcome','STEM']::text[], '',
    '[{"at":"10 Oct 2026","from":null,"to":"Pending","by":"system"}]'::jsonb
  ),
  (
    'app-2', 'wellbeing-expo', 'Student Wellbeing Expo', 'a1882201', 'Priya Shah', 'vol-priya',
    'Welcome Volunteer', 'Mawson Lakes', '18 November 2026', '7 October 2026',
    'Shortlisted', 'Full day', '["Full day (10:00 AM – 3:00 PM)"]'::jsonb,
    '{"confidentiality":"Yes"}'::jsonb, ARRAY['Wellbeing']::text[], 'Strong fit for welcome role.',
    '[{"at":"7 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"11 Oct 2026","from":"Pending","to":"Shortlisted","by":"rotaract.admin"}]'::jsonb
  ),
  (
    'app-3', 'ewb-community-build', 'EWB Community Build Day', 'a1773344', 'Chris Adeyemi', 'vol-chris',
    'Site Support', 'Mawson Lakes', '14 November 2026', '2 October 2026',
    'Approved', 'Morning', '["Build day (8:30 AM – 3:30 PM)"]'::jsonb,
    '{"shoes":"Yes","experience":"Some DIY"}'::jsonb, ARRAY['STEM','Hands-on']::text[], '',
    '[{"at":"2 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"8 Oct 2026","from":"Pending","to":"Approved","by":"super.admin"}]'::jsonb
  ),
  (
    'app-4', 'peer-mentor', 'Peer Mentor Welcome Day', 'a1664488', 'Jamie Cole', 'vol-jamie',
    'Orientation Support', 'Magill', '25 November 2026', '9 October 2026',
    'Pending', 'Afternoon', '[]'::jsonb, '{}'::jsonb, ARRAY['Mentoring']::text[],
    'Reliability is low.',
    '[{"at":"9 Oct 2026","from":null,"to":"Pending","by":"system"}]'::jsonb
  ),
  (
    'app-5', 'foodbank-packing', 'Foodbank Packing Morning', 'a1556677', 'Sam Okonkwo', 'vol-sam',
    'Packing Volunteer', 'Adelaide City', '12 October 2026', '1 October 2026',
    'Approved', 'Morning', '["Packing morning (9:00 AM – 12:30 PM)"]'::jsonb,
    '{"seated":"Happy to stand or sit"}'::jsonb, ARRAY['Community']::text[], '',
    '[{"at":"1 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"3 Oct 2026","from":"Pending","to":"Approved","by":"rotaract.admin"}]'::jsonb
  ),
  (
    'app-6', 'open-day-city', 'City Campus Open Day', 'a1991246', 'Alex Nguyen', 'vol-alex',
    'Tour Guide', 'Adelaide City', '5 December 2026', '8 October 2026',
    'Approved', 'Morning', '["Morning tours"]'::jsonb, '{}'::jsonb, ARRAY['Welcome']::text[], '',
    '[{"at":"8 Oct 2026","from":null,"to":"Pending","by":"system"},{"at":"12 Oct 2026","from":"Pending","to":"Approved","by":"rotaract.admin"}]'::jsonb
  ),
  (
    'app-7', 'harmony-week', 'Harmony Week Festival', 'a1882201', 'Priya Shah', 'vol-priya',
    'Festival Welcome', 'Adelaide City', '17 March 2027', '11 October 2026',
    'Pending', 'Full day', '[]'::jsonb, '{}'::jsonb, ARRAY['Wellbeing']::text[], '',
    '[{"at":"11 Oct 2026","from":null,"to":"Pending","by":"system"}]'::jsonb
  )
on conflict (id) do update set
  event_id = excluded.event_id,
  event_title = excluded.event_title,
  volunteer_username = excluded.volunteer_username,
  volunteer_name = excluded.volunteer_name,
  volunteer_id = excluded.volunteer_id,
  role = excluded.role,
  campus = excluded.campus,
  event_date = excluded.event_date,
  submitted_date = excluded.submitted_date,
  status = excluded.status,
  availability = excluded.availability,
  preferred_shifts = excluded.preferred_shifts,
  extra_answers = excluded.extra_answers,
  skills = excluded.skills,
  notes = excluded.notes,
  history = excluded.history,
  updated_at = now();

insert into public.shift_assignments (
  id, event_id, event_title, club_name, role, campus, location, date,
  start_time, end_time, meeting_point, notes, volunteer_username, status
) values
  (
    'shift-wellbeing', 'wellbeing-expo', 'Student Wellbeing Expo', 'SMHC',
    'Welcome Volunteer', 'Mawson Lakes', 'Mawson Lakes Campus, Building C Atrium',
    '18 November 2026', '10:00 AM', '3:00 PM', 'Building C foyer from 9:40 AM',
    'Wear closed shoes and collect your lanyard at briefing.', 'a1882201', 'Upcoming'
  ),
  (
    'shift-ingenuity', 'ingenuity-2026', 'Ingenuity 2026', 'AUES',
    'Registration Support', 'Adelaide City', 'Adelaide Convention Centre, North Terrace',
    '11 November 2026', '9:00 AM', '1:00 PM', 'North Terrace registration desk',
    'Coordinator briefing starts at 8:40 AM.', 'a1991246', 'Upcoming'
  ),
  (
    'shift-foodbank', 'foodbank-packing', 'Foodbank Packing Morning', 'Rotaract',
    'Hamper Packing', 'Adelaide City', 'Foodbank SA, Pooraka',
    '8 March 2026', '9:00 AM', '12:30 PM', 'Warehouse reception',
    'Completed demo shift.', 'a1556677', 'Completed'
  ),
  (
    'shift-open-day', 'open-day-city', 'City Campus Open Day', 'AUSA Crew',
    'Tour Guide', 'Adelaide City', 'North Terrace Campus, Hub Central',
    '5 December 2026', '9:00 AM', '1:00 PM', 'Hub Central information desk',
    'Collect a radio at check-in.', 'a1991246', 'Upcoming'
  )
on conflict (id) do update set
  event_id = excluded.event_id,
  event_title = excluded.event_title,
  volunteer_username = excluded.volunteer_username,
  status = excluded.status,
  notes = excluded.notes;

insert into public.announcements (id, subject, audience, at, status) values
  ('ann-1', 'Shift reminder: Foodbank Packing Morning', 'Foodbank Packing Morning', '11 Oct 2026', 'Sent'),
  ('ann-2', 'Ingenuity briefing pack is ready', 'Ingenuity 2026 volunteers', '12 Oct 2026', 'Sent'),
  ('ann-3', 'Open Day tour-guide briefing', 'City Campus Open Day', '20 Nov 2026', 'Scheduled')
on conflict (id) do update set
  subject = excluded.subject,
  audience = excluded.audience,
  at = excluded.at,
  status = excluded.status;

insert into public.shift_swaps (id, volunteer_name, shift, kind, status) values
  ('swap-1', 'Priya Shah', 'Wellbeing Expo · Full day', 'Drop', 'Pending')
on conflict (id) do update set
  volunteer_name = excluded.volunteer_name,
  shift = excluded.shift,
  kind = excluded.kind,
  status = excluded.status;

insert into public.audit_logs (id, at, who, action, target, ip, metadata) values
  ('aud-1', '12 Oct 2026 16:02', 'rotaract.admin', 'application.status', 'Alex Nguyen', '127.0.0.1', '{}'::jsonb),
  ('aud-2', '12 Oct 2026 14:18', 'super.admin', 'event.update', 'EWB Community Build Day', '127.0.0.1', '{}'::jsonb),
  ('aud-3', '11 Oct 2026 09:40', 'rotaract.admin', 'volunteer.pii_reveal', 'Priya Shah', '127.0.0.1', '{}'::jsonb),
  ('aud-4', '13 Oct 2026 10:12', 'super.admin', 'event.publish', 'Ingenuity 2026', '127.0.0.1', '{}'::jsonb)
on conflict (id) do update set
  at = excluded.at,
  who = excluded.who,
  action = excluded.action,
  target = excluded.target;

-- Keep the helper around so the seed can be re-run; coordinators can drop it later if desired.
`;

const out = resolve(here, "../../supabase/migrations/0002_seed_demo.sql");
writeFileSync(out, sql);
console.log(`Wrote ${out} with ${events.length} events.`);
