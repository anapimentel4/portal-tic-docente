import type { TipoRecurso } from '@portal/shared';
import type { Color } from '../../shared/colores';
import type { NombreIcono } from '../../shared/icono/icono';

/**
 * Los 6 módulos de la página de inicio (según CLAUDE.md, fase 3). Cambia aquí el texto o el orden.
 * Cada módulo lleva a:
 *  - catalogo:     el banco de recursos, opcionalmente filtrado por tipo
 *  - ruta:         otra página del portal (ej. /robotica)
 *  - apoyo:        el formulario de apoyo de la página de inicio
 *  - proximamente: todavía no existe (muestra la etiqueta "Próximamente")
 */
export type DestinoModulo =
  | { tipo: 'catalogo'; tipoRecurso?: TipoRecurso }
  | { tipo: 'ruta'; ruta: string; accion: string }
  | { tipo: 'apoyo' }
  | { tipo: 'proximamente' };

export interface Modulo {
  titulo: string;
  descripcion: string;
  icono: NombreIcono;
  /** Tono suave de la tarjeta (ver shared/colores.ts). */
  color: Color;
  destino: DestinoModulo;
}

export const MODULOS: Modulo[] = [
  {
    titulo: 'Banco de recursos',
    descripcion: 'Guías, videos, plantillas y herramientas web revisadas, por área y grado.',
    icono: 'libro',
    color: 'azul',
    destino: { tipo: 'catalogo' },
  },
  {
    titulo: 'Robótica educativa',
    descripcion: 'Proyectos con materiales del kit, pasos y competencias para llevar al aula.',
    icono: 'robot',
    color: 'naranja',
    destino: { tipo: 'ruta', ruta: '/robotica', accion: 'Ver proyectos' },
  },
  {
    titulo: 'Formación docente',
    descripcion: 'Talleres prácticos para fortalecer tus competencias digitales.',
    icono: 'birrete',
    color: 'violeta',
    destino: { tipo: 'proximamente' },
  },
  {
    titulo: 'Planificación y evaluación',
    descripcion: 'Ideas y herramientas para integrar la tecnología en tus planificaciones.',
    icono: 'planificacion',
    color: 'cian',
    destino: { tipo: 'proximamente' },
  },
  {
    titulo: 'Soporte y acompañamiento',
    descripcion: 'Pide acompañamiento en el aula, reporta un problema técnico o haz una reserva.',
    icono: 'soporte',
    color: 'rosa',
    destino: { tipo: 'apoyo' },
  },
  {
    titulo: 'Ciudadanía digital',
    descripcion: 'Uso seguro, ético y responsable de la tecnología con tus estudiantes.',
    icono: 'escudo',
    color: 'verde',
    destino: { tipo: 'catalogo', tipoRecurso: 'Ciudadanía digital' },
  },
];
