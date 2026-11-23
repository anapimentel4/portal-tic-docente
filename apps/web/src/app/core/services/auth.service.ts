import { computed, inject, Injectable, signal } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import type { Area, Perfil, Rol } from '@portal/shared';
import { SupabaseService } from './supabase.service';

export interface DatosRegistro {
  nombre: string;
  area: Area | null;
  correo: string;
  contrasena: string;
}

/**
 * Sesión del usuario y su perfil (tabla profiles, donde está el rol).
 * Las páginas leen las señales: usuario(), perfil(), rol().
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService).client;

  readonly sesion = signal<Session | null>(null);
  readonly perfil = signal<Perfil | null>(null);
  readonly usuario = computed(() => this.sesion()?.user ?? null);
  readonly rol = computed<Rol | null>(() => this.perfil()?.rol ?? null);
  readonly puedeVerPanel = computed(() => this.rol() === 'dinamizadora' || this.rol() === 'gestion');

  /** Se cumple cuando ya se sabe si hay sesión guardada (lo esperan los guards). */
  readonly listo: Promise<void> = this.iniciar();

  private async iniciar(): Promise<void> {
    const { data } = await this.supabase.auth.getSession();
    this.sesion.set(data.session);
    if (data.session) await this.cargarPerfil(data.session.user.id);

    this.supabase.auth.onAuthStateChange((evento, sesion) => {
      this.sesion.set(sesion);
      if (!sesion) {
        this.perfil.set(null);
        return;
      }
      // Supabase recomienda no llamar a su API dentro de este callback: se difiere.
      if (evento === 'SIGNED_IN' || evento === 'USER_UPDATED') {
        setTimeout(() => this.cargarPerfil(sesion.user.id));
      }
    });
  }

  async cargarPerfil(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, nombre, correo, area, rol')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.warn('No se pudo leer el perfil:', error.message);
      this.perfil.set(null);
      return;
    }
    this.perfil.set(data as Perfil | null);
  }

  async iniciarSesion(correo: string, contrasena: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena,
    });
    if (error) throw error;
    this.sesion.set(data.session);
    await this.cargarPerfil(data.user.id);
  }

  /** Devuelve true si Supabase pide confirmar el correo antes de entrar. */
  async registrarse(datos: DatosRegistro): Promise<{ necesitaConfirmar: boolean }> {
    const { data, error } = await this.supabase.auth.signUp({
      email: datos.correo,
      password: datos.contrasena,
      options: {
        // El trigger de la base de datos copia estos datos a profiles (rol = docente).
        data: { nombre: datos.nombre, area: datos.area },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    if (data.session && data.user) {
      this.sesion.set(data.session);
      await this.cargarPerfil(data.user.id);
    }
    return { necesitaConfirmar: !data.session };
  }

  async cerrarSesion(): Promise<void> {
    await this.supabase.auth.signOut();
    this.sesion.set(null);
    this.perfil.set(null);
  }
}
