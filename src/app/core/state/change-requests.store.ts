import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { ChangeRequest, ChangeRequestsApi, NewChangeRequest } from '../api/change-requests.api';

@Injectable({ providedIn: 'root' })
export class ChangeRequestsStore {
  private readonly api = inject(ChangeRequestsApi);

  private readonly _items = signal<ChangeRequest[]>([]);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly error = this._error.asReadonly();

  load(force = false): void {
    if (this._loading() || (this._loaded() && !force)) return;
    this._loading.set(true);
    this._error.set(null);
    this.api
      .list()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe({
        next: (items) => {
          this._items.set(items);
          this._loaded.set(true);
        },
        error: () => this._error.set('No fue posible cargar las solicitudes.'),
      });
  }

  create(request: NewChangeRequest): Observable<ChangeRequest> {
    return this.api.create(request).pipe(tap((created) => this._items.update((list) => [created, ...list])));
  }

  cancel(id: string): Observable<ChangeRequest> {
    return this.api.cancel(id).pipe(tap((updated) => this.replace(updated)));
  }

  approve(id: string): Observable<ChangeRequest> {
    return this.api.approve(id).pipe(tap((updated) => this.replace(updated)));
  }

  reject(id: string, comment: string): Observable<ChangeRequest> {
    return this.api.reject(id, comment).pipe(tap((updated) => this.replace(updated)));
  }

  private replace(updated: ChangeRequest): void {
    this._items.update((list) => list.map((r) => (r.id === updated.id ? updated : r)));
  }

  reset(): void {
    this._items.set([]);
    this._loaded.set(false);
  }
}
