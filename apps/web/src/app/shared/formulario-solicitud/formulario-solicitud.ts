import { Component, ElementRef, inject, input, output, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TIPOS_SOLICITUD, type TipoSolicitud } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { SolicitudesService } from '../../core/services/solicitudes.service';
import { Icono } from '../icono/icono';

const MAX_DETALLE = 1000;

/** Fecha de hoy en la zona horaria del usuario, como la espera <input type="date">. */
function hoy(): string {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/**
 * Formulario de solicitud: tipo, fecha deseada y detalle. Lo usan Inicio y "Mis solicitudes".
 * Crea una fila en solicitudes (pendiente); la dinamizadora la ve en el panel.
 */
@Component({
  selector: 'app-formulario-solicitud',
  imports: [ReactiveFormsModule, RouterLink, Icono],
  templateUrl: './formulario-solicitud.html',
  host: { class: 'block scroll-mt-20' },
})
export class FormularioSolicitud {
  protected readonly auth = inject(AuthService);
  private readonly servicio = inject(SolicitudesService);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly titulo = input('¿Necesitas apoyo?');
  readonly descripcion = input(
    'Pide acompañamiento en el aula, reporta un problema técnico o reserva el laboratorio, los kits o las laptops.',
  );
  /** Avisa cuando se guardó una solicitud (Mis solicitudes recarga su lista). */
  readonly enviada = output<void>();

  protected readonly tipos = Object.entries(TIPOS_SOLICITUD) as [TipoSolicitud, string][];
  protected readonly maxDetalle = MAX_DETALLE;
  protected readonly hoy = hoy();

  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly confirmacion = signal(false);

  private readonly campoTipo = viewChild<ElementRef<HTMLSelectElement>>('campoTipo');

  protected readonly form = this.fb.group({
    tipo: ['' as TipoSolicitud | '', Validators.required],
    fecha_deseada: [''],
    // pattern(/\S/): solo espacios no cuenta como detalle.
    detalle: ['', [Validators.required, Validators.pattern(/\S/), Validators.maxLength(MAX_DETALLE)]],
  });

  /** Lleva al usuario hasta el formulario (y elige el tipo si se indica). */
  abrir(tipo?: TipoSolicitud): void {
    this.confirmacion.set(false);
    if (tipo) this.form.controls.tipo.setValue(tipo);
    this.host.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // El foco va al formulario (si hay sesión) para que el teclado y el lector de pantalla lo sigan.
    setTimeout(() => this.campoTipo()?.nativeElement.focus({ preventScroll: true }));
  }

  protected async enviar(): Promise<void> {
    const { tipo, fecha_deseada, detalle } = this.form.getRawValue();
    if (this.form.invalid || !tipo) {
      this.form.markAllAsTouched();
      return;
    }
    if (fecha_deseada && fecha_deseada < this.hoy) {
      this.form.controls.fecha_deseada.setErrors({ pasada: true });
      this.form.controls.fecha_deseada.markAsTouched();
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    try {
      await this.servicio.crear({ tipo, fecha_deseada: fecha_deseada || null, detalle: detalle.trim() });
      this.form.reset();
      this.confirmacion.set(true);
      this.enviada.emit();
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.enviando.set(false);
    }
  }
}
