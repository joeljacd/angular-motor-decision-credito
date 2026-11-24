import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  appName: 'Motor de Decisión de Crédito',
  bankName: 'Banco Amazonas',
  environmentLabel: 'Desarrollo',
  apiBaseUrl: '/api',
  useMocks: true,
  /** Dominio de red mostrado en el login (BAMAZONAS\\usuario). */
  adDomain: 'BAMAZONAS',
  /** Usuarios sugeridos en el login cuando hay mocks. */
  demoUsers: ['mfcevallos', 'lmora', 'aperez', 'cruiz'] as string[],
  demoToday: '2026-11-22',
  features: {
    demoUserSwitcher: true,
    simulateKeyUnavailable: false,
  },
};
