import { OptionKey } from '@core/auth/permissions';

export interface PermissionItem {
  id: OptionKey;
  label: string;
  hint: string;
}

export interface PermissionGroup {
  title: string;
  items: PermissionItem[];
}

/** Opciones asignables a un perfil, agrupadas como en el menú real. Mantener en sincronía con nav.config.ts. */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: 'Capacidades',
    items: [
      { id: 'cap.request', label: 'Solicitar y editar', hint: 'Editar borradores y crear solicitudes' },
      { id: 'cap.approve', label: 'Aprobar y publicar', hint: 'Nunca sobre lo propio (cuatro ojos)' },
    ],
  },
  { title: 'Inicio', items: [{ id: 'home', label: 'Inicio', hint: 'Bandeja de pendientes' }] },
  {
    title: 'Motor',
    items: [
      { id: 'flows', label: 'Flujos', hint: 'Versiones, editor y revisión' },
      { id: 'requests', label: 'Solicitudes de cambio', hint: 'Lista y detalle' },
    ],
  },
  {
    title: 'Maestros',
    items: [
      { id: 'm-channels', label: 'Canales y productos', hint: 'Incluye la matriz canal–producto' },
      { id: 'm-actions', label: 'Acciones', hint: '' },
      { id: 'm-parameters', label: 'Parámetros', hint: '' },
      { id: 'm-catalogs', label: 'Catálogos', hint: '' },
      { id: 'm-roles', label: 'Roles', hint: '' },
    ],
  },
  {
    title: 'Auditoría',
    items: [
      { id: 'history', label: 'Historial', hint: '' },
      { id: 'integrity', label: 'Integridad', hint: '' },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { id: 'users', label: 'Usuarios', hint: '' },
      { id: 'profiles', label: 'Perfiles', hint: '' },
    ],
  },
];

export const ALL_PERMISSION_IDS: OptionKey[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id));
/** Solo pantallas (sin capacidades). */
export const SCREEN_PERMISSION_IDS = ALL_PERMISSION_IDS.filter((id) => !id.startsWith('cap.'));

/** Capacidades resumidas de un perfil para mostrar en la tabla. */
export function capabilitiesOf(opts: OptionKey[]): string[] {
  return [
    opts.includes('cap.request') && 'Solicitar',
    opts.includes('cap.approve') && 'Aprobar',
    (opts.includes('history') || opts.includes('integrity')) && 'Auditar',
  ].filter((c): c is string => !!c);
}
