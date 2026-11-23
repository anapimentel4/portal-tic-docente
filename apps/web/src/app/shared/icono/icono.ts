import { Component, computed, input } from '@angular/core';

/** Una figura de un icono: un trazo (path), un círculo o un rectángulo. */
type Figura =
  | { d: string }
  | { cx: number; cy: number; r: number }
  | { x: number; y: number; w: number; h: number; rx?: number };

/**
 * Iconos de trazo (24×24) del portal. Para agregar uno, añade su nombre y sus figuras aquí.
 * Son decorativos (aria-hidden): el texto del botón o del enlace es lo que se lee.
 */
const ICONOS = {
  libro: [{ d: 'M2 5h6a4 4 0 0 1 4 4v11a3 3 0 0 0-3-3H2z' }, { d: 'M22 5h-6a4 4 0 0 0-4 4v11a3 3 0 0 1 3-3h7z' }],
  robot: [
    { x: 5, y: 8, w: 14, h: 11, rx: 2 },
    { d: 'M12 8V5' },
    { cx: 12, cy: 4, r: 1 },
    { d: 'M9.5 13v1.5M14.5 13v1.5M2 13.5h3M19 13.5h3' },
  ],
  birrete: [{ d: 'M2 9l10-5 10 5-10 5z' }, { d: 'M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5' }, { d: 'M22 9v6' }],
  planificacion: [{ x: 5, y: 4, w: 14, h: 17, rx: 2 }, { d: 'M9 4V3h6v1' }, { d: 'M9 13l2 2 4-4' }],
  soporte: [
    { d: 'M4 15v-3a8 8 0 0 1 16 0v3' },
    { x: 3, y: 14, w: 4, h: 6, rx: 1.5 },
    { x: 17, y: 14, w: 4, h: 6, rx: 1.5 },
    { d: 'M19 20a3 3 0 0 1-3 2h-3' },
  ],
  escudo: [{ d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' }, { d: 'M9 12l2 2 4-4' }],
  buscar: [{ cx: 11, cy: 11, r: 7 }, { d: 'M20 20l-4-4' }],
  externo: [{ d: 'M14 4h6v6M20 4l-9 9' }, { d: 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' }],
  flecha: [{ d: 'M5 12h14M13 6l6 6-6 6' }],
  volver: [{ d: 'M19 12H5M11 6l-6 6 6 6' }],
  abajo: [{ d: 'M12 5v14M6 13l6 6 6-6' }],
  mas: [{ d: 'M12 5v14M5 12h14' }],
  check: [{ d: 'M5 12l5 5L20 7' }],
  resumen: [
    { x: 3, y: 3, w: 7, h: 7, rx: 1.5 },
    { x: 14, y: 3, w: 7, h: 7, rx: 1.5 },
    { x: 3, y: 14, w: 7, h: 7, rx: 1.5 },
    { x: 14, y: 14, w: 7, h: 7, rx: 1.5 },
  ],
  bandeja: [{ d: 'M3 13l3-8h12l3 8' }, { d: 'M3 13v6a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6h-5l-2 3h-4l-2-3z' }],
  caja: [{ d: 'M3 7l9-4 9 4-9 4z' }, { d: 'M3 7v10l9 4 9-4V7' }, { d: 'M12 11v10' }],
  personas: [{ cx: 9, cy: 8, r: 3 }, { d: 'M3 20a6 6 0 0 1 12 0' }, { cx: 17, cy: 9, r: 2.5 }, { d: 'M16.5 14.5a5 5 0 0 1 4.5 5' }],
  revision: [{ x: 5, y: 4, w: 14, h: 17, rx: 2 }, { d: 'M9 4V3h6v1' }, { d: 'M9 10h6M9 14h6M9 18h3' }],
} satisfies Record<string, Figura[]>;

export type NombreIcono = keyof typeof ICONOS;

@Component({
  selector: 'app-icono',
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      [class]="clase()"
    >
      @for (f of figuras(); track $index) {
        @if ('d' in f) {
          <svg:path [attr.d]="f.d" />
        } @else if ('r' in f) {
          <svg:circle [attr.cx]="f.cx" [attr.cy]="f.cy" [attr.r]="f.r" />
        } @else {
          <svg:rect [attr.x]="f.x" [attr.y]="f.y" [attr.width]="f.w" [attr.height]="f.h" [attr.rx]="f.rx ?? 0" />
        }
      }
    </svg>
  `,
  host: { class: 'contents' },
})
export class Icono {
  readonly nombre = input.required<NombreIcono>();
  /** Tamaño y color con clases de Tailwind. Por defecto: 20 px. */
  readonly clase = input('size-5 shrink-0');

  protected readonly figuras = computed<Figura[]>(() => ICONOS[this.nombre()]);
}
