import { Component } from '@angular/core';
import { CONTACTO } from '../../core/config/contacto';
import { Icono } from '../icono/icono';

@Component({
  selector: 'app-footer',
  imports: [Icono],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly contacto = CONTACTO;
  protected readonly anio = new Date().getFullYear();
  /** "829-757-0913" → "+18297570913" para el enlace tel: (República Dominicana: +1). */
  protected readonly telefonoMarcable = '+1' + CONTACTO.telefono.replace(/\D/g, '');
}
