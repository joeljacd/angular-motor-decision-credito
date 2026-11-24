import { Observable } from 'rxjs';

export type FindingKind =
  | 'Registro alterado' | 'Registro borrado' | 'Fuera de orden' | 'Campo de auditoría distinto'
  | 'Versión con firma distinta' | 'Versión sin sello' | 'Sello global inválido';

export type FindingSeverity = 'error' | 'warning';

export interface IntegrityFinding {
  kind: FindingKind;
  severity: FindingSeverity;
  location: string;
  detail: string;
  /** El hallazgo se resuelve solicitando el sellado de una versión. */
  sealable: boolean;
  /** El hallazgo apunta a un registro de Historial. */
  inHistory: boolean;
  /** Id de la solicitud de sellado ya pendiente, si existe. */
  pendingRequestId?: string;
}

export interface ChainLink {
  seq: number;
  status: 'valid' | 'breaks' | 'unverified';
}

export interface IntegrityReport {
  /** Texto legible: "Verificación manual: 22/11/2026 11:24 · Ana" */
  verifiedAt: string;
  clean: boolean;
  recordsVerified: number;
  sealedVersions: number;
  historyFindings: number;
  versionFindings: number;
  globalSealValid: boolean;
  chain: ChainLink[];
  findings: IntegrityFinding[];
}

export abstract class IntegrityApi {
  /** GET /integrity/alerts — mensajes de firmas/sellos inválidos (banner del shell). */
  abstract alerts(): Observable<string[]>;
  /** GET /integrity/last — último informe (verificación automática). */
  abstract lastReport(): Observable<IntegrityReport>;
  /**
   * POST /integrity/verify — ejecuta la verificación.
   * `scenario` solo lo usan los mocks para simular resultados; el backend real lo ignora.
   */
  abstract verify(scenario?: 'bad' | 'ok'): Observable<IntegrityReport>;
}
