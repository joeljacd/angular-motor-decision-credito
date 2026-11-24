import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { UI_CONTROL, UiControlBase } from './control-base';

/**
 * Campo de texto.
 *   <ui-input formControlName="usuario" placeholder="usuario" prefix="BAMAZONAS\" />
 *   <ui-input type="password" autocomplete="current-password" formControlName="clave" />
 * Tipos: text | password | email | number | search | tel
 */
@Component({
  selector: 'ui-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CONTROL, useExisting: forwardRef(() => UiInput) }],
  styleUrl: './input.scss',
  template: `
    <div class="box" [class.invalid]="showError()" [class.disabled]="disabled()">
      @if (prefix()) {
        <span class="affix start">{{ prefix() }}</span>
      }
      <input
        [id]="id()"
        [type]="type()"
        [class.mono]="mono()"
        [placeholder]="placeholder()"
        [attr.autocomplete]="autocomplete() || null"
        [attr.inputmode]="inputmode() || null"
        [attr.maxlength]="maxlength()"
        [readOnly]="readonly()"
        [disabled]="disabled()"
        [value]="value() ?? ''"
        [attr.aria-invalid]="showError() ? 'true' : null"
        (input)="onInput($event)"
        (blur)="touch()"
      />
      @if (suffix()) {
        <span class="affix end">{{ suffix() }}</span>
      }
    </div>
  `,
})
export class UiInput extends UiControlBase<string | number> {
  readonly type = input<'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'date'>('text');
  readonly placeholder = input('');
  readonly autocomplete = input('');
  readonly inputmode = input('');
  readonly maxlength = input<number | null>(null);
  readonly readonly = input(false);
  /** Fuente monoespaciada (códigos, usuarios de red). */
  readonly mono = input(false);
  /** Texto fijo a la izquierda / derecha dentro del campo (p. ej. dominio, unidad). */
  readonly prefix = input('');
  readonly suffix = input('');

  protected onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.commit(this.type() === 'number' ? (raw === '' ? null : Number(raw)) : raw);
  }
}
