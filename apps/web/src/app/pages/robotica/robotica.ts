import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AREAS, GRADOS, type ProyectoRobotica } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';
import { mensajeDeError } from '../../core/services/errores';
import { RoboticaService } from '../../core/services/robotica.service';
import { Icono } from '../../shared/icono/icono';
import { TarjetaProyecto } from '../../shared/tarjeta-proyecto/tarjeta-proyecto';

const TODAS_AREAS = 'Todas las áreas';
const TODOS_GRADOS = 'Todos los grados';

/**
 * Robótica educativa: lista de proyectos con filtros por área y grado (en la URL).
 * La dinamizadora ve también los borradores y el botón "Nuevo proyecto".
 */
@Component({
  selector: 'app-robotica',
  imports: [RouterLink, Icono, TarjetaProyecto],
  templateUrl: './robotica.html',
})
export class RoboticaPage implements OnInit {
  private readonly servicio = inject(RoboticaService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  readonly area = input<string>();
  readonly grado = input<string>();

  protected readonly areas = AREAS.filter((a) => a !== TODAS_AREAS);
  protected readonly grados = GRADOS.filter((g) => g !== TODOS_GRADOS);

  protected readonly proyectos = signal<ProyectoRobotica[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly filtroArea = computed(() => ((this.areas as string[]).includes(this.area() ?? '') ? this.area()! : ''));
  protected readonly filtroGrado = computed(() => ((this.grados as string[]).includes(this.grado() ?? '') ? this.grado()! : ''));
  protected readonly hayFiltros = computed(() => !!(this.filtroArea() || this.filtroGrado()));

  protected readonly visibles = computed(() => {
    const area = this.filtroArea();
    const grado = this.filtroGrado();
    return this.proyectos().filter(
      (p) =>
        (!area || p.area === area || p.area === TODAS_AREAS) &&
        (!grado || p.grado === grado || p.grado === TODOS_GRADOS),
    );
  });

  ngOnInit(): void {
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.proyectos.set(await this.servicio.listar());
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected filtrar(filtro: 'area' | 'grado', valor: string): void {
    void this.router.navigate([], {
      queryParams: { [filtro]: valor || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected limpiar(): void {
    void this.router.navigate([], { queryParams: {}, replaceUrl: true });
  }
}
