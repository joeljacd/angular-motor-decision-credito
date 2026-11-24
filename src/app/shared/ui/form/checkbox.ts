import { ChangeDetectionStrategy, Component, forwardRef } from '@angular/core';
import { UiIcon } from '../icon/icon';
import { UI_CONTROL, UiControlBase } from './control-base';

/** <ui-checkbox formControlName="aceptar">Acepto los términos</ui-checkbox> */
@Component({
  selector: 'ui-checkbox',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CONTROL, useExisting: forwardRef(() => UiCheckbox) }],
  template: `
    <label [class.disabled]="disabled()" [class.invalid]="showError()">
      <input
        type="checkbox"
        [id]="id()"
        [checked]="!!value()"
        [disabled]="disabled()"
        (change)="commit($any($event.target).checked)"
        (blur)="touch()"
      />
      <span class="box" aria-hidden="true"><ui-icon name="check" [size]="13" [stroke]="2.5" /></span>
      <span class="text"><ng-content /></span>
    </label>
  `,
  styles: `
    :host { display: inline-block; }
    label { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; }
    label.disabled { opacity: 0.55; cursor: not-allowed; }
    input { position: absolute; opacity: 0; width: 0; height: 0; pointer-events: none; }
    .box {
      width: 17px; height: 17px; flex: none; display: grid; place-items: center;
      border: 1.5px solid color-mix(in srgb, var(--color-text) 40%, transparent);
      border-radius: var(--radius-sm); background: var(--color-surface); color: transparent;
    }
    label:hover .box { border-color: var(--color-accent); }
    label.invalid .box { border-color: var(--color-error); }
    input:checked + .box { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
    input:focus-visible + .box { outline: 2px solid var(--color-accent); outline-offset: 2px; }
  `,
})
export class UiCheckbox extends UiControlBase<boolean> {}
