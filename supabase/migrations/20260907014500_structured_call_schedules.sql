alter table public.crs_call_schedules
  add column if not exists schedule_date date,
  add column if not exists source_document_key text,
  add column if not exists source_updated_at timestamptz;

create index if not exists crs_call_schedules_date_specialty_idx
  on public.crs_call_schedules (schedule_date, specialty)
  where status = 'published' and type = 'especialistas';

create index if not exists crs_call_schedules_source_idx
  on public.crs_call_schedules (source_document_key, source_updated_at);

comment on column public.crs_call_schedules.schedule_date is
  'Fecha calendario de una asignación de la rotativa mensual.';
comment on column public.crs_call_schedules.source_document_key is
  'Clave del documento vigente que originó la asignación estructurada.';
comment on column public.crs_call_schedules.source_updated_at is
  'Marca de actualización del documento fuente usado para indexar la asignación.';
