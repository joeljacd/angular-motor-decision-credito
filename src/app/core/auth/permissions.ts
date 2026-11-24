/**
 * Opciones de permiso. Cada pantalla del portal tiene una clave; el perfil del usuario
 * lista las claves habilitadas (`Profile.opts`). Las `cap.*` son capacidades transversales.
 */
export const MASTER_KEYS = ['m-canales', 'm-acciones', 'm-parametros', 'm-catalogos', 'm-roles'] as const;

/** Orden de las pantallas (define también cuál es "la primera permitida"). */
export const SCREEN_KEYS = [
  'inicio',
  'flujos',
  'solicitudes',
  ...MASTER_KEYS,
  'historial',
  'integridad',
  'usuarios',
  'perfiles',
] as const;

export const CAPABILITY_KEYS = ['cap.solicitar', 'cap.aprobar'] as const;

export type ScreenKey = (typeof SCREEN_KEYS)[number];
export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];
export type OptionKey = ScreenKey | CapabilityKey;

export const ALL_OPTIONS: readonly OptionKey[] = [...CAPABILITY_KEYS, ...SCREEN_KEYS];

export function isScreenKey(value: string): value is ScreenKey {
  return (SCREEN_KEYS as readonly string[]).includes(value);
}
