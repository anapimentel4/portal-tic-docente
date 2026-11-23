import { Component, computed, input } from '@angular/core';
import type { EstadoRecurso, TipoRecurso } from '@portal/shared';

/**
 * Colores de los badges. Las clases van escritas completas para que Tailwind las incluya.
 * Todas cumplen contraste AA (texto 800 sobre fondo 100).
 */
const COLORES = {
  azul: 'bg-blue-100 text-blue-800',
  rojo: 'bg-red-100 text-red-800',
  violeta: 'bg-violet-100 text-violet-800',
  ambar: 'bg-amber-100 text-amber-800',
  verde: 'bg-green-100 text-green-800',
  naranja: 'bg-orange-100 text-orange-800',
  cian: 'bg-cyan-100 text-cyan-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  gris: 'bg-slate-100 text-slate-700',
} as const;
export type ColorBadge = keyof typeof COLORES;

/** Un color por tipo de recurso. */
export const COLOR_TIPO: Record<TipoRecurso, ColorBadge> = {
  Guía: 'azul',
  Video: 'rojo',
  Plantilla: 'violeta',
  Presentación: 'ambar',
  Tutorial: 'cian',
  'Proyecto de robótica': 'naranja',
  'Ciudadanía digital': 'verde',
  'Herramienta web': 'indigo',
};

export const COLOR_ESTADO_RECURSO: Record<EstadoRecurso, ColorBadge> = {
  en_revision: 'ambar',
  publicado: 'verde',
  rechazado: 'rojo',
};

/** Etiqueta pequeña de color. Uso: <app-badge color="azul">Guía</app-badge> */
@Component({
  selector: 'app-badge',
  template: `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" [class]="clases()"><ng-content /></span>`,
})
export class Badge {
  readonly color = input<ColorBadge>('gris');
  protected readonly clases = computed(() => COLORES[this.color()]);
}
