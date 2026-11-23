import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Recurso } from '@portal/shared';
import { Badge, COLOR_TIPO } from '../badge/badge';
import { Icono } from '../icono/icono';
import { esEnlaceWeb } from '../enlaces';

/** Tarjeta del banco de recursos: badge del tipo, título, descripción, área y grado, Ver y Abrir enlace. */
@Component({
  selector: 'app-tarjeta-recurso',
  imports: [RouterLink, Badge, Icono],
  host: { class: 'tarjeta flex flex-col' },
  template: `
    <div><app-badge [color]="color()">{{ recurso().tipo }}</app-badge></div>
    <h2 class="mt-3 text-lg font-bold leading-snug">{{ recurso().titulo }}</h2>
    <p class="mt-1 text-sm text-secundario">{{ recurso().area }} · {{ recurso().grado }}</p>
    @if (recurso().descripcion) {
      <p class="mt-3 line-clamp-3 text-sm">{{ recurso().descripcion }}</p>
    }
    <!-- mt-auto empuja los botones al fondo para que las tarjetas queden alineadas -->
    <div class="mt-auto grid grid-cols-2 gap-2 pt-5">
      <a [routerLink]="['/recursos', recurso().id]" class="btn btn-secundario">
        Ver<span class="sr-only">: {{ recurso().titulo }}</span>
      </a>
      @if (enlace(); as url) {
        <a [href]="url" target="_blank" rel="noopener noreferrer" class="btn btn-primario">
          Abrir enlace <app-icono nombre="externo" clase="size-4 shrink-0" />
          <span class="sr-only">de {{ recurso().titulo }} (se abre en otra pestaña)</span>
        </a>
      }
    </div>
  `,
})
export class TarjetaRecurso {
  readonly recurso = input.required<Recurso>();
  protected readonly color = computed(() => COLOR_TIPO[this.recurso().tipo] ?? 'gris');
  protected readonly enlace = computed(() =>
    esEnlaceWeb(this.recurso().enlace_o_archivo) ? this.recurso().enlace_o_archivo : null,
  );
}
