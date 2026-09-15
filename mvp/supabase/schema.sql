-- Must schema for Supabase PostgreSQL (C262T-4104)
-- Apply in the Supabase SQL editor when connecting a live project.
-- Local demo uses the in-memory store in src/lib/db/store.ts.

create extension if not exists citext;

create table if not exists public.users (
  id uuid primary key,
  email citext unique not null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  role text not null check (role in ('admin', 'student')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 4000),
  location text not null,
  department text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create index if not exists events_location_idx on public.events (location);
create index if not exists events_department_idx on public.events (department);
create index if not exists events_starts_at_idx on public.events (starts_at);
create index if not exists events_deleted_at_idx on public.events (deleted_at);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.users (id),
  action text not null check (action in ('event.create', 'event.update', 'event.delete')),
  entity_type text not null check (entity_type = 'event'),
  entity_id uuid not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- Should stubs (empty tables for future FKs)
create table if not exists public.profiles (
  user_id uuid primary key references public.users (id),
  department text,
  campus text,
  bio text
);

create table if not exists public.volunteer_roles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id),
  title text not null,
  requirements text,
  slots int not null default 1
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  volunteer_role_id uuid not null references public.volunteer_roles (id),
  user_id uuid not null references public.users (id),
  status text not null,
  created_at timestamptz not null default now(),
  unique (volunteer_role_id, user_id)
);
