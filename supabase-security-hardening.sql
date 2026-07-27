-- CRS HPH 2025 - hardening de permisos Supabase
-- Ejecutar una vez en Supabase > SQL Editor después de supabase-setup.sql.
--
-- PostgreSQL concede EXECUTE sobre funciones nuevas a PUBLIC por defecto.
-- Este archivo revoca ese permiso implícito y deja sólo los roles necesarios.

begin;

-- Función interna: sólo debe ser utilizada por otras funciones/políticas del esquema.
revoke all on function public.crs_allowed_admin_role(text) from public;
revoke all on function public.crs_allowed_admin_role(text) from anon;
revoke all on function public.crs_allowed_admin_role(text) from authenticated;

-- Función de autorización usada por políticas RLS.
revoke all on function public.crs_is_admin() from public;
grant execute on function public.crs_is_admin() to anon, authenticated;

-- Resolución usuario/correo para el login. Se mantiene disponible sólo para los roles web.
revoke all on function public.crs_login_email(text) from public;
grant execute on function public.crs_login_email(text) to anon, authenticated;

-- Función de trigger: no necesita estar expuesta directamente a clientes.
revoke all on function public.crs_touch_updated_at() from public;
revoke all on function public.crs_touch_updated_at() from anon;
revoke all on function public.crs_touch_updated_at() from authenticated;

commit;

-- Verificación manual opcional en Supabase:
-- select routine_name, grantee, privilege_type
-- from information_schema.routine_privileges
-- where routine_schema = 'public'
--   and routine_name like 'crs_%'
-- order by routine_name, grantee;
