import { inject, Injectable } from '@angular/core';
import type { ProyectoRobotica } from '@portal/shared';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class RoboticaService {
  private readonly supabase = inject(SupabaseService).client;

  /** Los últimos proyectos publicados (para la página de inicio). */
  async destacados(cantidad = 3): Promise<ProyectoRobotica[]> {
    const { data, error } = await this.supabase
      .from('proyectos_robotica')
      .select('*')
      .eq('estado', 'publicado')
      .order('created_at', { ascending: false })
      .limit(cantidad);
    if (error) throw error;
    return data as ProyectoRobotica[];
  }
}
