import { Observable } from 'rxjs';

export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';

export interface ChangeRequest {
  id: string;
  /** Tipo de elemento: Canal, Producto, Acción, Parámetro, Catálogo, Rol, Sellado… */
  type: string;
  element: string;
  action: string;
  /** Usuario de red del solicitante. */
  requester: string;
  /** dd/MM/yyyy */
  date: string;
  expiresAt: string;
  status: RequestStatus;
  /** El elemento cambió desde que se hizo la solicitud: debe rehacerse (conflicto 409 al aprobar). */
  stale?: boolean;
  approver?: string;
  rejectionReason?: string;
  current: Record<string, string>;
  proposed: Record<string, string>;
  comment: string;
}

/** Datos para crear una solicitud; el backend asigna id, fechas y solicitante. */
export type NewChangeRequest = Pick<ChangeRequest, 'type' | 'element' | 'action' | 'current' | 'proposed' | 'comment'>;

export abstract class ChangeRequestsApi {
  /** GET /change-requests */
  abstract list(): Observable<ChangeRequest[]>;
  /** POST /change-requests */
  abstract create(request: NewChangeRequest): Observable<ChangeRequest>;
  /** POST /change-requests/{id}/cancel */
  abstract cancel(id: string): Observable<ChangeRequest>;
  /** POST /change-requests/{id}/approve — 409 si el elemento cambió; 403 si es el propio solicitante. */
  abstract approve(id: string): Observable<ChangeRequest>;
  /** POST /change-requests/{id}/reject  { comment } */
  abstract reject(id: string, comment: string): Observable<ChangeRequest>;
}
