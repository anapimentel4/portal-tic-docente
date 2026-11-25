import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Icono } from '../../../shared/icono/icono';
import { COLORES_RULETA } from '../datos';
import { lineas, SalaTallerEstado } from '../sala-taller.estado';

const VUELTAS = 5;
const DURACION_MS = 3500;
/** Con más opciones que esto, los textos no caben en la rueda: se muestran números. */
const MAX_TEXTOS = 12;

type Fuente = 'nombres' | 'preguntas';

/**
 * Ruleta: elige al azar un nombre de los participantes o una pregunta.
 * La lista se edita en la misma tarjeta (botón "Editar lista") y se comparte con "Configurar el taller".
 */
@Component({
  selector: 'app-ruleta',
  imports: [Icono],
  template: `
    <div class="flex items-center justify-between gap-2">
      <h2 class="text-lg font-bold text-oscuro!">Ruleta</h2>
      <div class="flex rounded-lg bg-slate-100 p-1 text-xs font-semibold" role="group" aria-label="Qué gira la ruleta">
        @for (f of fuentes; track f.valor) {
          <button
            type="button"
            class="min-h-8 rounded-md px-2.5"
            [class]="fuente() === f.valor ? 'bg-white shadow-sm' : 'text-secundario'"
            [attr.aria-pressed]="fuente() === f.valor"
            (click)="elegirFuente(f.valor)"
          >
            {{ f.texto }}
          </button>
        }
      </div>
    </div>

    @if (editando()) {
      <div class="flex flex-1 flex-col gap-2">
        <label for="ruleta-lista" class="text-sm font-semibold">
          {{ fuente() === 'nombres' ? 'Nombres (uno por línea)' : 'Preguntas (una por línea)' }}
        </label>
        <textarea
          id="ruleta-lista"
          rows="9"
          class="campo flex-1 text-sm"
          [value]="texto()"
          [placeholder]="fuente() === 'nombres' ? 'María Pérez&#10;José Rodríguez&#10;…' : 'What is your favorite song?&#10;…'"
          (input)="cambiarTexto($any($event.target).value)"
        ></textarea>
        <p class="text-xs text-secundario">{{ opciones().length }} en la ruleta. Se guarda solo.</p>
        <button type="button" class="btn btn-primario w-full" (click)="editando.set(false)"><app-icono nombre="check" /> Listo</button>
      </div>
    } @else {
      <div class="relative mx-auto mt-1 size-56">
        <!-- Indicador fijo arriba -->
        <span class="absolute -top-1 left-1/2 z-10 -translate-x-1/2 border-x-[11px] border-t-[18px] border-x-transparent border-t-oscuro" aria-hidden="true"></span>
        <div
          class="relative size-full overflow-hidden rounded-full border-4 border-white shadow-md ring-1 ring-borde"
          [style.background]="fondo()"
          [style.transform]="'rotate(' + giro() + 'deg)'"
          [style.transition]="girando() ? 'transform ' + duracionActual() + 'ms cubic-bezier(0.17, 0.67, 0.21, 1)' : 'none'"
          aria-hidden="true"
        >
          <!-- Texto de cada segmento, del centro hacia afuera -->
          @for (e of etiquetas(); track $index) {
            <span
              class="absolute top-1/2 left-1/2 w-[46%] origin-left truncate pr-2 text-right text-xs font-bold text-white drop-shadow"
              [style.transform]="'translateY(-50%) rotate(' + e.angulo + 'deg)'"
            >
              {{ e.texto }}
            </span>
          }
        </div>
        <button
          type="button"
          class="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-white text-xs font-bold shadow-md hover:bg-slate-50 disabled:cursor-not-allowed"
          [disabled]="girando() || opciones().length < 2"
          aria-label="Girar la ruleta"
          (click)="girar()"
        >
          SPIN
        </button>
      </div>

      <div class="flex min-h-16 items-center justify-center rounded-xl bg-fondo px-3 py-2 text-center" aria-live="polite">
        @if (opciones().length < 2) {
          <span class="text-sm text-secundario">
            {{ fuente() === 'nombres' ? 'Agrega al menos 2 nombres con “Editar lista”.' : 'Agrega al menos 2 preguntas con “Editar lista”.' }}
          </span>
        } @else if (girando()) {
          <span class="text-sm text-secundario">Girando…</span>
        } @else if (resultado()) {
          <span class="font-titulo text-lg leading-snug font-bold">
            @if (fuente() === 'preguntas') {
              <span class="block text-xs font-sans font-semibold tracking-wide text-acento uppercase">Pregunta {{ elegida() + 1 }}</span>
            }
            {{ resultado() }}
          </span>
        } @else {
          <span class="text-sm text-secundario">Pulsa “Girar”. Hay {{ opciones().length }} {{ fuente() === 'nombres' ? 'nombres' : 'preguntas' }}.</span>
        }
      </div>

      <div class="mt-auto flex flex-col gap-2">
        <button type="button" class="btn w-full bg-oscuro text-white hover:bg-slate-800" [disabled]="girando() || opciones().length < 2" (click)="girar()">
          <app-icono nombre="reiniciar" /> Girar
        </button>
        <button type="button" class="btn btn-secundario w-full" [disabled]="girando()" (click)="editando.set(true)">
          <app-icono nombre="ajustes" /> Editar lista
        </button>
      </div>
    }
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class Ruleta implements OnDestroy {
  private readonly estado = inject(SalaTallerEstado);

  /** Con "Reducir movimiento" activado gira menos y más rápido, pero sigue girando. */
  protected readonly duracionActual = signal(DURACION_MS);
  protected readonly fuentes: { valor: Fuente; texto: string }[] = [
    { valor: 'nombres', texto: 'Nombres' },
    { valor: 'preguntas', texto: 'Preguntas' },
  ];
  /** Si todavía no hay nombres, empieza con las preguntas para que se pueda girar enseguida. */
  protected readonly fuente = signal<Fuente>(this.estado.participantes().length >= 2 ? 'nombres' : 'preguntas');
  protected readonly editando = signal(false);
  protected readonly giro = signal(0);
  protected readonly girando = signal(false);
  protected readonly resultado = signal('');
  protected readonly elegida = signal(0);
  private temporizador?: ReturnType<typeof setTimeout>;

  /** El texto de la lista actual (nombres o preguntas), tal como se escribe. */
  protected readonly texto = computed(() =>
    this.fuente() === 'nombres' ? this.estado.config().participantes : this.estado.config().preguntas,
  );
  protected readonly opciones = computed(() => lineas(this.texto()));

  /** Un segmento de color por opción (conic-gradient empieza arriba y gira en el sentido del reloj). */
  protected readonly fondo = computed(() => {
    const n = segmentos(this.opciones().length);
    const paso = 360 / n;
    const partes = Array.from({ length: n }, (_, i) => {
      // Si el último color queda igual al primero (que está al lado), se usa otro.
      const color = COLORES_RULETA[(i === n - 1 && n % COLORES_RULETA.length === 1 ? i + 1 : i) % COLORES_RULETA.length];
      return `${color} ${i * paso}deg ${(i + 1) * paso}deg`;
    });
    return `conic-gradient(${partes.join(', ')})`;
  });

  /**
   * Textos sobre la rueda. Los nombres se escriben (si caben); las preguntas, con su número.
   * El ángulo se mide como en CSS (0° = derecha), por eso se resta 90° al centro del segmento.
   */
  protected readonly etiquetas = computed(() => {
    const opciones = this.opciones();
    if (opciones.length < 2) return [];
    const paso = 360 / opciones.length;
    const conTexto = this.fuente() === 'nombres' && opciones.length <= MAX_TEXTOS;
    return opciones.map((o, i) => ({
      angulo: i * paso + paso / 2 - 90,
      texto: conTexto ? o.split(' ')[0] : String(i + 1),
    }));
  });

  protected elegirFuente(fuente: Fuente): void {
    if (this.girando()) return;
    this.fuente.set(fuente);
    this.resultado.set('');
  }

  protected cambiarTexto(valor: string): void {
    this.estado.cambiar(this.fuente() === 'nombres' ? 'participantes' : 'preguntas', valor);
    this.resultado.set('');
  }

  protected girar(): void {
    const opciones = this.opciones();
    if (opciones.length < 2 || this.girando()) return;
    const paso = 360 / opciones.length;
    const elegida = Math.floor(Math.random() * opciones.length);
    // Centro del segmento elegido; se gira para que quede bajo el indicador (arriba).
    const centro = elegida * paso + paso / 2;
    const poco = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const duracion = poco ? 1200 : DURACION_MS;
    const actual = this.giro();
    const destino = actual - (actual % 360) + (poco ? 1 : VUELTAS) * 360 + (360 - centro);

    this.resultado.set('');
    this.duracionActual.set(duracion);
    this.girando.set(true);
    // Se espera un cuadro para que el navegador aplique la transición antes de cambiar el giro.
    requestAnimationFrame(() => this.giro.set(destino));
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => {
      this.girando.set(false);
      this.elegida.set(elegida);
      this.resultado.set(opciones[elegida]);
    }, duracion + 100);
  }

  ngOnDestroy(): void {
    clearTimeout(this.temporizador);
  }
}

/** Un segmento por opción; sin opciones, la ruleta se ve con 4 colores. */
function segmentos(opciones: number): number {
  return opciones >= 2 ? opciones : 4;
}
