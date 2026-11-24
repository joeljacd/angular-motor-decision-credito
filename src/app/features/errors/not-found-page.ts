import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TPipe } from '@core/i18n';
import { UiButton, UiCard } from '@shared/ui';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink, UiCard, UiButton, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ui-card { max-width: 580px; margin: 48px auto; display: flex; flex-direction: column; gap: 12px; }
    .code { align-self: flex-start; font-family: var(--font-mono); font-size: 12px; padding: 2px 8px; background: var(--color-neutral-200); border: 1px solid var(--color-divider); }
    h2 { margin: 0; }
    p { margin: 0; color: var(--color-neutral-700); }
  `,
  template: `
    <ui-card padding="lg">
      <span class="code">404</span>
      <h2>{{ 'notfound.title' | t }}</h2>
      <p>{{ 'notfound.body' | t }}</p>
      <a ui-button variant="primary" routerLink="/" style="align-self: flex-start">{{ 'forbidden.home' | t }}</a>
    </ui-card>
  `,
})
export class NotFoundPage {}
