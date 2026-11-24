import { Observable } from 'rxjs';
import { FlowDocument, FlowResources } from './flow.models';

/** none = no hay borrador abierto · publicado = el borrador se aprobó y pasó a vigente. */
export type FlowStatus = 'none' | 'edicion' | 'revision' | 'publicado';

/** Estado del borrador de flujo vigente (un solo borrador a la vez). */
export interface FlowState {
  status: FlowStatus;
  /** Comentario con el que un aprobador devolvió el borrador. */
  devolucion: string;
  openedBy: string;
  openedId: string;
  openedAt: string;
  editors: string[];
  editorNames: string;
  last: string;
  vence: string;
  sentAt: string;
  /** Quién aprobó y publicó (status = publicado). */
  approvedBy?: string;
  publishedAt?: string;
}

/** Todo lo que necesitan el editor y la revisión: borrador, versión vigente y recursos de ambos. */
export interface FlowWorkspace {
  state: FlowState;
  draft: FlowDocument;
  baseline: FlowDocument;
  resources: FlowResources;
  baselineResources: FlowResources;
}

export type VersionStatus = 'current' | 'retired' | 'edit' | 'review';
export type SealStatus = 'Sellada' | 'Sin sellar' | 'Firma inválida';

export interface FlowVersion {
  number: number;
  status: VersionStatus;
  seal: SealStatus;
  publishedAt: string;
  approvedBy: string;
  validity: string;
}

export type DraftSource = 'current' | 'retired' | 'empty';

/** Resultado simulado de la publicación (solo mocks; el backend real decide). */
export type PublishScenario = 'ok' | 'conflict' | 'error';

export abstract class WorkflowApi {
  /** GET /flow/draft — estado resumido (bandeja, shell). */
  abstract currentDraft(): Observable<FlowState>;
  /** GET /flow/workspace */
  abstract workspace(): Observable<FlowWorkspace>;
  /** GET /flows/{channel}/{product}/versions */
  abstract versions(channel: string, product: string): Observable<FlowVersion[]>;
  /** PUT /flow/draft */
  abstract saveDraft(document: FlowDocument, resources: FlowResources): Observable<FlowState>;
  /** POST /flow/draft  { source, version? } — abre un borrador (409 si ya existe uno). */
  abstract openDraft(source: DraftSource, version?: number): Observable<FlowState>;
  /** DELETE /flow/draft */
  abstract discardDraft(): Observable<FlowState>;
  /** POST /flow/draft/submit */
  abstract submit(): Observable<FlowState>;
  /** POST /flow/draft/return  { comment } */
  abstract returnDraft(comment: string): Observable<FlowState>;
  /** POST /flow/draft/approve — 409 si la versión vigente cambió; 5xx si el motor no pudo cargarla. */
  abstract approveAndPublish(scenario?: PublishScenario): Observable<FlowState>;
}
