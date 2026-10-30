-- D2/D3: harden signup trigger + SECURITY DEFINER application RPCs.
-- Derive volunteer identity from auth.uid(); force Pending on submit;
-- make audit_logs append-only even for service-role clients.

-- ---------------------------------------------------------------------------
-- D2: never trust client metadata for portal/role on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  username_value text := lower(coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  ));
begin
  begin
    insert into public.profiles (id, username, display_name, email, portal, role)
    values (
      new.id,
      username_value,
      coalesce(new.raw_user_meta_data->>'display_name', username_value),
      new.email,
      'student',
      'student'
    )
    on conflict (id) do nothing;
  exception
    when unique_violation then
      insert into public.profiles (id, username, display_name, email, portal, role)
      values (
        new.id,
        left(username_value || '-' || replace(new.id::text, '-', ''), 32),
        coalesce(new.raw_user_meta_data->>'display_name', username_value),
        new.email,
        'student',
        'student'
      )
      on conflict (id) do nothing;
  end;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- D1: append-only audit_logs (block update/delete for all roles)
-- ---------------------------------------------------------------------------
create or replace function public.deny_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are append-only';
end;
$$;

drop trigger if exists audit_logs_no_update on public.audit_logs;
create trigger audit_logs_no_update
before update on public.audit_logs
for each row execute function public.deny_audit_mutation();

drop trigger if exists audit_logs_no_delete on public.audit_logs;
create trigger audit_logs_no_delete
before delete on public.audit_logs
for each row execute function public.deny_audit_mutation();

revoke update, delete on public.audit_logs from authenticated, anon;

-- Block self-service portal/role elevation after signup (D2 follow-through).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and (
       new.portal is distinct from old.portal
       or new.role is distinct from old.role
     )
     and not public.is_admin()
     and auth.uid() is not null
     and coalesce(auth.jwt() ->> 'role', '') is distinct from 'service_role'
  then
    raise exception 'portal and role cannot be changed by the client';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- ---------------------------------------------------------------------------
-- D3: application RPCs bind to auth.uid() / is_admin()
-- ---------------------------------------------------------------------------
create or replace function public.submit_volunteer_application(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_id text;
  v_event_id text;
  v_username text;
  v_display text;
  existing_id text;
  result public.applications%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select p.username, p.display_name
    into v_username, v_display
  from public.profiles p
  where p.id = v_uid;

  if v_username is null then
    raise exception 'profile required';
  end if;

  v_id := coalesce(nullif(payload->>'id', ''), 'app-' || floor(extract(epoch from now()) * 1000)::text);
  v_event_id := nullif(payload->>'event_id', '');

  if v_event_id is null then
    raise exception 'event_id is required';
  end if;

  insert into public.events (
    id, title, tagline, category, tags, description, date, start_time, end_time,
    campus, location, organisation_id, contact_email, capacity, places_available,
    status, banner_image, poster_image, featured, trending_score
  )
  values (
    v_event_id,
    coalesce(nullif(payload->>'event_title', ''), 'Volunteer event'),
    '',
    'General',
    '{}',
    coalesce(nullif(payload->>'event_title', ''), 'Volunteer event'),
    coalesce(payload->>'event_date', ''),
    '9:00 AM',
    '5:00 PM',
    coalesce(nullif(payload->>'campus', ''), 'Adelaide City'),
    '',
    'unknown',
    'events@example.edu.au',
    0,
    0,
    'Open',
    '/window.svg',
    '/window.svg',
    false,
    0
  )
  on conflict (id) do nothing;

  select a.id into existing_id
  from public.applications a
  where a.volunteer_username = v_username
    and a.event_id = v_event_id
    and a.status in ('Pending', 'Shortlisted', 'Approved')
  limit 1;

  if existing_id is not null then
    select a.* into result from public.applications a where a.id = existing_id;
    return jsonb_build_object('created', false, 'application', to_jsonb(result));
  end if;

  insert into public.applications (
    id, event_id, event_title, volunteer_username, volunteer_name, volunteer_id,
    role, campus, event_date, submitted_date, status, availability,
    preferred_shifts, extra_answers, motivation, skills, notes, history
  )
  values (
    v_id,
    v_event_id,
    coalesce(payload->>'event_title', ''),
    v_username,
    coalesce(nullif(v_display, ''), nullif(payload->>'volunteer_name', ''), v_username),
    v_username,
    coalesce(nullif(payload->>'role', ''), 'Volunteer'),
    coalesce(payload->>'campus', ''),
    payload->>'event_date',
    coalesce(payload->>'submitted_date', to_char(now(), 'FMDD FMMonth YYYY')),
    'Pending',
    coalesce(payload->>'availability', ''),
    coalesce(payload->'preferred_shifts', '[]'::jsonb),
    coalesce(payload->'extra_answers', '{}'::jsonb),
    payload->>'motivation',
    coalesce(
      (
        select array_agg(x)
        from jsonb_array_elements_text(coalesce(payload->'skills', '[]'::jsonb)) as t(x)
      ),
      '{}'::text[]
    ),
    coalesce(payload->>'notes', ''),
    jsonb_build_array(
      jsonb_build_object(
        'at', coalesce(payload->>'submitted_date', to_char(now(), 'FMDD FMMonth YYYY')),
        'from', null,
        'to', 'Pending',
        'by', v_username
      )
    )
  )
  returning * into result;

  return jsonb_build_object('created', true, 'application', to_jsonb(result));
end;
$$;

create or replace function public.list_volunteer_applications(p_username text default null)
returns setof public.applications
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if public.is_admin() then
    v_username := lower(trim(coalesce(nullif(p_username, ''), '')));
    if v_username = '' then
      return query select * from public.applications order by created_at desc;
      return;
    end if;
    return query
      select *
      from public.applications
      where volunteer_username = v_username
      order by created_at desc;
    return;
  end if;

  select p.username into v_username
  from public.profiles p
  where p.id = v_uid;

  if v_username is null then
    raise exception 'profile required';
  end if;

  return query
    select *
    from public.applications
    where volunteer_username = v_username
    order by created_at desc;
end;
$$;

create or replace function public.list_all_applications()
returns setof public.applications
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'admin required';
  end if;
  return query select * from public.applications order by created_at desc;
end;
$$;

create or replace function public.update_application_status(
  p_id text,
  p_status text,
  p_username text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_is_admin boolean := false;
  result public.applications%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if p_status not in ('Pending', 'Shortlisted', 'Approved', 'Rejected', 'Withdrawn') then
    raise exception 'invalid status';
  end if;

  v_is_admin := public.is_admin();

  select p.username into v_username
  from public.profiles p
  where p.id = v_uid;

  if not v_is_admin then
    if v_username is null then
      raise exception 'profile required';
    end if;
    if p_status <> 'Withdrawn' then
      raise exception 'students may only withdraw';
    end if;
  end if;

  update public.applications
  set
    status = p_status,
    updated_at = now(),
    history = coalesce(history, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'at', to_char(now(), 'FMDD FMMonth YYYY HH24:MI'),
        'from', status,
        'to', p_status,
        'by', coalesce(v_username, 'admin')
      )
    )
  where id = p_id
    and (
      v_is_admin
      or (
        volunteer_username = v_username
        and status = 'Pending'
        and p_status = 'Withdrawn'
      )
    )
  returning * into result;

  if result.id is null then
    return jsonb_build_object('ok', false);
  end if;

  return jsonb_build_object('ok', true, 'application', to_jsonb(result));
end;
$$;

revoke execute on function public.submit_volunteer_application(jsonb) from anon, public;
revoke execute on function public.list_volunteer_applications(text) from anon, public;
revoke execute on function public.list_all_applications() from anon, public;
revoke execute on function public.update_application_status(text, text, text) from anon, public;

grant execute on function public.submit_volunteer_application(jsonb) to authenticated;
grant execute on function public.list_volunteer_applications(text) to authenticated;
grant execute on function public.list_all_applications() to authenticated;
grant execute on function public.update_application_status(text, text, text) to authenticated;
