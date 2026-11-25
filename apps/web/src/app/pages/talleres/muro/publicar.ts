import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS_MURO, type CategoriaMuro, type Muro } from '@portal/shared';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeDeError } from '../../../core/services/errores';
import { MuroService } from '../../../core/services/muro.service';
import { Icono } from '../../../shared/icono/icono';

const CLAVE_NOMBRE = 'portal-tic:muro-nombre';
export const MAX_TEXTO = 280;

/**
 * Publicar en el muro desde el celular (/muro/:codigo/publicar). Se abre con el QR.
 * No pide cuenta: solo el nombre (se recuerda en este celular), una categoría y la idea.
 */
@Component({
  selector: 'app-publicar-muro',
  imports: [RouterLink, Icono],
  templateUrl: './publicar.html',
})
export class PublicarMuroPage {
  private readonly servicio = inject(MuroService);
  private readonly auth = inject(AuthService);

  readonly codigo = input.required<string>();

  protected readonly categorias = CATEGORIAS_MURO;
  protected readonly max = MAX_TEXTO;

  protected readonly muro = signal<Muro | null>(null);
  protected readonly cargando = signal(true);
  protected readonly noExiste = signal(false);

  protected readonly nombre = signal(leerNombre());
  protected readonly categoria = signal<CategoriaMuro | null>(null);
  protected readonly texto = signal('');
  protected readonly intentado = signal(false);
  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly errorNombre = computed(() => (this.nombre().trim().length < 2 ? 'Escribe tu nombre.' : null));
  protected readonly errorCategoria = computed(() => (this.categoria() ? null : 'Elige una categoría.'));
  protected readonly errorTexto = computed(() => (this.texto().trim().length < 3 ? 'Escribe tu idea.' : null));

  constructor() {
    effect(() => {
      const codigo = this.codigo();
      untracked(() => void this.cargar(codigo));
    });
    // Si tiene sesión en el portal y no ha escrito un nombre, se usa el de su perfil.
    effect(() => {
      const nombre = this.auth.perfil()?.nombre;
      if (nombre && !untracked(this.nombre)) this.nombre.set(nombre);
    });
  }

  private async cargar(codigo: string): Promise<void> {
    this.cargando.set(true);
    try {
      const muro = await this.servicio.porCodigo(codigo);
      this.muro.set(muro);
      this.noExiste.set(!muro);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected async publicar(evento: Event): Promise<void> {
    evento.preventDefault();
    this.intentado.set(true);
    const muro = this.muro();
    const categoria = this.categoria();
    if (!muro || !categoria || this.errorNombre() || this.errorTexto()) return;
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.servicio.publicar(muro.id, { nombre: this.nombre(), categoria, texto: this.texto() });
      guardarNombre(this.nombre().trim());
      this.enviado.set(true);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }

  protected otra(): void {
    this.texto.set('');
    this.categoria.set(null);
    this.intentado.set(false);
    this.enviado.set(false);
  }
}

function leerNombre(): string {
  try {
    return localStorage.getItem(CLAVE_NOMBRE) ?? '';
  } catch {
    return '';
  }
}

function guardarNombre(nombre: string): void {
  try {
    localStorage.setItem(CLAVE_NOMBRE, nombre);
  } catch {
    // Sin almacenamiento: la próxima vez lo vuelve a escribir.
  }
}
