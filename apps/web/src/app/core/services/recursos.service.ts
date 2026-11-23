import { inject, Injectable } from '@angular/core';
import type { ChequeoRecurso, EstadoRecurso, Recurso } from '@portal/shared';
import { SupabaseService } from './supabase.service';

export type CambiosRevision = Partial<Record<ChequeoRecurso, boolean>> & { estado?: EstadoRecurso };

/**
 * Lectura y revisión de la tabla recursos.
 * RLS decide qué filas llegan: el panel (dinamizadora y gestión) ve todas;
 * solo la dinamizadora puede guardar cambios.
 */
@Injectable({ providedIn: 'root' })
export class RecursosService {
  private readonly supabase = inject(SupabaseService).client;

  /**
   * Solo los publicados, por título (catálogo para docentes).
   * El filtro por estado es explícito: a la dinamizadora RLS le deja ver todos.
   */
  async listarPublicados(): Promise<Recurso[]> {
    const { data, error } = await this.supabase
      .from('recursos')
      .select('*')
      .eq('estado', 'publicado')
      .order('titulo');
    if (error) throw error;
    return data as Recurso[];
  }

  /** Todos los recursos que el usuario puede ver, los más recientes primero (panel). */
  async listarTodos(): Promise<Recurso[]> {
    const { data, error } = await this.supabase
      .from('recursos')
      .select('*')
      .order('created_at', { ascending: false })
      .order('titulo');
    if (error) throw error;
    return data as Recurso[];
  }

  /** Guarda los chequeos y/o el estado. Devuelve la fila tal como quedó en la base de datos. */
  async actualizarRevision(id: string, cambios: CambiosRevision): Promise<Recurso> {
    const { data, error } = await this.supabase
      .from('recursos')
      .update(cambios)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    // Si RLS bloquea el update, Supabase no da error: simplemente no devuelve la fila.
    if (!data) throw { code: '42501' };
    return data as Recurso;
  }
}
