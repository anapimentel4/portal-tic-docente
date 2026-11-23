import { Component } from '@angular/core';
import { CONTACTO } from '../../core/config/contacto';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly contacto = CONTACTO;
  protected readonly anio = new Date().getFullYear();
}
