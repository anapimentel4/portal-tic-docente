import type { Area, EstadoRecurso, EstadoSolicitud, TipoRecurso } from '@portal/shared';
import type { NombreIcono } from './icono/icono';

/**
 * Colores suaves del portal. Cada color tiene:
 *  - badge: etiqueta pequeña (texto 800 sobre fondo 100: contraste AA)
 *  - fondo: tarjeta con un tono muy claro y su borde
 *  - icono: color del icono y de su recuadro
 *  - hover: borde al pasar el ratón por una tarjeta que es enlace
 * Las clases van escritas completas para que Tailwind las incluya.
 */
export const COLORES = {
  azul: {
    badge: 'bg-blue-100 text-blue-800',
    fondo: 'bg-blue-50/70 border-blue-100',
    icono: 'bg-white text-blue-700',
    hover: 'hover:border-blue-300',
  },
  rojo: {
    badge: 'bg-red-100 text-red-800',
    fondo: 'bg-red-50/70 border-red-100',
    icono: 'bg-white text-red-700',
    hover: 'hover:border-red-300',
  },
  violeta: {
    badge: 'bg-violet-100 text-violet-800',
    fondo: 'bg-violet-50/70 border-violet-100',
    icono: 'bg-white text-violet-700',
    hover: 'hover:border-violet-300',
  },
  ambar: {
    badge: 'bg-amber-100 text-amber-800',
    fondo: 'bg-amber-50/70 border-amber-100',
    icono: 'bg-white text-amber-700',
    hover: 'hover:border-amber-300',
  },
  verde: {
    badge: 'bg-green-100 text-green-800',
    fondo: 'bg-green-50/70 border-green-100',
    icono: 'bg-white text-green-700',
    hover: 'hover:border-green-300',
  },
  naranja: {
    badge: 'bg-orange-100 text-orange-800',
    fondo: 'bg-orange-50/70 border-orange-100',
    icono: 'bg-white text-orange-700',
    hover: 'hover:border-orange-300',
  },
  cian: {
    badge: 'bg-cyan-100 text-cyan-800',
    fondo: 'bg-cyan-50/70 border-cyan-100',
    icono: 'bg-white text-cyan-700',
    hover: 'hover:border-cyan-300',
  },
  indigo: {
    badge: 'bg-indigo-100 text-indigo-800',
    fondo: 'bg-indigo-50/70 border-indigo-100',
    icono: 'bg-white text-indigo-700',
    hover: 'hover:border-indigo-300',
  },
  rosa: {
    badge: 'bg-pink-100 text-pink-800',
    fondo: 'bg-pink-50/70 border-pink-100',
    icono: 'bg-white text-pink-700',
    hover: 'hover:border-pink-300',
  },
  gris: {
    badge: 'bg-slate-100 text-slate-700',
    fondo: 'bg-slate-50 border-slate-200',
    icono: 'bg-white text-slate-600',
    hover: 'hover:border-slate-300',
  },
} as const;
export type Color = keyof typeof COLORES;

/** Un color por tipo de recurso (badge y tono de la tarjeta). */
export const COLOR_TIPO: Record<TipoRecurso, Color> = {
  Guía: 'azul',
  Video: 'rojo',
  Plantilla: 'violeta',
  Presentación: 'ambar',
  Tutorial: 'cian',
  'Proyecto de robótica': 'naranja',
  'Ciudadanía digital': 'verde',
  'Herramienta web': 'indigo',
};

/**
 * Portada de cada tipo de recurso (las tarjetas del banco no tienen foto):
 * degradado de fondo, color de la etiqueta y del icono, e icono del tipo.
 */
export const PORTADA_TIPO: Record<TipoRecurso, { fondo: string; etiqueta: string; icono: NombreIcono; colorIcono: string }> = {
  Guía: { fondo: 'from-blue-950 to-blue-700', etiqueta: 'bg-sky-300', icono: 'libro', colorIcono: 'text-blue-700' },
  Video: { fondo: 'from-rose-950 to-red-700', etiqueta: 'bg-rose-300', icono: 'video', colorIcono: 'text-red-700' },
  Plantilla: { fondo: 'from-violet-950 to-violet-700', etiqueta: 'bg-violet-300', icono: 'planificacion', colorIcono: 'text-violet-700' },
  Presentación: { fondo: 'from-amber-900 to-orange-600', etiqueta: 'bg-amber-200', icono: 'presentacion', colorIcono: 'text-orange-700' },
  Tutorial: { fondo: 'from-cyan-950 to-teal-700', etiqueta: 'bg-cyan-300', icono: 'birrete', colorIcono: 'text-teal-700' },
  'Proyecto de robótica': { fondo: 'from-slate-950 to-orange-800', etiqueta: 'bg-amber-300', icono: 'robot', colorIcono: 'text-orange-700' },
  'Ciudadanía digital': { fondo: 'from-emerald-950 to-green-700', etiqueta: 'bg-emerald-300', icono: 'escudo', colorIcono: 'text-green-700' },
  'Herramienta web': { fondo: 'from-indigo-950 to-indigo-600', etiqueta: 'bg-indigo-200', icono: 'globo', colorIcono: 'text-indigo-700' },
};

/**
 * Portada según el área (para que no todas las "Herramienta web" se vean iguales).
 * "Todas las áreas" no está: esos recursos usan la portada de su tipo.
 */
export const PORTADA_AREA: Partial<Record<Area, { fondo: string; etiqueta: string; icono: NombreIcono; colorIcono: string }>> = {
  'Lengua Española': { fondo: 'from-rose-950 to-pink-700', etiqueta: 'bg-pink-200', icono: 'libro', colorIcono: 'text-pink-700' },
  Matemática: { fondo: 'from-blue-950 to-blue-600', etiqueta: 'bg-sky-300', icono: 'formulas', colorIcono: 'text-blue-700' },
  'Ciencias Sociales': { fondo: 'from-amber-950 to-amber-600', etiqueta: 'bg-amber-200', icono: 'globo', colorIcono: 'text-amber-700' },
  'Ciencias de la Naturaleza': { fondo: 'from-emerald-950 to-emerald-600', etiqueta: 'bg-emerald-300', icono: 'matraz', colorIcono: 'text-emerald-700' },
  Inglés: { fondo: 'from-red-950 to-red-700', etiqueta: 'bg-red-200', icono: 'mensaje', colorIcono: 'text-red-700' },
  Francés: { fondo: 'from-indigo-950 to-blue-700', etiqueta: 'bg-indigo-200', icono: 'mensaje', colorIcono: 'text-indigo-700' },
  'Educación Artística': { fondo: 'from-fuchsia-950 to-purple-600', etiqueta: 'bg-fuchsia-200', icono: 'paleta', colorIcono: 'text-purple-700' },
  'Educación Física': { fondo: 'from-lime-950 to-green-600', etiqueta: 'bg-lime-300', icono: 'chispa', colorIcono: 'text-green-700' },
  'Formación Integral Humana y Religiosa': { fondo: 'from-teal-950 to-cyan-700', etiqueta: 'bg-cyan-200', icono: 'corazon', colorIcono: 'text-teal-700' },
};

export const COLOR_ESTADO_RECURSO: Record<EstadoRecurso, Color> = {
  en_revision: 'ambar',
  publicado: 'verde',
  rechazado: 'rojo',
};

export const COLOR_ESTADO_SOLICITUD: Record<EstadoSolicitud, Color> = {
  pendiente: 'ambar',
  en_proceso: 'azul',
  resuelta: 'verde',
};
