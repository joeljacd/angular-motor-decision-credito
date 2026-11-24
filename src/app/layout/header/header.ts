import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';
import { APP_CONFIG } from '@core/config/app-config';
import { I18nService, Lang, TPipe } from '@core/i18n';
import { NavigationProgress } from '@core/navigation/navigation-progress';
import { InboxService } from '@core/state/inbox.service';
import { ThemeService } from '@core/theme';
import { ModalService, ToastService, UiBlueprint, UiButton, UiIcon, UiProgressBar, UiSegmented } from '@shared/ui';
import { LayoutStore } from '../layout.store';
import { UserSwitcher } from './user-switcher';

@Component({
  selector: 'app-header',
  imports: [FormsModule, RouterLink, UiButton, UiIcon, UiBlueprint, UiSegmented, UiProgressBar, UserSwitcher, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './header.scss',
  template: `
    <header>
      @if (layout.narrow()) {
        <button ui-button icon [attr.aria-label]="'nav.menu' | t" [title]="'nav.menu' | t" (click)="layout.openDrawer()">
          <ui-icon name="menu" />
        </button>
      }

      <div class="brand">
        <span class="logo" uiBlueprint corners="diagonal">BA</span>
        <div class="titles">
          <span class="name">{{ 'app.name' | t }}</span>
          <span class="sub">{{ 'app.bank' | t }} · {{ 'app.role' | t }}</span>
        </div>
      </div>

      @if (layout.wide()) {
        <div class="env" [title]="'shell.envReadonly' | t">
          <span class="env-label">{{ 'shell.env' | t }}</span>
          <span class="env-dot"></span>
          <span class="env-value">{{ config.environmentLabel }}</span>
          <ui-icon name="lock" [size]="13" />
        </div>
      }

      <span class="grow"></span>

      @if (auth.me()?.puedeAprobar) {
        <a ui-button size="sm" routerLink="/inicio" [queryParams]="{ tab: 'aprobar' }" class="pending">
          <ui-icon name="inbox" [size]="16" />
          @if (layout.wide()) {
            <span class="pending-text">{{ 'dash.tab.approve' | t }}</span>
          }
          <span class="count">{{ inbox.pendingCount() }}</span>
        </a>
      }

      <ui-segmented
        size="sm"
        [options]="langOptions()"
        [ngModel]="i18n.lang()"
        (ngModelChange)="setLang($event)"
        aria-label="Idioma"
      />

      <button ui-button icon size="sm" [title]="(theme.isDark() ? 'shell.theme.toLight' : 'shell.theme.toDark') | t" [attr.aria-label]="(theme.isDark() ? 'shell.theme.toLight' : 'shell.theme.toDark') | t" (click)="theme.toggleMode()">
        <ui-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="17" />
      </button>
      <button ui-button icon size="sm" [title]="'shell.theme.settings' | t" [attr.aria-label]="'shell.theme.settings' | t" (click)="openThemeSettings()">
        <ui-icon name="palette" [size]="17" />
      </button>

      @if (config.features.demoUserSwitcher) {
        <app-user-switcher />
      }
    </header>
    @if (progress.busy()) {
      <ui-progress-bar class="loading" />
    }
  `,
})
export class Header {
  protected readonly layout = inject(LayoutStore);
  protected readonly auth = inject(AuthService);
  protected readonly config = inject(APP_CONFIG);
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);
  protected readonly inbox = inject(InboxService);
  protected readonly progress = inject(NavigationProgress);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);

  protected readonly langOptions = computed(() => [
    { value: 'es' as Lang, label: 'ES' },
    { value: 'en' as Lang, label: 'EN' },
  ]);

  protected setLang(lang: Lang): void {
    this.i18n.setLang(lang);
    if (lang === 'en') this.toast.info(this.i18n.t('shell.langChanged'));
  }

  protected async openThemeSettings(): Promise<void> {
    const { ThemeDialog } = await import('../dialogs/theme-dialog');
    this.modal.open(ThemeDialog, { width: 'min(520px, 100%)' });
  }
}
