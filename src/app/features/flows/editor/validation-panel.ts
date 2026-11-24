import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { UiCard } from '@shared/ui';
import { ValidationItem } from '../flow-validation';

/** Panel "Validación": errores (bloquean el envío) y avisos; cada ítem lleva al lugar del problema. */
@Component({
  selector: 'app-validation-panel',
  imports: [UiCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './validation-panel.scss',
  template: `
    <ui-card padding="md">
      <div class="head">
        <h4>Validación</h4>
        <span class="count" [class.bad]="errors() > 0">{{ errors() }} errores · {{ warnings() }} avisos</span>
      </div>
      @if (!items().length) {
        <p class="ok">Sin observaciones. El borrador se puede enviar a revisión.</p>
      } @else {
        <ul>
          @for (i of items(); track $index) {
            <li>
              <button type="button" [class]="i.level" (click)="picked.emit(i)">
                <span class="lvl">{{ i.level === 'error' ? 'Error' : 'Aviso' }}</span>
                <span class="msg">{{ i.message }}</span>
                <span class="loc">{{ i.location }}</span>
              </button>
            </li>
          }
        </ul>
      }
    </ui-card>
  `,
})
export class ValidationPanel {
  readonly items = input.required<ValidationItem[]>();
  readonly picked = output<ValidationItem>();
  protected readonly errors = computed(() => this.items().filter((i) => i.level === 'error').length);
  protected readonly warnings = computed(() => this.items().length - this.errors());
}
