-- =====================================================================
-- Portal TIC Docente · 3. Storage (archivos)
--   recursos  archivos que comparten los docentes (PDF, Word, PowerPoint ≤ 10 MB).
--             Cada usuario sube solo dentro de su carpeta: recursos/<su id>/archivo.
--   robotica  fotos de los proyectos (≤ 5 MB). Solo la dinamizadora sube.
-- Ambos son públicos para LEER (la app guarda la URL pública del archivo).
-- Los videos y las herramientas web NO se suben: se guardan como enlace.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('recursos', 'recursos', true, 10485760, array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]),
  ('robotica', 'robotica', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- ---------- recursos ----------
create policy "archivos recursos: cada uno sube en su carpeta"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'recursos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "archivos recursos: el dueño o la dinamizadora borran"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'recursos'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.es_dinamizadora()))
  );

-- ---------- robotica ----------
create policy "fotos robotica: la dinamizadora sube"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'robotica' and (select public.es_dinamizadora()));

create policy "fotos robotica: la dinamizadora cambia"
  on storage.objects for update to authenticated
  using (bucket_id = 'robotica' and (select public.es_dinamizadora()))
  with check (bucket_id = 'robotica' and (select public.es_dinamizadora()));

create policy "fotos robotica: la dinamizadora borra"
  on storage.objects for delete to authenticated
  using (bucket_id = 'robotica' and (select public.es_dinamizadora()));
