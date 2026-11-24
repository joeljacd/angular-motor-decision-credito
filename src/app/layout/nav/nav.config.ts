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
  { key: 'home', path: '/home', icon: 'inbox', group: null },
  { key: 'flows', path: '/flows', icon: 'workflow', group: 'engine' },
  { key: 'requests', path: '/requests', icon: 'git-pull-request', group: 'engine' },
  { key: 'm-channels', path: '/masters/channels', icon: 'layers', group: 'masters' },
  { key: 'm-actions', path: '/masters/actions', icon: 'flag', group: 'masters' },
  { key: 'm-parameters', path: '/masters/parameters', icon: 'sliders', group: 'masters' },
  { key: 'm-catalogs', path: '/masters/catalogs', icon: 'list', group: 'masters' },
  { key: 'm-roles', path: '/masters/roles', icon: 'key', group: 'masters' },
  { key: 'history', path: '/history', icon: 'history', group: 'audit' },
  { key: 'integrity', path: '/integrity', icon: 'shield-check', group: 'audit' },
  { key: 'users', path: '/users', icon: 'users', group: 'security' },
  { key: 'profiles', path: '/profiles', icon: 'contact', group: 'security' },
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
