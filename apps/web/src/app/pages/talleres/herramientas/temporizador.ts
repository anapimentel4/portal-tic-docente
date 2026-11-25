import { Component, computed, OnDestroy, signal } from '@angular/core';
import { Icono } from '../../../shared/icono/icono';

const OPCIONES_MINUTOS = [3, 5, 10, 15, 20];

/** Temporizador grande para proyectar. Al llegar a cero suena tres veces (cambio de mesa). */
@Component({
  selector: 'app-temporizador',
  imports: [Icono],
  template: `
    <h2 class="text-lg font-bold text-oscuro!">Temporizador</h2>

    <div class="flex flex-wrap gap-1.5" role="group" aria-label="Duración en minutos">
      @for (m of opciones; track m) {
        <button
          type="button"
          class="min-h-9 rounded-lg px-2.5 text-sm font-semibold"
          [class]="minutos() === m ? 'bg-oscuro text-white' : 'border border-borde bg-white'"
          [attr.aria-pressed]="minutos() === m"
          (click)="elegir(m)"
        >
          {{ m }} min
        </button>
      }
    </div>

    <p
      class="text-center font-titulo text-6xl leading-tight font-bold tabular-nums"
      [class.text-acento]="restante() === 0"
      role="timer"
      [attr.aria-label]="'Quedan ' + texto()"
    >
      {{ texto() }}
    </p>
    <p class="text-center text-sm text-secundario" aria-live="polite">
      {{ restante() === 0 ? '¡Tiempo! Cambio de mesa.' : corriendo() ? 'Al sonar: cambio de mesa' : 'En pausa' }}
    </p>

    <div class="mt-auto flex gap-2">
      <button type="button" class="btn flex-1 bg-acento text-white hover:bg-orange-800" (click)="alternar()">
        @if (corriendo()) {
          <app-icono nombre="pausa" /> Pausar
        } @else {
          <app-icono nombre="play" /> {{ restante() === minutos() * 60 ? 'Iniciar' : restante() === 0 ? 'Otra vez' : 'Seguir' }}
        }
      </button>
      <button type="button" class="btn btn-secundario flex-1" (click)="reiniciar()">
        <app-icono nombre="reiniciar" /> Reiniciar
      </button>
    </div>
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class Temporizador implements OnDestroy {
  protected readonly opciones = OPCIONES_MINUTOS;
  protected readonly minutos = signal(10);
  /** Segundos que faltan. */
  protected readonly restante = signal(10 * 60);
  protected readonly corriendo = signal(false);

  private fin = 0;
  private intervalo?: ReturnType<typeof setInterval>;
  private audio?: AudioContext;

  protected readonly texto = computed(() => {
    const s = this.restante();
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  });

  protected elegir(minutos: number): void {
    this.detener();
    this.minutos.set(minutos);
    this.restante.set(minutos * 60);
  }

  protected alternar(): void {
    if (this.corriendo()) {
      this.detener();
      return;
    }
    if (this.restante() === 0) this.restante.set(this.minutos() * 60);
    // El sonido solo se puede preparar después de un clic.
    try {
      this.audio ??= new AudioContext();
      void this.audio.resume();
    } catch {
      // Sin sonido en este navegador.
    }
    // Se calcula con la hora real para que no se atrase si la pestaña queda en segundo plano.
    this.fin = Date.now() + this.restante() * 1000;
    this.corriendo.set(true);
    this.intervalo = setInterval(() => this.marcar(), 250);
  }

  protected reiniciar(): void {
    this.detener();
    this.restante.set(this.minutos() * 60);
  }

  private marcar(): void {
    const quedan = Math.max(0, Math.ceil((this.fin - Date.now()) / 1000));
    this.restante.set(quedan);
    if (quedan === 0) {
      this.detener();
      this.sonar();
    }
  }

  private detener(): void {
    clearInterval(this.intervalo);
    this.corriendo.set(false);
  }

  /** Tres pitidos cortos. */
  private sonar(): void {
    const audio = this.audio;
    if (!audio) return;
    for (let i = 0; i < 3; i++) {
      const inicio = audio.currentTime + i * 0.45;
      const tono = audio.createOscillator();
      const volumen = audio.createGain();
      tono.frequency.value = 880;
      volumen.gain.setValueAtTime(0.0001, inicio);
      volumen.gain.exponentialRampToValueAtTime(0.4, inicio + 0.02);
      volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.3);
      tono.connect(volumen).connect(audio.destination);
      tono.start(inicio);
      tono.stop(inicio + 0.32);
    }
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
    void this.audio?.close();
  }
}
