import { Component, inject } from '@angular/core';
import { Icono } from '../../../shared/icono/icono';
import { EQUIPOS } from '../datos';
import { SalaTallerEstado } from '../sala-taller.estado';

/** Reparte a los participantes en los 4 equipos, al azar. */
@Component({
  selector: 'app-grupos',
  imports: [Icono],
  template: `
    <h2 class="text-lg font-bold text-oscuro!">Grupos al azar</h2>

    @if (estado.participantes().length === 0) {
      <p class="text-sm text-secundario">Escribe los nombres de los participantes en “Configurar el taller” y pulsa “Mezclar grupos”.</p>
    }

    <ul class="grid grid-cols-2 gap-2 text-sm">
      @for (equipo of equipos; track equipo.nombre; let i = $index) {
        <li class="rounded-lg border p-2" [class]="equipo.tarjeta">
          <p class="font-bold">{{ equipo.nombre }}</p>
          @if (estado.grupos()[i].length) {
            <p class="text-secundario">{{ estado.grupos()[i].join(', ') }}</p>
          } @else {
            <p class="text-secundario">Sin nombres</p>
          }
        </li>
      }
    </ul>

    <button type="button" class="btn btn-secundario mt-auto w-full" [disabled]="estado.participantes().length === 0" (click)="mezclar()">
      <app-icono nombre="mezclar" /> Mezclar grupos
    </button>
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class Grupos {
  protected readonly estado = inject(SalaTallerEstado);
  protected readonly equipos = EQUIPOS;

  protected mezclar(): void {
    const nombres = [...this.estado.participantes()];
    // Mezcla de Fisher-Yates: todas las combinaciones tienen la misma probabilidad.
    for (let i = nombres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nombres[i], nombres[j]] = [nombres[j], nombres[i]];
    }
    const grupos: string[][] = EQUIPOS.map(() => []);
    nombres.forEach((nombre, i) => grupos[i % EQUIPOS.length].push(nombre));
    this.estado.grupos.set(grupos);
  }
}
