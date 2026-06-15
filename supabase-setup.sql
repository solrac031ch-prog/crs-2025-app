-- CRS HPH 2025 - Supabase setup
-- Ejecutar una vez en Supabase > SQL Editor.
-- Luego desplegar la funcion crs-admin-users para crear/eliminar usuarios desde la web.

create extension if not exists pgcrypto;

create table if not exists public.crs_admins (
  email text primary key,
  username text,
  display_name text,
  role text not null default 'jefe',
  active boolean not null default true,
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crs_admins add column if not exists username text;
alter table public.crs_admins add column if not exists created_by_email text;
alter table public.crs_admins alter column role set default 'jefe';

create unique index if not exists crs_admins_username_unique
on public.crs_admins (lower(username))
where username is not null and btrim(username) <> '';

insert into public.crs_admins (email, username, display_name, role, active)
values ('mdcarlosherrera@gmail.com', 'creador', 'Creador CRS HPH', 'creador', true)
on conflict (email) do update set
  username = coalesce(public.crs_admins.username, excluded.username),
  display_name = coalesce(public.crs_admins.display_name, excluded.display_name),
  role = 'creador',
  active = true;

create or replace function public.crs_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.crs_allowed_admin_role(role_value text)
returns boolean
language sql
stable
as $$
  select lower(coalesce(role_value, '')) in ('creador', 'jefe', 'jefatura', 'disenador', 'diseñador', 'admin');
$$;

create or replace function public.crs_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.crs_admins a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and a.active = true
      and public.crs_allowed_admin_role(a.role)
  );
$$;

create or replace function public.crs_login_email(login_text text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select a.email
  from public.crs_admins a
  where a.active = true
    and public.crs_allowed_admin_role(a.role)
    and (
      lower(a.email) = lower(btrim(login_text))
      or lower(coalesce(a.username, '')) = lower(btrim(login_text))
    )
  limit 1;
$$;

grant execute on function public.crs_login_email(text) to anon, authenticated;

create table if not exists public.crs_content_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('news', 'education', 'paper', 'procedure')),
  title text not null,
  description text,
  category text,
  month text,
  event_url text,
  url text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crs_documents (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  group_name text not null default 'documentos',
  title text not null,
  description text,
  url text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crs_flows (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  summary text,
  url text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crs_call_schedules (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('especialistas', 'uhd')),
  title text not null,
  specialty text,
  day_label text,
  doctor text,
  phone text,
  url text,
  file_path text,
  file_name text,
  file_type text,
  file_size bigint,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id),
  created_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists crs_content_touch on public.crs_content_items;
create trigger crs_content_touch before update on public.crs_content_items
for each row execute function public.crs_touch_updated_at();

drop trigger if exists crs_documents_touch on public.crs_documents;
create trigger crs_documents_touch before update on public.crs_documents
for each row execute function public.crs_touch_updated_at();

drop trigger if exists crs_flows_touch on public.crs_flows;
create trigger crs_flows_touch before update on public.crs_flows
for each row execute function public.crs_touch_updated_at();

drop trigger if exists crs_calls_touch on public.crs_call_schedules;
create trigger crs_calls_touch before update on public.crs_call_schedules
for each row execute function public.crs_touch_updated_at();

alter table public.crs_admins enable row level security;
alter table public.crs_content_items enable row level security;
alter table public.crs_documents enable row level security;
alter table public.crs_flows enable row level security;
alter table public.crs_call_schedules enable row level security;

grant select on public.crs_content_items to anon, authenticated;
grant select on public.crs_documents to anon, authenticated;
grant select on public.crs_flows to anon, authenticated;
grant select on public.crs_call_schedules to anon, authenticated;
grant select, insert, update, delete on public.crs_admins to authenticated;
grant insert, update, delete on public.crs_content_items to authenticated;
grant insert, update, delete on public.crs_documents to authenticated;
grant insert, update, delete on public.crs_flows to authenticated;
grant insert, update, delete on public.crs_call_schedules to authenticated;

drop policy if exists "crs_admins_admin_select" on public.crs_admins;
create policy "crs_admins_admin_select" on public.crs_admins
for select to authenticated
using (public.crs_is_admin());

drop policy if exists "crs_admins_admin_write" on public.crs_admins;
create policy "crs_admins_admin_write" on public.crs_admins
for all to authenticated
using (public.crs_is_admin())
with check (public.crs_is_admin());

drop policy if exists "crs_content_public_read" on public.crs_content_items;
create policy "crs_content_public_read" on public.crs_content_items
for select to anon, authenticated
using (status = 'published' or public.crs_is_admin());

drop policy if exists "crs_content_admin_write" on public.crs_content_items;
create policy "crs_content_admin_write" on public.crs_content_items
for all to authenticated
using (public.crs_is_admin())
with check (public.crs_is_admin());

drop policy if exists "crs_documents_public_read" on public.crs_documents;
create policy "crs_documents_public_read" on public.crs_documents
for select to anon, authenticated
using (status = 'published' or public.crs_is_admin());

drop policy if exists "crs_documents_admin_write" on public.crs_documents;
create policy "crs_documents_admin_write" on public.crs_documents
for all to authenticated
using (public.crs_is_admin())
with check (public.crs_is_admin());

drop policy if exists "crs_flows_public_read" on public.crs_flows;
create policy "crs_flows_public_read" on public.crs_flows
for select to anon, authenticated
using (status = 'published' or public.crs_is_admin());

drop policy if exists "crs_flows_admin_write" on public.crs_flows;
create policy "crs_flows_admin_write" on public.crs_flows
for all to authenticated
using (public.crs_is_admin())
with check (public.crs_is_admin());

drop policy if exists "crs_calls_public_read" on public.crs_call_schedules;
create policy "crs_calls_public_read" on public.crs_call_schedules
for select to anon, authenticated
using (status = 'published' or public.crs_is_admin());

drop policy if exists "crs_calls_admin_write" on public.crs_call_schedules;
create policy "crs_calls_admin_write" on public.crs_call_schedules
for all to authenticated
using (public.crs_is_admin())
with check (public.crs_is_admin());

insert into storage.buckets (id, name, public, file_size_limit)
values ('crs-public', 'crs-public', true, 104857600)
on conflict (id) do update set public = true, file_size_limit = 104857600;

drop policy if exists "crs_storage_public_read" on storage.objects;
create policy "crs_storage_public_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'crs-public');

drop policy if exists "crs_storage_admin_insert" on storage.objects;
create policy "crs_storage_admin_insert" on storage.objects
for insert to authenticated
with check (bucket_id = 'crs-public' and public.crs_is_admin());

drop policy if exists "crs_storage_admin_update" on storage.objects;
create policy "crs_storage_admin_update" on storage.objects
for update to authenticated
using (bucket_id = 'crs-public' and public.crs_is_admin())
with check (bucket_id = 'crs-public' and public.crs_is_admin());

drop policy if exists "crs_storage_admin_delete" on storage.objects;
create policy "crs_storage_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'crs-public' and public.crs_is_admin());
