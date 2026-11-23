import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

interface EnlaceMenu {
  texto: string;
  ruta: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
})
export class Header {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly menuAbierto = signal(false);

  /** Enlaces del menú. Cada fase agrega los suyos. */
  protected readonly enlaces: EnlaceMenu[] = [
    { texto: 'Inicio', ruta: '/' },
    { texto: 'Recursos', ruta: '/recursos' },
    { texto: 'Robótica', ruta: '/robotica' },
    { texto: 'Solicitudes', ruta: '/solicitudes' },
  ];

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected async salir(): Promise<void> {
    this.cerrarMenu();
    await this.auth.cerrarSesion();
    await this.router.navigateByUrl('/');
  }
}
