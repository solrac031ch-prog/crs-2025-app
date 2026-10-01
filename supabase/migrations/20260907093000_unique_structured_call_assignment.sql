create unique index if not exists crs_call_schedules_unique_assignment_idx
  on public.crs_call_schedules (type, schedule_date, specialty, source_document_key)
  where status = 'published'
    and type = 'especialistas'
    and schedule_date is not null
    and source_document_key is not null;
