import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { UI_CONTROL, UiControlBase } from './control-base';
import { UiOption } from './option';

let seq = 0;

/**
 * Control segmentado (una opción activa). Ej.: Activo | Inactivo, ES | EN.
 *   <ui-segmented formControlName="estado" [options]="[{value:'Activo',label:'Activo'},{value:'Inactivo',label:'Inactivo'}]" />
 */
@Component({
  selector: 'ui-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CONTROL, useExisting: forwardRef(() => UiSegmented) }],
  host: { '[class.fill]': 'fill()' },
  template: `
    <div class="seg" role="radiogroup" [class.fill]="fill()" [class.sm]="size() === 'sm'">
      @for (opt of options(); track $index) {
        <label class="opt" [class.selected]="opt.value === value()" [class.disabled]="disabled() || opt.disabled">
          <input
            type="radio"
            [name]="name"
            [checked]="opt.value === value()"
            [disabled]="disabled() || opt.disabled"
            (change)="commit(opt.value)"
            (blur)="touch()"
          />
          {{ opt.label }}
        </label>
      }
    </div>
  `,
  styles: `
    :host { display: inline-block; }
    :host(.fill) { display: block; }
    .seg { display: inline-flex; overflow: hidden; border: 1px solid var(--color-divider); border-radius: var(--radius-md); background: var(--color-surface); }
    .seg.fill { display: flex; }
    .opt {
      flex: 1 1 auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      padding: 7px 12px; font-size: 13px; cursor: pointer; user-select: none;
    }
    .sm .opt { padding: 0 10px; height: 32px; font-size: 12px; font-weight: 600; }
    .opt + .opt { border-left: 1px solid var(--color-divider); }
    .opt input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
    .opt.selected { background: var(--color-accent); color: #fff; }
    .opt:not(.selected):not(.disabled):hover { background: color-mix(in srgb, var(--color-text) 7%, transparent); }
    .opt.disabled { opacity: 0.5; cursor: not-allowed; }
    .opt:has(input:focus-visible) { outline: 2px solid var(--color-accent); outline-offset: -2px; }
  `,
})
export class UiSegmented<T = string> extends UiControlBase<T> {
  readonly options = input.required<UiOption<T>[]>();
  readonly fill = input(false);
  readonly size = input<'md' | 'sm'>('md');
  protected readonly name = `ui-seg-${seq++}`;
}
