import { Component, computed, effect, ElementRef, inject, OnDestroy, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Icono } from '../../shared/icono/icono';
import { type ActividadAgenda } from './datos';
import { BancoDinamicas } from './herramientas/banco-dinamicas';
import { Grupos } from './herramientas/grupos';
import { Marcador } from './herramientas/marcador';
import { Ruleta } from './herramientas/ruleta';
import { Temporizador } from './herramientas/temporizador';
import { crearQr } from './qr';
import { SalaTallerEstado } from './sala-taller.estado';

type EstadoActividad = 'hecho' | 'ahora' | 'pendiente';

/** Pantallas de English Hub que todavía no existen (se muestran como "Próximamente"). */
const PROXIMAMENTE = ['Juegos proyectables', 'Asistencia y evaluación', 'Subir evidencias'];

/**
 * Sala de taller (English Hub): pantalla para proyectar durante un taller con docentes.
 * Agenda del día, QR con un enlace, ruleta, temporizador, grupos al azar, marcador y banco de dinámicas.
 * No usa la base de datos: lo que se configura se guarda en este navegador (SalaTallerEstado).
 */
@Component({
  selector: 'app-sala-taller',
  imports: [RouterLink, Icono, Ruleta, Temporizador, Grupos, Marcador, BancoDinamicas],
  templateUrl: './sala-taller.html',
})
export class SalaTallerPage implements OnDestroy {
  protected readonly estado = inject(SalaTallerEstado);
  protected readonly auth = inject(AuthService);
  protected readonly config = this.estado.config;
  protected readonly proximamente = PROXIMAMENTE;

  private readonly sala = viewChild.required<ElementRef<HTMLElement>>('sala');
  private readonly dialogoQr = viewChild.required<ElementRef<HTMLDialogElement>>('dialogoQr');

  /** Minutos desde la medianoche; se actualiza cada 30 segundos para marcar la actividad de "ahora". */
  private readonly minutoActual = signal(minutosDeHoy());
  private readonly reloj = setInterval(() => this.minutoActual.set(minutosDeHoy()), 30_000);

  protected readonly pantallaCompleta = signal(false);
  protected readonly editandoTema = signal(false);
  private readonly alCambiarPantalla = () => this.pantallaCompleta.set(!!document.fullscreenElement);

  protected readonly agenda = computed(() =>
    this.config().agenda.map((actividad) => {
      const inicio = aMinutos(actividad.hora);
      const fin = inicio + (Number(actividad.minutos) || 0);
      const ahora = this.minutoActual();
      const estado: EstadoActividad = inicio < 0 ? 'pendiente' : ahora >= fin ? 'hecho' : ahora >= inicio ? 'ahora' : 'pendiente';
      return { ...actividad, horaTexto: horaCorta(actividad.hora), estado };
    }),
  );

  /** El enlace del QR; si no se escribió ninguno, el Banco de recursos de este portal. */
  protected readonly enlace = computed(() => this.config().enlace.trim() || `${location.origin}/recursos`);
  protected readonly enlaceValido = computed(() => /^https?:\/\/\S+\.\S+/.test(this.enlace()) || this.enlace().startsWith(location.origin));
  protected readonly enlaceCorto = computed(() => this.enlace().replace(/^https?:\/\//, '').replace(/\/$/, ''));
  protected readonly qr = signal('');

  constructor() {
    document.addEventListener('fullscreenchange', this.alCambiarPantalla);
    effect(() => {
      const enlace = this.enlace();
      if (!this.enlaceValido()) {
        this.qr.set('');
        return;
      }
      crearQr(enlace)
        .then((imagen) => this.qr.set(imagen))
        .catch(() => this.qr.set(''));
    });
  }

  protected cambiar(campo: 'tema' | 'dirigido' | 'enlace' | 'participantes' | 'preguntas', evento: Event): void {
    this.estado.cambiar(campo, (evento.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  protected cambiarActividad(indice: number, campo: keyof ActividadAgenda, evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    const agenda = this.config().agenda.map((a, i) =>
      i === indice ? { ...a, [campo]: campo === 'minutos' ? Math.max(0, Number(valor) || 0) : valor } : a,
    );
    this.estado.cambiar('agenda', agenda);
  }

  protected agregarActividad(): void {
    const agenda = this.config().agenda;
    const ultima = agenda.at(-1);
    const hora = ultima ? deMinutos(aMinutos(ultima.hora) + (Number(ultima.minutos) || 0)) : '09:00';
    this.estado.cambiar('agenda', [...agenda, { hora, minutos: 15, titulo: '' }]);
  }

  protected quitarActividad(indice: number): void {
    this.estado.cambiar('agenda', this.config().agenda.filter((_, i) => i !== indice));
  }

  protected volverAlEjemplo(): void {
    if (confirm('¿Volver a los datos de ejemplo? Se borran el tema, la agenda, los nombres, los grupos y el marcador.')) {
      this.estado.volverAlEjemplo();
    }
  }

  protected async alternarPantallaCompleta(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await this.sala().nativeElement.requestFullscreen();
    } catch {
      // Algunos navegadores (por ejemplo, Safari en iPhone) no la permiten.
    }
  }

  protected editarTema(): void {
    this.editandoTema.set(true);
    // Pone el cursor en el campo del tema cuando aparece.
    setTimeout(() => document.getElementById('tema-rapido')?.focus());
  }

  protected abrirQr(): void {
    this.dialogoQr().nativeElement.showModal();
  }

  protected cerrarQr(): void {
    this.dialogoQr().nativeElement.close();
  }

  ngOnDestroy(): void {
    clearInterval(this.reloj);
    document.removeEventListener('fullscreenchange', this.alCambiarPantalla);
  }
}

function minutosDeHoy(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** "09:15" → 555. Devuelve -1 si la hora no es válida. */
function aMinutos(hora: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hora ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : -1;
}

/** 555 → "09:15". */
function deMinutos(total: number): string {
  const t = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
}

/** "09:15" → "9:15 a. m."; "14:00" → "2:00 p. m." */
function horaCorta(hora: string): string {
  const total = aMinutos(hora);
  if (total < 0) return '';
  const h = Math.floor(total / 60);
  const m = String(total % 60).padStart(2, '0');
  return `${h % 12 || 12}:${m} ${h < 12 ? 'a. m.' : 'p. m.'}`;
}
