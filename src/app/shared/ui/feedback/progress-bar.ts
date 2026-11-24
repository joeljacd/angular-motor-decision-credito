import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Barra de progreso: indeterminada (navegación), animada de 0 a 100 % (arranque) o determinada (`value` en %). */
@Component({
  selector: 'ui-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'progressbar', '[attr.aria-busy]': 'true', '[attr.aria-valuenow]': 'mode() === "determinate" ? value() : null', '[style.height.px]': 'height()' },
  template: `<div class="bar" [class.fill]="mode() === 'fill'" [class.determinate]="mode() === 'determinate'" [style.width.%]="mode() === 'determinate' ? value() : null"></div>`,
  styles: `
    :host { display: block; position: relative; overflow: hidden; background: var(--color-accent-100); }
    .bar { position: absolute; top: 0; bottom: 0; background: var(--color-accent); width: 35%; animation: ui-slide 0.9s ease-in-out infinite; }
    .bar.determinate { left: 0; animation: none; transition: width 0.1s linear; }
    .bar.fill { left: 0; animation: ui-fill 1.6s ease-out forwards; }
  `,
})
export class UiProgressBar {
  readonly mode = input<'indeterminate' | 'fill' | 'determinate'>('indeterminate');
  /** Porcentaje (0–100) cuando `mode` es 'determinate'. */
  readonly value = input(0);
  readonly height = input(3);
}
