import { ChangeDetectionStrategy, Component, computed, contentChild, inject, input } from '@angular/core';
import { I18nService } from '@core/i18n';
import { UI_CONTROL } from './control-base';
import { validationMessage } from './validation-messages';

/**
 * Etiqueta + control + ayuda/error. Lee el estado del control proyectado.
 *   <ui-form-field label="Contraseña" hint="Mínimo 8 caracteres">
 *     <ui-input type="password" formControlName="clave" />
 *   </ui-form-field>
 */
@Component({
  selector: 'ui-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (label()) {
      <label class="label" [attr.for]="control()?.id()">
        {{ label() }}
        @if (control()?.isRequired()) {
          <span class="req" aria-hidden="true">*</span>
        }
      </label>
    }
    <ng-content />
    @if (control()?.showError()) {
      <div class="msg error" role="alert">{{ error() }}</div>
    } @else if (hint()) {
      <div class="msg">{{ hint() }}</div>
    }
  `,
  styles: `
    :host { display: block; min-width: 0; }
    .label { display: block; font-size: 12px; margin-bottom: 5px; color: color-mix(in srgb, var(--color-text) 70%, transparent); }
    .req { color: var(--color-error); margin-left: 2px; }
    .msg { font-size: 12px; margin-top: 5px; color: var(--color-neutral-700); }
    .msg.error { color: var(--color-error); }
  `,
})
export class UiFormField {
  readonly label = input('');
  readonly hint = input('');

  private readonly i18n = inject(I18nService);
  protected readonly control = contentChild(UI_CONTROL);
  protected readonly error = computed(() => validationMessage(this.control()?.errors() ?? null, this.i18n));
}
