import { inject, Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SystemStatusStore } from '../state/system-status.store';

/**
 * Traduce errores HTTP a feedback de UI. Los diálogos se cargan bajo demanda (no pesan en el bundle inicial).
 *  - 401 → cierra sesión y vuelve a /login
 *  - 403 → diálogo "sin permiso"
 *  - 409 → diálogo "conflicto de concurrencia" (recargar)
 *  - 503 → banner "llave no disponible" (edición deshabilitada)
 */
@Injectable({ providedIn: 'root' })
export class ErrorFeedbackService {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly status = inject(SystemStatusStore);
  private readonly injector = inject(Injector);

  unauthorized(): void {
    if (!this.auth.isAuthenticated()) return;
    const returnUrl = this.router.url;
    this.auth.logout();
    void this.router.navigate(['/login'], { queryParams: { returnUrl, reason: 'expired' } });
  }

  async forbidden(): Promise<void> {
    const { ForbiddenDialog } = await import('../../shared/dialogs/forbidden-dialog');
    (await this.modal()).open(ForbiddenDialog);
  }

  async conflict(): Promise<void> {
    const { ConflictDialog } = await import('../../shared/dialogs/conflict-dialog');
    (await this.modal()).open(ConflictDialog);
  }

  keyUnavailable(): void {
    this.status.keyUnavailable.set(true);
  }

  private async modal() {
    const { ModalService } = await import('../../shared/ui/modal/modal.service');
    return this.injector.get(ModalService);
  }
}
