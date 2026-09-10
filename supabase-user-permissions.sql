-- MASTER: permisos de usuarios alineados con el controlador de Jefatura.
create schema if not exists crs_private;
revoke all on schema crs_private from public, anon;
grant usage on schema crs_private to authenticated;

create or replace function crs_private.can_manage_users()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null and exists (
    select 1 from public.crs_admins a
    where lower(a.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and a.active = true
      and lower(trim(a.role)) in ('creador', 'disenador', 'diseñador', 'admin')
  );
$$;
revoke all on function crs_private.can_manage_users() from public, anon;
grant execute on function crs_private.can_manage_users() to authenticated;

drop policy if exists "crs_admins_admin_write" on public.crs_admins;
create policy "crs_admins_admin_write" on public.crs_admins
for all to authenticated
using (crs_private.can_manage_users())
with check (crs_private.can_manage_users());

alter function public.crs_touch_updated_at() set search_path = '';

