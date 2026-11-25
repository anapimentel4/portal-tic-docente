import { Component, computed, signal } from '@angular/core';
import { CATEGORIAS, DINAMICAS, type CategoriaDinamica } from '../datos';

/** Banco de dinámicas y juegos, con filtro por momento del taller. */
@Component({
  selector: 'app-banco-dinamicas',
  template: `
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-2xl font-bold text-oscuro!">Banco de dinámicas y juegos</h2>
        <p class="text-sm text-secundario">Los docentes las viven en el taller y las llevan a su aula.</p>
      </div>
      <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar dinámicas">
        @for (f of filtros; track f) {
          <button
            type="button"
            class="min-h-10 rounded-full px-3.5 text-sm font-semibold"
            [class]="filtro() === f ? 'bg-oscuro text-white' : 'border border-borde bg-white text-oscuro'"
            [attr.aria-pressed]="filtro() === f"
            (click)="filtro.set(f)"
          >
            {{ f }}
          </button>
        }
      </div>
    </div>

    <ul class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      @for (d of visibles(); track d.nombre) {
        <li class="flex flex-col gap-2 rounded-2xl border border-borde bg-white p-4">
          <span class="self-start rounded-full px-2.5 py-1 text-xs font-bold" [class]="categorias[d.categoria]">{{ d.categoria }}</span>
          <h3 class="text-base font-bold text-oscuro!">{{ d.nombre }}</h3>
          <p class="text-sm leading-relaxed text-secundario">{{ d.descripcion }}</p>
          <p class="mt-auto flex justify-between pt-1 text-xs text-secundario">
            <span>{{ d.duracion }}</span><span>{{ d.habilidad }}</span>
          </p>
        </li>
      }
    </ul>
  `,
})
export class BancoDinamicas {
  protected readonly categorias = CATEGORIAS;
  protected readonly filtros: ('Todas' | CategoriaDinamica)[] = ['Todas', 'Rompehielo', 'Energizante', 'Contenido', 'Cierre'];
  protected readonly filtro = signal<'Todas' | CategoriaDinamica>('Todas');
  protected readonly visibles = computed(() =>
    this.filtro() === 'Todas' ? DINAMICAS : DINAMICAS.filter((d) => d.categoria === this.filtro()),
  );
}
