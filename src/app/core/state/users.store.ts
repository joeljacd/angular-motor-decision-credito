import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';
import { User } from '../auth/auth.models';
import { NewUser, UsersApi } from '../api/users.api';

/** Usuarios del portal (pantalla Usuarios y conteo en Perfiles). */
@Injectable({ providedIn: 'root' })
export class UsersStore {
  private readonly api = inject(UsersApi);
  private readonly _items = signal<User[]>([]);
  private readonly _loading = signal(false);
  private readonly _loaded = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  private readonly names = computed(() => new Map(this._items().map((u) => [u.usuario, u.nombre])));

  /** Nombre completo de un usuario de red (cae al usuario si aún no se cargó la lista). */
  nameOf(username: string | undefined): string {
    return username ? (this.names().get(username) ?? username) : '—';
  }

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

  create(user: NewUser): Observable<User> {
    return this.api.create(user).pipe(tap((created) => this._items.update((list) => [...list, created])));
  }

  update(username: string, changes: Partial<Pick<User, 'nombre' | 'estado'>>): Observable<User> {
    return this.api
      .update(username, changes)
      .pipe(tap((updated) => this._items.update((list) => list.map((u) => (u.usuario === updated.usuario ? updated : u)))));
  }
}
