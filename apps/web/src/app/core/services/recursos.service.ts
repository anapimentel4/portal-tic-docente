import { inject, Injectable } from '@angular/core';
import type { ChequeoRecurso, EstadoRecurso, Recurso } from '@portal/shared';
import { SupabaseService } from './supabase.service';

/** Lo que llena un docente al compartir un recurso. Lo demás lo pone la base de datos. */
export type NuevoRecurso = Pick<
  Recurso,
  | 'titulo'
  | 'area'
  | 'grado'
  | 'tipo'
  | 'enlace_o_archivo'
  | 'descripcion'
  | 'competencias'
  | 'tema_unidad'
  | 'herramienta'
  | 'duracion'
  | 'nivel_tic'
  | 'autor'
  | 'fuente'
  | 'licencia'
  | 'etiquetas'
>;

export type CambiosRevision =Partial<Record<ChequeoRecurso, boolean>> & { estado?: EstadoRecurso };

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

  /**
   * Un recurso por su id, o null si no existe o el usuario no puede verlo
   * (sin sesión solo los publicados; el autor también ve los suyos; el panel ve todos).
   */
  async obtener(id: string): Promise<Recurso | null> {
    // Un id que no es uuid haría fallar a Postgres: se trata como "no existe".
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await this.supabase.from('recursos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Recurso | null;
  }

  /** "Compartir un recurso": queda en revisión, a nombre del usuario actual y sin chequeos. */
  async proponer(recurso: NuevoRecurso, usuarioId: string): Promise<void> {
    const { error } = await this.supabase
      .from('recursos')
      .insert({ ...recurso, estado: 'en_revision', creado_por: usuarioId });
    if (error) throw error;
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
