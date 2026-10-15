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
create policy "crs_admins_admin_select" on public.crs_admins
for select to authenticated using ((select crs_private.is_admin()));

drop policy if exists "crs_admins_admin_write" on public.crs_admins;
drop policy if exists "crs_admins_admin_insert" on public.crs_admins;
drop policy if exists "crs_admins_admin_update" on public.crs_admins;
drop policy if exists "crs_admins_admin_delete" on public.crs_admins;
create policy "crs_admins_admin_insert" on public.crs_admins
for insert to authenticated with check ((select crs_private.can_manage_users()));
create policy "crs_admins_admin_update" on public.crs_admins
for update to authenticated
using ((select crs_private.can_manage_users()))
with check ((select crs_private.can_manage_users()));
create policy "crs_admins_admin_delete" on public.crs_admins
for delete to authenticated using ((select crs_private.can_manage_users()));

drop policy if exists "crs_content_public_read" on public.crs_content_items;
create policy "crs_content_public_read" on public.crs_content_items
for select to anon, authenticated
using (status = 'published' or (select crs_private.is_admin()));
drop policy if exists "crs_content_admin_write" on public.crs_content_items;
drop policy if exists "crs_content_admin_insert" on public.crs_content_items;
drop policy if exists "crs_content_admin_update" on public.crs_content_items;
drop policy if exists "crs_content_admin_delete" on public.crs_content_items;
create policy "crs_content_admin_insert" on public.crs_content_items
for insert to authenticated with check ((select crs_private.is_admin()));
create policy "crs_content_admin_update" on public.crs_content_items
for update to authenticated
using ((select crs_private.is_admin()))
with check ((select crs_private.is_admin()));
create policy "crs_content_admin_delete" on public.crs_content_items
for delete to authenticated using ((select crs_private.is_admin()));

drop policy if exists "crs_documents_public_read" on public.crs_documents;
create policy "crs_documents_public_read" on public.crs_documents
for select to anon, authenticated
using (status = 'published' or (select crs_private.is_admin()));
drop policy if exists "crs_documents_admin_write" on public.crs_documents;
drop policy if exists "crs_documents_admin_insert" on public.crs_documents;
drop policy if exists "crs_documents_admin_update" on public.crs_documents;
drop policy if exists "crs_documents_admin_delete" on public.crs_documents;
create policy "crs_documents_admin_insert" on public.crs_documents
for insert to authenticated with check ((select crs_private.is_admin()));
create policy "crs_documents_admin_update" on public.crs_documents
for update to authenticated
using ((select crs_private.is_admin()))
with check ((select crs_private.is_admin()));
create policy "crs_documents_admin_delete" on public.crs_documents
for delete to authenticated using ((select crs_private.is_admin()));

drop policy if exists "crs_flows_public_read" on public.crs_flows;
create policy "crs_flows_public_read" on public.crs_flows
for select to anon, authenticated
using (status = 'published' or (select crs_private.is_admin()));
drop policy if exists "crs_flows_admin_write" on public.crs_flows;
drop policy if exists "crs_flows_admin_insert" on public.crs_flows;
drop policy if exists "crs_flows_admin_update" on public.crs_flows;
drop policy if exists "crs_flows_admin_delete" on public.crs_flows;
create policy "crs_flows_admin_insert" on public.crs_flows
for insert to authenticated with check ((select crs_private.is_admin()));
create policy "crs_flows_admin_update" on public.crs_flows
for update to authenticated
using ((select crs_private.is_admin()))
with check ((select crs_private.is_admin()));
create policy "crs_flows_admin_delete" on public.crs_flows
for delete to authenticated using ((select crs_private.is_admin()));

drop policy if exists "crs_calls_public_read" on public.crs_call_schedules;
create policy "crs_calls_public_read" on public.crs_call_schedules
for select to anon, authenticated
using (status = 'published' or (select crs_private.is_admin()));
drop policy if exists "crs_calls_admin_write" on public.crs_call_schedules;
drop policy if exists "crs_calls_admin_insert" on public.crs_call_schedules;
drop policy if exists "crs_calls_admin_update" on public.crs_call_schedules;
drop policy if exists "crs_calls_admin_delete" on public.crs_call_schedules;
create policy "crs_calls_admin_insert" on public.crs_call_schedules
for insert to authenticated with check ((select crs_private.is_admin()));
create policy "crs_calls_admin_update" on public.crs_call_schedules
for update to authenticated
using ((select crs_private.is_admin()))
with check ((select crs_private.is_admin()));
create policy "crs_calls_admin_delete" on public.crs_call_schedules
for delete to authenticated using ((select crs_private.is_admin()));

drop policy if exists "crs_storage_admin_insert" on storage.objects;
create policy "crs_storage_admin_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'crs-public' and (select crs_private.is_admin()));

drop policy if exists "crs_storage_admin_update" on storage.objects;
create policy "crs_storage_admin_update" on storage.objects
for update to authenticated
using (bucket_id = 'crs-public' and (select crs_private.is_admin()))
with check (bucket_id = 'crs-public' and (select crs_private.is_admin()));

drop policy if exists "crs_storage_admin_delete" on storage.objects;
create policy "crs_storage_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'crs-public' and (select crs_private.is_admin()));

create index if not exists crs_call_schedules_created_by_idx on public.crs_call_schedules(created_by);
create index if not exists crs_content_items_created_by_idx on public.crs_content_items(created_by);
create index if not exists crs_documents_created_by_idx on public.crs_documents(created_by);
create index if not exists crs_flows_created_by_idx on public.crs_flows(created_by);

do $$
begin
  if to_regprocedure('public.crs_is_admin()') is not null then
    execute 'revoke all on function public.crs_is_admin() from public';
    execute 'revoke all on function public.crs_is_admin() from anon';
    execute 'revoke all on function public.crs_is_admin() from authenticated';
  end if;
  if to_regprocedure('public.crs_login_email(text)') is not null then
    execute 'revoke all on function public.crs_login_email(text) from public';
    execute 'revoke all on function public.crs_login_email(text) from anon';
    execute 'revoke all on function public.crs_login_email(text) from authenticated';
  end if;
  if to_regprocedure('public.crs_allowed_admin_role(text)') is not null then
    execute 'revoke all on function public.crs_allowed_admin_role(text) from public';
    execute 'revoke all on function public.crs_allowed_admin_role(text) from anon';
    execute 'revoke all on function public.crs_allowed_admin_role(text) from authenticated';
  end if;
  if to_regprocedure('public.crs_touch_updated_at()') is not null then
    execute 'revoke all on function public.crs_touch_updated_at() from public';
    execute 'revoke all on function public.crs_touch_updated_at() from anon';
    execute 'revoke all on function public.crs_touch_updated_at() from authenticated';
  end if;
end
$;

commit;
notify pgrst, 'reload schema';
