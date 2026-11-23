import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS_RECURSO, type ProyectoRobotica } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { RoboticaService } from '../../core/services/robotica.service';
import { Badge } from '../../shared/badge/badge';
import { COLOR_ESTADO_RECURSO } from '../../shared/colores';
import { esEnlaceWeb } from '../../shared/enlaces';
import { Icono } from '../../shared/icono/icono';

/** Un texto con una cosa por línea → lista. Quita numeración o viñetas escritas a mano ("1.", "-", "•"). */
export function enLista(texto: string | null): string[] {
  return (texto ?? '')
    .split('\n')
    .map((l) => l.replace(/^\s*(\d+[.)-]|[-•*])\s*/, '').trim())
    .filter(Boolean);
}

/** Detalle de un proyecto: foto, competencias, materiales del kit y pasos numerados. Ruta: /robotica/:id */
@Component({
  selector: 'app-proyecto-detalle',
  imports: [RouterLink, Badge, Icono],
  templateUrl: './proyecto-detalle.html',
})
export class ProyectoDetallePage {
  private readonly servicio = inject(RoboticaService);
  protected readonly auth = inject(AuthService);

  readonly id = input.required<string>();

  protected readonly proyecto = signal<ProyectoRobotica | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly textosEstado = ESTADOS_RECURSO;
  protected readonly colorEstado = COLOR_ESTADO_RECURSO;

  protected readonly foto = computed(() => {
    const url = this.proyecto()?.foto_url;
    return esEnlaceWeb(url) ? url : null;
  });
  protected readonly materiales = computed(() => enLista(this.proyecto()?.materiales ?? null));
  protected readonly pasos = computed(() => enLista(this.proyecto()?.pasos ?? null));

  constructor() {
    effect(() => void this.cargar(this.id()));
  }

  protected async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.proyecto.set(await this.servicio.obtener(id));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
