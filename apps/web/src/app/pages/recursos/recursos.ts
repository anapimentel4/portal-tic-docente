import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AREAS, GRADOS, TIPOS_RECURSO, type Recurso } from '@portal/shared';
import { mensajeDeError } from '../../core/services/errores';
import { RecursosService } from '../../core/services/recursos.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { normalizar } from '../../shared/enlaces';
import { Filtros, type Filtro, type ValoresFiltro } from '../../shared/filtros/filtros';
import { Icono } from '../../shared/icono/icono';
import { TarjetaRecurso } from '../../shared/tarjeta-recurso/tarjeta-recurso';

const TODAS_AREAS = 'Todas las áreas';
const TODOS_GRADOS = 'Todos los grados';

/** Solo acepta valores del catálogo; cualquier otro valor de la URL se ignora. */
const delCatalogo = (lista: readonly string[], valor: string | undefined): string =>
  valor && lista.includes(valor) ? valor : '';

/**
 * Banco de recursos: los publicados, para cualquiera (con o sin sesión).
 * Los filtros viven en la URL (?q=&area=&grado=&tipo=) para poder compartir una búsqueda.
 */
@Component({
  selector: 'app-recursos',
  imports: [RouterLink, Filtros, TarjetaRecurso, Icono],
  templateUrl: './recursos.html',
})
export class RecursosPage implements OnInit {
  private readonly servicio = inject(RecursosService);
  private readonly router = inject(Router);
  protected readonly configurado = inject(SupabaseService).configurado;

  // Parámetros de la URL (withComponentInputBinding los pasa como inputs).
  readonly q = input<string>();
  readonly area = input<string>();
  readonly grado = input<string>();
  readonly tipo = input<string>();

  protected readonly recursos = signal<Recurso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filtros = computed<ValoresFiltro>(() => ({
    q: (this.q() ?? '').trim(),
    area: delCatalogo(AREAS, this.area()),
    grado: delCatalogo(GRADOS, this.grado()),
    tipo: delCatalogo(TIPOS_RECURSO, this.tipo()),
  }));

  protected readonly hayFiltros = computed(() => Object.values(this.filtros()).some(Boolean));

  protected readonly visibles = computed(() => {
    const { q, area, grado, tipo } = this.filtros();
    const palabras = normalizar(q).split(/\s+/).filter(Boolean);
    return this.recursos().filter((r) => {
      // Un recurso para "Todas las áreas" sirve también para Matemática (igual con los grados).
      if (area && r.area !== area && r.area !== TODAS_AREAS) return false;
      if (grado && r.grado !== grado && r.grado !== TODOS_GRADOS) return false;
      if (tipo && r.tipo !== tipo) return false;
      if (!palabras.length) return true;
      const texto = normalizar([r.titulo, r.descripcion ?? '', ...r.etiquetas].join(' '));
      return palabras.every((p) => texto.includes(p));
    });
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.recursos.set(await this.servicio.listarPublicados());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected filtrar({ filtro, valor }: { filtro: Filtro; valor: string }): void {
    void this.router.navigate([], {
      // Sin trim: si no, al escribir "dos palabras" se borraría el espacio. Se recorta al filtrar.
      queryParams: { [filtro]: valor || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected limpiar(): void {
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
}
