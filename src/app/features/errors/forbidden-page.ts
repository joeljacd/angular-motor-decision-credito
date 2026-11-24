import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';
import { I18nService, TPipe } from '@core/i18n';
import { navPathFor } from '../../layout/nav/nav.config';
import { UiButton, UiCard } from '@shared/ui';

/** 403 de pantalla completa (guard de permisos). */
@Component({
  selector: 'app-forbidden-page',
  imports: [RouterLink, UiCard, UiButton, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ui-card { max-width: 580px; margin: 48px auto; display: flex; flex-direction: column; gap: 12px; animation: ui-in 0.2s ease both; }
    .code { align-self: flex-start; font-family: var(--font-mono); font-size: 12px; padding: 2px 8px; background: var(--color-error-bg); color: var(--color-error); border: 1px solid var(--color-error); }
    h2 { margin: 0; }
    p { margin: 0; font-size: 14px; color: var(--color-neutral-700); }
  `,
  template: `
    <ui-card padding="lg">
      <span class="code">403</span>
      <h2>{{ 'forbidden.title' | t }}</h2>
      <p>{{ 'forbidden.body' | t: { profile: auth.me()?.perfil ?? '', note: note() } }}</p>
      @if (home()) {
        <a ui-button variant="primary" [routerLink]="home()" style="align-self: flex-start">{{ 'forbidden.home' | t }}</a>
      }
    </ui-card>
  `,
})
export class ForbiddenPage {
  protected readonly auth = inject(AuthService);
  private readonly i18n = inject(I18nService);

  protected readonly home = computed(() => {
    const first = this.auth.firstAllowedScreen();
    return first ? navPathFor(first) : null;
  });
  protected readonly note = computed(() => {
    const me = this.auth.me();
    if (!me) return '';
    return !me.userActive ? this.i18n.t('forbidden.userInactive') : !me.perfilActivo ? this.i18n.t('forbidden.profileInactive') : '';
  });
}
