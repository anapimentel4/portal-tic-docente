import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  CHEQUEOS_RECURSO,
  ESTADOS_RECURSO,
  NIVELES_TIC,
  type ChequeoRecurso,
  type EstadoRecurso,
  type Recurso,
} from '@portal/shared';
import { AuthService } from '../../../core/services/auth.service';
import { mensajeDeError } from '../../../core/services/errores';
import { PanelService } from '../../../core/services/panel.service';
import { RecursosService, type CambiosRevision } from '../../../core/services/recursos.service';
import { Badge, COLOR_TIPO } from '../../../shared/badge/badge';
import { esEnlaceWeb, normalizar } from '../../../shared/enlaces';
import { Icono } from '../../../shared/icono/icono';

const CHEQUEOS = Object.keys(CHEQUEOS_RECURSO) as ChequeoRecurso[];
const ESTADOS = Object.keys(ESTADOS_RECURSO) as EstadoRecurso[];

/**
 * Panel → Recursos en revisión.
 * La dinamizadora marca las 4 comprobaciones y aprueba (una a una o "Aprobar seleccionados") o rechaza.
 * Gestión lo ve en solo lectura. Después de cada acción se actualizan los indicadores del panel.
 */
@Component({
  selector: 'app-revision-recursos',
  imports: [Badge, Icono],
  templateUrl: './revision-recursos.html',
})
export class RevisionRecursosPage implements OnInit {
  private readonly servicio = inject(RecursosService);
  private readonly auth = inject(AuthService);
  private readonly panel = inject(PanelService);

  protected readonly chequeos = CHEQUEOS;
  protected readonly textosChequeo = CHEQUEOS_RECURSO;
  protected readonly estados = ESTADOS;
  protected readonly textosEstado = ESTADOS_RECURSO;
  protected readonly niveles = NIVELES_TIC;
  protected readonly colorTipo = COLOR_TIPO;
  protected readonly esEnlaceWeb = esEnlaceWeb;

  /** Solo la dinamizadora edita; RLS lo exige igual en la base de datos. */
  protected readonly puedeEditar = computed(() => this.auth.rol() === 'dinamizadora');

  protected readonly recursos = signal<Recurso[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly filtroEstado = signal<EstadoRecurso>('en_revision');
  protected readonly busqueda = signal('');
  /** Ids de los recursos que se están guardando ahora mismo. */
  protected readonly guardando = signal<ReadonlySet<string>>(new Set());
  /** Último error de guardado de cada recurso. */
  protected readonly errores = signal<Readonly<Record<string, string>>>({});
  /** Mensaje tras aprobar/rechazar (el recurso sale de la lista y hay que decirlo). */
  protected readonly aviso = signal<string | null>(null);
  /** Ids marcados para "Aprobar seleccionados". */
  protected readonly seleccion = signal<ReadonlySet<string>>(new Set());
  protected readonly aprobandoVarios = signal(false);
  protected readonly errorLote = signal<string | null>(null);

  protected readonly conteo = computed(() => {
    const total: Record<EstadoRecurso, number> = { en_revision: 0, publicado: 0, rechazado: 0 };
    for (const r of this.recursos()) total[r.estado]++;
    return total;
  });

  protected readonly visibles = computed(() => {
    const estado = this.filtroEstado();
    const texto = normalizar(this.busqueda().trim());
    return this.recursos().filter(
      (r) =>
        r.estado === estado &&
        (!texto ||
          normalizar([r.titulo, r.area, r.grado, r.tipo, r.herramienta ?? '', ...r.etiquetas].join(' ')).includes(texto)),
    );
  });

  /** Recursos en revisión visibles que ya tienen las 4 comprobaciones (los únicos que se pueden aprobar). */
  protected readonly listosVisibles = computed(() =>
    this.filtroEstado() === 'en_revision' ? this.visibles().filter((r) => this.listoParaPublicar(r)) : [],
  );
  /** Solo cuentan los seleccionados que siguen visibles y listos (si se desmarca un chequeo, sale del lote). */
  protected readonly seleccionados = computed(() => this.listosVisibles().filter((r) => this.seleccion().has(r.id)));

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.errorCarga.set(null);
    try {
      this.recursos.set(await this.servicio.listarTodos());
    } catch (e) {
      this.errorCarga.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected chequeosHechos(r: Recurso): number {
    return CHEQUEOS.filter((c) => r[c]).length;
  }

  protected listoParaPublicar(r: Recurso): boolean {
    return CHEQUEOS.every((c) => r[c]);
  }

  protected marcarChequeo(r: Recurso, chequeo: ChequeoRecurso, valor: boolean): void {
    void this.guardar(r, { [chequeo]: valor });
  }

  protected cambiarFiltro(estado: EstadoRecurso): void {
    this.filtroEstado.set(estado);
    this.aviso.set(null);
    this.seleccion.set(new Set());
  }

  protected alternarSeleccion(id: string, marcado: boolean): void {
    this.seleccion.update((s) => {
      const copia = new Set(s);
      if (marcado) copia.add(id);
      else copia.delete(id);
      return copia;
    });
  }

  protected seleccionarTodosLosListos(): void {
    const todos = this.seleccionados().length === this.listosVisibles().length;
    this.seleccion.set(todos ? new Set() : new Set(this.listosVisibles().map((r) => r.id)));
  }

  /** "Aprobar seleccionados": publica el lote en una sola operación. */
  protected async aprobarSeleccionados(): Promise<void> {
    const lote = this.seleccionados();
    if (!lote.length) return;
    this.aprobandoVarios.set(true);
    this.errorLote.set(null);
    try {
      const actualizados = await this.servicio.aprobarVarios(lote.map((r) => r.id));
      actualizados.forEach((r) => this.reemplazar(r));
      this.seleccion.set(new Set());
      this.aviso.set(
        actualizados.length === 1 ? 'Se aprobó 1 recurso.' : `Se aprobaron ${actualizados.length} recursos.`,
      );
      void this.panel.actualizar();
    } catch (e) {
      this.errorLote.set(mensajeDeError(e));
    } finally {
      this.aprobandoVarios.set(false);
    }
  }

  protected cambiarEstado(r: Recurso, estado: EstadoRecurso): void {
    if (estado === 'publicado' && !this.listoParaPublicar(r)) return;
    void this.guardar(r, { estado });
  }

  /** Muestra el cambio al momento y lo deshace si la base de datos no lo acepta. */
  private async guardar(original: Recurso, cambios: CambiosRevision): Promise<void> {
    const id = original.id;
    this.reemplazar({ ...original, ...cambios });
    this.guardando.update((s) => new Set(s).add(id));
    this.errores.update(({ [id]: _, ...resto }) => resto);
    try {
      this.reemplazar(await this.servicio.actualizarRevision(id, cambios));
      if (cambios.estado) {
        const destino = { en_revision: 'volvió a revisión', publicado: 'se aprobó', rechazado: 'se rechazó' };
        this.aviso.set(`«${original.titulo}» ${destino[cambios.estado]}.`);
        this.alternarSeleccion(id, false);
        void this.panel.actualizar();
      }
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

  private reemplazar(recurso: Recurso): void {
    this.recursos.update((lista) => lista.map((r) => (r.id === recurso.id ? recurso : r)));
  }
}
