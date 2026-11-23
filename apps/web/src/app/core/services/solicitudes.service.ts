import { inject, Injectable } from '@angular/core';
import type { Solicitud, TipoSolicitud } from '@portal/shared';
import { SupabaseService } from './supabase.service';

export interface NuevaSolicitud {
  tipo: TipoSolicitud;
  fecha_deseada: string | null;
  detalle: string;
}

/**
 * Solicitudes de apoyo (tabla solicitudes). La usan el formulario de Inicio y "Mis solicitudes".
 * RLS: cada docente crea y ve solo las suyas; el panel ve todas; solo la dinamizadora cambia el estado.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly supabase = inject(SupabaseService).client;

  /** Crea una solicitud del usuario con sesión. La base de datos pone docente_id y estado = pendiente. */
  async crear(solicitud: NuevaSolicitud): Promise<void> {
    const { error } = await this.supabase.from('solicitudes').insert(solicitud);
    if (error) throw error;
  }

  /**
   * Las solicitudes del usuario, las más recientes primero.
   * El filtro por docente es explícito: a la dinamizadora y a gestión RLS les deja ver todas.
   */
  async mias(usuarioId: string): Promise<Solicitud[]> {
    const { data, error } = await this.supabase
      .from('solicitudes')
      .select('*')
      .eq('docente_id', usuarioId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Solicitud[];
  }
}
