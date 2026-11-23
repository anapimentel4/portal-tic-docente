import { Routes } from '@angular/router';
import { rolGuard } from './core/guards/auth.guard';

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
