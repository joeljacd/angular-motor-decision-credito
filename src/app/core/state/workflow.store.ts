import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { FlowState, WorkflowApi } from '../api/workflow.api';

@Injectable({ providedIn: 'root' })
export class WorkflowStore {
  private readonly api = inject(WorkflowApi);

  private readonly _flow = signal<FlowState | null>(null);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);

  readonly flow = this._flow.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  load(force = false): void {
    if (this._loading() || (this._loaded() && !force)) return;
    this._loading.set(true);
    this.api
      .currentDraft()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (flow) => {
          this._flow.set(flow);
          this._loaded.set(true);
        },
        error: () => this._flow.set(null),
      });
  }

  /** Actualiza el estado resumido tras una operación del editor (mantiene la bandeja sincronizada). */
  set(flow: FlowState): void {
    this._flow.set(flow);
    this._loaded.set(true);
  }

  reset(): void {
    this._flow.set(null);
    this._loaded.set(false);
  }
}
