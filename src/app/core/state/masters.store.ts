import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { MastersApi, MastersSnapshot } from '../api/masters.api';

/** Estado vigente de los maestros (canales, productos, acciones, catálogos, roles, parámetros). Solo lectura: los cambios son solicitudes. */
@Injectable({ providedIn: 'root' })
export class MastersStore {
  private readonly api = inject(MastersApi);
  private readonly _snapshot = signal<MastersSnapshot | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly snapshot = this._snapshot.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = computed(() => this._snapshot() !== null);

  load(force = false): void {
    if (this._loading() || (this.loaded() && !force)) return;
    this._loading.set(true);
    this._error.set(false);
    this.api
      .snapshot()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({ next: (s) => this._snapshot.set(s), error: () => this._error.set(true) });
  }
}
