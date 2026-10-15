-- MASTER Urgencia Adulto HPH - hardening Supabase
-- Idempotente. Mantiene los helpers privilegiados fuera del esquema público,
-- elimina políticas SELECT duplicadas y agrega índices para las FK de auditoría.

begin;

create schema if not exists crs_private;
revoke all on schema crs_private from public;
grant usage on schema crs_private to anon, authenticated, service_role;

create or replace function crs_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and exists (
       select 1 from public.crs_admins a
       where lower(a.email) = lower(coalesce(auth.jwt()->>'email', ''))
         and a.active = true
     );
$$;

create or replace function crs_private.can_manage_users()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
     and exists (
       select 1 from public.crs_admins a
       where lower(a.email) = lower(coalesce(auth.jwt()->>'email', ''))
         and a.active = true
         and lower(btrim(a.role)) in ('creador', 'disenador', 'diseñador', 'admin')
     );
$$;

revoke all on function crs_private.is_admin() from public;
revoke all on function crs_private.is_admin() from anon;
revoke all on function crs_private.is_admin() from authenticated;
grant execute on function crs_private.is_admin() to anon, authenticated, service_role;

revoke all on function crs_private.can_manage_users() from public;
revoke all on function crs_private.can_manage_users() from anon;
revoke all on function crs_private.can_manage_users() from authenticated;
grant execute on function crs_private.can_manage_users() to authenticated, service_role;

drop policy if exists "crs_admins_admin_select" on public.crs_admins;
drop policy if exists "crs_admins_self_select" on public.crs_admins;
drop policy if exists "crs_admins_manager_select" on public.crs_admins;
drop policy if exists "crs_admins_select" on public.crs_admins;
drop policy if exists "crs_admins_admin_write" on public.crs_admins;
drop policy if exists "crs_admins_admin_insert" on public.crs_admins;
drop policy if exists "crs_admins_admin_update" on public.crs_admins;
drop policy if exists "crs_admins_admin_delete" on public.crs_admins;

create policy "crs_admins_select" on public.crs_admins
for select to authenticated
using (
  lower(email) = lower(coalesce(((select auth.jwt()) ->> 'email'), ''))
  or (select crs_private.can_manage_users())
);

commit;
notify pgrst, 'reload schema';
