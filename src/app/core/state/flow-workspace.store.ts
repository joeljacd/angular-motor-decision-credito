import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { FlowDocument, FlowResources } from '../api/flow.models';
import { DraftSource, FlowState, FlowWorkspace, PublishScenario, WorkflowApi } from '../api/workflow.api';
import { WorkflowStore } from './workflow.store';

/**
 * Espacio de trabajo del flujo: borrador, versión vigente y recursos (variables, catálogos, campos).
 * Las ediciones se aplican en memoria y se persisten de inmediato; si el guardado falla se recarga desde el servidor.
 */
@Injectable({ providedIn: 'root' })
export class FlowWorkspaceStore {
  private readonly api = inject(WorkflowApi);
  private readonly workflow = inject(WorkflowStore);

  private readonly _ws = signal<FlowWorkspace | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);
  private readonly _saving = signal(false);

  readonly workspace = this._ws.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly saving = this._saving.asReadonly();
  readonly loaded = computed(() => this._ws() !== null);

  readonly state = computed(() => this._ws()?.state ?? null);
  readonly draft = computed(() => this._ws()?.draft ?? null);
  readonly baseline = computed(() => this._ws()?.baseline ?? null);
  readonly resources = computed(() => this._ws()?.resources ?? null);
  readonly baselineResources = computed(() => this._ws()?.baselineResources ?? null);

  load(force = false): void {
    if (this._loading() || (this.loaded() && !force)) return;
    this._loading.set(true);
    this._error.set(false);
    this.api
      .workspace()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (ws) => {
          this._ws.set(ws);
          this.workflow.set(ws.state);
        },
        error: () => this._error.set(true),
      });
  }

  /** Aplica `change` sobre una copia del borrador/recursos y la guarda. */
  edit(change: (draft: FlowDocument, resources: FlowResources) => void): Observable<FlowState> {
    const ws = this._ws();
    if (!ws) throw new Error('El espacio de trabajo no está cargado');
    const draft = structuredClone(ws.draft);
    const resources = structuredClone(ws.resources);
    change(draft, resources);
    this._ws.set({ ...ws, draft, resources });
    this._saving.set(true);
    return this.api.saveDraft(draft, resources).pipe(
      tap({
        next: (state) => this.applyState(state),
        error: () => this.load(true),
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  open(source: DraftSource, version?: number): Observable<FlowState> {
    return this.api.openDraft(source, version).pipe(tap((s) => this.refreshAfter(s)));
  }
  discard(): Observable<FlowState> {
    return this.api.discardDraft().pipe(tap((s) => this.refreshAfter(s)));
  }
  submit(): Observable<FlowState> {
    return this.api.submit().pipe(tap((s) => this.applyState(s)));
  }
  returnDraft(comment: string): Observable<FlowState> {
    return this.api.returnDraft(comment).pipe(tap((s) => this.applyState(s)));
  }
  approve(scenario?: PublishScenario): Observable<FlowState> {
    return this.api.approveAndPublish(scenario).pipe(tap((s) => this.refreshAfter(s)));
  }

  private applyState(state: FlowState): void {
    this._ws.update((ws) => (ws ? { ...ws, state } : ws));
    this.workflow.set(state);
  }

  /** Abrir/descartar/publicar cambian borrador y versión vigente: se recarga todo. */
  private refreshAfter(state: FlowState): void {
    this.workflow.set(state);
    this.load(true);
  }

  reset(): void {
    this._ws.set(null);
  }
}
