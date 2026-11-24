import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '@core/i18n';
import { ToastService, UiButton, UiModalFrame } from '../ui';

/** 409: otro usuario modificó el elemento. Recargar = re-navegar a la ruta actual (re-ejecuta los loaders). */
@Component({
  selector: 'app-conflict-dialog',
  imports: [UiModalFrame, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal-frame code="409" codeTone="warning" [kicker]="i18n.t('err.409.kicker')" [title]="i18n.t('err.409.title')">
      {{ i18n.t('err.409.body') }}
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">{{ i18n.t('common.close') }}</button>
        <button ui-button variant="primary" (click)="reload()">{{ i18n.t('common.reload') }}</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class ConflictDialog {
  protected readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected reload(): void {
    this.ref.close();
    void this.router.navigateByUrl(this.router.url, { onSameUrlNavigation: 'reload' }).then(() => this.toast.success(this.i18n.t('err.reloaded')));
  }
}
