import { computed, inject, Injectable, signal } from '@angular/core';
import { IntegrityApi } from '../api/integrity.api';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class IntegrityStore {
  private readonly api = inject(IntegrityApi);
  private readonly auth = inject(AuthService);

  private readonly _alerts = signal<string[]>([]);
  private readonly _loaded = signal(false);

  /** Alertas visibles para el usuario actual (solo quien ve Inicio o Integridad). */
  readonly alerts = computed(() =>
    this.auth.can('integrity') || this.auth.can('home') ? this._alerts() : [],
  );
  readonly hasAlerts = computed(() => this.alerts().length > 0);

  load(force = false): void {
    if (this._loaded() && !force) return;
    this.api.alerts().subscribe({
      next: (alerts) => {
        this._alerts.set(alerts);
        this._loaded.set(true);
      },
      error: () => this._alerts.set([]),
    });
  }

  reset(): void {
    this._alerts.set([]);
    this._loaded.set(false);
  }
}
