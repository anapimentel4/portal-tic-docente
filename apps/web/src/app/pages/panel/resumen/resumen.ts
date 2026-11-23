import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { PanelService, type Indicadores } from '../../../core/services/panel.service';
import { COLORES, type Color } from '../../../shared/colores';
import { Icono, type NombreIcono } from '../../../shared/icono/icono';

interface Tarjeta {
  clave: keyof Indicadores;
  texto: string;
  icono: NombreIcono;
  color: Color;
  /** Página del panel donde se atiende (si la hay). */
  ruta?: string;
}

/** Panel → Resumen: saludo e indicadores reales (función indicadores_panel de la base de datos). */
@Component({
  selector: 'app-resumen',
  imports: [RouterLink, NgTemplateOutlet, Icono],
  templateUrl: './resumen.html',
})
export class ResumenPage {
  protected readonly auth = inject(AuthService);
  protected readonly panel = inject(PanelService);
  protected readonly colores = COLORES;

  protected readonly nombre = computed(() => this.auth.perfil()?.nombre?.split(' ')[0] ?? '');

  protected readonly tarjetas: Tarjeta[] = [
    { clave: 'total_recursos', texto: 'Recursos en total', icono: 'libro', color: 'azul' },
    { clave: 'publicados', texto: 'Publicados', icono: 'check', color: 'verde' },
    { clave: 'en_revision', texto: 'En revisión', icono: 'revision', color: 'ambar', ruta: '/panel/recursos' },
    { clave: 'solicitudes_pendientes', texto: 'Solicitudes pendientes', icono: 'bandeja', color: 'rosa', ruta: '/panel/solicitudes' },
    { clave: 'docentes_registrados', texto: 'Docentes registrados', icono: 'personas', color: 'violeta' },
  ];
}
