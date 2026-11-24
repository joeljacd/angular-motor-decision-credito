import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { I18nService, TPipe } from '@core/i18n';
import { InboxService } from '@core/state/inbox.service';
import { IntegrityStore } from '@core/state/integrity.store';
import { SystemStatusStore } from '@core/state/system-status.store';
import { UiAlert, UiButton } from '@shared/ui';
import { Header } from '../header/header';
import { LayoutStore } from '../layout.store';
import { Sidebar } from '../sidebar/sidebar';

/** Marco de la aplicación autenticada: header + menú lateral + banners globales + contenido. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, Header, Sidebar, UiAlert, UiButton, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:resize)': 'layout.setViewport($any($event.target).innerWidth)' },
  styleUrl: './shell.scss',
  template: `
    <a class="skip" href="#main">Saltar al contenido</a>
    <app-header />
    <div class="body">
      @if (layout.narrow() && layout.mobileOpen()) {
        <div class="backdrop" (click)="layout.closeDrawer()"></div>
      }
      <app-sidebar />
      <div class="col">
        @if (integrity.hasAlerts()) {
          <ui-alert tone="error" [solid]="true" [banner]="true" icon="alert-triangle">
            @for (alert of integrity.alerts(); track alert) {
              <span>{{ alert }}</span>
            }
            <a uiAlertActions ui-button size="sm" class="on-solid" routerLink="/integrity">{{ 'shell.integrity.go' | t }}</a>
          </ui-alert>
        }
        @if (status.keyUnavailable()) {
          <ui-alert tone="warning" [banner]="true" icon="key">
            <span><strong>{{ 'shell.lock503' | t }}</strong> {{ 'shell.lock503.detail' | t }}</span>
          </ui-alert>
        }
        <main id="main" tabindex="-1">
          <div class="inner"><router-outlet /></div>
        </main>
      </div>
    </div>
  `,
})
export class Shell implements OnInit {
  protected readonly layout = inject(LayoutStore);
  protected readonly integrity = inject(IntegrityStore);
  protected readonly status = inject(SystemStatusStore);
  private readonly inbox = inject(InboxService);
  protected readonly i18n = inject(I18nService);

  ngOnInit(): void {
    // Datos que el menú necesita (badges) y banners globales.
    this.inbox.refresh();
    this.integrity.load();
  }
}
