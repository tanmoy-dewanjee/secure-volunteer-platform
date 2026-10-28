-- Student signup can collide on profiles.username (email local-part).
-- Keep auth.users insert from rolling back when that happens.

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
      portal_value,
      role_value
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
        portal_value,
        role_value
      )
      on conflict (id) do nothing;
  end;
  return new;
end;
$$;
