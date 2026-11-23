import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

/** Lo que devuelve la función indicadores_panel() de la base de datos. */
export interface Indicadores {
  total_recursos: number;
  publicados: number;
  en_revision: number;
  solicitudes_pendientes: number;
  docentes_registrados: number;
}

/**
 * Indicadores del panel, compartidos por el Resumen y el menú lateral.
 * Cada página del panel llama a actualizar() después de una acción, así los números siempre están al día.
 */
@Injectable({ providedIn: 'root' })
export class PanelService {
  private readonly supabase = inject(SupabaseService).client;

  readonly indicadores = signal<Indicadores | null>(null);
  readonly error = signal<string | null>(null);

  async actualizar(): Promise<void> {
    // La función comprueba en la base de datos que el usuario sea dinamizadora o gestión.
    const { data, error } = await this.supabase.rpc('indicadores_panel');
    if (error) {
      console.warn('No se pudieron leer los indicadores:', error.message);
      this.error.set('No se pudieron cargar los indicadores.');
      return;
    }
    this.error.set(null);
    this.indicadores.set(data as Indicadores);
  }
}
