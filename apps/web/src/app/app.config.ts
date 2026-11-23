import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Los parámetros de la URL (ej. :id) llegan como input() del componente.
      withComponentInputBinding(),
      // Al cambiar de página, vuelve arriba.
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
    ),
  ],
};
