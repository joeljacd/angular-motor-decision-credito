/**
 * Entorno base (build de producción).
 * `useMocks: true` mientras no exista backend: los servicios de `core/api` usan datos simulados.
 * Para conectar el backend real: `useMocks: false` y definir `apiBaseUrl`.
 */
import type { Environment } from './environment.model';

export const environment: Environment = {
  production: true,
  appName: 'Motor de Decisión de Crédito',
  bankName: 'Banco Amazonas',
  environmentLabel: 'Producción',
  apiBaseUrl: '/api',
  useMocks: true,
  /** Dominio de red mostrado en el login (BAMAZONAS\\usuario). */
  adDomain: 'BAMAZONAS',
  /** Usuarios sugeridos en el login cuando hay mocks. */
  demoUsers: ['mfcevallos', 'lmora', 'aperez', 'cruiz'] as string[],
  /** Fecha "hoy" fija para que los datos de demostración sean coherentes (ISO). null = fecha real. */
  demoToday: '2026-11-22' as string | null,
  features: {
    /** Selector "Ver el portal como…" (solo tiene sentido con mocks). */
    demoUserSwitcher: true,
    /** Simula el 503 "Llave no disponible" (edición deshabilitada). */
    simulateKeyUnavailable: false,
  },
};
