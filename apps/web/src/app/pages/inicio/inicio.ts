import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AREAS, type ProyectoRobotica } from '@portal/shared';
import { MODULOS } from '../../core/config/modulos';
import { AuthService } from '../../core/services/auth.service';
import { RoboticaService } from '../../core/services/robotica.service';
import { esEnlaceWeb } from '../../shared/enlaces';
import { Icono } from '../../shared/icono/icono';
import { FormularioApoyo } from './formulario-apoyo';

/** Fase 3: hero con buscador y área, los 6 módulos, proyectos de robótica destacados y formulario de apoyo. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, NgTemplateOutlet, Icono, FormularioApoyo],
  templateUrl: './inicio.html',
})
export class InicioPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly robotica = inject(RoboticaService);

  protected readonly modulos = MODULOS;
  protected readonly areas = AREAS.filter((a) => a !== 'Todas las áreas');
  protected readonly proyectos = signal<ProyectoRobotica[]>([]);
  protected readonly formulario = viewChild.required(FormularioApoyo);
  protected readonly esEnlaceWeb = esEnlaceWeb;

  ngOnInit(): void {
    // Los destacados son un extra: si fallan, la sección simplemente no aparece.
    this.robotica
      .destacados()
      .then((p) => this.proyectos.set(p))
      .catch((e) => console.warn('No se pudieron cargar los proyectos destacados:', e));
  }

  /** Lleva al banco con la búsqueda y el área ya aplicadas. */
  protected buscar(texto: string, area: string): void {
    const q = texto.trim();
    void this.router.navigate(['/recursos'], {
      queryParams: { q: q || null, area: area || null },
    });
  }
}
