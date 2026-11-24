import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiButton, UiFormField, UiModalFrame, UiTextarea } from '@shared/ui';

/** Pide el motivo del rechazo (obligatorio). Cierra con el comentario o sin valor si se cancela. */
@Component({
  selector: 'app-reject-dialog',
  imports: [FormsModule, UiModalFrame, UiFormField, UiTextarea, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal-frame [title]="'Rechazar ' + data.id">
      <ui-form-field label="Comentario (obligatorio)">
        <ui-textarea [rows]="4" placeholder="Motivo del rechazo" [ngModel]="comment()" (ngModelChange)="comment.set($event)" />
      </ui-form-field>
      @if (touched() && !comment().trim()) {
        <p class="err" role="alert">El comentario es obligatorio</p>
      }
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" (click)="confirm()">Rechazar</button>
      </ng-container>
    </ui-modal-frame>
  `,
  styles: `.err { margin: 6px 0 0; font-size: 12px; color: var(--color-error); }`,
})
export class RejectDialog {
  protected readonly ref = inject<DialogRef<string>>(DialogRef);
  protected readonly data = inject<{ id: string }>(DIALOG_DATA);
  protected readonly comment = signal('');
  protected readonly touched = signal(false);

  protected confirm(): void {
    this.touched.set(true);
    if (this.comment().trim()) this.ref.close(this.comment().trim());
  }
}
