-- =====================================================================
-- Portal TIC Docente · 2. Seguridad (Row Level Security)
-- Quién puede ver y cambiar qué. Esta es la protección real: aunque alguien
-- salte las pantallas del frontend, Postgres aplica estas reglas.
--
--   docente       ve lo publicado, crea solicitudes y propone recursos;
--                 solo ve SUS solicitudes y SUS recursos propuestos.
--   dinamizadora  lo gestiona todo.
--   gestion       solo lectura (panel e indicadores).
--   anon          (sin sesión) solo ve recursos y proyectos publicados.
-- =====================================================================

-- ---------- Funciones de rol ----------
-- security definer: leen profiles sin pasar por su RLS (evita reglas circulares).
create function public.rol_actual() returns public.rol
language sql stable security definer set search_path = '' as $$
  select rol from public.profiles where id = auth.uid()
$$;

create function public.es_dinamizadora() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.rol_actual() = 'dinamizadora', false)
$$;

create function public.puede_ver_panel() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.rol_actual() in ('dinamizadora', 'gestion'), false)
$$;

-- ---------- Nadie se cambia su propio rol ni su correo ----------
-- Solo la dinamizadora, o el editor SQL de Supabase (ahí no hay usuario: auth.uid() es null).
create function public.proteger_rol_y_correo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (new.rol is distinct from old.rol or new.correo is distinct from old.correo or new.id is distinct from old.id)
     and auth.uid() is not null
     and not public.es_dinamizadora() then
    raise exception 'Solo la dinamizadora puede cambiar el rol o el correo de un perfil.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger proteger_rol_y_correo
  before update on public.profiles
  for each row execute function public.proteger_rol_y_correo();

-- ---------- Permisos base (RLS decide fila por fila) ----------
grant usage on schema public to anon, authenticated;
grant select on public.recursos, public.proyectos_robotica to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- ---------- Activar RLS en todas las tablas ----------
alter table public.profiles enable row level security;
alter table public.recursos enable row level security;
alter table public.proyectos_robotica enable row level security;
alter table public.solicitudes enable row level security;
alter table public.talleres enable row level security;
alter table public.inscripciones enable row level security;
alter table public.acompanamientos enable row level security;
alter table public.inventario enable row level security;
alter table public.incidencias enable row level security;
alter table public.plan_trabajo enable row level security;

-- ---------- profiles ----------
create policy "perfil: cada uno ve el suyo; panel ve todos"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.puede_ver_panel()));

create policy "perfil: cada uno edita el suyo; la dinamizadora, todos"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) or (select public.es_dinamizadora()))
  with check (id = (select auth.uid()) or (select public.es_dinamizadora()));
-- No hay insert (lo hace el trigger al registrarse) ni delete (se borra con la cuenta).

-- ---------- recursos ----------
create policy "recursos: todos ven los publicados"
  on public.recursos for select to anon, authenticated
  using (estado = 'publicado');

create policy "recursos: el autor ve los suyos; panel ve todos"
  on public.recursos for select to authenticated
  using (creado_por = (select auth.uid()) or (select public.puede_ver_panel()));

create policy "recursos: el docente propone (queda en revisión)"
  on public.recursos for insert to authenticated
  with check (
    (select public.es_dinamizadora())
    or (
      creado_por = (select auth.uid())
      and estado = 'en_revision'
      and not (bien_clasificado or enlace_funciona or derechos_uso or util_aula)
    )
  );

create policy "recursos: solo la dinamizadora edita"
  on public.recursos for update to authenticated
  using ((select public.es_dinamizadora()))
  with check ((select public.es_dinamizadora()));

create policy "recursos: solo la dinamizadora borra"
  on public.recursos for delete to authenticated
  using ((select public.es_dinamizadora()));

-- ---------- proyectos_robotica ----------
create policy "robotica: todos ven los publicados"
  on public.proyectos_robotica for select to anon, authenticated
  using (estado = 'publicado');

create policy "robotica: panel ve todos"
  on public.proyectos_robotica for select to authenticated
  using ((select public.puede_ver_panel()));

create policy "robotica: la dinamizadora gestiona"
  on public.proyectos_robotica for all to authenticated
  using ((select public.es_dinamizadora()))
  with check ((select public.es_dinamizadora()));

-- ---------- solicitudes ----------
create policy "solicitudes: el docente ve las suyas; panel ve todas"
  on public.solicitudes for select to authenticated
  using (docente_id = (select auth.uid()) or (select public.puede_ver_panel()));

create policy "solicitudes: cada uno crea las suyas (pendientes)"
  on public.solicitudes for insert to authenticated
  with check (docente_id = (select auth.uid()) and estado = 'pendiente');

create policy "solicitudes: solo la dinamizadora cambia el estado"
  on public.solicitudes for update to authenticated
  using ((select public.es_dinamizadora()))
  with check ((select public.es_dinamizadora()));

create policy "solicitudes: solo la dinamizadora borra"
  on public.solicitudes for delete to authenticated
  using ((select public.es_dinamizadora()));

-- ---------- Tablas "Próximamente" ----------
-- talleres: los docentes los ven; la dinamizadora los gestiona.
create policy "talleres: usuarios con sesión los ven"
  on public.talleres for select to authenticated using (true);
create policy "talleres: la dinamizadora gestiona"
  on public.talleres for all to authenticated
  using ((select public.es_dinamizadora())) with check ((select public.es_dinamizadora()));

-- inscripciones: cada docente maneja las suyas.
create policy "inscripciones: el docente ve las suyas; panel ve todas"
  on public.inscripciones for select to authenticated
  using (docente_id = (select auth.uid()) or (select public.puede_ver_panel()));
create policy "inscripciones: el docente se inscribe"
  on public.inscripciones for insert to authenticated
  with check (docente_id = (select auth.uid()) or (select public.es_dinamizadora()));
create policy "inscripciones: el docente se da de baja"
  on public.inscripciones for delete to authenticated
  using (docente_id = (select auth.uid()) or (select public.es_dinamizadora()));

-- acompanamientos: el docente ve los suyos.
create policy "acompanamientos: el docente ve los suyos; panel ve todos"
  on public.acompanamientos for select to authenticated
  using (docente_id = (select auth.uid()) or (select public.puede_ver_panel()));
create policy "acompanamientos: la dinamizadora gestiona"
  on public.acompanamientos for all to authenticated
  using ((select public.es_dinamizadora())) with check ((select public.es_dinamizadora()));

-- inventario, incidencias y plan_trabajo: panel lee; la dinamizadora gestiona.
create policy "inventario: panel lee" on public.inventario for select to authenticated
  using ((select public.puede_ver_panel()));
create policy "inventario: la dinamizadora gestiona" on public.inventario for all to authenticated
  using ((select public.es_dinamizadora())) with check ((select public.es_dinamizadora()));

create policy "incidencias: panel lee" on public.incidencias for select to authenticated
  using ((select public.puede_ver_panel()));
create policy "incidencias: la dinamizadora gestiona" on public.incidencias for all to authenticated
  using ((select public.es_dinamizadora())) with check ((select public.es_dinamizadora()));

create policy "plan_trabajo: panel lee" on public.plan_trabajo for select to authenticated
  using ((select public.puede_ver_panel()));
create policy "plan_trabajo: la dinamizadora gestiona" on public.plan_trabajo for all to authenticated
  using ((select public.es_dinamizadora())) with check ((select public.es_dinamizadora()));

-- ---------- Indicadores del panel (una sola llamada) ----------
-- La app la llama con supabase.rpc('indicadores_panel'). Solo dinamizadora y gestión.
create function public.indicadores_panel() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.puede_ver_panel() then
    raise exception 'No tienes permiso para ver los indicadores.' using errcode = '42501';
  end if;
  return json_build_object(
    'total_recursos', (select count(*) from public.recursos),
    'publicados', (select count(*) from public.recursos where estado = 'publicado'),
    'en_revision', (select count(*) from public.recursos where estado = 'en_revision'),
    'solicitudes_pendientes', (select count(*) from public.solicitudes where estado = 'pendiente'),
    'docentes_registrados', (select count(*) from public.profiles where rol = 'docente')
  );
end;
$$;

revoke execute on function public.indicadores_panel() from public, anon;
grant execute on function public.indicadores_panel() to authenticated;
