-- =====================================================================
-- Portal TIC Docente · 1. Tablas
-- Ejecutar en orden: 1 tablas → 2 seguridad (RLS) → 3 storage.
-- Los textos de las listas (áreas, grados, tipos) deben coincidir con
-- packages/shared/src/catalogos.ts.
-- =====================================================================

-- ---------- Tipos con valores fijos ----------
create type public.rol as enum ('docente', 'dinamizadora', 'gestion');
create type public.estado_recurso as enum ('en_revision', 'publicado', 'rechazado');
create type public.nivel_tic as enum ('basico', 'intermedio', 'avanzado');
create type public.tipo_solicitud as enum (
  'acompanamiento', 'problema_tecnico', 'reserva_laboratorio', 'reserva_kits', 'reserva_laptops'
);
create type public.estado_solicitud as enum ('pendiente', 'en_proceso', 'resuelta');

-- ---------- Catálogos como funciones (una sola lista para todas las tablas) ----------
create function public.es_area_valida(valor text) returns boolean
language sql immutable as $$
  select valor in (
    'Lengua Española', 'Matemática', 'Ciencias Sociales', 'Ciencias de la Naturaleza',
    'Inglés', 'Francés', 'Educación Artística', 'Educación Física',
    'Formación Integral Humana y Religiosa', 'Todas las áreas'
  )
$$;

create function public.es_grado_valido(valor text) returns boolean
language sql immutable as $$
  select valor in (
    '1.º Secundaria', '2.º Secundaria', '3.º Secundaria',
    '4.º Secundaria', '5.º Secundaria', '6.º Secundaria', 'Todos los grados'
  )
$$;

create function public.es_tipo_recurso_valido(valor text) returns boolean
language sql immutable as $$
  select valor in (
    'Guía', 'Video', 'Plantilla', 'Presentación', 'Tutorial',
    'Proyecto de robótica', 'Ciudadanía digital', 'Herramienta web'
  )
$$;

-- ---------- 1. profiles: un perfil por usuario de Supabase Auth ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  correo text not null default '',
  area text check (area is null or public.es_area_valida(area)),
  rol public.rol not null default 'docente',
  created_at timestamptz not null default now()
);

-- ---------- 2. recursos ----------
create table public.recursos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(trim(titulo)) > 0),
  area text not null check (public.es_area_valida(area)),
  grado text not null check (public.es_grado_valido(grado)),
  tipo text not null check (public.es_tipo_recurso_valido(tipo)),
  estado public.estado_recurso not null default 'en_revision',
  enlace_o_archivo text not null,
  descripcion text,
  competencias text,
  tema_unidad text,
  herramienta text,
  duracion text,
  nivel_tic public.nivel_tic,
  autor text,
  fuente text,
  licencia text,
  etiquetas text[] not null default '{}',
  fecha_registro date not null default current_date,
  bien_clasificado boolean not null default false,
  enlace_funciona boolean not null default false,
  derechos_uso boolean not null default false,
  util_aula boolean not null default false,
  creado_por uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index recursos_estado_idx on public.recursos (estado);

-- ---------- 3. proyectos_robotica ----------
create table public.proyectos_robotica (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (length(trim(titulo)) > 0),
  area text not null check (public.es_area_valida(area)),
  grado text not null check (public.es_grado_valido(grado)),
  competencias text,
  materiales text,
  pasos text,
  foto_url text,
  estado public.estado_recurso not null default 'en_revision',
  created_at timestamptz not null default now()
);

-- ---------- 4. solicitudes ----------
create table public.solicitudes (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  tipo public.tipo_solicitud not null,
  fecha_deseada date,
  detalle text not null check (length(trim(detalle)) > 0),
  estado public.estado_solicitud not null default 'pendiente',
  created_at timestamptz not null default now()
);
create index solicitudes_docente_idx on public.solicitudes (docente_id);
create index solicitudes_estado_idx on public.solicitudes (estado);

-- ---------- 5. Tablas para más adelante (en la interfaz: "Próximamente") ----------
create table public.talleres (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descripcion text,
  fecha timestamptz,
  lugar text,
  cupo integer check (cupo is null or cupo > 0),
  created_at timestamptz not null default now()
);

create table public.inscripciones (
  id uuid primary key default gen_random_uuid(),
  taller_id uuid not null references public.talleres (id) on delete cascade,
  docente_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (taller_id, docente_id)
);

create table public.acompanamientos (
  id uuid primary key default gen_random_uuid(),
  docente_id uuid not null references public.profiles (id) on delete cascade,
  fecha date not null default current_date,
  tema text,
  observaciones text,
  created_at timestamptz not null default now()
);

create table public.inventario (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text,
  cantidad integer not null default 1 check (cantidad >= 0),
  estado text,
  ubicacion text,
  created_at timestamptz not null default now()
);

create table public.incidencias (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid references public.inventario (id) on delete set null,
  descripcion text not null,
  estado public.estado_solicitud not null default 'pendiente',
  reportado_por uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.plan_trabajo (
  id uuid primary key default gen_random_uuid(),
  actividad text not null,
  responsable text,
  fecha_inicio date,
  fecha_fin date,
  estado text,
  created_at timestamptz not null default now()
);

-- ---------- Perfil automático al registrarse (siempre como docente) ----------
-- Toma nombre y área de los datos que envía el formulario de registro.
-- Si el área no es válida queda vacía, para que el registro nunca falle.
create function public.crear_perfil_nuevo_usuario() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_area text := nullif(trim(new.raw_user_meta_data ->> 'area'), '');
begin
  if v_area is not null and not public.es_area_valida(v_area) then
    v_area := null;
  end if;
  insert into public.profiles (id, nombre, correo, area, rol)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nombre'), ''), split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    v_area,
    'docente'
  );
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();
