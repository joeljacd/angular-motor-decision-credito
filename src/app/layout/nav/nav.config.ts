import { ScreenKey } from '@core/auth';
import { I18nKey } from '@core/i18n';
import { IconName } from '@shared/ui';

export type NavGroupId = 'engine' | 'masters' | 'audit' | 'security';

export interface NavItem {
  /** Opción de permiso que habilita la entrada (y la ruta). */
  key: ScreenKey;
  path: string;
  icon: IconName;
  group: NavGroupId | null;
}

/**
 * Fuente única del menú Y de las rutas protegidas.
 * Para agregar una pantalla: 1) clave en core/auth/permissions.ts, 2) entrada aquí,
 * 3) ruta en app.routes.ts con `data: { option: <clave> }`, 4) textos en i18n (nav.<clave>).
 */
export const NAV_ITEMS: readonly NavItem[] = [
  { key: 'inicio', path: '/inicio', icon: 'inbox', group: null },
  { key: 'flujos', path: '/flujos', icon: 'workflow', group: 'engine' },
  { key: 'solicitudes', path: '/solicitudes', icon: 'git-pull-request', group: 'engine' },
  { key: 'm-canales', path: '/maestros/canales', icon: 'layers', group: 'masters' },
  { key: 'm-acciones', path: '/maestros/acciones', icon: 'flag', group: 'masters' },
  { key: 'm-parametros', path: '/maestros/parametros', icon: 'sliders', group: 'masters' },
  { key: 'm-catalogos', path: '/maestros/catalogos', icon: 'list', group: 'masters' },
  { key: 'm-roles', path: '/maestros/roles', icon: 'key', group: 'masters' },
  { key: 'historial', path: '/historial', icon: 'history', group: 'audit' },
  { key: 'integridad', path: '/integridad', icon: 'shield-check', group: 'audit' },
  { key: 'usuarios', path: '/usuarios', icon: 'users', group: 'security' },
  { key: 'perfiles', path: '/perfiles', icon: 'contact', group: 'security' },
];

export const NAV_GROUPS: readonly { id: NavGroupId | null; labelKey?: I18nKey }[] = [
  { id: null },
  { id: 'engine', labelKey: 'nav.group.engine' },
  { id: 'masters', labelKey: 'nav.group.masters' },
  { id: 'audit', labelKey: 'nav.group.audit' },
  { id: 'security', labelKey: 'nav.group.security' },
];

export function navPathFor(key: ScreenKey): string {
  return NAV_ITEMS.find((i) => i.key === key)?.path ?? '/';
}
