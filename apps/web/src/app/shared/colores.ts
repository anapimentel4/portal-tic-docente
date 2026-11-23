import type { EstadoRecurso, EstadoSolicitud, TipoRecurso } from '@portal/shared';

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
