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
      { id: 'cap.solicitar', label: 'Solicitar y editar', hint: 'Editar borradores y crear solicitudes' },
      { id: 'cap.aprobar', label: 'Aprobar y publicar', hint: 'Nunca sobre lo propio (cuatro ojos)' },
    ],
  },
  { title: 'Inicio', items: [{ id: 'inicio', label: 'Inicio', hint: 'Bandeja de pendientes' }] },
  {
    title: 'Motor',
    items: [
      { id: 'flujos', label: 'Flujos', hint: 'Versiones, editor y revisión' },
      { id: 'solicitudes', label: 'Solicitudes de cambio', hint: 'Lista y detalle' },
    ],
  },
  {
    title: 'Maestros',
    items: [
      { id: 'm-canales', label: 'Canales y productos', hint: 'Incluye la matriz canal–producto' },
      { id: 'm-acciones', label: 'Acciones', hint: '' },
      { id: 'm-parametros', label: 'Parámetros', hint: '' },
      { id: 'm-catalogos', label: 'Catálogos', hint: '' },
      { id: 'm-roles', label: 'Roles', hint: '' },
    ],
  },
  {
    title: 'Auditoría',
    items: [
      { id: 'historial', label: 'Historial', hint: '' },
      { id: 'integridad', label: 'Integridad', hint: '' },
    ],
  },
  {
    title: 'Seguridad',
    items: [
      { id: 'usuarios', label: 'Usuarios', hint: '' },
      { id: 'perfiles', label: 'Perfiles', hint: '' },
    ],
  },
];

export const ALL_PERMISSION_IDS: OptionKey[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.id));
/** Solo pantallas (sin capacidades). */
export const SCREEN_PERMISSION_IDS = ALL_PERMISSION_IDS.filter((id) => !id.startsWith('cap.'));

/** Capacidades resumidas de un perfil para mostrar en la tabla. */
export function capabilitiesOf(opts: OptionKey[]): string[] {
  return [
    opts.includes('cap.solicitar') && 'Solicitar',
    opts.includes('cap.aprobar') && 'Aprobar',
    (opts.includes('historial') || opts.includes('integridad')) && 'Auditar',
  ].filter((c): c is string => !!c);
}
