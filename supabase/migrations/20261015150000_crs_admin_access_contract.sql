-- MASTER Urgencias HPH: acceso robusto a perfiles de Jefatura.
-- El navegador solo lee su perfil; el listado global queda reservado a gestores.
begin;

revoke all privileges on table public.crs_admins from anon;
revoke insert, update, delete, truncate, references, trigger on table public.crs_admins from authenticated;
grant select on table public.crs_admins to authenticated;
grant select, insert, update, delete on table public.crs_admins to service_role;

drop policy if exists "crs_admins_admin_select" on public.crs_admins;
drop policy if exists "crs_admins_self_select" on public.crs_admins;
drop policy if exists "crs_admins_manager_select" on public.crs_admins;
drop policy if exists "crs_admins_admin_insert" on public.crs_admins;
drop policy if exists "crs_admins_admin_update" on public.crs_admins;
drop policy if exists "crs_admins_admin_delete" on public.crs_admins;
drop policy if exists "crs_admins_admin_write" on public.crs_admins;

create policy "crs_admins_self_select"
on public.crs_admins
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

create policy "crs_admins_manager_select"
on public.crs_admins
for select
to authenticated
using ((select crs_private.can_manage_users()));

commit;
notify pgrst, 'reload schema';
