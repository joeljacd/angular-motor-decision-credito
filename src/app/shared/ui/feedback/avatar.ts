import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Avatar de iniciales. <ui-avatar initials="MC" [size]="34" variant="filled" /> */
@Component({
  selector: 'ui-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.width.px]': 'size()', '[style.height.px]': 'size()', '[style.font-size.px]': 'size() * 0.42', '[class.outline]': 'variant() === "outline"' },
  template: `{{ initials() }}`,
  styles: `
    :host { display: grid; place-items: center; flex: none; background: var(--color-accent); color: #fff; border: 1px solid var(--color-accent); font-family: var(--font-heading); font-weight: var(--font-heading-weight); letter-spacing: 0.04em; border-radius: var(--radius-sm); }
    :host(.outline) { background: transparent; color: var(--color-accent-700); border-color: var(--color-divider); }
  `,
})
export class UiAvatar {
  readonly initials = input.required<string>();
  readonly size = input(34);
  readonly variant = input<'filled' | 'outline'>('filled');
}
