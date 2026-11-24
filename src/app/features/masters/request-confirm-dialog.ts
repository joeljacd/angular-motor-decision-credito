import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiButton, UiModalFrame } from '@shared/ui';

export interface RequestConfirmData {
  title: string;
  body: string;
  /** Detalle en forma de lista (p. ej. dónde se usa una acción). */
  list?: string[];
  /** Si se indica, el diálogo es informativo (bloqueo) y solo ofrece cerrar. */
  blocked?: boolean;
  /** Id de una solicitud pendiente sobre el mismo elemento: impide crear otra. */
  duplicateId?: string;
  confirmLabel?: string;
}

/** Confirma la creación de una solicitud de cambio, o informa por qué no se puede pedir. */
@Component({
  selector: 'app-request-confirm-dialog',
  imports: [UiModalFrame, UiButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    p { margin: 0 0 12px; font-size: 14px; }
    ul { margin: 0 0 12px; padding: 8px 12px 8px 28px; max-height: 180px; overflow: auto; background: var(--color-neutral-200); font-size: 13px; }
    .note { font-size: 12px; padding: 8px 10px; background: var(--color-info-bg); color: var(--color-info); }
    .dup { font-size: 13px; padding: 8px 10px; margin-top: 8px; background: var(--color-warning-bg); color: var(--color-warning-fg); }
  `,
  template: `
    <ui-modal-frame [title]="data.title">
      <p>{{ data.body }}</p>
      @if (data.list?.length) {
        <ul>@for (item of data.list; track item) { <li>{{ item }}</li> }</ul>
      }
      @if (data.duplicateId) {
        <div class="dup">Ya hay una solicitud pendiente sobre este elemento: <a [routerLink]="['/solicitudes']" [queryParams]="{ id: data.duplicateId }" (click)="ref.close(false)">{{ data.duplicateId }}</a></div>
      }
      @if (!data.blocked) { <div class="note">Este cambio no rige hasta que otro aprobador lo apruebe.</div> }
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close(false)">{{ data.blocked ? 'Entendido' : 'Cancelar' }}</button>
        @if (!data.blocked) {
          <button ui-button variant="primary" [disabled]="!!data.duplicateId" (click)="ref.close(true)">{{ data.confirmLabel ?? 'Crear solicitud de cambio' }}</button>
        }
      </ng-container>
    </ui-modal-frame>
  `,
})
export class RequestConfirmDialog {
  protected readonly data = inject<RequestConfirmData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
}
