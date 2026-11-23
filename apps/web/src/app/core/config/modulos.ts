import type { TipoRecurso, TipoSolicitud } from '@portal/shared';

/**
 * Los 6 módulos de la página de inicio. Cambia aquí el texto o el orden.
 * Cada módulo lleva a:
 *  - catalogo:     el catálogo de recursos, opcionalmente filtrado por tipo
 *  - apoyo:        el formulario de apoyo de la página de inicio, con el tipo ya elegido
 *  - proximamente: todavía no tiene página
 */
export type DestinoModulo =
  | { tipo: 'catalogo'; tipoRecurso?: TipoRecurso }
  | { tipo: 'apoyo'; tipoSolicitud: TipoSolicitud }
  | { tipo: 'proximamente' };

export interface Modulo {
  titulo: string;
  descripcion: string;
  /** Emoji decorativo (los lectores de pantalla lo ignoran). */
  icono: string;
  destino: DestinoModulo;
}

export const MODULOS: Modulo[] = [
  {
    titulo: 'Recursos',
    descripcion: 'Guías, videos, plantillas y herramientas web revisadas, por área y grado.',
    icono: '📚',
    destino: { tipo: 'catalogo' },
  },
  {
    titulo: 'Robótica educativa',
    descripcion: 'Proyectos con materiales, pasos y competencias para llevar al aula.',
    icono: '🤖',
    destino: { tipo: 'catalogo', tipoRecurso: 'Proyecto de robótica' },
  },
  {
    titulo: 'Ciudadanía digital',
    descripcion: 'Uso seguro, ético y responsable de la tecnología con tus estudiantes.',
    icono: '🛡️',
    destino: { tipo: 'catalogo', tipoRecurso: 'Ciudadanía digital' },
  },
  {
    titulo: 'Talleres y formación',
    descripcion: 'Talleres prácticos para docentes, con inscripción en línea.',
    icono: '🎓',
    destino: { tipo: 'proximamente' },
  },
  {
    titulo: 'Acompañamiento TIC',
    descripcion: 'Pide apoyo para planificar o dar una clase con tecnología.',
    icono: '🤝',
    destino: { tipo: 'apoyo', tipoSolicitud: 'acompanamiento' },
  },
  {
    titulo: 'Reservas',
    descripcion: 'Reserva el laboratorio, los kits de robótica o las laptops.',
    icono: '📅',
    destino: { tipo: 'apoyo', tipoSolicitud: 'reserva_laboratorio' },
  },
];
