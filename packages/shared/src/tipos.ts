import type { Area, Rol } from './catalogos';

/** Fila de la tabla profiles (una por usuario de Supabase Auth). */
export interface Perfil {
  id: string;
  nombre: string;
  correo: string;
  area: Area | null;
  rol: Rol;
}
