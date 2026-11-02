-- Super admin can add club coordinators. Coordinators cannot add or promote admins.
-- Paste into the Supabase SQL editor after 0007.

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and portal = 'admin'
      and role = 'super_admin'
  );
$$;

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
     and coalesce(auth.jwt() ->> 'role', '') is distinct from 'service_role'
  then
    if auth.uid() is null or not public.is_super_admin() then
      raise exception 'only a super admin can change portal or role';
    end if;
    if new.role = 'super_admin' and old.role is distinct from 'super_admin' then
      raise exception 'club coordinators cannot be promoted to super admin';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
before update on public.profiles
for each row execute function public.protect_profile_role();

create or replace function public.list_admin_accounts()
returns table (
  id uuid,
  username text,
  display_name text,
  email citext,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'admin required';
  end if;
  return query
    select
      p.id,
      p.username,
      p.display_name,
      p.email,
      p.role,
      p.created_at
    from public.profiles p
    where p.portal = 'admin'
    order by p.created_at asc;
end;
$$;

revoke execute on function public.is_super_admin() from anon, public;
revoke execute on function public.list_admin_accounts() from anon, public;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.list_admin_accounts() to authenticated;
