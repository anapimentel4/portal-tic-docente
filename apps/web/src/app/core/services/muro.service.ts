import { inject, Injectable } from '@angular/core';
import type { CategoriaMuro, Muro, PublicacionMuro } from '@portal/shared';
import { SupabaseService } from './supabase.service';

/** Lo que escribe el docente al publicar. */
export interface NuevaPublicacion {
  nombre: string;
  categoria: CategoriaMuro;
  texto: string;
}

/** Un muro con cuántas publicaciones tiene (para la lista de la dinamizadora). */
export type MuroConTotal = Muro & { total: number };

/**
 * Muro colaborativo de los talleres (tablas muros y muro_publicaciones, migración 7).
 * RLS: todos ven los muros y las publicaciones visibles, y publican sin cuenta en un muro abierto;
 * solo la dinamizadora crea, cierra y borra muros, y oculta o borra publicaciones.
 */
@Injectable({ providedIn: 'root' })
export class MuroService {
  private readonly supabase = inject(SupabaseService).client;

  /** Muros, del más nuevo al más viejo, con su número de publicaciones. */
  async listar(): Promise<MuroConTotal[]> {
    const { data, error } = await this.supabase
      .from('muros')
      .select('*, muro_publicaciones(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as (Muro & { muro_publicaciones: { count: number }[] })[]).map(({ muro_publicaciones, ...muro }) => ({
      ...muro,
      total: muro_publicaciones[0]?.count ?? 0,
    }));
  }

  /** Un muro por su código, o null si no existe. */
  async porCodigo(codigo: string): Promise<Muro | null> {
    const limpio = codigo.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,10}$/.test(limpio)) return null;
    const { data, error } = await this.supabase.from('muros').select('*').eq('codigo', limpio).maybeSingle();
    if (error) throw error;
    return data as Muro | null;
  }

  async crear(pregunta: string): Promise<Muro> {
    const { data, error } = await this.supabase.from('muros').insert({ pregunta: pregunta.trim() }).select().maybeSingle();
    if (error) throw error;
    if (!data) throw { code: '42501' };
    return data as Muro;
  }

  async cambiarAbierto(id: string, abierto: boolean): Promise<void> {
    const { data, error } = await this.supabase.from('muros').update({ abierto }).eq('id', id).select('id');
    if (error) throw error;
    // Si RLS bloquea el cambio, Supabase no da error: simplemente no cambia ninguna fila.
    if (!data?.length) throw { code: '42501' };
  }

  async borrar(id: string): Promise<void> {
    const { data, error } = await this.supabase.from('muros').delete().eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) throw { code: '42501' };
  }

  /** Publicaciones del muro, de la más nueva a la más vieja (la dinamizadora también ve las ocultas). */
  async publicaciones(muroId: string): Promise<PublicacionMuro[]> {
    const { data, error } = await this.supabase
      .from('muro_publicaciones')
      .select('*')
      .eq('muro_id', muroId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as PublicacionMuro[];
  }

  /** Publica sin necesidad de cuenta. No pide la fila de vuelta: así funciona igual sin sesión. */
  async publicar(muroId: string, datos: NuevaPublicacion): Promise<void> {
    const { error } = await this.supabase.from('muro_publicaciones').insert({
      muro_id: muroId,
      nombre: datos.nombre.trim(),
      categoria: datos.categoria,
      texto: datos.texto.trim(),
    });
    if (error) throw error;
  }

  /** Suma (o resta) un "me gusta". Devuelve el total nuevo. */
  async meGusta(publicacionId: string, sumar: boolean): Promise<number | null> {
    const { data, error } = await this.supabase.rpc('me_gusta', { publicacion: publicacionId, sumar });
    if (error) throw error;
    return data as number | null;
  }

  async cambiarVisible(publicacionId: string, visible: boolean): Promise<void> {
    const { data, error } = await this.supabase.from('muro_publicaciones').update({ visible }).eq('id', publicacionId).select('id');
    if (error) throw error;
    if (!data?.length) throw { code: '42501' };
  }
}
