import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideApis } from '@core/api/api.providers';
import { provideAppConfig } from '@core/config/app-config';
import { MOCK_LATENCY_MS } from '@core/api/mock/mock-latency';

/** Providers comunes para specs: mocks sin latencia, router vacío, configuración por defecto. */
export const provideTestApp = () => [
  provideZonelessChangeDetection(),
  provideAppConfig(),
  provideApis(),
  provideRouter([]),
  { provide: MOCK_LATENCY_MS, useValue: 0 },
];
