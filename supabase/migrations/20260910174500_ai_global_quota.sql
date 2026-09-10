-- MASTER Urgencias HPH
-- Endurecimiento de cuota de MASTER IA.
-- Mantiene la firma RPC existente para no romper la Edge Function desplegada.
-- La cuota por client_hash sigue existiendo, pero deja de ser la única barrera:
-- además se aplica un máximo global atómico de 250 solicitudes generativas por día.
--
-- IMPORTANTE: migración preparada; no implica desplegar la Edge Function de la rama.

begin;

create table if not exists public.crs_ai_global_usage (
  day date primary key default current_date,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.crs_ai_global_usage enable row level security;

revoke all on table public.crs_ai_global_usage from public, anon, authenticated;
grant select on table public.crs_ai_global_usage to service_role;

-- Si el corte ocurre con consumo ya registrado durante el día, el contador global
-- parte al menos desde ese consumo en vez de regalar una segunda cuota completa.
insert into public.crs_ai_global_usage(day, request_count, updated_at)
select current_date, coalesce(sum(request_count), 0)::integer, now()
from public.crs_ai_daily_usage
where day = current_date
on conflict (day) do update
set request_count = greatest(
      public.crs_ai_global_usage.request_count,
      excluded.request_count
    ),
    updated_at = now();

create or replace function public.crs_take_ai_quota(
  p_client_hash text,
  p_limit integer default 250
)
returns table(allowed boolean, remaining integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  client_count integer;
  global_count integer;
  safe_client_limit integer := greatest(1, least(coalesce(p_limit, 250), 1000));
  global_daily_limit constant integer := 250;
begin
  -- MASTER IA siempre entrega un SHA-256 hexadecimal. Rechazar otros formatos
  -- reduce la superficie del SECURITY DEFINER y evita claves arbitrarias.
  if p_client_hash is null or p_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid client hash';
  end if;

  insert into public.crs_ai_daily_usage(day, client_hash, request_count, updated_at)
  values (current_date, p_client_hash, 1, now())
  on conflict (day, client_hash)
  do update set
    request_count = public.crs_ai_daily_usage.request_count + 1,
    updated_at = now()
  returning request_count into client_count;

  -- Una identidad ya bloqueada por su cuota local no debe poder agotar el contador
  -- global repitiendo solicitudes que de todos modos no llegarán al proveedor.
  if client_count > safe_client_limit then
    return query select false, 0;
    return;
  end if;

  insert into public.crs_ai_global_usage(day, request_count, updated_at)
  values (current_date, 1, now())
  on conflict (day)
  do update set
    request_count = public.crs_ai_global_usage.request_count + 1,
    updated_at = now()
  returning request_count into global_count;

  return query
  select
    global_count <= global_daily_limit,
    greatest(
      least(
        safe_client_limit - client_count,
        global_daily_limit - global_count
      ),
      0
    );
end;
$$;

revoke all on function public.crs_take_ai_quota(text, integer) from public;
revoke execute on function public.crs_take_ai_quota(text, integer) from anon, authenticated;
grant execute on function public.crs_take_ai_quota(text, integer) to service_role;

commit;
