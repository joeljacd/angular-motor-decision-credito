import { InjectionToken, Provider } from '@angular/core';
import { environment } from '@env/environment';
import type { Environment } from '@env/environment.model';

export type AppConfig = Environment;

/** Configuración de la app (viene de `environments/`). Inyectar en lugar de importar `environment` directo. */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

export function provideAppConfig(config: AppConfig = environment): Provider {
  return { provide: APP_CONFIG, useValue: config };
}
