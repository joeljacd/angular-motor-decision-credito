import { ResolvedMode, ThemeTokens } from './theme.models';

/**
 * Deriva la rampa de acento (100…900) desde un único color usando color-mix() — sin cálculo de color en JS.
 * Es el mecanismo de "color de acento personalizado".
 */
export function deriveAccentTokens(base: string, mode: ResolvedMode): ThemeTokens {
  const mix = (pct: number, into: string) => `color-mix(in srgb, ${base} ${pct}%, ${into})`;
  const toward = (pct: number, into: string) => `color-mix(in srgb, ${into} ${pct}%, ${base})`;

  if (mode === 'light') {
    return {
      '--color-accent': base,
      '--color-accent-100': mix(9, '#fff'),
      '--color-accent-200': mix(18, '#fff'),
      '--color-accent-300': mix(35, '#fff'),
      '--color-accent-400': mix(60, '#fff'),
      '--color-accent-500': mix(82, '#fff'),
      '--color-accent-600': toward(12, '#000'),
      '--color-accent-700': toward(12, '#000'),
      '--color-accent-800': toward(42, '#000'),
      '--color-accent-900': toward(62, '#000'),
      '--color-hero': toward(55, '#000'),
      '--color-hero-muted': mix(35, '#fff'),
      '--color-hero-soft': mix(60, '#fff'),
    };
  }
  return {
    '--color-accent': base,
    '--color-accent-100': mix(16, '#000'),
    '--color-accent-200': mix(26, '#000'),
    '--color-accent-300': mix(40, '#000'),
    '--color-accent-400': mix(62, '#000'),
    '--color-accent-500': mix(82, '#000'),
    '--color-accent-600': base,
    '--color-accent-700': toward(35, '#fff'),
    '--color-accent-800': toward(65, '#fff'),
    '--color-accent-900': toward(80, '#fff'),
    '--color-hero': mix(22, '#000'),
    '--color-hero-muted': toward(65, '#fff'),
    '--color-hero-soft': toward(35, '#fff'),
  };
}

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
