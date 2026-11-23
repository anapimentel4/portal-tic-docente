import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ROLES } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';
import { PanelService } from '../../core/services/panel.service';
import { Icono, type NombreIcono } from '../../shared/icono/icono';

interface EnlacePanel {
  texto: string;
  icono: NombreIcono;
  /** Sin ruta = "Próximamente". */
  ruta?: string;
  /** Número que se muestra al lado (pendientes). */
  contador?: () => number | undefined;
}

/**
 * Panel de la dinamizadora (/panel): menú lateral y, a la derecha, la página elegida.
 * Entran dinamizadora y gestión (rolGuard); gestión lo ve todo en solo lectura.
 */
@Component({
  selector: 'app-panel',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icono],
  templateUrl: './panel.html',
})
export class PanelPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly panel = inject(PanelService);
  protected readonly roles = ROLES;
  protected readonly soloLectura = computed(() => this.auth.rol() === 'gestion');

  protected readonly enlaces: EnlacePanel[] = [
    { texto: 'Resumen', icono: 'resumen', ruta: '/panel' },
    {
      texto: 'Recursos en revisión',
      icono: 'revision',
      ruta: '/panel/recursos',
      contador: () => this.panel.indicadores()?.en_revision,
    },
    {
      texto: 'Solicitudes',
      icono: 'bandeja',
      ruta: '/panel/solicitudes',
      contador: () => this.panel.indicadores()?.solicitudes_pendientes,
    },
    { texto: 'Talleres', icono: 'birrete' },
    { texto: 'Inventario', icono: 'caja' },
    { texto: 'Acompañamientos', icono: 'personas' },
  ];

  ngOnInit(): void {
    void this.panel.actualizar();
  }
}
