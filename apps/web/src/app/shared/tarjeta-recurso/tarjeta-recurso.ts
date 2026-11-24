import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Recurso } from '@portal/shared';
import { PORTADA_AREA, PORTADA_TIPO } from '../colores';
import { esEnlaceWeb } from '../enlaces';
import { Icono } from '../icono/icono';

/**
 * Tarjeta del banco de recursos: una portada de color según el tipo (con su etiqueta,
 * un icono y el sitio web), área y grado, título, descripción corta, y los botones Ver y Abrir enlace.
 */
@Component({
  selector: 'app-tarjeta-recurso',
  imports: [RouterLink, Icono],
  host: { class: 'tarjeta tarjeta-interactiva flex flex-col rounded-3xl p-3' },
  template: `
    <!-- Portada (adorno: el tipo también se lee en la etiqueta) -->
    <div class="fondo-tecnologico relative aspect-[5/2] rounded-2xl sm:aspect-[16/9] bg-gradient-to-br p-4" [class]="portada().fondo">
      <span class="rounded-md px-2 py-0.5 text-[11px] font-bold text-oscuro" [class]="portada().etiqueta">{{ recurso().tipo }}</span>
      <span
        class="absolute top-1/2 right-4 flex size-16 -translate-y-1/2 -rotate-6 items-center justify-center rounded-2xl bg-white shadow-xl sm:size-[4.5rem]"
        [class]="portada().colorIcono"
        aria-hidden="true"
      >
        <app-icono [nombre]="portada().icono" clase="size-8 shrink-0 sm:size-9" />
      </span>
      <span class="absolute -right-6 -bottom-6 size-20 rounded-full bg-white/10" aria-hidden="true"></span>
      @if (sitio(); as s) {
        <span class="absolute bottom-3 left-4 max-w-[55%] truncate text-xs font-semibold text-white/80">{{ s }}</span>
      }
    </div>

    <div class="flex flex-1 flex-col px-2 pt-4 pb-1">
      <p class="text-xs font-medium text-secundario">{{ recurso().area }} · {{ recurso().grado }}</p>
      <h2 class="mt-1 line-clamp-2 text-base leading-snug font-bold">{{ recurso().titulo }}</h2>
      @if (recurso().descripcion) {
        <p class="mt-1.5 line-clamp-2 text-sm text-secundario">{{ recurso().descripcion }}</p>
      }
      <!-- mt-auto empuja los botones al fondo para que las tarjetas queden alineadas -->
      <div class="mt-auto grid grid-cols-[auto_1fr] gap-2 pt-4">
        <a [routerLink]="['/recursos', recurso().id]" class="btn btn-secundario px-4">
          Ver<span class="sr-only">: {{ recurso().titulo }}</span>
        </a>
        @if (enlace(); as url) {
          <a [href]="url" target="_blank" rel="noopener noreferrer" class="btn btn-primario px-3">
            Abrir enlace <app-icono nombre="externo" clase="size-4 shrink-0" />
            <span class="sr-only">de {{ recurso().titulo }} (se abre en otra pestaña)</span>
          </a>
        }
      </div>
    </div>
  `,
})
export class TarjetaRecurso {
  readonly recurso = input.required<Recurso>();
  /**
   * Color: el del área (si es una sola) o el del tipo. Icono: el del tipo, salvo las
   * herramientas web de un área concreta, que llevan el icono de su asignatura.
   */
  protected readonly portada = computed(() => {
    const { tipo, area } = this.recurso();
    const porTipo = PORTADA_TIPO[tipo] ?? PORTADA_TIPO['Herramienta web'];
    const porArea = PORTADA_AREA[area];
    if (!porArea) return porTipo;
    return { ...porArea, icono: tipo === 'Herramienta web' ? porArea.icono : porTipo.icono };
  });
  protected readonly enlace = computed(() =>
    esEnlaceWeb(this.recurso().enlace_o_archivo) ? this.recurso().enlace_o_archivo : null,
  );
  /** "https://www.code.org/learn" → "code.org" (se muestra en la portada). */
  protected readonly sitio = computed(() => {
    const url = this.enlace();
    if (!url) return null;
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return null;
    }
  });
}
