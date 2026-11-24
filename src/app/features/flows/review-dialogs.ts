import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PublishScenario } from '@core/api/workflow.api';
import { UiAlert, UiButton, UiFormField, UiModalFrame, UiOption, UiRadioGroup, UiTextarea } from '@shared/ui';

const SCENARIOS: UiOption<PublishScenario>[] = [
  { value: 'ok', label: 'Publicación exitosa' },
  { value: 'conflict', label: 'Conflicto: la versión vigente cambió' },
  { value: 'error', label: 'Error: el motor no pudo cargarla' },
];

/** Confirma la aprobación y publicación. El selector de escenario existe solo con mocks, para probar los errores. */
@Component({
  selector: 'app-approve-dialog',
  imports: [FormsModule, UiModalFrame, UiButton, UiRadioGroup, UiAlert],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `p { margin: 0 0 12px; font-size: 14px; } .sim { margin-top: 14px; }`,
  template: `
    <ui-modal-frame kicker="Revisión" title="Aprobar y publicar">
      <p>Al aprobar, el borrador pasa a ser la versión vigente y la anterior se retira. Esta acción queda firmada y registrada en el historial.</p>
      @if (data.simulate) {
        <ui-alert tone="info" class="sim">Solo con datos de prueba: elige qué responde el servidor.</ui-alert>
        <ui-radio-group [options]="scenarios" [ngModel]="scenario()" (ngModelChange)="scenario.set($event)" />
      }
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" (click)="ref.close(scenario())">Aprobar y publicar</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class ApproveDialog {
  protected readonly data = inject<{ simulate: boolean }>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<PublishScenario>>(DialogRef);
  protected readonly scenarios = SCENARIOS;
  protected readonly scenario = signal<PublishScenario>('ok');
}

/** Devuelve el borrador al editor con un comentario obligatorio. */
@Component({
  selector: 'app-return-dialog',
  imports: [FormsModule, UiModalFrame, UiButton, UiFormField, UiTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `.err { margin: 4px 0 0; font-size: 12px; color: var(--color-error); }`,
  template: `
    <ui-modal-frame kicker="Revisión" title="Devolver al editor">
      <ui-form-field label="Comentario para quien editó">
        <ui-textarea [rows]="4" [ngModel]="comment()" (ngModelChange)="comment.set($event)" />
        @if (touched() && !valid()) { <p class="err" role="alert">El comentario es obligatorio</p> }
      </ui-form-field>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" (click)="confirm()">Devolver</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class ReturnDialog {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly comment = signal('');
  protected readonly touched = signal(false);
  protected readonly valid = computed(() => this.comment().trim().length > 0);

  protected confirm(): void {
    this.touched.set(true);
    if (this.valid()) this.ref.close(this.comment().trim());
  }
}
