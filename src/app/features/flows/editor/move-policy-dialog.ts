import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { UiButton, UiFormField, UiModalFrame, UiOption, UiSelect } from '@shared/ui';

export interface MovePolicyData {
  policy: string;
  current: string;
  categories: UiOption<string>[];
}

/** Diálogo para mover una política a otra categoría (queda al final de la destino). */
@Component({
  selector: 'app-move-policy-dialog',
  imports: [FormsModule, UiModalFrame, UiButton, UiFormField, UiSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal-frame kicker="Política" [title]="'Mover ' + data.policy">
      <ui-form-field label="Categoría destino"><ui-select [options]="data.categories" [(ngModel)]="target" /></ui-form-field>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" [disabled]="target() === data.current" (click)="ref.close(target())">Mover</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class MovePolicyDialog {
  protected readonly data = inject<MovePolicyData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly target = signal(this.data.current);
}
