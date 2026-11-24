import { inject, Pipe, PipeTransform } from '@angular/core';
import { Role } from '@core/auth';
import { I18nService } from '@core/i18n';

const KEY: Record<Role, string> = { request: 'me.cap.request', approve: 'me.cap.approve', audit: 'me.cap.audit' };

/** ['request','approve'] → "Solicitar · Aprobar"  (vacío → "Solo lectura") */
@Pipe({ name: 'rolesLabel', pure: false })
export class RolesLabelPipe implements PipeTransform {
  private readonly i18n = inject(I18nService);
  transform(roles: readonly Role[] | null | undefined): string {
    return roles?.length ? roles.map((r) => this.i18n.t(KEY[r])).join(' · ') : this.i18n.t('me.readOnly');
  }
}
