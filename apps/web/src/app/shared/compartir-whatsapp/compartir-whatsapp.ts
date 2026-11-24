import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Icono } from '../icono/icono';

/**
 * Botón "Compartir por WhatsApp": abre WhatsApp (app o web) con un mensaje
 * que lleva el título y el enlace de la página actual. No usa ninguna clave ni guarda nada.
 */
@Component({
  selector: 'app-compartir-whatsapp',
  imports: [Icono],
  host: { class: 'block' },
  template: `
    <a
      [href]="enlace()"
      target="_blank"
      rel="noopener noreferrer"
      class="btn w-full bg-green-700 text-white hover:bg-green-800"
    >
      <app-icono nombre="mensaje" clase="size-5 shrink-0" />
      Compartir por WhatsApp
      <span class="sr-only">(se abre en otra pestaña)</span>
    </a>
  `,
})
export class CompartirWhatsapp {
  private readonly documento = inject(DOCUMENT);

  /** Lo que se comparte, por ejemplo el título del recurso. */
  readonly titulo = input.required<string>();
  /** Frase antes del título. */
  readonly intro = input('Te comparto este recurso del Portal TIC Docente');

  protected readonly enlace = computed(() => {
    const mensaje = `${this.intro()}: «${this.titulo()}» ${this.documento.location.href}`;
    return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
  });
}
