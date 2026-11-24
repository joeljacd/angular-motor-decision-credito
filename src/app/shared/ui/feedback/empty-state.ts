import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIcon } from '../icon/icon';
import { IconName } from '../icon/icons';

/** Estado vacío. <ui-empty-state icon="check-circle" title="…" description="…"><button ui-button>Acción</button></ui-empty-state> */
@Component({
  selector: 'ui-empty-state',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (icon()) {
      <ui-icon [name]="icon()!" [size]="32" class="icon" />
    }
    <span class="title">{{ title() }}</span>
    @if (description()) {
      <span class="desc">{{ description() }}</span>
    }
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; padding: 56px 20px; }
    .icon { color: var(--color-success); }
    .title { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 22px; }
    .description { font-size: 14px; color: var(--color-neutral-700); }
    .actions { margin-top: 6px; }
    .actions:empty { display: none; }
  `,
})
export class UiEmptyState {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input<IconName | null>(null);
}
