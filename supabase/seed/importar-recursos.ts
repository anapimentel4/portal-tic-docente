// Importa recursos.csv (exportado de la hoja de catalogación) a la tabla recursos.
//
//   pnpm seed:recursos:prueba   revisa el CSV y muestra qué se importaría (no toca la base de datos)
//   pnpm seed:recursos          importa de verdad (necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env)
//
// - Convierte los textos de la hoja a los valores de la base de datos
//   ("En revisión" → en_revision, "Básico" → basico, "TRUE"/"Sí" → true…).
// - Las áreas, grados y tipos deben ser los del catálogo (packages/shared); si no, la fila se salta y se avisa.
// - Se puede ejecutar varias veces: no duplica los recursos cuyo enlace ya está en la base de datos.
// - Usa la service_role key porque las reglas RLS no dejan crear recursos publicados ni sin usuario.
//   Esa clave NUNCA va en el frontend ni en git: solo en .env, en tu computadora.

import { readFileSync } from 'node:fs';
import {
  AREAS,
  ESTADOS_RECURSO,
  GRADOS,
  NIVELES_TIC,
  TIPOS_RECURSO,
} from '../../packages/shared/src/catalogos.ts';

const ARCHIVO = new URL('../../recursos.csv', import.meta.url);
const SOLO_PRUEBA = process.argv.includes('--prueba');

type Fila = Record<string, string>;

// ---------- Lectura del CSV (comillas, comas y saltos de línea dentro de las celdas) ----------
function leerCsv(texto: string): Fila[] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let celda = '';
  let entreComillas = false;
  texto = texto.replace(/^﻿/, ''); // quita el BOM que agregan Excel y Google Sheets

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (entreComillas) {
      if (c === '"' && texto[i + 1] === '"') {
        celda += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        celda += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === ',') {
      fila.push(celda);
      celda = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
    } else {
      celda += c;
    }
  }
  if (celda !== '' || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }

  const [encabezados, ...datos] = filas.filter((f) => f.some((c) => c.trim() !== ''));
  return datos.map((valores) =>
    Object.fromEntries(encabezados.map((e, i) => [e.trim(), (valores[i] ?? '').trim()])),
  );
}

// ---------- Conversión de textos a valores de la base de datos ----------
/** "En Revisión " → "en revision" (sin tildes, minúsculas, espacios simples). */
const normalizar = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Busca el texto en una lista del catálogo sin importar tildes ni mayúsculas. */
function delCatalogo<T extends string>(valor: string, lista: readonly T[]): T | null {
  return lista.find((x) => normalizar(x) === normalizar(valor)) ?? null;
}

/** Busca por el texto visible ("En revisión") o por el valor ("en_revision"). */
function claveDe<T extends string>(valor: string, mapa: Record<T, string>): T | null {
  const v = normalizar(valor).replace(/_/g, ' ');
  for (const [clave, texto] of Object.entries(mapa) as [T, string][]) {
    if (normalizar(texto) === v || clave.replace(/_/g, ' ') === v) return clave;
  }
  return null;
}

/** "1ro", "1.º", "1° Secundaria" → "1.º Secundaria". */
function grado(valor: string) {
  const exacto = delCatalogo(valor, GRADOS);
  if (exacto) return exacto;
  const n = normalizar(valor).match(/^([1-6])\s*(?:\.?\s*[º°o]|ro|do|ero|to|mo|vo)?\b/);
  return n ? (`${n[1]}.º Secundaria` as (typeof GRADOS)[number]) : null;
}

function booleano(valor: string): boolean | null {
  const v = normalizar(valor);
  if (['true', 'verdadero', 'si', 'x', '1', 'yes'].includes(v)) return true;
  if (['false', 'falso', 'no', '', '0'].includes(v)) return false;
  return null;
}

/** "2026-11-23" o "23/11/2026" → "2026-11-23". Vacío = hoy (hora de Santo Domingo). */
function fecha(valor: string): string | null {
  if (!valor) return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santo_Domingo' }).format(new Date());
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return valor;
  const m = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
}

const vacioANull = (s: string) => (s === '' ? null : s);

function convertir(f: Fila, numeroFila: number) {
  const errores: string[] = [];
  const req = (columna: string) => {
    const v = f[columna];
    if (v === undefined) errores.push(`falta la columna "${columna}"`);
    return v ?? '';
  };

  const titulo = req('Título');
  const enlace = req('Archivo o enlace');
  const area = delCatalogo(req('Área'), AREAS);
  const gr = grado(req('Grado'));
  const tipo = delCatalogo(req('Tipo'), TIPOS_RECURSO);
  const estado = claveDe(req('Estado') || 'En revisión', ESTADOS_RECURSO);
  const textoNivel = req('Nivel TIC del docente');
  const nivel = textoNivel ? claveDe(textoNivel, NIVELES_TIC) : null;
  const fechaRegistro = fecha(req('Fecha de registro'));
  const checks = {
    bien_clasificado: booleano(req('Bien clasificado')),
    enlace_funciona: booleano(req('Enlace funciona')),
    derechos_uso: booleano(req('Derechos de uso')),
    util_aula: booleano(req('Útil para el aula')),
  };

  if (!titulo) errores.push('el título está vacío');
  if (!enlace) errores.push('el enlace está vacío');
  if (!area) errores.push(`área desconocida "${f['Área']}"`);
  if (!gr) errores.push(`grado desconocido "${f['Grado']}"`);
  if (!tipo) errores.push(`tipo desconocido "${f['Tipo']}"`);
  if (!estado) errores.push(`estado desconocido "${f['Estado']}"`);
  if (textoNivel && !nivel) errores.push(`nivel TIC desconocido "${textoNivel}"`);
  if (fechaRegistro === null) errores.push(`fecha no reconocida "${f['Fecha de registro']}"`);
  for (const [k, v] of Object.entries(checks)) if (v === null) errores.push(`valor no reconocido en ${k}`);

  if (errores.length) return { errores: errores.map((e) => `fila ${numeroFila}: ${e}`) };

  return {
    recurso: {
      titulo,
      area,
      grado: gr,
      tipo,
      estado,
      enlace_o_archivo: enlace,
      descripcion: vacioANull(f['Descripción corta'] ?? ''),
      competencias: vacioANull(f['Competencias'] ?? ''),
      tema_unidad: vacioANull(f['Tema / unidad'] ?? ''),
      herramienta: vacioANull(f['Herramienta usada'] ?? ''),
      duracion: vacioANull(f['Duración sugerida'] ?? ''),
      nivel_tic: nivel,
      autor: vacioANull(f['Autor'] ?? ''),
      fuente: vacioANull(f['Fuente'] ?? ''),
      licencia: vacioANull(f['Licencia'] ?? ''),
      etiquetas: (f['Etiquetas'] ?? '').split(/[,;]/).map((e) => e.trim()).filter(Boolean),
      fecha_registro: fechaRegistro,
      ...checks,
    },
  };
}

// ---------- Programa ----------
const filas = leerCsv(readFileSync(ARCHIVO, 'utf8'));
const recursos = [];
const errores: string[] = [];
filas.forEach((f, i) => {
  const r = convertir(f, i + 2); // +2: la fila 1 son los encabezados
  if (r.errores) errores.push(...r.errores);
  else recursos.push(r.recurso);
});

console.log(`CSV: ${filas.length} filas → ${recursos.length} válidas, ${filas.length - recursos.length} con errores.`);
for (const e of errores) console.log(`  ✗ ${e}`);

const conteo = (campo: string) =>
  Object.entries(
    recursos.reduce<Record<string, number>>((acc, r) => {
      const k = String(r[campo as keyof typeof r]);
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .map(([k, n]) => `${k}: ${n}`)
    .join(', ');
console.log(`  Estados → ${conteo('estado')}`);
console.log(`  Tipos   → ${conteo('tipo')}`);
console.log(`  Niveles → ${conteo('nivel_tic')}`);

if (SOLO_PRUEBA) {
  console.log('\nModo prueba: no se guardó nada. Para importar: pnpm seed:recursos');
  process.exit(errores.length ? 1 : 0);
}

const url = process.env.SUPABASE_URL;
const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !clave) {
  console.error('\nFaltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el archivo .env (copia .env.example).');
  process.exit(1);
}

const cabeceras = {
  apikey: clave,
  Authorization: `Bearer ${clave}`,
  'Content-Type': 'application/json',
};

// No duplicar: se saltan los enlaces que ya están en la base de datos.
const resp = await fetch(`${url}/rest/v1/recursos?select=enlace_o_archivo`, { headers: cabeceras });
if (!resp.ok) {
  console.error(`\nNo se pudo leer la tabla recursos (${resp.status}): ${await resp.text()}`);
  process.exit(1);
}
const existentes = new Set(((await resp.json()) as { enlace_o_archivo: string }[]).map((r) => r.enlace_o_archivo));
const nuevos = recursos.filter((r) => !existentes.has(r.enlace_o_archivo));
console.log(`\nYa estaban en la base de datos: ${recursos.length - nuevos.length}. Nuevos: ${nuevos.length}.`);

if (nuevos.length) {
  const ins = await fetch(`${url}/rest/v1/recursos`, {
    method: 'POST',
    headers: { ...cabeceras, Prefer: 'return=minimal' },
    body: JSON.stringify(nuevos),
  });
  if (!ins.ok) {
    console.error(`No se pudieron guardar (${ins.status}): ${await ins.text()}`);
    process.exit(1);
  }
  console.log(`✓ Se importaron ${nuevos.length} recursos.`);
}
if (errores.length) {
  console.log(`Revisa en la hoja las ${errores.length} fila(s) con errores y vuelve a ejecutar.`);
  process.exit(1);
}
