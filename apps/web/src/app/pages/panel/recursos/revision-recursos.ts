import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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
import { RecursosService, type CambiosRevision } from '../../../core/services/recursos.service';

const CHEQUEOS = Object.keys(CHEQUEOS_RECURSO) as ChequeoRecurso[];
const ESTADOS = Object.keys(ESTADOS_RECURSO) as EstadoRecurso[];

/** Quita tildes y mayúsculas para buscar "robotica" y encontrar "Robótica". */
const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

/**
 * Panel → Revisar recursos.
 * La dinamizadora marca los 4 chequeos y publica (o rechaza). Gestión solo mira.
 */
@Component({
  selector: 'app-revision-recursos',
  imports: [RouterLink],
  templateUrl: './revision-recursos.html',
})
export class RevisionRecursosPage implements OnInit {
  private readonly servicio = inject(RecursosService);
  private readonly auth = inject(AuthService);

  protected readonly chequeos = CHEQUEOS;
  protected readonly textosChequeo = CHEQUEOS_RECURSO;
  protected readonly estados = ESTADOS;
  protected readonly textosEstado = ESTADOS_RECURSO;
  protected readonly niveles = NIVELES_TIC;

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
  /** Mensaje tras publicar/rechazar (el recurso sale de la lista y hay que decirlo). */
  protected readonly aviso = signal<string | null>(null);

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

  /** Solo se enlazan direcciones web; cualquier otra cosa se muestra como texto. */
  protected esEnlaceWeb(valor: string): boolean {
    return /^https?:\/\//i.test(valor);
  }

  protected marcarChequeo(r: Recurso, chequeo: ChequeoRecurso, valor: boolean): void {
    void this.guardar(r, { [chequeo]: valor });
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
        const destino = { en_revision: 'volvió a revisión', publicado: 'se publicó', rechazado: 'se rechazó' };
        this.aviso.set(`«${original.titulo}» ${destino[cambios.estado]}.`);
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
