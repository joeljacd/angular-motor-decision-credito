import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { UI_CONTROL, UiControlBase } from './control-base';
import { UiOption } from './option';

let seq = 0;

/** Grupo de radios. <ui-radio-group formControlName="tipo" [options]="opts" [vertical]="true" /> */
@Component({
  selector: 'ui-radio-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CONTROL, useExisting: forwardRef(() => UiRadioGroup) }],
  template: `
    <div class="group" role="radiogroup" [class.vertical]="vertical()">
      @for (opt of options(); track $index) {
        <label [class.disabled]="disabled() || opt.disabled">
          <input
            type="radio"
            [name]="name"
            [checked]="opt.value === value()"
            [disabled]="disabled() || opt.disabled"
            (change)="commit(opt.value)"
            (blur)="touch()"
          />
          <span class="dot" aria-hidden="true"></span>
          {{ opt.label }}
        </label>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .group { display: flex; flex-wrap: wrap; gap: 8px 18px; }
    .group.vertical { flex-direction: column; }
    label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
    label.disabled { opacity: 0.5; cursor: not-allowed; }
    input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
    .dot { width: 16px; height: 16px; flex: none; border-radius: 50%; border: 1.5px solid color-mix(in srgb, var(--color-text) 40%, transparent); background: var(--color-surface); }
    label:hover .dot { border-color: var(--color-accent); }
    input:checked + .dot { border-color: var(--color-accent); background: var(--color-accent); box-shadow: inset 0 0 0 4px var(--color-surface); }
    input:focus-visible + .dot { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  `,
})
export class UiRadioGroup<T = string> extends UiControlBase<T> {
  readonly options = input.required<UiOption<T>[]>();
  readonly vertical = input(false);
  protected readonly name = `ui-radio-${seq++}`;
}
