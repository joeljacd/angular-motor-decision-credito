import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { UI_CONTROL, UiControlBase } from './control-base';

@Component({
  selector: 'ui-textarea',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CONTROL, useExisting: forwardRef(() => UiTextarea) }],
  styleUrl: './textarea.scss',
  template: `
    <div class="box" [class.invalid]="showError()" [class.disabled]="disabled()">
      <textarea
        [id]="id()"
        [rows]="rows()"
        [placeholder]="placeholder()"
        [attr.maxlength]="maxlength()"
        [disabled]="disabled()"
        [value]="value() ?? ''"
        [attr.aria-invalid]="showError() ? 'true' : null"
        (input)="commit($any($event.target).value)"
        (blur)="touch()"
      ></textarea>
    </div>
  `,
})
export class UiTextarea extends UiControlBase<string> {
  readonly rows = input(4);
  readonly placeholder = input('');
  readonly maxlength = input<number | null>(null);
}
