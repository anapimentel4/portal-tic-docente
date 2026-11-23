import type { Area, EstadoRecurso, Grado, NivelTic, Rol, TipoRecurso } from './catalogos';

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
