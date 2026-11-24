import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TPipe } from '@core/i18n';
import { UiCard, UiProgressBar } from '@shared/ui';

/** Pantalla de transición tras autenticar: muestra los pasos de preparación mientras se cargan datos. */
@Component({
  selector: 'app-boot-overlay',
  imports: [UiCard, UiProgressBar, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 24px; background: var(--color-bg); }
    ui-card { width: min(420px, 100%); box-shadow: var(--shadow-md); animation: ui-in 0.25s ease both; display: flex; flex-direction: column; gap: 18px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .logo { width: 40px; height: 40px; display: grid; place-items: center; background: var(--color-accent); color: #fff; font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 18px; }
    .titles { display: flex; flex-direction: column; line-height: 1.15; }
    .bank { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 18px; }
    .app { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--color-accent); }
    .title { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 24px; }
    .step { font-size: 13px; color: var(--color-neutral-700); }
  `,
  template: `
    <ui-card padding="lg">
      <div class="brand">
        <div class="logo">BA</div>
        <div class="titles"><span class="bank">{{ 'app.bank' | t }}</span><span class="app">{{ 'app.name' | t }}</span></div>
      </div>
      <div>
        <div class="title">{{ 'boot.title' | t }}</div>
        <div class="step" aria-live="polite">{{ step() }}</div>
      </div>
      <ui-progress-bar mode="fill" [height]="6" />
    </ui-card>
  `,
})
export class BootOverlay {
  readonly step = input.required<string>();
}
