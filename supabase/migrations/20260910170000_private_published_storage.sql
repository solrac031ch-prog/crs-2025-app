-- MASTER Urgencias HPH
-- Fase 2 del cutover de Storage.
-- IMPORTANTE: aplicar sólo después de publicar el frontend que usa createSignedUrl().
-- El cambio no mueve ni elimina objetos. Los archivos archivados dejan de poder
-- obtener nuevas URLs firmadas; una URL firmada emitida antes del archivado puede
-- seguir funcionando hasta su expiración (15 minutos en el frontend actual).

begin;

-- Las URLs públicas históricas son derivadas de file_path y dejan de ser la fuente
-- canónica. Se limpian sólo cuando apuntan al bucket Storage de este mismo proyecto.
update public.crs_content_items
set url = null
where file_path is not null
  and url like 'https://mjrcymctfnnyabvmfgda.supabase.co/storage/v1/object/public/crs-public/%';

update public.crs_documents
set url = null
where file_path is not null
  and url like 'https://mjrcymctfnnyabvmfgda.supabase.co/storage/v1/object/public/crs-public/%';

update public.crs_flows
set url = null
where file_path is not null
  and url like 'https://mjrcymctfnnyabvmfgda.supabase.co/storage/v1/object/public/crs-public/%';

-- El bucket pasa a privado. La descarga directa deja de saltarse RLS.
update storage.buckets
set public = false
where id = 'crs-public';

-- Sustituye la lectura global por una política ligada al estado publicado.
drop policy if exists crs_storage_public_read on storage.objects;
drop policy if exists crs_storage_published_read on storage.objects;

create policy crs_storage_published_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'crs-public'
  and (
    exists (
      select 1
      from public.crs_content_items c
      where c.file_path = storage.objects.name
        and c.status = 'published'
    )
    or exists (
      select 1
      from public.crs_documents d
      where d.file_path = storage.objects.name
        and d.status = 'published'
    )
    or exists (
      select 1
      from public.crs_flows f
      where f.file_path = storage.objects.name
        and f.status = 'published'
    )
  )
);

commit;
