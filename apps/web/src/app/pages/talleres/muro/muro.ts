import { Component, computed, effect, ElementRef, inject, input, OnDestroy, signal, untracked, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIAS_MURO, type CategoriaMuro, type Muro, type PublicacionMuro } from '@portal/shared';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeDeError } from '../../../core/services/errores';
import { MuroService } from '../../../core/services/muro.service';
import { Icono } from '../../../shared/icono/icono';
import { COLORES_MURO } from '../datos';
import { crearQr } from '../qr';

/** Cada cuánto se buscan publicaciones nuevas. */
const CADA_MS = 5000;
const CLAVE_ME_GUSTA = 'portal-tic:muro-me-gusta';

/**
 * Muro colaborativo para proyectar (/muro/:codigo). Lo ve cualquiera.
 * Se actualiza solo cada 5 segundos. La dinamizadora puede ocultar publicaciones y cerrar el muro.
 */
@Component({
  selector: 'app-muro',
  imports: [RouterLink, Icono],
  templateUrl: './muro.html',
})
export class MuroPage implements OnDestroy {
  private readonly servicio = inject(MuroService);
  protected readonly auth = inject(AuthService);

  /** Viene de la ruta /muro/:codigo. */
  readonly codigo = input.required<string>();

  protected readonly categorias = CATEGORIAS_MURO;
  protected readonly colores = COLORES_MURO;

  protected readonly muro = signal<Muro | null>(null);
  protected readonly publicaciones = signal<PublicacionMuro[]>([]);
  protected readonly cargando = signal(true);
  protected readonly noExiste = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal<CategoriaMuro | 'Todas'>('Todas');
  protected readonly qr = signal('');
  protected readonly pantallaCompleta = signal(false);
  protected readonly meGusta = signal<Set<string>>(leerMeGusta());

  protected readonly esDinamizadora = computed(() => this.auth.rol() === 'dinamizadora');
  protected readonly enlacePublicar = computed(() => `${location.origin}/muro/${this.muro()?.codigo ?? ''}/publicar`);
  protected readonly enlaceCorto = computed(() => this.enlacePublicar().replace(/^https?:\/\//, ''));

  protected readonly visibles = computed(() => {
    const f = this.filtro();
    return this.publicaciones().filter((p) => f === 'Todas' || p.categoria === f);
  });
  protected readonly cuenta = computed(() => {
    const cuenta: Record<string, number> = {};
    for (const p of this.publicaciones()) if (p.visible) cuenta[p.categoria] = (cuenta[p.categoria] ?? 0) + 1;
    return cuenta;
  });
  protected readonly totalVisibles = computed(() => this.publicaciones().filter((p) => p.visible).length);

  private readonly sala = viewChild.required<ElementRef<HTMLElement>>('sala');
  private readonly dialogoQr = viewChild.required<ElementRef<HTMLDialogElement>>('dialogoQr');
  private intervalo?: ReturnType<typeof setInterval>;
  private buscando = false;
  private readonly alCambiarPantalla = () => this.pantallaCompleta.set(!!document.fullscreenElement);

  constructor() {
    document.addEventListener('fullscreenchange', this.alCambiarPantalla);
    // Al cambiar el código de la ruta, se carga ese muro.
    effect(() => {
      const codigo = this.codigo();
      untracked(() => void this.iniciar(codigo));
    });
  }

  private async iniciar(codigo: string): Promise<void> {
    clearInterval(this.intervalo);
    this.cargando.set(true);
    this.noExiste.set(false);
    this.error.set(null);
    try {
      const muro = await this.servicio.porCodigo(codigo);
      this.muro.set(muro);
      if (!muro) {
        this.noExiste.set(true);
        return;
      }
      this.qr.set(await crearQr(`${location.origin}/muro/${muro.codigo}/publicar`));
      await this.actualizar();
      this.intervalo = setInterval(() => void this.actualizar(), CADA_MS);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Trae las publicaciones (y si el muro sigue abierto). No hace nada si la pestaña está oculta. */
  private async actualizar(): Promise<void> {
    const muro = this.muro();
    if (!muro || this.buscando || document.hidden) return;
    this.buscando = true;
    try {
      const [publicaciones, actual] = await Promise.all([this.servicio.publicaciones(muro.id), this.servicio.porCodigo(muro.codigo)]);
      this.publicaciones.set(publicaciones);
      if (actual) this.muro.set(actual);
      this.error.set(null);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.buscando = false;
    }
  }

  protected async darMeGusta(p: PublicacionMuro): Promise<void> {
    const yaLeGusta = this.meGusta().has(p.id);
    try {
      const total = await this.servicio.meGusta(p.id, !yaLeGusta);
      if (total === null) return;
      this.publicaciones.update((lista) => lista.map((x) => (x.id === p.id ? { ...x, likes: total } : x)));
      const nuevo = new Set(this.meGusta());
      if (yaLeGusta) nuevo.delete(p.id);
      else nuevo.add(p.id);
      this.meGusta.set(nuevo);
      guardarMeGusta(nuevo);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  protected async alternarVisible(p: PublicacionMuro): Promise<void> {
    try {
      await this.servicio.cambiarVisible(p.id, !p.visible);
      this.publicaciones.update((lista) => lista.map((x) => (x.id === p.id ? { ...x, visible: !x.visible } : x)));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  protected async alternarAbierto(): Promise<void> {
    const muro = this.muro();
    if (!muro) return;
    try {
      await this.servicio.cambiarAbierto(muro.id, !muro.abierto);
      this.muro.set({ ...muro, abierto: !muro.abierto });
    } catch (e) {
      this.error.set(mensajeDeError(e));
    }
  }

  protected async alternarPantallaCompleta(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await this.sala().nativeElement.requestFullscreen();
    } catch {
      // Algunos navegadores (por ejemplo, Safari en iPhone) no la permiten.
    }
  }

  protected abrirQr(): void {
    this.dialogoQr().nativeElement.showModal();
  }

  protected cerrarQr(): void {
    this.dialogoQr().nativeElement.close();
  }

  /** "hace 3 min", "hace 2 h"… */
  protected hace(fecha: string): string {
    const min = Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    return h < 24 ? `hace ${h} h` : new Date(fecha).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' });
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
    document.removeEventListener('fullscreenchange', this.alCambiarPantalla);
  }
}

function leerMeGusta(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(CLAVE_ME_GUSTA) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

function guardarMeGusta(ids: Set<string>): void {
  try {
    localStorage.setItem(CLAVE_ME_GUSTA, JSON.stringify([...ids].slice(-500)));
  } catch {
    // Sin almacenamiento: el "me gusta" se cuenta igual, solo que no se recuerda.
  }
}
