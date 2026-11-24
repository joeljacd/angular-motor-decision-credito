import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiBlueprint } from './blueprint.directive';

export type CardTone = 'default' | 'error' | 'warning' | 'success' | 'info';

/**
 * Contenedor con marco blueprint.
 *   <ui-card>…</ui-card>   <ui-card padding="none" tone="error">…</ui-card>
 */
@Component({
  selector: 'ui-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [UiBlueprint],
  host: { '[class]': '"pad-" + padding() + " tone-" + tone()' },
  template: `<ng-content />`,
  styles: `
    :host { display: block; background: var(--color-surface); }
    :host(.pad-sm) { padding: 12px 14px; }
    :host(.pad-md) { padding: 16px 18px; }
    :host(.pad-lg) { padding: 28px; }
    :host(.tone-error) { border-color: var(--color-error); background: var(--color-error-bg); }
    :host(.tone-warning) { border-color: var(--color-warning); background: var(--color-warning-bg); }
    :host(.tone-success) { border-color: var(--color-success); background: var(--color-success-bg); }
    :host(.tone-info) { border-color: var(--color-info); background: var(--color-info-bg); }
  `,
})
export class UiCard {
  readonly padding = input<'none' | 'sm' | 'md' | 'lg'>('none');
  readonly tone = input<CardTone>('default');
}
