import { Component, computed, input } from '@angular/core';
import { COLORES, type Color } from '../colores';

// Se reexportan para no cambiar los imports de las páginas.
export { COLOR_ESTADO_RECURSO, COLOR_ESTADO_SOLICITUD, COLOR_TIPO } from '../colores';
export type ColorBadge = Color;

/** Etiqueta pequeña de color. Uso: <app-badge color="azul">Guía</app-badge> */
@Component({
  selector: 'app-badge',
  template: `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="clases()"><ng-content /></span>`,
})
export class Badge {
  readonly color = input<Color>('gris');
  protected readonly clases = computed(() => COLORES[this.color()].badge);
}
