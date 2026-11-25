import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { mensajeDeError } from '../../../core/services/errores';
import { MuroService, type MuroConTotal } from '../../../core/services/muro.service';
import { Icono } from '../../../shared/icono/icono';

/**
 * Muros colaborativos (solo la dinamizadora): crear un muro con una pregunta,
 * proyectarlo, abrirlo o cerrarlo, copiar el enlace para publicar y borrarlo.
 */
@Component({
  selector: 'app-muros',
  imports: [RouterLink, Icono],
  templateUrl: './muros.html',
})
export class MurosPage implements OnInit {
  private readonly servicio = inject(MuroService);

  protected readonly muros = signal<MuroConTotal[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pregunta = signal('');
  protected readonly creando = signal(false);
  protected readonly ocupado = signal<string | null>(null);
  protected readonly aviso = signal('');

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.muros.set(await this.servicio.listar());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected async crear(evento: Event): Promise<void> {
    evento.preventDefault();
    const pregunta = this.pregunta().trim();
    if (pregunta.length < 3) {
      this.error.set('Escribe la pregunta del muro (al menos 3 caracteres).');
      return;
    }
    this.creando.set(true);
    this.error.set(null);
    try {
      const muro = await this.servicio.crear(pregunta);
      this.pregunta.set('');
      this.muros.update((lista) => [{ ...muro, total: 0 }, ...lista]);
      this.aviso.set(`Muro creado. Su código es ${muro.codigo}.`);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.creando.set(false);
    }
  }

  protected async alternarAbierto(muro: MuroConTotal): Promise<void> {
    this.ocupado.set(muro.id);
    this.error.set(null);
    try {
      await this.servicio.cambiarAbierto(muro.id, !muro.abierto);
      this.muros.update((lista) => lista.map((m) => (m.id === muro.id ? { ...m, abierto: !m.abierto } : m)));
      this.aviso.set(muro.abierto ? 'El muro quedó cerrado: ya no recibe publicaciones.' : 'El muro quedó abierto.');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(null);
    }
  }

  protected async copiarEnlace(muro: MuroConTotal): Promise<void> {
    const enlace = `${location.origin}/muro/${muro.codigo}/publicar`;
    try {
      await navigator.clipboard.writeText(enlace);
      this.aviso.set('Enlace copiado. Pégalo en el grupo de WhatsApp del taller.');
    } catch {
      this.aviso.set(`Copia este enlace: ${enlace}`);
    }
  }

  protected async borrar(muro: MuroConTotal): Promise<void> {
    const texto = muro.total
      ? `¿Borrar el muro "${muro.pregunta}" y sus ${muro.total} publicaciones? No se puede deshacer.`
      : `¿Borrar el muro "${muro.pregunta}"?`;
    if (!confirm(texto)) return;
    this.ocupado.set(muro.id);
    this.error.set(null);
    try {
      await this.servicio.borrar(muro.id);
      this.muros.update((lista) => lista.filter((m) => m.id !== muro.id));
      this.aviso.set('Muro borrado.');
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.ocupado.set(null);
    }
  }
}
