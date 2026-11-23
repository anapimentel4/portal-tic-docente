import { inject, Injectable } from '@angular/core';
import type { TipoSolicitud } from '@portal/shared';
import { SupabaseService } from './supabase.service';

export interface NuevaSolicitud {
  tipo: TipoSolicitud;
  fecha_deseada: string | null;
  detalle: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly supabase = inject(SupabaseService).client;

  /** Crea una solicitud del usuario con sesión. La base de datos pone docente_id y estado = pendiente. */
  async crear(solicitud: NuevaSolicitud): Promise<void> {
    const { error } = await this.supabase.from('solicitudes').insert(solicitud);
    if (error) throw error;
  }
}
