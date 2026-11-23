import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

// Fase 1: solo el encabezado de la página. En la fase 3 se agregan
// el buscador, los 6 módulos, los proyectos destacados y el formulario de apoyo.
@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
})
export class InicioPage {
  protected readonly auth = inject(AuthService);
}
