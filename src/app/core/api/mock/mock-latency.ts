import { InjectionToken } from '@angular/core';

/** Latencia simulada de los mocks (ms). En tests se provee 0. */
export const MOCK_LATENCY_MS = new InjectionToken<number>('MOCK_LATENCY_MS', {
  providedIn: 'root',
  factory: () => 350,
});

