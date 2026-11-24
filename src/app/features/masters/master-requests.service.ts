import { computed, inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ChangeRequest } from '@core/api/change-requests.api';
import { AuthService } from '@core/auth';
import { ChangeRequestsStore } from '@core/state/change-requests.store';
import { SystemStatusStore } from '@core/state/system-status.store';
import { ToastService } from '@shared/ui';

export interface MasterChange {
  /** Tipo de elemento: Canal, Producto, Acción… */
  type: string;
  /** Alta, Cambio, Baja, Habilitar, Deshabilitar… */
  action: string;
  /** Texto que identifica al elemento (se usa para detectar solicitudes pendientes duplicadas). */
  element: string;
  current: Record<string, string>;
  proposed: Record<string, string>;
  comment?: string;
}

/**
 * Los maestros no se editan directamente: cada cambio es una solicitud que aprueba otra persona.
 * Este servicio centraliza permisos, detección de duplicados y creación de solicitudes.
 */
@Injectable({ providedIn: 'root' })
export class MasterRequests {
  private readonly store = inject(ChangeRequestsStore);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly status = inject(SystemStatusStore);

  /** Puede pedir cambios (capacidad Solicitar y sistema de firma disponible). */
  readonly canEdit = computed(() => (this.auth.me()?.puedeSolicitar ?? false) && !this.status.keyUnavailable());

  load(): void {
    this.store.load();
  }

  /** Solicitud pendiente sobre el mismo elemento, si existe. */
  pendingFor(element: string): ChangeRequest | undefined {
    return this.store.items().find((r) => r.estado === 'Pendiente' && r.elemento === element);
  }

  create(change: MasterChange): Observable<ChangeRequest> {
    return this.store
      .create({ tipo: change.type, accion: change.action, elemento: change.element, actual: change.current, propuesto: change.proposed, comentario: change.comment ?? '' })
      .pipe(tap((r) => this.toast.success(`Solicitud ${r.id} creada · no rige hasta su aprobación`)));
  }
}
