create table if not exists public.crs_ai_daily_usage (
  day date not null default current_date,
  client_hash text not null,
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (day, client_hash)
);

alter table public.crs_ai_daily_usage enable row level security;
revoke all on table public.crs_ai_daily_usage from public, anon, authenticated;

drop function if exists public.crs_take_ai_quota(text, integer);
create function public.crs_take_ai_quota(p_client_hash text, p_limit integer default 250)
returns table(allowed boolean, remaining integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
  safe_limit integer := greatest(1, least(coalesce(p_limit, 250), 1000));
begin
  if p_client_hash is null or length(trim(p_client_hash)) < 16 then
    raise exception 'invalid client hash';
  end if;

  insert into public.crs_ai_daily_usage(day, client_hash, request_count, updated_at)
  values (current_date, p_client_hash, 1, now())
  on conflict (day, client_hash)
  do update set
    request_count = public.crs_ai_daily_usage.request_count + 1,
    updated_at = now()
  returning request_count into new_count;

  return query select
    new_count <= safe_limit,
    greatest(safe_limit - new_count, 0);
end;
$$;

revoke all on function public.crs_take_ai_quota(text, integer) from public, anon, authenticated;
grant execute on function public.crs_take_ai_quota(text, integer) to service_role;

comment on table public.crs_ai_daily_usage is 'Contador diario de uso de MASTER IA por identificador de red seudonimizado; no almacena preguntas ni datos clínicos.';
comment on function public.crs_take_ai_quota(text, integer) is 'Incrementa y valida la cuota diaria de MASTER IA. Solo service_role.';
