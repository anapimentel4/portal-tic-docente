import { computed, effect, Injectable, signal } from '@angular/core';
import { CONFIG_EJEMPLO, EQUIPOS, type ConfigTaller } from './datos';

const CLAVE = 'portal-tic:sala-taller';

interface Guardado {
  config: ConfigTaller;
  grupos: string[][];
  puntos: number[];
}

/** Lista de líneas no vacías de un texto (un elemento por línea). */
export function lineas(texto: string): string[] {
  return texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Estado de la Sala de taller, compartido por sus herramientas (grupos, marcador, ruleta).
 * Se guarda solo en este navegador (localStorage): no usa la base de datos.
 * Si el navegador no deja guardar (ventana privada), todo funciona igual, pero se pierde al recargar.
 */
@Injectable({ providedIn: 'root' })
export class SalaTallerEstado {
  private readonly guardado = leer();

  readonly config = signal<ConfigTaller>(this.guardado?.config ?? copia(CONFIG_EJEMPLO));
  readonly grupos = signal<string[][]>(this.guardado?.grupos ?? EQUIPOS.map(() => []));
  readonly puntos = signal<number[]>(this.guardado?.puntos ?? EQUIPOS.map(() => 0));

  readonly participantes = computed(() => lineas(this.config().participantes));

  constructor() {
    effect(() => {
      const datos: Guardado = { config: this.config(), grupos: this.grupos(), puntos: this.puntos() };
      try {
        localStorage.setItem(CLAVE, JSON.stringify(datos));
      } catch {
        // Sin almacenamiento disponible: se sigue usando en memoria.
      }
    });
  }

  cambiar<K extends keyof ConfigTaller>(campo: K, valor: ConfigTaller[K]): void {
    this.config.update((c) => ({ ...c, [campo]: valor }));
  }

  volverAlEjemplo(): void {
    this.config.set(copia(CONFIG_EJEMPLO));
    this.grupos.set(EQUIPOS.map(() => []));
    this.puntos.set(EQUIPOS.map(() => 0));
  }
}

function copia(config: ConfigTaller): ConfigTaller {
  return { ...config, agenda: config.agenda.map((a) => ({ ...a })) };
}

function leer(): Guardado | null {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (!texto) return null;
    const datos = JSON.parse(texto) as Guardado;
    const valido =
      datos?.config &&
      Array.isArray(datos.config.agenda) &&
      Array.isArray(datos.grupos) &&
      datos.grupos.length === EQUIPOS.length &&
      Array.isArray(datos.puntos) &&
      datos.puntos.length === EQUIPOS.length;
    return valido ? { ...datos, config: { ...CONFIG_EJEMPLO, ...datos.config } } : null;
  } catch {
    return null;
  }
}
