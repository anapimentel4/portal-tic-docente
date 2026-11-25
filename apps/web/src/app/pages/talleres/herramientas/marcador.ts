import { Component, computed, inject } from '@angular/core';
import { Icono } from '../../../shared/icono/icono';
import { EQUIPOS } from '../datos';
import { SalaTallerEstado } from '../sala-taller.estado';

/** Marcador de los 4 equipos, con barras. */
@Component({
  selector: 'app-marcador',
  imports: [Icono],
  template: `
    <h2 class="text-lg font-bold text-oscuro!">Marcador</h2>

    <ul class="flex flex-col gap-2.5">
      @for (equipo of equipos; track equipo.nombre; let i = $index) {
        <li class="flex items-center gap-2 text-sm">
          <span class="w-16 shrink-0 font-semibold">{{ equipo.nombre }}</span>
          <span class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <span class="block h-full rounded-full transition-all" [class]="equipo.barra" [style.width.%]="(puntos()[i] / maximo()) * 100"></span>
          </span>
          <b class="w-7 text-right text-base tabular-nums" aria-live="polite">{{ puntos()[i] }}</b>
          <button type="button" class="flex size-9 items-center justify-center rounded-lg border border-borde bg-white disabled:opacity-40" [attr.aria-label]="'Quitar un punto a ' + equipo.nombre" [disabled]="puntos()[i] === 0" (click)="sumar(i, -1)">
            <app-icono nombre="menos" clase="size-4" />
          </button>
          <button type="button" class="flex size-9 items-center justify-center rounded-lg bg-oscuro text-white" [attr.aria-label]="'Sumar un punto a ' + equipo.nombre" (click)="sumar(i, 1)">
            <app-icono nombre="mas" clase="size-4" />
          </button>
        </li>
      }
    </ul>

    <button type="button" class="btn btn-secundario mt-auto w-full" [disabled]="total() === 0" (click)="reiniciar()">
      <app-icono nombre="reiniciar" /> Poner en cero
    </button>
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class Marcador {
  private readonly estado = inject(SalaTallerEstado);
  protected readonly equipos = EQUIPOS;
  protected readonly puntos = this.estado.puntos;

  protected readonly total = computed(() => this.puntos().reduce((a, b) => a + b, 0));
  /** La barra llena equivale a 10 puntos, o al equipo que vaya ganando si pasa de 10. */
  protected readonly maximo = computed(() => Math.max(10, ...this.puntos()));

  protected sumar(equipo: number, cambio: number): void {
    this.puntos.update((p) => p.map((v, i) => (i === equipo ? Math.max(0, v + cambio) : v)));
  }

  protected reiniciar(): void {
    if (confirm('¿Poner el marcador en cero?')) this.puntos.set(EQUIPOS.map(() => 0));
  }
}
