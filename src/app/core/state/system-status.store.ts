import { inject, Injectable, signal } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

/** Estado global del sistema que afecta a toda la UI (p. ej. banner 503 "llave no disponible"). */
@Injectable({ providedIn: 'root' })
export class SystemStatusStore {
  /** true = el servicio no puede firmar cambios; la edición debe deshabilitarse. */
  readonly keyUnavailable = signal(inject(APP_CONFIG).features.simulateKeyUnavailable);
}
