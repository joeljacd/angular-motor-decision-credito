import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/auth';
import { TPipe } from '@core/i18n';
import { ModalService, UiAvatar, UiBlueprint, UiIcon, UiPopover } from '@shared/ui';
import { RolesLabelPipe } from '@shared/pipes/roles-label.pipe';
import { LayoutStore } from '../layout.store';
import { NavService } from '../nav/nav.service';

/** Menú lateral dinámico (según permisos), colapsable en escritorio y cajón en móvil. */
@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, UiIcon, UiAvatar, UiPopover, UiBlueprint, TPipe, RolesLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './sidebar.scss',
  host: {
    '[style.width.px]': 'layout.siderWidth()',
    '[class.floating]': 'layout.narrow()',
    '[class.hidden]': 'layout.narrow() && !layout.mobileOpen()',
    '[class.collapsed]': '!layout.expanded()',
  },
  template: `
    <button
      type="button"
      class="collapse"
      [title]="(layout.narrow() ? 'nav.closeMenu' : layout.collapsed() ? 'nav.expand' : 'nav.collapse') | t"
      [attr.aria-label]="(layout.narrow() ? 'nav.closeMenu' : layout.collapsed() ? 'nav.expand' : 'nav.collapse') | t"
      (click)="layout.toggleCollapse()"
    >
      <ui-icon name="chevron-left" [size]="15" class="chev" [class.flip]="!layout.narrow() && layout.collapsed()" />
    </button>

    <nav aria-label="Principal">
      @for (section of nav.sections(); track section.id) {
        @if (section.labelKey) {
          @if (layout.expanded()) {
            <span class="group">{{ section.labelKey | t }}</span>
          } @else {
            <span class="divider"></span>
          }
        }
        @for (entry of section.entries; track entry.item.key) {
          <a class="item" [routerLink]="entry.item.path" routerLinkActive="active" [title]="entry.labelKey | t" (click)="onNavigate()">
            <ui-icon [name]="entry.item.icon" [size]="18" />
            @if (layout.expanded()) {
              <span class="label">{{ entry.labelKey | t }}</span>
            }
            @if (entry.badge; as badge) {
              <span class="badge" [class]="'tone-' + badge.tone" [class.abs]="!layout.expanded()">{{ badge.text }}</span>
            }
          </a>
        }
      }
    </nav>

    <div class="user">
      <ui-popover [(open)]="menuOpen" [placement]="layout.expanded() ? 'top-start' : 'right-end'" width="260px">
        <div class="menu-head">
          <span class="menu-name">{{ auth.me()?.nombre }}</span>
          <span class="menu-id">BAMAZONAS\{{ auth.me()?.id }}</span>
        </div>
        <button type="button" class="menu-item" (click)="openInfo()"><ui-icon name="user" [size]="17" />{{ 'shell.user.info' | t }}</button>
        <div class="menu-sep"></div>
        <button type="button" class="menu-item" (click)="logout()"><ui-icon name="log-out" [size]="17" />{{ 'shell.user.logout' | t }}</button>
      </ui-popover>
      <button type="button" class="user-btn" [title]="auth.me()?.nombre ?? ''" aria-haspopup="true" [attr.aria-expanded]="menuOpen()" (click)="menuOpen.set(!menuOpen())">
        <ui-avatar [initials]="auth.me()?.ini ?? ''" [size]="38" uiBlueprint corners="diagonal" />
        @if (layout.expanded()) {
          <span class="user-text">
            <span class="user-name">{{ auth.me()?.nombre }}</span>
            <span class="user-roles">{{ auth.me()?.roles | rolesLabel }}</span>
          </span>
          <ui-icon name="chevron-up" [size]="16" />
        }
      </button>
    </div>
  `,
})
export class Sidebar {
  protected readonly layout = inject(LayoutStore);
  protected readonly nav = inject(NavService);
  protected readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);

  protected onNavigate(): void {
    if (this.layout.narrow()) this.layout.closeDrawer();
  }

  protected async openInfo(): Promise<void> {
    this.menuOpen.set(false);
    const { UserInfoDialog } = await import('../dialogs/user-info-dialog');
    this.modal.open(UserInfoDialog, { width: 'min(460px, 100%)' });
  }

  protected logout(): void {
    this.menuOpen.set(false);
    this.layout.closeDrawer();
    this.modal.closeAll();
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
