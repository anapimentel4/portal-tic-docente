import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ESTADOS_SOLICITUD, TIPOS_SOLICITUD, type EstadoSolicitud } from '@portal/shared';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeDeError } from '../../../core/services/errores';
import { PanelService } from '../../../core/services/panel.service';
import { SolicitudesService, type SolicitudConDocente } from '../../../core/services/solicitudes.service';
import { Badge } from '../../../shared/badge/badge';
import { COLOR_ESTADO_SOLICITUD } from '../../../shared/colores';

type Filtro = EstadoSolicitud | 'todas';

/**
 * Panel → Solicitudes: todas las solicitudes con docente, tipo, fecha, detalle y estado.
 * La dinamizadora cambia el estado con un select; gestión solo mira.
 */
@Component({
  selector: 'app-solicitudes-panel',
  imports: [Badge, NgTemplateOutlet],
  templateUrl: './solicitudes-panel.html',
})
export class SolicitudesPanelPage implements OnInit {
  private readonly servicio = inject(SolicitudesService);
  private readonly panel = inject(PanelService);
  private readonly auth = inject(AuthService);

  protected readonly tipos = TIPOS_SOLICITUD;
  protected readonly textosEstado = ESTADOS_SOLICITUD;
  protected readonly estados = Object.keys(ESTADOS_SOLICITUD) as EstadoSolicitud[];
  protected readonly filtros: Filtro[] = ['todas', ...this.estados];
  protected readonly colorEstado = COLOR_ESTADO_SOLICITUD;
  protected readonly puedeEditar = computed(() => this.auth.rol() === 'dinamizadora');

  protected readonly solicitudes = signal<SolicitudConDocente[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly filtro = signal<Filtro>('todas');
  protected readonly guardando = signal<ReadonlySet<string>>(new Set());
  protected readonly errores = signal<Readonly<Record<string, string>>>({});

  protected readonly conteo = computed(() => {
    const total: Record<Filtro, number> = { todas: 0, pendiente: 0, en_proceso: 0, resuelta: 0 };
    for (const s of this.solicitudes()) {
      total[s.estado]++;
      total.todas++;
    }
    return total;
  });

  protected readonly visibles = computed(() => {
    const f = this.filtro();
    return f === 'todas' ? this.solicitudes() : this.solicitudes().filter((s) => s.estado === f);
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      this.solicitudes.set(await this.servicio.listarTodas());
    } catch (e) {
      this.errorCarga.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Muestra el cambio al momento y lo deshace si la base de datos no lo acepta. */
  protected async cambiarEstado(original: SolicitudConDocente, estado: EstadoSolicitud): Promise<void> {
    if (estado === original.estado) return;
    const id = original.id;
    this.reemplazar({ ...original, estado });
    this.guardando.update((s) => new Set(s).add(id));
    this.errores.update(({ [id]: _, ...resto }) => resto);
    try {
      this.reemplazar(await this.servicio.cambiarEstado(id, estado));
      void this.panel.actualizar();
    } catch (e) {
      this.reemplazar(original);
      this.errores.update((m) => ({ ...m, [id]: mensajeDeError(e) }));
    } finally {
      this.guardando.update((s) => {
        const copia = new Set(s);
        copia.delete(id);
        return copia;
      });
    }
  }

  protected textoEstado(estado: EstadoSolicitud): string {
    return ESTADOS_SOLICITUD[estado];
  }

  protected colorDe(estado: EstadoSolicitud) {
    return COLOR_ESTADO_SOLICITUD[estado];
  }

  /** "2026-11-23" o un timestamp → "23 nov. 2026" (las fechas sin hora, sin desfase de zona horaria). */
  protected fecha(valor: string): string {
    const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
    const d = soloFecha ? new Date(`${valor}T12:00:00`) : new Date(valor);
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private reemplazar(s: SolicitudConDocente): void {
    this.solicitudes.update((lista) => lista.map((x) => (x.id === s.id ? s : x)));
  }
}
