import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { UiIcon } from '../icon/icon';
import { IconName } from '../icon/icons';

export type AlertTone = 'error' | 'warning' | 'info' | 'success';
const DEFAULT_ICON: Record<AlertTone, IconName> = {
  error: 'alert-triangle',
  warning: 'alert-triangle',
  info: 'info',
  success: 'check-circle',
};

/**
 * Aviso en línea o banner de ancho completo.
 *   <ui-alert tone="info">El usuario se autentica con Active Directory.</ui-alert>
 *   <ui-alert tone="error" solid banner> … <button uiAlertActions ui-button>Ver</button></ui-alert>
 */
@Component({
  selector: 'ui-alert',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"tone-" + tone()', '[class.solid]': 'solid()', '[class.banner]': 'banner()', role: 'alert' },
  template: `
    <ui-icon [name]="glyph()" [size]="18" />
    <div class="content"><ng-content /></div>
    <div class="actions"><ng-content select="[uiAlertActions]" /></div>
  `,
  styles: `
    :host { display: flex; gap: 12px; align-items: flex-start; padding: 10px 14px; font-size: 13px; line-height: 1.4; background: var(--a-bg); color: var(--a-fg); border: 1px solid transparent; }
    :host(.banner) { padding: 10px 24px; border-width: 0 0 1px; }
    :host(.tone-error) { --a-bg: var(--color-error-bg); --a-fg: var(--color-error); }
    :host(.tone-warning) { --a-bg: var(--color-warning-bg); --a-fg: var(--color-warning-fg); border-color: var(--color-warning); }
    :host(.tone-info) { --a-bg: var(--color-info-bg); --a-fg: var(--color-info); }
    :host(.tone-success) { --a-bg: var(--color-success-bg); --a-fg: var(--color-success); }
    :host(.solid.tone-error) { --a-bg: var(--color-error); --a-fg: #fff; }
    :host(.solid.tone-warning) { --a-bg: var(--color-warning); --a-fg: #1a1200; }
    ui-icon { margin-top: 1px; }
    .content { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .actions { flex: none; }
    .actions:empty { display: none; }
  `,
})
export class UiAlert {
  readonly tone = input<AlertTone>('info');
  readonly icon = input<IconName | null>(null);
  readonly solid = input(false);
  readonly banner = input(false);
  protected readonly glyph = computed(() => this.icon() ?? DEFAULT_ICON[this.tone()]);
}
