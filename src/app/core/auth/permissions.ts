/**
 * Opciones de permiso. Cada pantalla del portal tiene una clave; el perfil del usuario
 * lista las claves habilitadas (`Profile.opts`). Las `cap.*` son capacidades transversales.
 */
export const MASTER_KEYS = ['m-channels', 'm-actions', 'm-parameters', 'm-catalogs', 'm-roles'] as const;

/** Orden de las pantallas (define también cuál es "la primera permitida"). */
export const SCREEN_KEYS = [
  'home',
  'flows',
  'requests',
  ...MASTER_KEYS,
  'history',
  'integrity',
  'users',
  'profiles',
] as const;

export const CAPABILITY_KEYS = ['cap.request', 'cap.approve'] as const;

export type ScreenKey = (typeof SCREEN_KEYS)[number];
export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];
export type OptionKey = ScreenKey | CapabilityKey;

export const ALL_OPTIONS: readonly OptionKey[] = [...CAPABILITY_KEYS, ...SCREEN_KEYS];

export function isScreenKey(value: string): value is ScreenKey {
  return (SCREEN_KEYS as readonly string[]).includes(value);
}
