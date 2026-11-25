import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Icono } from '../../../shared/icono/icono';
import { COLORES_RULETA } from '../datos';
import { lineas, SalaTallerEstado } from '../sala-taller.estado';

const VUELTAS = 5;
const DURACION_MS = 3500;

/** Ruleta: elige al azar un nombre de los participantes o una pregunta. */
@Component({
  selector: 'app-ruleta',
  imports: [Icono],
  template: `
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-lg font-bold text-oscuro!">Ruleta</h2>
      <div class="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold" role="group" aria-label="Qué gira la ruleta">
        <button type="button" class="rounded-md px-2.5 py-1.5" [class]="fuente() === 'nombres' ? 'bg-white shadow-sm' : 'text-secundario'" [attr.aria-pressed]="fuente() === 'nombres'" (click)="elegirFuente('nombres')">Nombres</button>
        <button type="button" class="rounded-md px-2.5 py-1.5" [class]="fuente() === 'preguntas' ? 'bg-white shadow-sm' : 'text-secundario'" [attr.aria-pressed]="fuente() === 'preguntas'" (click)="elegirFuente('preguntas')">Preguntas</button>
      </div>
    </div>

    <div class="relative mx-auto mt-2 size-44 sm:size-48">
      <!-- Indicador fijo arriba -->
      <span class="absolute -top-1 left-1/2 z-10 -translate-x-1/2 border-x-[10px] border-t-[16px] border-x-transparent border-t-oscuro" aria-hidden="true"></span>
      <div
        class="size-full rounded-full border-4 border-white shadow-md ring-1 ring-borde"
        [style.background]="fondo()"
        [style.transform]="'rotate(' + giro() + 'deg)'"
        [style.transition]="girando() ? 'transform ' + duracion + 'ms cubic-bezier(0.17, 0.67, 0.21, 1)' : 'none'"
        aria-hidden="true"
      ></div>
      <span class="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-white text-xs font-bold shadow" aria-hidden="true">SPIN</span>
    </div>

    <p class="min-h-12 text-center text-sm font-semibold" aria-live="polite">
      @if (opciones().length === 0) {
        <span class="font-normal text-secundario">
          {{ fuente() === 'nombres' ? 'Escribe los nombres en “Configurar el taller”.' : 'Escribe las preguntas en “Configurar el taller”.' }}
        </span>
      } @else if (girando()) {
        <span class="font-normal text-secundario">Girando…</span>
      } @else if (resultado()) {
        {{ resultado() }}
      } @else {
        <span class="font-normal text-secundario">{{ opciones().length }} {{ fuente() === 'nombres' ? 'nombres' : 'preguntas' }} en la ruleta</span>
      }
    </p>

    <button type="button" class="btn mt-auto w-full bg-oscuro text-white hover:bg-slate-800" [disabled]="girando() || opciones().length < 2" (click)="girar()">
      <app-icono nombre="reiniciar" /> Girar
    </button>
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class Ruleta implements OnDestroy {
  private readonly estado = inject(SalaTallerEstado);

  protected readonly duracion = DURACION_MS;
  protected readonly fuente = signal<'nombres' | 'preguntas'>('nombres');
  protected readonly giro = signal(0);
  protected readonly girando = signal(false);
  protected readonly resultado = signal('');
  private temporizador?: ReturnType<typeof setTimeout>;

  protected readonly opciones = computed(() =>
    this.fuente() === 'nombres' ? this.estado.participantes() : lineas(this.estado.config().preguntas),
  );

  /** Un segmento de color por opción (conic-gradient empieza arriba y gira en el sentido del reloj). */
  protected readonly fondo = computed(() => {
    const n = segmentos(this.opciones().length);
    const paso = 360 / n;
    const partes = Array.from({ length: n }, (_, i) => {
      // Si hay un número de opciones que deja dos segmentos iguales juntos, se salta un color.
      const color = COLORES_RULETA[(i === n - 1 && n % COLORES_RULETA.length === 1 ? i + 1 : i) % COLORES_RULETA.length];
      return `${color} ${i * paso}deg ${(i + 1) * paso}deg`;
    });
    return `conic-gradient(${partes.join(', ')})`;
  });

  protected elegirFuente(fuente: 'nombres' | 'preguntas'): void {
    if (this.girando()) return;
    this.fuente.set(fuente);
    this.resultado.set('');
  }

  protected girar(): void {
    const opciones = this.opciones();
    if (opciones.length < 2 || this.girando()) return;
    const paso = 360 / segmentos(opciones.length);
    const elegida = Math.floor(Math.random() * opciones.length);
    // Centro del segmento elegido; se gira para que quede bajo el indicador (arriba).
    const centro = elegida * paso + paso / 2;
    const actual = this.giro();
    const destino = actual - (actual % 360) + VUELTAS * 360 + (360 - centro);

    const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resultado.set('');
    this.girando.set(!sinMovimiento);
    this.giro.set(destino);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(
      () => {
        this.girando.set(false);
        this.resultado.set(opciones[elegida]);
      },
      sinMovimiento ? 0 : DURACION_MS,
    );
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }
}

/** Un segmento por opción; sin opciones, la ruleta se ve con 4 colores. */
function segmentos(opciones: number): number {
  return opciones >= 2 ? opciones : 4;
}
