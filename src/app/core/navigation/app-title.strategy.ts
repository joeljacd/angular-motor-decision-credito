import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';

/** Título de pestaña: "<Pantalla> · Banco Amazonas". `title` de la ruta puede ser una clave i18n. */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const page = this.buildTitle(snapshot);
    const app = this.i18n.t('app.bank');
    this.title.setTitle(page ? `${this.i18n.t(page)} · ${app}` : `${this.i18n.t('app.name')} · ${app}`);
  }
}
