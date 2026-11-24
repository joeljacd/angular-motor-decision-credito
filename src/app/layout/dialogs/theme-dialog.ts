import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogRef } from '@angular/cdk/dialog';
import { I18nService, TPipe } from '@core/i18n';
import { ThemeMode, ThemePreset, ThemeService } from '@core/theme';
import { UiButton, UiFormField, UiModalFrame, UiSegmented } from '@shared/ui';

/** Panel de apariencia: modo, tema (preset) y color de acento. Todo es reactivo y se guarda por usuario/navegador. */
@Component({
  selector: 'app-theme-dialog',
  imports: [FormsModule, UiModalFrame, UiButton, UiSegmented, UiFormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .stack { display: flex; flex-direction: column; gap: 18px; }
    .presets { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
    .preset { text-align: left; padding: 10px 12px; cursor: pointer; background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-divider); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 6px; }
    .preset:hover { border-color: var(--color-accent-300); }
    .preset.active { border-color: var(--color-accent); box-shadow: 0 0 0 1px var(--color-accent); }
    .swatches { display: flex; gap: 0; height: 22px; border: 1px solid var(--color-divider); }
    .swatches span { flex: 1; }
    .p-name { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 17px; line-height: 1; }
    .p-desc { font-size: 12px; color: var(--color-neutral-700); }
    .accent { display: flex; align-items: center; gap: 10px; }
    .accent input[type='color'] { width: 44px; height: 36px; padding: 2px; border: 1px solid var(--color-divider); background: var(--color-surface); cursor: pointer; }
    .accent code { font-family: var(--font-mono); font-size: 13px; }
  `,
  template: `
    <ui-modal-frame [title]="i18n.t('theme.title')" [closable]="true">
      <div class="stack">
        <ui-form-field [label]="i18n.t('theme.mode')">
          <ui-segmented [options]="modes()" [ngModel]="theme.mode()" (ngModelChange)="theme.setMode($event)" />
        </ui-form-field>

        <ui-form-field [label]="i18n.t('theme.preset')">
          <div class="presets" role="radiogroup">
            @for (p of theme.presets; track p.id) {
              <button type="button" role="radio" class="preset" [class.active]="p.id === theme.presetId()" [attr.aria-checked]="p.id === theme.presetId()" (click)="theme.setPreset(p.id)">
                <span class="swatches" aria-hidden="true">
                  <span [style.background]="swatch(p, '--color-accent')"></span>
                  <span [style.background]="swatch(p, '--color-hero')"></span>
                  <span [style.background]="swatch(p, '--color-bg')"></span>
                  <span [style.background]="swatch(p, '--color-surface')"></span>
                </span>
                <span class="p-name">{{ p.label }}</span>
                @if (p.description) { <span class="p-desc">{{ p.description }}</span> }
              </button>
            }
          </div>
        </ui-form-field>

        <ui-form-field [label]="i18n.t('theme.accent')" [hint]="i18n.t('theme.accent.help')">
          <div class="accent">
            <input type="color" [value]="theme.accent() ?? currentAccent()" [attr.aria-label]="i18n.t('theme.accent')" (input)="theme.setAccent($any($event.target).value)" />
            <code>{{ theme.accent() ?? currentAccent() }}</code>
            @if (theme.accent()) {
              <button ui-button size="sm" variant="ghost" (click)="theme.setAccent(null)">{{ i18n.t('theme.accent.reset') }}</button>
            }
          </div>
        </ui-form-field>
      </div>
      <ng-container uiModalActions>
        <button ui-button (click)="theme.reset()">{{ i18n.t('theme.reset') }}</button>
        <button ui-button variant="primary" (click)="ref.close()">{{ i18n.t('common.done') }}</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class ThemeDialog {
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);

  protected readonly modes = computed<{ value: ThemeMode; label: string }[]>(() => [
    { value: 'light', label: this.i18n.t('theme.mode.light') },
    { value: 'dark', label: this.i18n.t('theme.mode.dark') },
    { value: 'system', label: this.i18n.t('theme.mode.system') },
  ]);

  protected readonly currentAccent = computed(() => this.theme.preset()[this.theme.resolvedMode()]['--color-accent']);

  protected swatch(preset: ThemePreset, token: `--${string}`): string {
    return preset[this.theme.resolvedMode()][token];
  }
}
