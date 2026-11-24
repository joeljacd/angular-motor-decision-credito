import { ChangeDetectionStrategy, Component, computed, forwardRef, input } from '@angular/core';
import { UiIcon } from '../icon/icon';
import { UI_CONTROL, UiControlBase } from './control-base';
import { UiOption } from './option';

/**
 * Lista desplegable (select nativo estilizado: accesible y buen UX en móvil). Conserva el tipo del valor.
 *   <ui-select formControlName="perfil" [options]="perfiles()" placeholder="Selecciona un perfil" />
 *   // options: { value: 1, label: 'Administrador' }[]
 */
@Component({
  selector: 'ui-select',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: UI_CONTROL, useExisting: forwardRef(() => UiSelect) }],
  styleUrl: './select.scss',
  template: `
    <div class="box" [class.invalid]="showError()" [class.disabled]="disabled()" [class.compact]="compact()">
      <select
        [id]="id()"
        [disabled]="disabled()"
        [attr.aria-invalid]="showError() ? 'true' : null"
        (change)="onSelect($event)"
        (blur)="touch()"
      >
        @if (placeholder() !== null) {
          <option value="-1" [selected]="selectedIndex() < 0">{{ placeholder() }}</option>
        }
        @for (opt of options(); track $index) {
          <option [value]="$index" [selected]="$index === selectedIndex()" [disabled]="opt.disabled">
            {{ opt.label }}
          </option>
        }
      </select>
      <ui-icon class="chev" name="chevron-down" [size]="16" />
    </div>
  `,
})
export class UiSelect<T = unknown> extends UiControlBase<T> {
  readonly options = input.required<UiOption<T>[]>();
  /** Texto de la opción vacía. `null` = sin opción vacía. */
  readonly placeholder = input<string | null>(null);
  readonly compact = input(false);

  protected readonly selectedIndex = computed(() => this.options().findIndex((o) => o.value === this.value()));

  protected onSelect(event: Event): void {
    const index = Number((event.target as HTMLSelectElement).value);
    this.commit(index >= 0 ? this.options()[index].value : null);
  }
}
