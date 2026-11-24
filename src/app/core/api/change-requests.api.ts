import { Observable } from 'rxjs';

export type RequestStatus = 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada' | 'Vencida';

export interface ChangeRequest {
  id: string;
  /** Tipo de elemento: Canal, Producto, Acción, Parámetro, Catálogo, Rol, Sellado… */
  tipo: string;
  elemento: string;
  accion: string;
  /** Usuario de red del solicitante. */
  solicitante: string;
  /** dd/MM/yyyy */
  fecha: string;
  vence: string;
  estado: RequestStatus;
  /** El elemento cambió desde que se hizo la solicitud: debe rehacerse (conflicto 409 al aprobar). */
  stale?: boolean;
  aprobador?: string;
  rechazo?: string;
  actual: Record<string, string>;
  propuesto: Record<string, string>;
  comentario: string;
}

/** Datos para crear una solicitud; el backend asigna id, fechas y solicitante. */
export type NewChangeRequest = Pick<ChangeRequest, 'tipo' | 'elemento' | 'accion' | 'actual' | 'propuesto' | 'comentario'>;

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
