-- CRS HPH 2025 - hardening de permisos Supabase
-- Puede ejecutarse más de una vez de forma segura.
-- También tolera instalaciones antiguas donde alguna función opcional aún no exista.
--
-- PostgreSQL concede EXECUTE sobre funciones nuevas a PUBLIC por defecto.
-- Este archivo revoca ese permiso implícito y deja sólo los roles necesarios.

begin;

do $hardening$
begin
  -- Función interna opcional: sólo debe ser utilizada por otras funciones/políticas.
  if to_regprocedure('public.crs_allowed_admin_role(text)') is not null then
    execute 'revoke all on function public.crs_allowed_admin_role(text) from public';
    execute 'revoke all on function public.crs_allowed_admin_role(text) from anon';
    execute 'revoke all on function public.crs_allowed_admin_role(text) from authenticated';
  else
    raise notice 'crs_allowed_admin_role(text) no existe; se omite.';
  end if;

  -- Función de autorización usada por políticas RLS.
  if to_regprocedure('public.crs_is_admin()') is not null then
    execute 'revoke all on function public.crs_is_admin() from public';
    execute 'revoke all on function public.crs_is_admin() from anon';
    execute 'revoke all on function public.crs_is_admin() from authenticated';
    execute 'grant execute on function public.crs_is_admin() to anon, authenticated';
  else
    raise notice 'crs_is_admin() no existe; se omite.';
  end if;

  -- Resolución usuario/correo para login; existe sólo en instalaciones nuevas.
  if to_regprocedure('public.crs_login_email(text)') is not null then
    execute 'revoke all on function public.crs_login_email(text) from public';
    execute 'revoke all on function public.crs_login_email(text) from anon';
    execute 'revoke all on function public.crs_login_email(text) from authenticated';
    execute 'grant execute on function public.crs_login_email(text) to anon, authenticated';
  else
    raise notice 'crs_login_email(text) no existe; se omite.';
  end if;

  -- Función de trigger: no necesita estar expuesta directamente a clientes.
  if to_regprocedure('public.crs_touch_updated_at()') is not null then
    execute 'revoke all on function public.crs_touch_updated_at() from public';
    execute 'revoke all on function public.crs_touch_updated_at() from anon';
    execute 'revoke all on function public.crs_touch_updated_at() from authenticated';
  else
    raise notice 'crs_touch_updated_at() no existe; se omite.';
  end if;
end
$hardening$;

commit;

-- Verificación manual opcional en Supabase:
-- select routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name like 'crs_%'
-- order by routine_name, grantee;
