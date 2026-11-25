import type { Area, CategoriaMuro, EstadoRecurso, EstadoSolicitud, Grado, NivelTic, Rol, TipoRecurso, TipoSolicitud } from './catalogos';

/** Fila de la tabla profiles (una por usuario de Supabase Auth). */
export interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  area: Area | null;
  rol: Rol;
}

/** Las 4 comprobaciones que la dinamizadora marca antes de publicar un recurso. */
export const CHEQUEOS_RECURSO = {
  bien_clasificado: 'Bien clasificado (área, grado y tipo correctos)',
  enlace_funciona: 'El enlace o archivo abre bien',
  derechos_uso: 'Se puede usar (licencia o derechos claros)',
  util_aula: 'Es útil para el aula',
} as const;
export type ChequeoRecurso = keyof typeof CHEQUEOS_RECURSO;

/** Fila de la tabla recursos. */
export interface Recurso extends Record<ChequeoRecurso, boolean> {
  id: string;
  titulo: string;
  area: Area;
  grado: Grado;
  tipo: TipoRecurso;
  estado: EstadoRecurso;
  enlace_o_archivo: string;
  descripcion: string | null;
  competencias: string | null;
  tema_unidad: string | null;
  herramienta: string | null;
  duracion: string | null;
  nivel_tic: NivelTic | null;
  autor: string | null;
  fuente: string | null;
  licencia: string | null;
  etiquetas: string[];
  fecha_registro: string;
  creado_por: string | null;
  created_at: string;
}

/** Fila de la tabla proyectos_robotica. */
export interface ProyectoRobotica {
  id: string;
  titulo: string;
  area: Area;
  grado: Grado;
  /** Frase corta (máx. 160 caracteres) para la tarjeta. */
  descripcion: string | null;
  competencias: string | null;
  materiales: string | null;
  pasos: string | null;
  foto_url: string | null;
  estado: EstadoRecurso;
  created_at: string;
}

/** Fila de la tabla solicitudes. */
export interface Solicitud {
  id: string;
  docente_id: string;
  tipo: TipoSolicitud;
  fecha_deseada: string | null;
  detalle: string;
  estado: EstadoSolicitud;
  created_at: string;
}

/** Fila de la tabla muros: un muro colaborativo de un taller. */
export interface Muro {
  id: string;
  /** Código corto que va en el enlace y en el QR (ej. K7P2QX). */
  codigo: string;
  pregunta: string;
  /** Si recibe publicaciones nuevas. */
  abierto: boolean;
  creado_por: string | null;
  created_at: string;
}

/** Fila de la tabla muro_publicaciones. */
export interface PublicacionMuro {
  id: string;
  muro_id: string;
  nombre: string;
  categoria: CategoriaMuro;
  texto: string;
  likes: number;
  /** false = la dinamizadora la ocultó. */
  visible: boolean;
  created_at: string;
}
