import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '@core/i18n';
import { UiButton } from '../button/button';
import { UiModalFrame } from './modal-frame';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'danger' pinta el botón de confirmación en rojo. */
  tone?: 'primary' | 'danger';
}

@Component({
  selector: 'ui-confirm-dialog',
  imports: [UiModalFrame, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal-frame [title]="data.title">
      <p class="msg">{{ data.message }}</p>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close(false)">{{ data.cancelLabel ?? i18n.t('common.back') }}</button>
        <button ui-button [variant]="data.tone === 'danger' ? 'danger' : 'primary'" (click)="ref.close(true)">
          {{ data.confirmLabel ?? i18n.t('common.accept') }}
        </button>
      </ng-container>
    </ui-modal-frame>
  `,
  styles: `.msg { margin: 0; opacity: 0.85; }`,
})
export class ConfirmDialog {
  protected readonly data = inject<ConfirmOptions>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  protected readonly i18n = inject(I18nService);
}
