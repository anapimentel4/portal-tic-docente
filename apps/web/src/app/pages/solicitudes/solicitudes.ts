import { Component, inject, OnInit, signal } from '@angular/core';
import { ESTADOS_SOLICITUD, TIPOS_SOLICITUD, type Solicitud } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { SolicitudesService } from '../../core/services/solicitudes.service';
import { Badge } from '../../shared/badge/badge';
import { COLOR_ESTADO_SOLICITUD } from '../../shared/colores';
import { FormularioSolicitud } from '../../shared/formulario-solicitud/formulario-solicitud';

/** "Mis solicitudes" (/solicitudes): las solicitudes del usuario con su estado, y el formulario para crear otra. */
@Component({
  selector: 'app-solicitudes',
  imports: [Badge, FormularioSolicitud],
  templateUrl: './solicitudes.html',
})
export class SolicitudesPage implements OnInit {
  private readonly servicio = inject(SolicitudesService);
  private readonly auth = inject(AuthService);

  protected readonly tipos = TIPOS_SOLICITUD;
  protected readonly estados = ESTADOS_SOLICITUD;
  protected readonly colorEstado = COLOR_ESTADO_SOLICITUD;

  protected readonly solicitudes = signal<Solicitud[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    const usuario = this.auth.usuario();
    if (!usuario) return; // authGuard ya lo impide; por si acaso.
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.solicitudes.set(await this.servicio.mias(usuario.id));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** "2026-11-23" o un timestamp → "23 nov. 2026" (las fechas sin hora, sin desfase de zona horaria). */
  protected fecha(valor: string): string {
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
    const d = soloFecha ? new Date(`${valor}T12:00:00`) : new Date(valor);
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
