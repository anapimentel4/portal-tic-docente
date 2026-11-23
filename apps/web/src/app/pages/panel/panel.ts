import { Component, inject } from '@angular/core';
import { ROLES } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';

// Fase 1: solo comprueba que el guard por rol funciona.
// En la fase 5 se agregan los indicadores, la revisión de recursos y las solicitudes.
@Component({
  selector: 'app-panel',
  templateUrl: './panel.html',
})
export class PanelPage {
  protected readonly auth = inject(AuthService);
  protected readonly roles = ROLES;
}
