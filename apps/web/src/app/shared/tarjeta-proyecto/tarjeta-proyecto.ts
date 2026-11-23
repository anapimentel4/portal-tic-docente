import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS_RECURSO, type ProyectoRobotica } from '@portal/shared';
import { Badge } from '../badge/badge';
import { COLOR_ESTADO_RECURSO } from '../colores';
import { esEnlaceWeb } from '../enlaces';
import { Icono } from '../icono/icono';

/** Tarjeta de proyecto de robótica: foto, título, área y grado. Toda la tarjeta lleva al detalle. */
@Component({
  selector: 'app-tarjeta-proyecto',
  imports: [RouterLink, Badge, Icono],
  host: { class: 'block' },
  template: `
    <a
      [routerLink]="['/robotica', proyecto().id]"
      class="tarjeta flex h-full flex-col overflow-hidden border-orange-100 bg-orange-50/70 p-0 transition-colors hover:border-orange-300"
    >
      @if (foto(); as url) {
        <img [src]="url" alt="" class="aspect-video w-full bg-white object-cover" loading="lazy" />
      } @else {
        <!-- Sin foto: un recuadro con el icono, para que todas las tarjetas tengan la misma forma -->
        <span class="flex aspect-video w-full items-center justify-center bg-orange-100/60 text-orange-700">
          <app-icono nombre="robot" clase="size-14 shrink-0" />
        </span>
      }
      <span class="flex flex-1 flex-col p-5">
        @if (proyecto().estado !== 'publicado') {
          <span class="mb-2"><app-badge [color]="colorEstado[proyecto().estado]">{{ textosEstado[proyecto().estado] }}</app-badge></span>
        }
        <span class="font-titulo text-lg font-bold leading-snug text-oscuro">{{ proyecto().titulo }}</span>
        <span class="mt-1 text-sm text-secundario">{{ proyecto().area }} · {{ proyecto().grado }}</span>
        <span class="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-primario">
          Ver proyecto <app-icono nombre="flecha" clase="size-4 shrink-0" />
        </span>
      </span>
    </a>
  `,
})
export class TarjetaProyecto {
  readonly proyecto = input.required<ProyectoRobotica>();
  protected readonly textosEstado = ESTADOS_RECURSO;
  protected readonly colorEstado = COLOR_ESTADO_RECURSO;
  protected readonly foto = computed(() => (esEnlaceWeb(this.proyecto().foto_url) ? this.proyecto().foto_url : null));
}
