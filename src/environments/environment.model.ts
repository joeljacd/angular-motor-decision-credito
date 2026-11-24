/** Forma de la configuración por entorno (compartida: environment.ts se reemplaza en el build de desarrollo). */
export interface Environment {
  production: boolean;
  appName: string;
  bankName: string;
  environmentLabel: string;
  apiBaseUrl: string;
  useMocks: boolean;
  adDomain: string;
  demoUsers: string[];
  demoToday: string | null;
  features: { demoUserSwitcher: boolean; simulateKeyUnavailable: boolean };
}
