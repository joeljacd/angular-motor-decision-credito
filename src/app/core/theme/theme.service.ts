import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, InjectionToken, signal } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import { deriveAccentTokens, HEX_COLOR } from './accent';
import { ResolvedMode, ThemeConfig, ThemeMode, ThemePreset, ThemeSettings, ThemeTokens } from './theme.models';
import { THEME_PRESETS } from './theme.presets';

export const THEME_CONFIG = new InjectionToken<ThemeConfig>('THEME_CONFIG', {
  providedIn: 'root',
  factory: () => ({ presets: THEME_PRESETS, defaultPresetId: 'amazonas', defaultMode: 'light' }),
});

const STORAGE_KEY = 'theme';

/**
 * Temas configurables en runtime: modo (claro/oscuro/sistema) × preset × acento personalizado.
 * Aplica los tokens como custom properties en <html>; los componentes solo usan var(--color-*).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = inject(StorageService);
  private readonly config = inject(THEME_CONFIG);

  readonly presets = this.config.presets;

  private readonly systemDark = signal(this.mediaQuery()?.matches ?? false);
  private readonly settings = signal<ThemeSettings>(this.load());

  readonly mode = computed(() => this.settings().mode);
  readonly presetId = computed(() => this.settings().presetId);
  readonly accent = computed(() => this.settings().accent);
  readonly resolvedMode = computed<ResolvedMode>(() => {
    const m = this.mode();
    return m === 'system' ? (this.systemDark() ? 'dark' : 'light') : m;
  });
  readonly isDark = computed(() => this.resolvedMode() === 'dark');
  readonly preset = computed<ThemePreset>(
    () => this.presets.find((p) => p.id === this.presetId()) ?? this.presets[0],
  );

  private applied: string[] = [];

  constructor() {
    const mq = this.mediaQuery();
    mq?.addEventListener('change', (e) => this.systemDark.set(e.matches));

    this.sync(); // aplica de inmediato (antes del primer render) y luego reacciona a cambios
    effect(() => this.sync());
  }

  setMode(mode: ThemeMode): void {
    this.settings.update((s) => ({ ...s, mode }));
  }

  toggleMode(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  setPreset(presetId: string): void {
    if (this.presets.some((p) => p.id === presetId)) {
      this.settings.update((s) => ({ ...s, presetId }));
    }
  }

  setAccent(hex: string | null): void {
    const accent = hex && HEX_COLOR.test(hex) ? hex : null;
    this.settings.update((s) => ({ ...s, accent }));
  }

  reset(): void {
    this.settings.set(this.defaults());
  }

  // ── internals ─────────────────────────────────────────────────────────
  private sync(): void {
    const mode = this.resolvedMode();
    this.apply(this.buildTokens(this.preset(), mode, this.accent()), mode);
    this.storage.local.set(STORAGE_KEY, this.settings());
  }

  private buildTokens(preset: ThemePreset, mode: ResolvedMode, accent: string | null): ThemeTokens {
    return {
      ...preset.shared,
      ...preset[mode],
      ...(accent ? deriveAccentTokens(accent, mode) : {}),
    };
  }

  private apply(tokens: ThemeTokens, mode: ResolvedMode): void {
    const root = this.doc.documentElement;
    for (const name of this.applied) root.style.removeProperty(name);
    for (const [name, value] of Object.entries(tokens)) root.style.setProperty(name, value);
    this.applied = Object.keys(tokens);
    root.style.colorScheme = mode;
    root.dataset['theme'] = mode;
  }

  private defaults(): ThemeSettings {
    return { mode: this.config.defaultMode, presetId: this.config.defaultPresetId, accent: null };
  }

  private load(): ThemeSettings {
    const saved = this.storage.local.get<Partial<ThemeSettings>>(STORAGE_KEY);
    const d = this.defaults();
    const mode = (['light', 'dark', 'system'] as const).find((m) => m === saved?.mode) ?? d.mode;
    const presetId = this.presets.some((p) => p.id === saved?.presetId) ? saved!.presetId! : d.presetId;
    const accent = saved?.accent && HEX_COLOR.test(saved.accent) ? saved.accent : null;
    return { mode, presetId, accent };
  }

  private mediaQuery(): MediaQueryList | null {
    return typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
  }
}
