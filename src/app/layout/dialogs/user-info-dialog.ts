import { DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AuthService } from '@core/auth';
import { APP_CONFIG } from '@core/config/app-config';
import { I18nService } from '@core/i18n';
import { RolesLabelPipe } from '@shared/pipes/roles-label.pipe';
import { UiButton, UiIcon, UiModalFrame } from '@shared/ui';

@Component({
  selector: 'app-user-info-dialog',
  imports: [UiModalFrame, UiButton, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RolesLabelPipe],
  styles: `
    .hero { position: relative; padding: 24px; background: var(--color-hero); color: #fff; display: flex; align-items: center; gap: 16px; }
    .avatar { width: 64px; height: 64px; flex: none; display: grid; place-items: center; background: var(--color-accent); border: 1px solid var(--color-hero-soft); font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 28px; }
    .who { display: flex; flex-direction: column; line-height: 1.2; }
    .who-name { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 26px; }
    .who-pos { font-size: 13px; color: var(--color-hero-muted); }
    .x { position: absolute; top: 10px; right: 10px; color: #fff; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; }
    .cell { padding: 14px 20px; border-bottom: 1px solid var(--color-divider); border-right: 1px solid var(--color-divider); display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .k { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-neutral-700); }
    .v { font-size: 14px; overflow-wrap: anywhere; }
    .foot { display: flex; justify-content: flex-end; padding: 16px 20px; }
  `,
  template: `
    <ui-modal-frame [flush]="true">
      @if (me(); as m) {
        <div class="hero">
          <span class="avatar">{{ m.initials }}</span>
          <div class="who"><span class="who-name">{{ m.name }}</span><span class="who-pos">{{ m.jobTitle }}</span></div>
          <button ui-button icon variant="ghost" class="x" [attr.aria-label]="i18n.t('common.close')" (click)="ref.close()"><ui-icon name="x" /></button>
        </div>
        <div class="grid">
          @for (row of rows(); track row.k) {
            <div class="cell"><span class="k">{{ row.k }}</span><span class="v">{{ row.v }}</span></div>
          }
        </div>
        <div class="foot"><button ui-button variant="primary" (click)="ref.close()">{{ i18n.t('common.done') }}</button></div>
      }
    </ui-modal-frame>
  `,
})
export class UserInfoDialog {
  protected readonly i18n = inject(I18nService);
  protected readonly ref = inject(DialogRef);
  private readonly auth = inject(AuthService);
  private readonly config = inject(APP_CONFIG);
  private readonly roles = inject(RolesLabelPipe);

  protected readonly me = this.auth.me;
  protected readonly rows = computed(() => {
    const m = this.me();
    if (!m) return [];
    const t = (k: string) => this.i18n.t(k);
    return [
      { k: t('me.adUser'), v: `${this.config.adDomain}\\${m.id}` },
      { k: t('me.profile'), v: m.profile },
      { k: t('me.capabilities'), v: this.roles.transform(m.roles) },
      { k: t('me.email'), v: m.email },
      { k: t('me.position'), v: m.jobTitle },
      { k: t('me.environment'), v: this.config.environmentLabel },
      { k: t('me.sessionStart'), v: new Date(this.auth.session()?.startedAt ?? Date.now()).toLocaleString(this.i18n.lang()) },
    ];
  });
}
