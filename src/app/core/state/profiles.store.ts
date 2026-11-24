import { inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { ActiveState, Profile } from '../auth/auth.models';
import { ProfileDraft, ProfilesApi } from '../api/profiles.api';

/** Perfiles (pantalla Perfiles y selector de perfil en Usuarios). */
@Injectable({ providedIn: 'root' })
export class ProfilesStore {
  private readonly api = inject(ProfilesApi);
  private readonly _items = signal<Profile[]>([]);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  load(force = false): void {
    if (this._loading() || (this._loaded() && !force)) return;
    this._loading.set(true);
    this.api
      .list()
      .pipe(finalize(() => this._loading.set(false)))
      .subscribe((items) => {
        this._items.set(items);
        this._loaded.set(true);
      });
  }

  create(draft: ProfileDraft): Observable<Profile> {
    return this.api.create(draft).pipe(tap((created) => this._items.update((list) => [...list, created])));
  }

  update(id: number, draft: ProfileDraft): Observable<Profile> {
    return this.api.update(id, draft).pipe(tap((updated) => this.replace(updated)));
  }

  setStatus(id: number, status: ActiveState): Observable<Profile> {
    return this.api.setStatus(id, status).pipe(tap((updated) => this.replace(updated)));
  }

  private replace(updated: Profile): void {
    this._items.update((list) => list.map((p) => (p.id === updated.id ? updated : p)));
  }
}
