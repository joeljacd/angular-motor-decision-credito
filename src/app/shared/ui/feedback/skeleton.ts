import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Placeholder con shimmer. <ui-skeleton width="40%" height="12px" /> */
@Component({
  selector: 'ui-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.width]': 'width()', '[style.height]': 'height()', 'aria-hidden': 'true' },
  template: ``,
  styles: `
    :host {
      display: block;
      background: linear-gradient(90deg, var(--color-neutral-200), var(--color-neutral-100), var(--color-neutral-200));
      background-size: 200% 100%;
      animation: ui-shimmer 1.2s linear infinite;
    }
  `,
})
export class UiSkeleton {
  readonly width = input('100%');
  readonly height = input('12px');
}
