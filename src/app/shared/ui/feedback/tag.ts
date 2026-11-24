import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tone } from '@core/util/tone';

/** Etiqueta de estado/tipo. <ui-tag tone="success" dot>Aprobada</ui-tag> */
@Component({
  selector: 'ui-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': '"tone-" + tone()', '[class.sm]': 'size() === "sm"' },
  template: `
    @if (dot()) {
      <span class="dot" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styles: `
    :host { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; padding: 2px 8px; white-space: nowrap; border-radius: calc(var(--radius-md) * 0.75); background: var(--tag-bg); color: var(--tag-fg); }
    :host(.sm) { font-size: 11px; padding: 1px 7px; }
    .dot { width: 6px; height: 6px; background: currentColor; }
    :host(.tone-accent) { --tag-bg: var(--color-accent-100); --tag-fg: var(--color-accent-800); }
    :host(.tone-neutral) { --tag-bg: var(--color-neutral-200); --tag-fg: var(--color-neutral-800); }
    :host(.tone-success) { --tag-bg: var(--color-success-bg); --tag-fg: var(--color-success); }
    :host(.tone-warning) { --tag-bg: var(--color-warning-bg); --tag-fg: var(--color-warning-fg); }
    :host(.tone-error) { --tag-bg: var(--color-error-bg); --tag-fg: var(--color-error); }
    :host(.tone-orange) { --tag-bg: var(--color-orange-bg); --tag-fg: var(--color-orange); }
    :host(.tone-info) { --tag-bg: var(--color-info-bg); --tag-fg: var(--color-info); }
  `,
})
export class UiTag {
  readonly tone = input<Tone>('neutral');
  readonly dot = input(false);
  readonly size = input<'md' | 'sm'>('md');
}
