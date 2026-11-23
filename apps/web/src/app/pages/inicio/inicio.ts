import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, OnInit, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { ProyectoRobotica } from '@portal/shared';
import { MODULOS } from '../../core/config/modulos';
import { AuthService } from '../../core/services/auth.service';
import { RoboticaService } from '../../core/services/robotica.service';
import { FormularioApoyo } from './formulario-apoyo';

/** Fase 3: buscador, los 6 módulos, proyectos de robótica destacados y formulario de apoyo. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, NgTemplateOutlet, FormularioApoyo],
  templateUrl: './inicio.html',
})
export class InicioPage implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly robotica = inject(RoboticaService);

  protected readonly modulos = MODULOS;
  protected readonly proyectos = signal<ProyectoRobotica[]>([]);
  protected readonly formulario = viewChild.required(FormularioApoyo);

  ngOnInit(): void {
    // Los destacados son un extra: si fallan, la sección simplemente no aparece.
    this.robotica
      .destacados()
      .then((p) => this.proyectos.set(p))
      .catch((e) => console.warn('No se pudieron cargar los proyectos destacados:', e));
  }

  protected buscar(texto: string): void {
    const q = texto.trim();
    void this.router.navigate(['/recursos'], { queryParams: q ? { q } : {} });
  }

  protected esEnlaceWeb(valor: string | null): valor is string {
    return !!valor && /^https?:\/\//i.test(valor);
  }
}
