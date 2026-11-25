// Prueba las migraciones (tablas, RLS y storage) en un Postgres en memoria (PGlite),
// simulando lo mínimo de Supabase: auth.users, auth.uid(), roles anon/authenticated y storage.
// Ejecutar desde la raíz:  pnpm test:rls
import { PGlite } from '@electric-sql/pglite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const MIG = new URL("../migrations", import.meta.url).pathname;
const db = new PGlite();

await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as
    $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant usage on schema auth, storage to anon, authenticated;
  grant select, insert, update, delete on storage.objects to authenticated;
`);

for (const f of readdirSync(MIG).filter((f) => f.endsWith('.sql')).sort()) {
  await db.exec(readFileSync(join(MIG, f), 'utf8'));
  console.log('migración OK:', f);
}

let fallos = 0;
const ok = (cond, texto) => {
  console.log(`${cond ? '  ✓' : '  ✗ FALLA'} ${texto}`);
  if (!cond) fallos++;
};

/** Ejecuta como un usuario (uid) o como anon (uid = null), dentro de una transacción. */
async function como(uid, sql, params = []) {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid ?? '']);
    await tx.exec(`set local role ${uid ? 'authenticated' : 'anon'}`);
    return tx.query(sql, params);
  });
}
async function falla(uid, sql, params = []) {
  try {
    await como(uid, sql, params);
    return false;
  } catch {
    return true;
  }
}

// ---------- Usuarios ----------
const crear = async (correo, meta) =>
  (await db.query(`insert into auth.users (email, raw_user_meta_data) values ($1, $2) returning id`, [correo, meta])).rows[0].id;
const ana = await crear('ana@centro.do', { nombre: 'Ana', area: 'Matemática' });
const luis = await crear('luis@centro.do', { nombre: 'Luis', area: 'Área inventada' });
const geo = await crear('gestion@centro.do', {});

console.log('\nRegistro');
const perfiles = (await db.query(`select correo, nombre, area, rol from public.profiles order by correo`)).rows;
ok(perfiles.every((p) => p.rol === 'docente'), 'todo usuario nuevo empieza como docente');
ok(perfiles.find((p) => p.correo === 'luis@centro.do').area === null, 'un área inválida queda vacía y el registro no falla');
ok(perfiles.find((p) => p.correo === 'gestion@centro.do').nombre === 'gestion', 'sin nombre usa la parte del correo');

console.log('\nRoles');
ok(await falla(ana, `update public.profiles set rol = 'dinamizadora' where id = $1`, [ana]), 'un docente NO se cambia el rol');
ok((await como(ana, `update public.profiles set nombre = 'Ana P.' where id = $1`, [ana])).affectedRows === 1, 'un docente sí edita su nombre');
ok((await como(ana, `update public.profiles set nombre = 'x' where id = $1`, [luis])).affectedRows === 0, 'un docente NO edita el perfil de otro');
ok((await como(ana, `select * from public.profiles`)).rows.length === 1, 'un docente solo ve su perfil');
// Desde el editor SQL (sin usuario) sí se puede: así se nombra la primera dinamizadora.
await db.query(`update public.profiles set rol = 'dinamizadora' where id = $1`, [ana]);
ok((await como(ana, `update public.profiles set rol = 'gestion' where id = $1`, [geo])).affectedRows === 1, 'la dinamizadora cambia el rol de otro');
ok((await como(geo, `select * from public.profiles`)).rows.length === 3, 'gestión ve todos los perfiles');

console.log('\nRecursos');
const CHEQUEOS = 'bien_clasificado = true, enlace_funciona = true, derechos_uso = true, util_aula = true';
await db.query(`insert into public.recursos (titulo, area, grado, tipo, estado, enlace_o_archivo, bien_clasificado, enlace_funciona, derechos_uso, util_aula) values
  ('Publicado', 'Matemática', '1.º Secundaria', 'Guía', 'publicado', 'https://a', true, true, true, true),
  ('Rechazado', 'Matemática', '1.º Secundaria', 'Guía', 'rechazado', 'https://b', false, false, false, false)`);
ok((await como(null, `select titulo from public.recursos`)).rows.length === 1, 'sin sesión solo se ven los publicados');
ok(await falla(null, `insert into public.recursos (titulo, area, grado, tipo, enlace_o_archivo) values ('x','Matemática','1.º Secundaria','Guía','https://x')`), 'sin sesión NO se proponen recursos');
const insertar = (estado, check = false) =>
  como(luis, `insert into public.recursos (titulo, area, grado, tipo, estado, enlace_o_archivo, util_aula)
              values ('De Luis', 'Inglés', 'Todos los grados', 'Video', $1, 'https://v', $2) returning id, creado_por`, [estado, check]);
const propuesto = (await insertar('en_revision')).rows[0];
ok(propuesto.creado_por === luis, 'un docente propone un recurso (queda en revisión, con su id)');
ok(await falla(luis, `insert into public.recursos (titulo, area, grado, tipo, estado, enlace_o_archivo) values ('x','Inglés','Todos los grados','Video','publicado','https://x')`), 'un docente NO publica directamente');
ok(await falla(luis, `insert into public.recursos (titulo, area, grado, tipo, enlace_o_archivo, util_aula) values ('x','Inglés','Todos los grados','Video','https://x', true)`), 'un docente NO marca el checklist');
ok(await falla(luis, `insert into public.recursos (titulo, area, grado, tipo, enlace_o_archivo) values ('x','Inglés','7.º','Video','https://x')`), 'un grado fuera del catálogo se rechaza');
ok((await como(luis, `select titulo from public.recursos`)).rows.length === 2, 'el docente ve los publicados + el suyo en revisión');
ok((await como(luis, `update public.recursos set estado = 'publicado' where id = $1`, [propuesto.id])).affectedRows === 0, 'un docente NO aprueba');
ok((await como(geo, `select * from public.recursos`)).rows.length === 3, 'gestión ve todos los recursos');
ok((await como(geo, `update public.recursos set estado = 'publicado' where id = $1`, [propuesto.id])).affectedRows === 0, 'gestión NO edita (solo lectura)');
ok(await falla(ana, `update public.recursos set estado = 'publicado' where id = $1`, [propuesto.id]), 'NI la dinamizadora publica sin las 4 comprobaciones');
ok(await falla(ana, `update public.recursos set estado = 'publicado', bien_clasificado = true, enlace_funciona = true, derechos_uso = true where id = $1`, [propuesto.id]), 'con 3 de 4 comprobaciones tampoco se publica');
ok((await como(ana, `update public.recursos set estado = 'publicado', ${CHEQUEOS} where id = $1`, [propuesto.id])).affectedRows === 1, 'la dinamizadora aprueba con el checklist completo');

// "Aprobar seleccionados" (panel): un solo update para varios. Se borran al final para no cambiar los conteos de abajo.
const [completo, incompleto] = (await db.query(`insert into public.recursos (titulo, area, grado, tipo, enlace_o_archivo, bien_clasificado, enlace_funciona, derechos_uso, util_aula) values
  ('Lote completo', 'Matemática', '1.º Secundaria', 'Guía', 'https://lote1', true, true, true, true),
  ('Lote incompleto', 'Matemática', '1.º Secundaria', 'Guía', 'https://lote2', true, true, true, false) returning id`)).rows.map((r) => r.id);
ok(await falla(ana, `update public.recursos set estado = 'publicado' where id = any($1)`, [[completo, incompleto]]), 'aprobar seleccionados falla entero si uno no tiene las 4 comprobaciones');
ok((await db.query(`select count(*)::int as n from public.recursos where id = any($1) and estado = 'publicado'`, [[completo, incompleto]])).rows[0].n === 0, '…y no deja ninguno publicado a medias');
ok((await como(ana, `update public.recursos set estado = 'publicado' where id = any($1)`, [[completo]])).affectedRows === 1, 'aprobar seleccionados funciona con los completos');
ok((await como(geo, `update public.recursos set estado = 'en_revision' where id = any($1)`, [[completo]])).affectedRows === 0, 'gestión NO aprueba ni devuelve en lote');
await db.query(`delete from public.recursos where id = any($1)`, [[completo, incompleto]]);

console.log('\nSolicitudes');
const sol = (await como(luis, `insert into public.solicitudes (tipo, detalle) values ('problema_tecnico', 'No enciende el proyector') returning id, docente_id, estado`)).rows[0];
ok(sol.docente_id === luis && sol.estado === 'pendiente', 'un docente crea su solicitud (pendiente)');
ok(await falla(luis, `insert into public.solicitudes (tipo, detalle, estado) values ('acompanamiento', 'x', 'resuelta')`), 'un docente NO la crea ya resuelta');
ok(await falla(luis, `insert into public.solicitudes (tipo, detalle, docente_id) values ('acompanamiento', 'x', $1)`, [geo]), 'un docente NO la crea a nombre de otro');
ok((await como(null, `select 1`).then(() => falla(null, `select * from public.solicitudes`))), 'sin sesión NO se leen solicitudes');
await db.query(`update public.profiles set rol = 'docente' where id = $1`, [geo]);
ok((await como(geo, `select * from public.solicitudes`)).rows.length === 0, 'otro docente NO ve solicitudes ajenas');
await db.query(`update public.profiles set rol = 'gestion' where id = $1`, [geo]);
ok((await como(luis, `update public.solicitudes set estado = 'resuelta' where id = $1`, [sol.id])).affectedRows === 0, 'un docente NO cambia el estado');
ok((await como(geo, `update public.solicitudes set estado = 'resuelta' where id = $1`, [sol.id])).affectedRows === 0, 'gestión NO cambia el estado');
ok((await como(geo, `select s.id, p.nombre from public.solicitudes s join public.profiles p on p.id = s.docente_id`)).rows[0]?.nombre === 'Luis', 'gestión ve las solicitudes con el nombre del docente (tabla del panel)');
ok((await como(luis, `select * from public.solicitudes where docente_id = $1`, [luis])).rows.length === 1, 'el docente ve las suyas en «Mis solicitudes»');
ok((await como(ana, `update public.solicitudes set estado = 'en_proceso' where id = $1`, [sol.id])).affectedRows === 1, 'la dinamizadora cambia el estado');

console.log('\nRobótica');
await db.query(`insert into public.proyectos_robotica (titulo, area, grado, estado) values ('Brazo', 'Ciencias de la Naturaleza', '3.º Secundaria', 'publicado'), ('Borrador', 'Matemática', '2.º Secundaria', 'en_revision')`);
ok((await como(null, `select * from public.proyectos_robotica`)).rows.length === 1, 'sin sesión se ven solo los publicados');
ok(await falla(luis, `insert into public.proyectos_robotica (titulo, area, grado) values ('x','Matemática','2.º Secundaria')`), 'un docente NO crea proyectos');
ok((await como(ana, `insert into public.proyectos_robotica (titulo, area, grado) values ('Nuevo','Matemática','2.º Secundaria') returning id`)).rows.length === 1, 'la dinamizadora crea proyectos');

console.log('\nIndicadores');
const ind = (await como(geo, `select public.indicadores_panel() as i`)).rows[0].i;
ok(ind.total_recursos === 3 && ind.publicados === 2 && ind.en_revision === 0 && ind.solicitudes_pendientes === 0 && ind.docentes_registrados === 1, `gestión lee los indicadores ${JSON.stringify(ind)}`);
ok(await falla(luis, `select public.indicadores_panel()`), 'un docente NO lee los indicadores');
ok(await falla(null, `select public.indicadores_panel()`), 'sin sesión NO se leen los indicadores');

console.log('\nPróximamente');
ok(await falla(luis, `insert into public.inventario (nombre) values ('Laptop')`), 'un docente NO toca el inventario');
ok((await como(ana, `insert into public.inventario (nombre) values ('Laptop') returning id`)).rows.length === 1, 'la dinamizadora gestiona el inventario');
for (const tabla of ['inventario', 'incidencias', 'plan_trabajo']) {
  ok((await como(geo, `select * from public.${tabla}`)).rows.length === 0, `gestión NO lee ${tabla} (solo la dinamizadora)`);
  ok((await como(luis, `select * from public.${tabla}`)).rows.length === 0, `un docente NO lee ${tabla}`);
}
ok((await como(ana, `select * from public.inventario`)).rows.length === 1, 'la dinamizadora lee el inventario');
ok((await como(ana, `insert into public.talleres (titulo) values ('Canva') returning id`)).rows.length === 1, 'la dinamizadora crea talleres');
ok((await como(luis, `select * from public.talleres`)).rows.length === 1, 'el docente ve los talleres');

console.log('\nFunciones');
ok((await db.query(`select count(*)::int as n from pg_proc where proname = 'is_dinamizadora'`)).rows[0].n === 1, 'existe is_dinamizadora() (nombre del plan)');
ok((await db.query(`select count(*)::int as n from pg_proc where proname = 'es_dinamizadora'`)).rows[0].n === 0, 'ya no existe es_dinamizadora()');
ok((await como(ana, `select public.is_dinamizadora() as d`)).rows[0].d === true && (await como(geo, `select public.is_dinamizadora() as d`)).rows[0].d === false, 'is_dinamizadora() distingue los roles');

console.log('\nStorage');
const subir = (uid, bucket, nombre) => como(uid, `insert into storage.objects (bucket_id, name) values ($1, $2)`, [bucket, nombre]);
ok((await subir(luis, 'recursos', `${luis}/guia.pdf`)).affectedRows === 1, 'un docente sube a su carpeta de recursos');
ok(await falla(luis, `insert into storage.objects (bucket_id, name) values ('recursos', $1)`, [`${ana}/x.pdf`]), 'un docente NO sube a la carpeta de otro');
ok(await falla(luis, `insert into storage.objects (bucket_id, name) values ('robotica', 'foto.jpg')`), 'un docente NO sube fotos de robótica');
ok((await subir(ana, 'robotica', 'brazo.jpg')).affectedRows === 1, 'la dinamizadora sube fotos de robótica');
ok((await db.query(`select count(*)::int as n from storage.buckets`)).rows[0].n === 2, 'se crearon los buckets recursos y robotica');

console.log('\nMuro colaborativo');
ok(await falla(luis, `insert into public.muros (pregunta) values ('¿Qué te funciona?')`), 'un docente NO crea muros');
ok(await falla(geo, `insert into public.muros (pregunta) values ('¿Qué te funciona?')`), 'gestión NO crea muros');
ok(await falla(null, `insert into public.muros (pregunta) values ('¿Qué te funciona?')`), 'sin sesión NO se crean muros');
const muro = (await como(ana, `insert into public.muros (pregunta) values ('¿Qué actividad te funciona mejor?') returning id, codigo`)).rows[0];
ok(/^[A-Z2-9]{6}$/.test(muro.codigo), 'la dinamizadora crea un muro y recibe un código de 6 caracteres');
ok((await como(null, `select codigo from public.muros`)).rows.length === 1, 'sin sesión se ve el muro (para el QR)');
const publicar = (uid, extra = '', valores = '') =>
  como(uid, `insert into public.muro_publicaciones (muro_id, nombre, categoria, texto${extra}) values ($1, '  Rosa  ', 'Juegos', 'Hot seat con el vocabulario'${valores})`, [muro.id]);
ok((await publicar(null)).affectedRows === 1, 'sin sesión se publica en un muro abierto');
ok((await publicar(luis)).affectedRows === 1, 'un docente con sesión también publica');
ok(await falla(null, `insert into public.muro_publicaciones (muro_id, nombre, categoria, texto, likes) values ($1, 'Rosa', 'Juegos', 'Hola a todos', 99)`, [muro.id]), 'sin sesión NO se ponen "me gusta" al publicar');
ok(await falla(null, `insert into public.muro_publicaciones (muro_id, nombre, categoria, texto, visible) values ($1, 'Rosa', 'Juegos', 'Hola a todos', false)`, [muro.id]), 'sin sesión NO se elige si es visible');
ok(await falla(null, `insert into public.muro_publicaciones (muro_id, nombre, categoria, texto) values ($1, 'Rosa', 'Deportes', 'Hola a todos')`, [muro.id]), 'una categoría inventada NO se acepta');
ok(await falla(null, `insert into public.muro_publicaciones (muro_id, nombre, categoria, texto) values ($1, 'R', 'Juegos', 'Hola a todos')`, [muro.id]), 'un nombre de 1 letra NO se acepta');
const pub = (await db.query(`select id, nombre from public.muro_publicaciones order by created_at limit 1`)).rows[0];
ok(pub.nombre === 'Rosa', 'el nombre se guarda sin espacios sobrantes');
ok(await falla(null, `update public.muro_publicaciones set texto = 'cambiado'`), 'sin sesión NO se edita el texto de una publicación');
ok(await falla(null, `update public.muro_publicaciones set visible = false`), 'sin sesión NO se oculta una publicación');
ok((await como(luis, `update public.muro_publicaciones set visible = false`)).affectedRows === 0, 'un docente NO oculta publicaciones');
ok((await como(luis, `delete from public.muro_publicaciones`)).affectedRows === 0, 'un docente NO borra publicaciones');
ok((await como(null, `select public.me_gusta($1) as n`, [pub.id])).rows[0].n === 1, 'sin sesión se da "me gusta" (suma 1)');
ok((await como(null, `select public.me_gusta($1, false) as n`, [pub.id])).rows[0].n === 0 && (await como(null, `select public.me_gusta($1, false) as n`, [pub.id])).rows[0].n === 0, 'quitar "me gusta" resta 1 y nunca baja de 0');
ok(await falla(null, `update public.muro_publicaciones set likes = 50`), 'sin sesión NO se cambian los "me gusta" directamente');
ok((await como(ana, `update public.muro_publicaciones set visible = false where id = $1`, [pub.id])).affectedRows === 1, 'la dinamizadora oculta una publicación');
ok((await como(null, `select id from public.muro_publicaciones`)).rows.length === 1, 'sin sesión NO se ven las ocultas');
ok((await como(ana, `select id from public.muro_publicaciones`)).rows.length === 2, 'la dinamizadora ve también las ocultas');
ok((await como(null, `select public.me_gusta($1) as n`, [pub.id])).rows[0].n === null, 'una publicación oculta NO recibe "me gusta"');
ok((await como(luis, `update public.muros set abierto = false`)).affectedRows === 0, 'un docente NO cierra el muro');
ok((await como(ana, `update public.muros set abierto = false where id = $1`, [muro.id])).affectedRows === 1, 'la dinamizadora cierra el muro');
ok(await falla(null, `insert into public.muro_publicaciones (muro_id, nombre, categoria, texto) values ($1, 'Rosa', 'Juegos', 'Llego tarde')`, [muro.id]), 'en un muro cerrado NO se publica');
ok((await como(luis, `delete from public.muros`)).affectedRows === 0, 'un docente NO borra muros');
ok((await como(ana, `delete from public.muros where id = $1`, [muro.id])).affectedRows === 1 && (await db.query(`select count(*)::int as n from public.muro_publicaciones`)).rows[0].n === 0, 'al borrar el muro se borran sus publicaciones');

console.log('\nCatálogos (SQL = packages/shared)');
const cat = await import('../../packages/shared/src/catalogos.ts');
const valida = async (fn, valores) =>
  (await Promise.all(valores.map(async (v) => (await db.query(`select public.${fn}($1) as ok`, [v])).rows[0].ok))).every(Boolean);
const enumValores = async (tipo) =>
  (await db.query(`select unnest(enum_range(null::public.${tipo}))::text as v`)).rows.map((r) => r.v).join(',');
ok(await valida('es_area_valida', cat.AREAS), 'las áreas coinciden');
ok(await valida('es_grado_valido', cat.GRADOS), 'los grados coinciden');
ok(await valida('es_tipo_recurso_valido', cat.TIPOS_RECURSO), 'los tipos de recurso coinciden');
for (const [tipo, objeto] of [
  ['estado_recurso', cat.ESTADOS_RECURSO],
  ['nivel_tic', cat.NIVELES_TIC],
  ['rol', cat.ROLES],
  ['tipo_solicitud', cat.TIPOS_SOLICITUD],
  ['estado_solicitud', cat.ESTADOS_SOLICITUD],
]) {
  ok((await enumValores(tipo)) === Object.keys(objeto).join(','), `los valores de ${tipo} coinciden`);
}
const checkMuro = (await db.query(`select pg_get_constraintdef(oid) as d from pg_constraint where conrelid = 'public.muro_publicaciones'::regclass and conname like '%categoria%'`)).rows[0].d;
ok(cat.CATEGORIAS_MURO.every((c) => checkMuro.includes(`'${c}'`)) && (checkMuro.match(/'[^']+'/g) ?? []).length === cat.CATEGORIAS_MURO.length, 'las categorías del muro coinciden');

console.log(fallos ? `\n${fallos} prueba(s) fallaron` : '\nTodas las pruebas pasan');
process.exit(fallos ? 1 : 0);
