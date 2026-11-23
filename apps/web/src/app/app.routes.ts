import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './core/guards/auth.guard';

// Cada página se carga solo cuando se visita (loadComponent).
export const routes: Routes = [
  {
    path: '',
    title: 'Portal TIC Docente',
    loadComponent: () => import('./pages/inicio/inicio').then((m) => m.InicioPage),
  },
  {
    path: 'recursos',
    title: 'Recursos · Portal TIC Docente',
    loadComponent: () => import('./pages/recursos/recursos').then((m) => m.RecursosPage),
  },
  {
    // Va antes de recursos/:id para que "compartir" no se tome como un id.
    path: 'recursos/compartir',
    title: 'Compartir un recurso · Portal TIC Docente',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/recursos/compartir-recurso').then((m) => m.CompartirRecursoPage),
  },
  {
    path: 'recursos/:id',
    title: 'Recurso · Portal TIC Docente',
    loadComponent: () =>
      import('./pages/recurso-detalle/recurso-detalle').then((m) => m.RecursoDetallePage),
  },
  {
    path: 'login',
    title: 'Entrar · Portal TIC Docente',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage),
  },
  {
    path: 'panel',
    title: 'Panel · Portal TIC Docente',
    canActivate: [rolGuard('dinamizadora', 'gestion')],
    loadComponent: () => import('./pages/panel/panel').then((m) => m.PanelPage),
  },
  {
    path: 'panel/recursos',
    title: 'Revisar recursos · Portal TIC Docente',
    canActivate: [rolGuard('dinamizadora', 'gestion')],
    loadComponent: () =>
      import('./pages/panel/recursos/revision-recursos').then((m) => m.RevisionRecursosPage),
  },
  { path: '**', redirectTo: '' },
];
