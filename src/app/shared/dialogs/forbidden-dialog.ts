import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@core/auth';
import { I18nService } from '@core/i18n';
import { RolesLabelPipe } from '../pipes/roles-label.pipe';
import { UiButton, UiModalFrame } from '../ui';

/** 403 en una acción (la pantalla completa sin permiso se resuelve con el guard → /403). */
@Component({
  selector: 'app-forbidden-dialog',
  imports: [UiModalFrame, UiButton, RolesLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ui-modal-frame code="403" [kicker]="i18n.t('err.403.kicker')" [title]="i18n.t('err.403.title')">
      {{ i18n.t('err.403.body', { roles: (auth.me()?.roles | rolesLabel) }) }}
      <ng-container uiModalActions>
        <button ui-button variant="primary" (click)="ref.close()">{{ i18n.t('common.accept') }}</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class ForbiddenDialog {
  protected readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);
  protected readonly auth = inject(AuthService);
}
