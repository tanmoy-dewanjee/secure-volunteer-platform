-- Secure Volunteer Platform — Postgres schema for student + admin portals.
-- Paste into the Supabase SQL editor, or apply with the Supabase CLI.
-- Auth secrets stay in auth.users. Application profile is public.profiles.
-- After this file, run 0002_seed_demo.sql so events and demo accounts are not empty.

create extension if not exists pgcrypto;
create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users when the student/admin signs up)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  email citext unique not null,
  portal text not null check (portal in ('student', 'admin')),
  role text not null check (
    role in ('student', 'super_admin', 'event_coordinator', 'viewer')
  ),
  campus text,
  phone text,
  bio text,
  skills text[] not null default '{}',
  availability text,
  emergency_contact text,
  accessibility text,
  hours integer not null default 0,
  events_attended integer not null default 0,
  points integer not null default 0,
  profile_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_portal_idx on public.profiles (portal);
create index if not exists profiles_username_idx on public.profiles (username);

-- ---------------------------------------------------------------------------
-- Events (slug ids keep existing student URLs such as /events/ingenuity-2026)
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id text primary key,
  title text not null,
  tagline text not null default '',
  category text not null,
  tags text[] not null default '{}',
  description text not null,
  date text not null,
  start_time text not null,
  end_time text not null,
  campus text not null,
  location text not null default '',
  organisation_id text not null,
  contact_email text not null,
  capacity integer not null default 0,
  places_available integer not null default 0,
  status text not null check (
    status in ('Open', 'Closed', 'Full', 'Coming soon', 'In progress')
  ),
  requirements text[] not null default '{}',
  roles jsonb not null default '[]'::jsonb,
  shifts jsonb not null default '[]'::jsonb,
  banner_image text not null,
  poster_image text not null,
  featured boolean not null default false,
  trending_score integer not null default 0,
  application_deadline text not null default '',
  accessibility_notes text not null default '',
  lat double precision,
  lng double precision,
  ask_resume boolean not null default false,
  custom_fields jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists events_campus_idx on public.events (campus);
create index if not exists events_category_idx on public.events (category);
create index if not exists events_status_idx on public.events (status);
create index if not exists events_deleted_idx on public.events (deleted_at);

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table if not exists public.applications (
  id text primary key,
  event_id text not null references public.events (id),
  event_title text not null,
  volunteer_username text not null,
  volunteer_name text not null,
  volunteer_id text,
  role text not null,
  campus text not null,
  event_date text,
  submitted_date text not null,
  status text not null check (
    status in ('Pending', 'Shortlisted', 'Approved', 'Rejected', 'Withdrawn')
  ),
  availability text,
  preferred_shifts jsonb not null default '[]'::jsonb,
  extra_answers jsonb not null default '{}'::jsonb,
  motivation text,
  skills text[] not null default '{}',
  notes text not null default '',
  history jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_event_idx on public.applications (event_id);
create index if not exists applications_volunteer_idx on public.applications (volunteer_username);
create index if not exists applications_status_idx on public.applications (status);

-- ---------------------------------------------------------------------------
-- Volunteer directory (admin address book; synthetic demo rows)
-- ---------------------------------------------------------------------------
create table if not exists public.volunteer_directory (
  id text primary key,
  name text not null,
  student_username text unique not null,
  email text not null,
  phone text not null default '',
  student_id text not null,
  campus text not null,
  skills text[] not null default '{}',
  hours integer not null default 0,
  events_attended integer not null default 0,
  no_shows integer not null default 0,
  reliability integer not null default 100,
  status text not null default 'Active',
  notes text not null default ''
);

-- ---------------------------------------------------------------------------
-- Shifts assigned to a volunteer + check-in status
-- ---------------------------------------------------------------------------
create table if not exists public.shift_assignments (
  id text primary key,
  event_id text not null references public.events (id),
  event_title text not null,
  club_name text not null default '',
  role text not null,
  campus text not null,
  location text not null default '',
  date text not null,
  start_time text not null,
  end_time text not null,
  meeting_point text not null default '',
  notes text not null default '',
  volunteer_username text not null,
  status text not null default 'Upcoming' check (
    status in ('Upcoming', 'Checked in', 'Completed')
  ),
  created_at timestamptz not null default now()
);

create index if not exists shift_assignments_volunteer_idx
  on public.shift_assignments (volunteer_username);

-- ---------------------------------------------------------------------------
-- Comms, swaps, audit
-- ---------------------------------------------------------------------------
create table if not exists public.announcements (
  id text primary key,
  subject text not null,
  audience text not null,
  at text not null,
  status text not null check (status in ('Sent', 'Scheduled')),
  created_at timestamptz not null default now()
);

create table if not exists public.shift_swaps (
  id text primary key,
  volunteer_name text not null,
  shift text not null,
  kind text not null check (kind in ('Drop', 'Swap')),
  status text not null check (status in ('Pending', 'Approved', 'Rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  at text not null,
  who text not null,
  action text not null,
  target text not null,
  ip text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_action_idx on public.audit_logs (action);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
for each row execute function public.touch_updated_at();

drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Create a profile row when Auth creates a user
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  portal_value text := coalesce(new.raw_user_meta_data->>'portal', 'student');
  role_value text := coalesce(
    new.raw_user_meta_data->>'role',
    case when portal_value = 'admin' then 'event_coordinator' else 'student' end
  );
  username_value text := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
begin
  insert into public.profiles (id, username, display_name, email, portal, role)
  values (
    new.id,
    lower(username_value),
    coalesce(new.raw_user_meta_data->>'display_name', username_value),
    new.email,
    portal_value,
    role_value
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.applications enable row level security;
alter table public.volunteer_directory enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.announcements enable row level security;
alter table public.shift_swaps enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and portal = 'admin'
  );
$$;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (id = auth.uid() or public.is_admin());

drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events
  for select using (deleted_at is null);

drop policy if exists events_admin_write on public.events;
create policy events_admin_write on public.events
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists applications_own_read on public.applications;
create policy applications_own_read on public.applications
  for select using (
    public.is_admin()
    or volunteer_username = (
      select username from public.profiles where id = auth.uid()
    )
  );

drop policy if exists applications_own_insert on public.applications;
create policy applications_own_insert on public.applications
  for insert with check (
    public.is_admin()
    or volunteer_username = (
      select username from public.profiles where id = auth.uid()
    )
  );

drop policy if exists applications_own_update on public.applications;
create policy applications_own_update on public.applications
  for update using (
    public.is_admin()
    or volunteer_username = (
      select username from public.profiles where id = auth.uid()
    )
  );

drop policy if exists directory_admin on public.volunteer_directory;
create policy directory_admin on public.volunteer_directory
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists shifts_own on public.shift_assignments;
create policy shifts_own on public.shift_assignments
  for all using (
    public.is_admin()
    or volunteer_username = (
      select username from public.profiles where id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or volunteer_username = (
      select username from public.profiles where id = auth.uid()
    )
  );

drop policy if exists announcements_admin on public.announcements;
create policy announcements_admin on public.announcements
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists announcements_student_read on public.announcements;
create policy announcements_student_read on public.announcements
  for select using (true);

drop policy if exists swaps_admin on public.shift_swaps;
create policy swaps_admin on public.shift_swaps
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists audit_admin_read on public.audit_logs;
create policy audit_admin_read on public.audit_logs
  for select using (public.is_admin());

drop policy if exists audit_admin_insert on public.audit_logs;
create policy audit_admin_insert on public.audit_logs
  for insert with check (public.is_admin());

grant usage on schema public to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert, update on public.shift_assignments to authenticated;
grant select on public.announcements to anon, authenticated;
grant all on public.events to authenticated;
grant all on public.volunteer_directory to authenticated;
grant all on public.shift_swaps to authenticated;
grant all on public.audit_logs to authenticated;
grant all on public.announcements to authenticated;
