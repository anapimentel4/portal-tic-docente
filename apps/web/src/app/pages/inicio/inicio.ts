import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AREAS, type ProyectoRobotica, type Recurso, type TipoRecurso } from '@portal/shared';
import { CONTACTO } from '../../core/config/contacto';
import { MODULOS } from '../../core/config/modulos';
import { AuthService } from '../../core/services/auth.service';
import { RecursosService } from '../../core/services/recursos.service';
import { RoboticaService } from '../../core/services/robotica.service';
import { COLOR_TIPO, COLORES } from '../../shared/colores';
import { FormularioSolicitud } from '../../shared/formulario-solicitud/formulario-solicitud';
import { Icono, type NombreIcono } from '../../shared/icono/icono';
import { TarjetaProyecto } from '../../shared/tarjeta-proyecto/tarjeta-proyecto';

/** Icono de cada tipo de recurso (en "Lo más nuevo en el banco"). */
const ICONO_TIPO: Partial<Record<TipoRecurso, NombreIcono>> = {
  'Proyecto de robótica': 'robot',
  'Ciudadanía digital': 'escudo',
  'Herramienta web': 'externo',
  Plantilla: 'planificacion',
  Tutorial: 'birrete',
};

/**
 * Inicio: hero con buscador, cifras reales y lo más nuevo del banco; los 6 módulos;
 * proyectos de robótica destacados y la sección de apoyo con el formulario.
 */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, NgTemplateOutlet, Icono, FormularioSolicitud, TarjetaProyecto],
  templateUrl: './inicio.html',
})
export class InicioPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly robotica = inject(RoboticaService);
  private readonly recursos = inject(RecursosService);

  protected readonly modulos = MODULOS;
  protected readonly colores = COLORES;
  protected readonly colorTipo = COLOR_TIPO;
  protected readonly centro = CONTACTO.centro;
  protected readonly horario = CONTACTO.horario.charAt(0).toLowerCase() + CONTACTO.horario.slice(1);
  protected readonly areas = AREAS.filter((a) => a !== 'Todas las áreas');
  private readonly todosProyectos = signal<ProyectoRobotica[]>([]);
  protected readonly publicados = signal<Recurso[]>([]);
  protected readonly formulario = viewChild.required(FormularioSolicitud);

  /** Lo que se puede pedir en la sección de apoyo. */
  protected readonly servicios: { icono: NombreIcono; titulo: string; texto: string }[] = [
    { icono: 'personas', titulo: 'Acompañamiento en el aula', texto: 'La dinamizadora TIC te ayuda a planificar y dar una clase con tecnología.' },
    { icono: 'soporte', titulo: 'Problemas técnicos', texto: 'Equipos, proyector, internet o plataformas que no funcionan.' },
    { icono: 'caja', titulo: 'Reservas', texto: 'Laboratorio, kits de robótica o el carrito de laptops.' },
  ];

  /** Proyectos de robótica publicados: los 3 más recientes van destacados. */
  private readonly proyectosPublicados = computed(() => this.todosProyectos().filter((p) => p.estado === 'publicado'));
  protected readonly proyectos = computed(() =>
    [...this.proyectosPublicados()].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3),
  );

  /** Los 3 recursos publicados más recientes (por fecha de registro). */
  protected readonly recientes = computed(() =>
    [...this.publicados()]
      .sort((a, b) => (b.fecha_registro || b.created_at).localeCompare(a.fecha_registro || a.created_at))
      .slice(0, 3),
  );

  /** Cifras del hero: solo aparecen las que se pudieron cargar. */
  protected readonly cifras = computed(() => [
    { valor: this.publicados().length || '—', texto: 'recursos revisados' },
    { valor: this.proyectosPublicados().length || '—', texto: 'proyectos de robótica' },
    { valor: this.areas.length, texto: 'áreas curriculares' },
  ]);

  ngOnInit(): void {
    // Son extras de la portada: si fallan, esas partes simplemente no aparecen.
    this.robotica
      .listar()
      .then((p) => this.todosProyectos.set(p))
      .catch((e) => console.warn('No se pudieron cargar los proyectos destacados:', e));
    this.recursos
      .listarPublicados()
      .then((r) => this.publicados.set(r))
      .catch((e) => console.warn('No se pudieron cargar los recursos recientes:', e));
  }

  protected iconoTipo(tipo: TipoRecurso): NombreIcono {
    return ICONO_TIPO[tipo] ?? 'libro';
  }

  /** Lleva al banco con la búsqueda y el área ya aplicadas. */
  protected buscar(texto: string, area: string): void {
    const q = texto.trim();
    void this.router.navigate(['/recursos'], {
      queryParams: { q: q || null, area: area || null },
    });
  }
}
