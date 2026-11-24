import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { StorageService } from '../storage/storage.service';
import { EN } from './en';
import { ES, I18nKey } from './es';

export type Lang = 'es' | 'en';
const DICTIONARIES: Record<Lang, Partial<Record<I18nKey, string>>> = { es: ES, en: EN };

/** i18n liviano basado en signals (sin dependencias). Clave faltante → español → la propia clave. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly storage = inject(StorageService);
  private readonly doc = inject(DOCUMENT);

  private readonly _lang = signal<Lang>(this.storage.local.get<Lang>('lang') === 'en' ? 'en' : 'es');
  readonly lang = this._lang.asReadonly();
  readonly isEnglish = computed(() => this._lang() === 'en');

  constructor() {
    effect(() => {
      this.doc.documentElement.lang = this._lang();
      this.storage.local.set('lang', this._lang());
    });
  }

  setLang(lang: Lang): void {
    this._lang.set(lang);
  }

  /** Traduce `key`. Lee el signal `lang`, por lo que se re-evalúa solo en plantillas. */
  t(key: I18nKey | (string & {}), params?: Record<string, string | number>): string {
    const dict = DICTIONARIES[this._lang()];
    const text = (dict as Record<string, string>)[key] ?? (ES as Record<string, string>)[key] ?? key;
    return params ? text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`)) : text;
  }
}
