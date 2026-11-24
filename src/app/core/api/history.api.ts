import { Observable } from 'rxjs';

export type ChangeType =
  | 'Alta' | 'Cambio' | 'Baja' | 'Apertura' | 'Envío' | 'Devolución' | 'Aprobación' | 'Publicación' | 'Descarte' | 'Vencimiento';

/** Registro de la bitácora de auditoría (solo lectura, firmado y encadenado). */
export interface HistoryEntry {
  /** Número de registro dentro de la cadena. */
  seq: number;
  /** dd/MM/yyyy HH:mm:ss */
  timestamp: string;
  user: string;
  changeType: ChangeType;
  elementType: string;
  element: string;
  summary: string;
  /** "—" cuando el cambio es sobre un maestro (sin canal). */
  channel: string;
  product: string;
  version: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  signature: string;
  previousSignature: string;
  /** false = la firma anterior no coincide (cadena rota en este registro). */
  chainOk: boolean;
  keyId: string;
}

export interface HistoryFilter {
  channel?: string;
  product?: string;
  version?: string;
  user?: string;
  elementType?: string;
  /** Texto contenido en el elemento. */
  element?: string;
  /** yyyy-MM-dd */
  from?: string;
  to?: string;
}

export interface HistoryPage {
  items: HistoryEntry[];
  total: number;
}

/** Valores disponibles para poblar los filtros. */
export interface HistoryFilterOptions {
  channels: string[];
  products: string[];
  versions: string[];
  users: string[];
  elementTypes: string[];
}

export abstract class HistoryApi {
  /** GET /history?channel=&product=&…&page=&size= */
  abstract query(filter: HistoryFilter, page: number, size: number): Observable<HistoryPage>;
  /** GET /history/filter-options */
  abstract filterOptions(): Observable<HistoryFilterOptions>;
}
