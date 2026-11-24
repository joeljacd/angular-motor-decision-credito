import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nKey } from './es';
import { I18nService } from './i18n.service';

/** {{ 'nav.inicio' | t }}  ·  {{ 'dash.hello' | t: { name: 'Ana' } }} */
@Pipe({ name: 't', pure: false })
export class TPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(key: I18nKey | (string & {}), params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}
