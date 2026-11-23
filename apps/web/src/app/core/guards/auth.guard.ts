import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Rol } from '@portal/shared';
import { AuthService } from '../services/auth.service';

/**
 * Pide haber iniciado sesión. Si no, manda a /login y luego regresa a la página pedida.
 * Ojo: los guards solo ordenan la navegación; la seguridad real está en RLS (Postgres).
 */
export const authGuard: CanActivateFn = async (_ruta, estado) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.listo;
  return auth.usuario() ? true : router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
};

/** Pide haber iniciado sesión Y tener uno de los roles indicados. Ej.: rolGuard('dinamizadora', 'gestion'). */
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return async (_ruta, estado) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    await auth.listo;
    if (!auth.usuario()) {
      return router.createUrlTree(['/login'], { queryParams: { volver: estado.url } });
    }
    const rol = auth.rol();
    return rol && roles.includes(rol) ? true : router.createUrlTree(['/']);
  };
}
