import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AREAS, GRADOS, NIVELES_TIC, TIPOS_RECURSO, type Recurso } from '@portal/shared';
import { mensajeDeError } from '../../core/services/errores';
import { RecursosService } from '../../core/services/recursos.service';
import { SupabaseService } from '../../core/services/supabase.service';

const TODAS_AREAS = 'Todas las áreas';
const TODOS_GRADOS = 'Todos los grados';

/** Quita tildes y mayúsculas para que "robotica" encuentre "Robótica". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/** Solo acepta valores del catálogo; cualquier otro valor de la URL se ignora. */
const delCatalogo = <T extends string>(lista: readonly T[], valor: string | undefined): T | '' =>
  valor && (lista as readonly string[]).includes(valor) ? (valor as T) : '';

type Filtro = 'q' | 'area' | 'grado' | 'tipo';

/**
 * Catálogo de recursos publicados. Lo ve cualquiera, con o sin sesión.
 * Los filtros viven en la URL (?q=&area=&grado=&tipo=) para poder compartir una búsqueda.
 */
@Component({
  selector: 'app-recursos',
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

  /** En los filtros no tiene sentido elegir "Todas…": eso es no filtrar. */
  protected readonly areas = AREAS.filter((a) => a !== TODAS_AREAS);
  protected readonly grados = GRADOS.filter((g) => g !== TODOS_GRADOS);
  protected readonly tipos = TIPOS_RECURSO;
  protected readonly niveles = NIVELES_TIC;

  protected readonly recursos = signal<Recurso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filtros = computed(() => ({
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
      const texto = normalizar(
        [r.titulo, r.descripcion, r.tema_unidad, r.competencias, r.herramienta, r.area, r.tipo, ...r.etiquetas]
          .filter(Boolean)
          .join(' '),
      );
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

  protected filtrar(filtro: Filtro, valor: string): void {
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

  protected esEnlaceWeb(valor: string): boolean {
    return /^https?:\/\//i.test(valor);
  }
}
