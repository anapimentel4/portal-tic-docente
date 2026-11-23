import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS_RECURSO, type ProyectoRobotica } from '@portal/shared';
import { Badge } from '../badge/badge';
import { COLOR_ESTADO_RECURSO } from '../colores';
import { esEnlaceWeb } from '../enlaces';
import { Icono } from '../icono/icono';

/**
 * Tarjeta de proyecto de robótica: foto, título, área, grado y frase corta. Toda la tarjeta lleva al detalle.
 * `oscura`: versión para la franja oscura de Inicio (como el mockup).
 */
@Component({
  selector: 'app-tarjeta-proyecto',
  imports: [RouterLink, Badge, Icono],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/robotica', proyecto().id]"
      class="tarjeta flex h-full flex-col overflow-hidden p-0 transition-colors"
      [class]="
        oscura()
          ? 'border-slate-700 bg-slate-800 hover:border-amber-300'
          : 'border-orange-100 bg-orange-50/70 hover:border-orange-300'
      "
    >
      @if (foto(); as url) {
        <img [src]="url" alt="" class="aspect-video w-full bg-white object-cover" loading="lazy" />
      } @else {
        <!-- Sin foto: un recuadro con el icono, para que todas las tarjetas tengan la misma forma -->
        <span
          class="flex aspect-video w-full items-center justify-center"
          [class]="oscura() ? 'bg-slate-700/60 text-amber-300' : 'bg-orange-100/60 text-orange-700'"
        >
          <app-icono nombre="robot" clase="size-14 shrink-0" />
        </span>
      }
      <span class="flex flex-1 flex-col p-5">
        @if (proyecto().estado !== 'publicado') {
          <span class="mb-2"><app-badge [color]="colorEstado[proyecto().estado]">{{ textosEstado[proyecto().estado] }}</app-badge></span>
        }
        @if (oscura()) {
          <span class="mb-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span class="rounded-full bg-amber-400 px-2.5 py-1 text-oscuro">{{ proyecto().area }}</span>
            <span class="rounded-full bg-white/10 px-2.5 py-1 text-slate-100">{{ proyecto().grado }}</span>
          </span>
        }
        <span class="font-titulo text-lg font-bold leading-snug" [class]="oscura() ? 'text-white' : 'text-oscuro'">
          {{ proyecto().titulo }}
        </span>
        @if (!oscura()) {
          <span class="mt-1 text-sm text-secundario">{{ proyecto().area }} · {{ proyecto().grado }}</span>
        }
        @if (proyecto().descripcion) {
          <span class="mt-2 text-sm" [class]="oscura() ? 'text-slate-300' : 'text-oscuro/80'">{{ proyecto().descripcion }}</span>
        }
        <span
          class="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold"
          [class]="oscura() ? 'text-amber-300' : 'text-primario'"
        >
          Ver proyecto <app-icono nombre="flecha" clase="size-4 shrink-0" />
        </span>
      </span>
    </a>
  `,
})
export class TarjetaProyecto {
  readonly proyecto = input.required<ProyectoRobotica>();
  readonly oscura = input(false);
  protected readonly textosEstado = ESTADOS_RECURSO;
  protected readonly colorEstado = COLOR_ESTADO_RECURSO;
  protected readonly foto = computed(() => (esEnlaceWeb(this.proyecto().foto_url) ? this.proyecto().foto_url : null));
}
