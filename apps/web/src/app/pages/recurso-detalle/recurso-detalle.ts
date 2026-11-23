import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ESTADOS_RECURSO, NIVELES_TIC, type Recurso } from '@portal/shared';
import { mensajeDeError } from '../../core/services/errores';
import { RecursosService } from '../../core/services/recursos.service';
import { Badge, COLOR_ESTADO_RECURSO, COLOR_TIPO } from '../../shared/badge/badge';
import { esEnlaceWeb } from '../../shared/enlaces';
import { Icono } from '../../shared/icono/icono';

/** Detalle de un recurso: todos sus campos, con el enlace destacado. Ruta: /recursos/:id */
@Component({
  selector: 'app-recurso-detalle',
  imports: [RouterLink, Badge, Icono],
  templateUrl: './recurso-detalle.html',
})
export class RecursoDetallePage {
  private readonly servicio = inject(RecursosService);

  /** :id de la URL (withComponentInputBinding). */
  readonly id = input.required<string>();

  protected readonly recurso = signal<Recurso | null>(null);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly textosEstado = ESTADOS_RECURSO;
  protected readonly niveles = NIVELES_TIC;
  protected readonly colorTipo = COLOR_TIPO;
  protected readonly colorEstado = COLOR_ESTADO_RECURSO;

  protected readonly enlace = computed(() => {
    const valor = this.recurso()?.enlace_o_archivo;
    return esEnlaceWeb(valor) ? valor : null;
  });

  /** Campos de texto opcionales, en el orden en que se muestran. Los vacíos no salen. */
  protected readonly datos = computed(() => {
    const r = this.recurso();
    if (!r) return [];
    return [
      ['Competencias', r.competencias],
      ['Tema / unidad', r.tema_unidad],
      ['Herramienta usada', r.herramienta],
      ['Duración sugerida', r.duracion],
      ['Nivel TIC del docente', r.nivel_tic ? this.niveles[r.nivel_tic] : null],
      ['Autor', r.autor],
      ['Fuente', r.fuente],
      ['Licencia', r.licencia],
      ['Fecha de registro', r.fecha_registro ? this.fecha(r.fecha_registro) : null],
    ].filter((d): d is [string, string] => !!d[1]);
  });

  constructor() {
    // Si cambia el :id (de un detalle a otro), se vuelve a cargar.
    effect(() => void this.cargar(this.id()));
  }

  protected async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.recurso.set(await this.servicio.obtener(id));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  /** "2026-11-23" → "23 de noviembre de 2026" (sin desfase de zona horaria). */
  private fecha(iso: string): string {
    const [a, m, d] = iso.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}
