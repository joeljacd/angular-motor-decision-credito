import { Injectable } from '@angular/core';

const PREFIX = 'bamz.portal.';

/** Acceso tipado y seguro (try/catch) a localStorage / sessionStorage. */
@Injectable({ providedIn: 'root' })
export class StorageService {
  readonly local = this.wrap(() => localStorage);
  /** Datos de sesión: se pierden al cerrar la pestaña (preferible para tokens). */
  readonly session = this.wrap(() => sessionStorage);

  private wrap(getStore: () => Storage) {
    return {
      get: <T>(key: string): T | null => {
        try {
          const raw = getStore().getItem(PREFIX + key);
          return raw === null ? null : (JSON.parse(raw) as T);
        } catch {
          return null;
        }
      },
      set: (key: string, value: unknown): void => {
        try {
          getStore().setItem(PREFIX + key, JSON.stringify(value));
        } catch {
          /* almacenamiento no disponible / lleno: se ignora */
        }
      },
      remove: (key: string): void => {
        try {
          getStore().removeItem(PREFIX + key);
        } catch {
          /* noop */
        }
      },
    };
  }
}
