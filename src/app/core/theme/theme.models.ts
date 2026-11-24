export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedMode = 'light' | 'dark';

/** Mapa de custom properties CSS: { '--color-bg': '#fff', ... } */
export type ThemeTokens = Record<`--${string}`, string>;

export interface ThemePreset {
  id: string;
  label: string;
  description?: string;
  /** Tokens comunes a claro y oscuro (radios, tipografía, marcas blueprint…). */
  shared?: ThemeTokens;
  light: ThemeTokens;
  dark: ThemeTokens;
}

export interface ThemeSettings {
  mode: ThemeMode;
  presetId: string;
  /** Color de acento personalizado (#rrggbb). null = el del preset. */
  accent: string | null;
}

export interface ThemeConfig {
  presets: ThemePreset[];
  defaultPresetId: string;
  defaultMode: ThemeMode;
}
