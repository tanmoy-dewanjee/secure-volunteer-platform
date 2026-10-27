-- Allow the student and admin APIs to submit/list applications when only the
-- publishable key is configured (RLS would otherwise hide every row).

create or replace function public.submit_volunteer_application(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
  v_event_id text;
  v_username text;
  existing_id text;
  result public.applications%rowtype;
begin
  v_id := coalesce(nullif(payload->>'id', ''), 'app-' || floor(extract(epoch from now()) * 1000)::text);
  v_event_id := nullif(payload->>'event_id', '');
  v_username := lower(trim(coalesce(payload->>'volunteer_username', '')));

  if v_event_id is null or v_username = '' then
    raise exception 'event_id and volunteer_username are required';
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
    coalesce(nullif(payload->>'volunteer_name', ''), v_username),
    coalesce(nullif(payload->>'volunteer_id', ''), v_username),
    coalesce(nullif(payload->>'role', ''), 'Volunteer'),
    coalesce(payload->>'campus', ''),
    payload->>'event_date',
    coalesce(payload->>'submitted_date', to_char(now(), 'FMDD FMMonth YYYY')),
    coalesce(nullif(payload->>'status', ''), 'Pending'),
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
    coalesce(payload->'history', '[]'::jsonb)
  )
  returning * into result;

  return jsonb_build_object('created', true, 'application', to_jsonb(result));
end;
$$;

create or replace function public.list_volunteer_applications(p_username text)
returns setof public.applications
language sql
security definer
set search_path = public
stable
as $$
  select *
  from public.applications
  where volunteer_username = lower(trim(p_username))
  order by created_at desc;
$$;

create or replace function public.list_all_applications()
returns setof public.applications
language sql
security definer
set search_path = public
stable
as $$
  select * from public.applications order by created_at desc;
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
  result public.applications%rowtype;
begin
  if p_status not in ('Pending', 'Shortlisted', 'Approved', 'Rejected', 'Withdrawn') then
    raise exception 'invalid status';
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
        'by', coalesce(nullif(p_username, ''), 'system')
      )
    )
  where id = p_id
    and (p_username is null or volunteer_username = lower(trim(p_username)))
  returning * into result;

  if result.id is null then
    return jsonb_build_object('ok', false);
  end if;

  return jsonb_build_object('ok', true, 'application', to_jsonb(result));
end;
$$;

grant execute on function public.submit_volunteer_application(jsonb) to anon, authenticated;
grant execute on function public.list_volunteer_applications(text) to anon, authenticated;
grant execute on function public.list_all_applications() to anon, authenticated;
grant execute on function public.update_application_status(text, text, text) to anon, authenticated;
