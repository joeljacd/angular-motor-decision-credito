import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, MeInfo } from '@core/auth';
import { AuthApi } from '@core/api/auth.api';
import { I18nService, TPipe } from '@core/i18n';
import { RolesLabelPipe } from '@shared/pipes/roles-label.pipe';
import { ToastService, UiAvatar, UiIcon, UiPopover, UiTag } from '@shared/ui';
import { LayoutStore } from '../layout.store';
import { navPathFor } from '../nav/nav.config';

/**
 * "Ver el portal como…": cambia de usuario para comparar menús y permisos (solo con mocks / entorno de demo).
 * Se activa con `environment.features.demoUserSwitcher`.
 */
@Component({
  selector: 'app-user-switcher',
  imports: [UiAvatar, UiIcon, UiPopover, UiTag, TPipe, RolesLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './user-switcher.scss',
  template: `
    <div class="anchor">
      <button type="button" class="trigger" [class.open]="open()" [title]="'shell.viewAs.tooltip' | t" aria-haspopup="true" [attr.aria-expanded]="open()" (click)="toggle()">
        <ui-avatar [initials]="auth.me()?.ini ?? ''" [size]="34" />
        @if (layout.wide()) {
          <span class="who">
            <span class="who-name">{{ auth.me()?.nombre }}</span>
            <span class="who-profile">{{ auth.me()?.perfil }}</span>
          </span>
        }
        <ui-icon name="chevron-down" [size]="14" />
      </button>

      <ui-popover [(open)]="open" placement="bottom-end" width="380px">
        <div class="head">
          <div class="head-title">{{ 'shell.viewAs.title' | t }}</div>
          <div class="head-help">{{ 'shell.viewAs.help' | t }}</div>
        </div>
        @for (u of users(); track u.id) {
          <button type="button" class="row" [class.current]="u.id === auth.me()?.id" (click)="pick(u)">
            <ui-avatar [initials]="u.ini" [size]="38" [variant]="u.id === auth.me()?.id ? 'filled' : 'outline'" />
            <span class="info">
              <span class="line">
                <span class="r-name">{{ u.nombre }}</span>
                <span class="r-screens">{{ screens(u) }}</span>
              </span>
              <span class="tags">
                <ui-tag [tone]="u.perfilActivo ? 'accent' : 'neutral'" size="sm">{{ u.perfil }}</ui-tag>
                <ui-tag size="sm">{{ u.perfilActivo ? (u.roles | rolesLabel) : i18n.t('me.noAccess') }}</ui-tag>
              </span>
            </span>
            @if (u.id === auth.me()?.id) {
              <ui-icon name="check" [size]="18" [stroke]="2" class="tick" />
            }
          </button>
        }
        @if (auth.can('profiles')) {
          <button type="button" class="manage" (click)="goProfiles()">{{ 'shell.viewAs.manageProfiles' | t }}</button>
        }
      </ui-popover>
    </div>
  `,
})
export class UserSwitcher {
  protected readonly auth = inject(AuthService);
  protected readonly layout = inject(LayoutStore);
  protected readonly i18n = inject(I18nService);
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly open = signal(false);
  protected readonly users = signal<MeInfo[]>([]);

  protected toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next && this.users().length === 0) this.api.demoUsers().subscribe((u) => this.users.set(u));
  }

  protected screens(u: MeInfo): string {
    const n = u.opts.filter((o) => !o.startsWith('cap.')).length;
    return n === 1 ? this.i18n.t('shell.viewAs.screen') : this.i18n.t('shell.viewAs.screens', { n });
  }

  protected pick(u: MeInfo): void {
    this.open.set(false);
    if (u.id === this.auth.me()?.id) return;
    this.auth.switchUser(u.id).subscribe((me) => {
      // Si la pantalla actual no está permitida para el nuevo usuario, va a su primera pantalla permitida.
      const first = this.auth.firstAllowedScreen();
      void this.router.navigateByUrl(first ? navPathFor(first) : '/403');
      this.toast.success(this.i18n.t('shell.viewAs.toast', { name: me.nombre, profile: me.perfil }));
    });
  }

  protected goProfiles(): void {
    this.open.set(false);
    void this.router.navigateByUrl('/profiles');
  }
}
