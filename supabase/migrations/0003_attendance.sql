-- QR attendance tokens, station codes, and check-in history.
-- Safe to re-run after 0001_init.sql and 0002_seed_demo.sql.

alter table public.shift_assignments
  add column if not exists slot_id text not null default '',
  add column if not exists qr_token text,
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_out_at timestamptz,
  add column if not exists check_in_method text not null default '';

update public.shift_assignments
set qr_token = encode(gen_random_bytes(16), 'hex')
where qr_token is null or qr_token = '';

create unique index if not exists shift_assignments_qr_token_idx
  on public.shift_assignments (qr_token);

create table if not exists public.shift_stations (
  event_id text primary key references public.events (id) on delete cascade,
  token text not null unique,
  label text not null default 'Event check-in',
  created_at timestamptz not null default now()
);

insert into public.shift_stations (event_id, token, label)
select
  e.id,
  encode(gen_random_bytes(16), 'hex'),
  e.title || ' check-in'
from public.events e
on conflict (event_id) do nothing;

create table if not exists public.attendance_logs (
  id text primary key,
  assignment_id text not null references public.shift_assignments (id) on delete cascade,
  event_id text not null,
  volunteer_username text not null,
  action text not null check (action in ('check_in', 'check_out', 'no_show', 'complete')),
  method text not null default 'manual',
  at timestamptz not null default now(),
  by_username text not null default ''
);

create index if not exists attendance_logs_event_idx
  on public.attendance_logs (event_id, at desc);

alter table public.shift_stations enable row level security;
alter table public.attendance_logs enable row level security;

drop policy if exists stations_read on public.shift_stations;
create policy stations_read on public.shift_stations
  for select using (true);

drop policy if exists stations_admin on public.shift_stations;
create policy stations_admin on public.shift_stations
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists attendance_own on public.attendance_logs;
create policy attendance_own on public.attendance_logs
  for select using (
    public.is_admin()
    or volunteer_username = (
      select username from public.profiles where id = auth.uid()
    )
  );

drop policy if exists attendance_write on public.attendance_logs;
create policy attendance_write on public.attendance_logs
  for insert with check (
    public.is_admin()
    or volunteer_username = (
      select username from public.profiles where id = auth.uid()
    )
  );

grant select on public.shift_stations to anon, authenticated;
grant all on public.shift_stations to authenticated;
grant select, insert on public.attendance_logs to authenticated;
grant all on public.attendance_logs to authenticated;
