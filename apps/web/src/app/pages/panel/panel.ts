import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ROLES } from '@portal/shared';
import { AuthService } from '../../core/services/auth.service';

// Fase 1 dejó el guard por rol; ya está la revisión de recursos (/panel/recursos).
// En la fase 5 se agregan los indicadores y las solicitudes.
@Component({
  selector: 'app-panel',
  imports: [RouterLink],
  templateUrl: './panel.html',
})
export class PanelPage {
  protected readonly auth = inject(AuthService);
  protected readonly roles = ROLES;
}
