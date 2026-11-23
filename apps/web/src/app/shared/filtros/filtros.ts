import { Component, input, output } from '@angular/core';
import { AREAS, GRADOS, TIPOS_RECURSO } from '@portal/shared';

export type Filtro = 'q' | 'area' | 'grado' | 'tipo';
export interface ValoresFiltro {
  q: string;
  area: string;
  grado: string;
  tipo: string;
}

/**
 * Filtros del banco de recursos: búsqueda, área y grado (selects) y tipo (chips).
 * No guarda nada: avisa con (cambiar) y la página decide qué hacer (la pone en la URL).
 */
@Component({
  selector: 'app-filtros',
  templateUrl: './filtros.html',
})
export class Filtros {
  readonly valores = input.required<ValoresFiltro>();
  /** Texto de la búsqueda tal como se escribe (sin recortar espacios). */
  readonly textoBusqueda = input('');
  readonly hayFiltros = input(false);

  readonly cambiar = output<{ filtro: Filtro; valor: string }>();
  readonly limpiar = output<void>();

  /** "Todas las áreas" y "Todos los grados" no son filtros: equivalen a no filtrar. */
  protected readonly areas = AREAS.filter((a) => a !== 'Todas las áreas');
  protected readonly grados = GRADOS.filter((g) => g !== 'Todos los grados');
  protected readonly tipos = TIPOS_RECURSO;

  protected elegirTipo(tipo: string): void {
    // Pulsar el chip activo lo quita.
    this.cambiar.emit({ filtro: 'tipo', valor: this.valores().tipo === tipo ? '' : tipo });
  }
}
