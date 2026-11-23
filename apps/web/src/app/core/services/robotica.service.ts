import { inject, Injectable } from '@angular/core';
import type { EstadoRecurso, ProyectoRobotica } from '@portal/shared';
import { SupabaseService } from './supabase.service';

const BUCKET = 'robotica';
/** Lo mismo que permite el bucket (migración 3): JPG, PNG o WebP de hasta 5 MB. */
export const FOTO_TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
export const FOTO_MAX_MB = 5;

/** Lo que llena la dinamizadora en el formulario de proyecto. */
export type DatosProyecto = Pick<
  ProyectoRobotica,
  'titulo' | 'area' | 'grado' | 'descripcion' | 'competencias' | 'materiales' | 'pasos' | 'foto_url'
> & { estado: EstadoRecurso };

/**
 * Proyectos de robótica (tabla proyectos_robotica) y sus fotos (bucket robotica).
 * RLS: todos ven los publicados; el panel ve todos; solo la dinamizadora crea, edita y sube fotos.
 */
@Injectable({ providedIn: 'root' })
export class RoboticaService {
  private readonly supabase = inject(SupabaseService).client;

  /** Los proyectos que el usuario puede ver (la dinamizadora también ve los borradores). */
  async listar(): Promise<ProyectoRobotica[]> {
    const { data, error } = await this.supabase.from('proyectos_robotica').select('*').order('titulo');
    if (error) throw error;
    return data as ProyectoRobotica[];
  }

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

  /** Un proyecto por id, o null si no existe o no se puede ver. */
  async obtener(id: string): Promise<ProyectoRobotica | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
    const { data, error } = await this.supabase.from('proyectos_robotica').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as ProyectoRobotica | null;
  }

  /** Crea (sin id) o actualiza (con id). Devuelve el id del proyecto. */
  async guardar(datos: DatosProyecto, id?: string): Promise<string> {
    const consulta = id
      ? this.supabase.from('proyectos_robotica').update(datos).eq('id', id)
      : this.supabase.from('proyectos_robotica').insert(datos);
    const { data, error } = await consulta.select('id').maybeSingle();
    if (error) throw error;
    // Si RLS bloquea el cambio, Supabase no da error: simplemente no devuelve la fila.
    if (!data) throw { code: '42501' };
    return (data as { id: string }).id;
  }

  /** Sube una foto al bucket y devuelve su URL pública. */
  async subirFoto(archivo: File): Promise<string> {
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[archivo.type] ?? 'jpg';
    const ruta = `${crypto.randomUUID()}.${extension}`;
    const { error } = await this.supabase.storage
      .from(BUCKET)
      .upload(ruta, archivo, { contentType: archivo.type, cacheControl: '31536000' });
    if (error) throw error;
    return this.supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl;
  }

  /** Borra una foto del bucket a partir de su URL pública. Las URL de otros sitios se ignoran. */
  async borrarFoto(url: string): Promise<void> {
    const marca = `/storage/v1/object/public/${BUCKET}/`;
    const i = url.indexOf(marca);
    if (i === -1) return;
    await this.supabase.storage.from(BUCKET).remove([decodeURIComponent(url.slice(i + marca.length))]);
  }
}
