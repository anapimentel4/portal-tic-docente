-- =====================================================================
-- Portal TIC Docente · 7. Muro colaborativo (Talleres, tipo Padlet)
--
-- Agregado (pedido el 24-nov): la dinamizadora crea un muro con una pregunta;
-- los docentes escanean el QR y publican desde el celular con su nombre,
-- SIN iniciar sesión. Las publicaciones aparecen enseguida en el muro proyectado.
--
-- Reglas:
--   - Todos (con o sin sesión) ven los muros y las publicaciones visibles.
--   - Todos pueden publicar, pero solo en un muro abierto, solo nombre,
--     categoría y texto (no pueden poner "me gusta" ni ocultar), y hasta 300
--     publicaciones por muro.
--   - Solo la dinamizadora crea, abre, cierra y borra muros, y oculta o borra
--     publicaciones. Ella ve también las ocultas.
--   - "Me gusta": solo con la función me_gusta(), que suma o resta 1.
-- =====================================================================

-- Código corto para el enlace y el QR, sin letras que se confunden (0/O, 1/I/L).
create function public.nuevo_codigo_muro() returns text
language sql volatile set search_path = '' as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1), '')
  from generate_series(1, 6)
$$;

create table public.muros (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique default public.nuevo_codigo_muro(),
  pregunta text not null check (char_length(trim(pregunta)) between 3 and 200),
  abierto boolean not null default true,
  creado_por uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.muro_publicaciones (
  id uuid primary key default gen_random_uuid(),
  muro_id uuid not null references public.muros (id) on delete cascade,
  nombre text not null check (char_length(trim(nombre)) between 2 and 60),
  categoria text not null check (categoria in ('Juegos', 'Canciones', 'Speaking', 'Vocabulario', 'Otra idea')),
  texto text not null check (char_length(trim(texto)) between 3 and 280),
  likes integer not null default 0 check (likes >= 0),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index muro_publicaciones_muro on public.muro_publicaciones (muro_id, created_at desc);

-- ---------- Límites al publicar (también aplican si alguien salta la página) ----------
create function public.controlar_publicacion_muro() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.muros where id = new.muro_id and abierto) then
    raise exception 'Este muro está cerrado: ya no recibe publicaciones.' using errcode = 'P0001';
  end if;
  if (select count(*) from public.muro_publicaciones where muro_id = new.muro_id) >= 300 then
    raise exception 'Este muro ya tiene el máximo de 300 publicaciones.' using errcode = 'P0001';
  end if;
  new.nombre := trim(new.nombre);
  new.texto := trim(new.texto);
  -- Sin cuenta no se elige: siempre empieza visible y sin "me gusta".
  if auth.uid() is null or not public.is_dinamizadora() then
    new.likes := 0;
    new.visible := true;
  end if;
  return new;
end;
$$;

create trigger controlar_publicacion_muro
  before insert on public.muro_publicaciones
  for each row execute function public.controlar_publicacion_muro();

-- ---------- "Me gusta" (suma o resta 1; nunca baja de 0) ----------
create function public.me_gusta(publicacion uuid, sumar boolean default true) returns integer
language sql volatile security definer set search_path = '' as $$
  update public.muro_publicaciones
  set likes = greatest(0, likes + case when sumar then 1 else -1 end)
  where id = publicacion and visible
  returning likes
$$;
revoke execute on function public.me_gusta(uuid, boolean) from public;
grant execute on function public.me_gusta(uuid, boolean) to anon, authenticated;

-- ---------- Permisos base (RLS decide fila por fila) ----------
revoke all on public.muros, public.muro_publicaciones from anon, authenticated;
grant select on public.muros, public.muro_publicaciones to anon, authenticated;
grant insert, update, delete on public.muros to authenticated;
-- Al publicar solo se escriben estas 4 columnas.
grant insert (muro_id, nombre, categoria, texto) on public.muro_publicaciones to anon, authenticated;
grant update (visible), delete on public.muro_publicaciones to authenticated;

alter table public.muros enable row level security;
alter table public.muro_publicaciones enable row level security;

-- ---------- muros ----------
create policy "muros: todos los ven"
  on public.muros for select to anon, authenticated
  using (true);
create policy "muros: la dinamizadora los crea"
  on public.muros for insert to authenticated
  with check ((select public.is_dinamizadora()));
create policy "muros: la dinamizadora los cambia"
  on public.muros for update to authenticated
  using ((select public.is_dinamizadora()))
  with check ((select public.is_dinamizadora()));
create policy "muros: la dinamizadora los borra"
  on public.muros for delete to authenticated
  using ((select public.is_dinamizadora()));

-- ---------- muro_publicaciones ----------
create policy "muro: todos ven las visibles; la dinamizadora, todas"
  on public.muro_publicaciones for select to anon, authenticated
  using (visible or (select public.is_dinamizadora()));
create policy "muro: todos publican en un muro abierto"
  on public.muro_publicaciones for insert to anon, authenticated
  with check (exists (select 1 from public.muros m where m.id = muro_id and m.abierto));
create policy "muro: la dinamizadora oculta o muestra"
  on public.muro_publicaciones for update to authenticated
  using ((select public.is_dinamizadora()))
  with check ((select public.is_dinamizadora()));
create policy "muro: la dinamizadora borra"
  on public.muro_publicaciones for delete to authenticated
  using ((select public.is_dinamizadora()));
