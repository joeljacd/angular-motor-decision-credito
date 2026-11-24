import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/auth';
import { I18nService, TPipe } from '@core/i18n';
import { ChangeRequestsStore } from '@core/state/change-requests.store';
import { InboxRow, InboxService } from '@core/state/inbox.service';
import { IntegrityStore } from '@core/state/integrity.store';
import { SystemStatusStore } from '@core/state/system-status.store';
import { ModalService, ToastService, UiButton, UiCard, UiEmptyState, UiIcon, UiPageHeader, UiTab, UiTableSkeleton, UiTabs } from '@shared/ui';
import { InboxTable } from './inbox-table';

type DashboardTab = 'approve' | 'mine';

/** Inicio · bandeja de pendientes. Qué puedo aprobar y qué he solicitado. */
@Component({
  selector: 'app-dashboard-page',
  imports: [RouterLink, UiPageHeader, UiCard, UiTabs, UiTableSkeleton, UiEmptyState, UiButton, UiIcon, InboxTable, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './dashboard-page.scss',
  template: `
    <ui-page-header
      [kicker]="'dash.kicker' | t"
      [title]="'dash.hello' | t: { name: firstName() }"
      [description]="'dash.lead' | t"
    />

    @if (integrity.hasAlerts()) {
      <ui-card tone="error" padding="md" class="alerts">
        <ui-icon name="shield-alert" [size]="22" class="alerts-icon" />
        <div class="alerts-body">
          <span class="alerts-title">{{ 'dash.alerts.title' | t }}</span>
          @for (alert of integrity.alerts(); track alert) {
            <span>{{ alert }}</span>
          }
        </div>
        @if (auth.can('integrity')) {
          <a ui-button size="sm" routerLink="/integrity" class="alerts-cta">{{ 'dash.alerts.go' | t }}</a>
        }
      </ui-card>
    }

    <ui-card>
      <ui-tabs [tabs]="tabs()" [(active)]="activeTab" />

      @if (inbox.loading() && !hasData()) {
        <ui-table-skeleton [rows]="5" />
      } @else if (activeTab() === 'approve') {
        @if (inbox.approveRows().length) {
          <app-inbox-table mode="approve" [rows]="inbox.approveRows()" />
        } @else {
          <ui-empty-state icon="check-circle" [title]="'dash.empty.approve.title' | t" [description]="'dash.empty.approve.text' | t">
            <a ui-button routerLink="/flows">{{ 'dash.empty.approve.cta' | t }}</a>
          </ui-empty-state>
        }
      } @else {
        @if (inbox.mineRows().length) {
          <app-inbox-table mode="mine" [rows]="inbox.mineRows()" [locked]="status.keyUnavailable()" (cancel)="confirmCancel($event)" />
        } @else {
          <ui-empty-state [title]="'dash.empty.mine.title' | t" [description]="'dash.empty.mine.text' | t">
            <a ui-button routerLink="/masters/channels">{{ 'dash.empty.mine.cta' | t }}</a>
          </ui-empty-state>
        }
      }
    </ui-card>
  `,
})
export class DashboardPage implements OnInit {
  /** ?tab=aprobar | mias  (enlazado por withComponentInputBinding) */
  readonly tab = input<string | undefined>();

  protected readonly auth = inject(AuthService);
  protected readonly inbox = inject(InboxService);
  protected readonly integrity = inject(IntegrityStore);
  protected readonly status = inject(SystemStatusStore);
  private readonly requests = inject(ChangeRequestsStore);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18nService);

  protected readonly firstName = computed(() => this.auth.me()?.name.split(' ')[0] ?? '');
  protected readonly canApprove = computed(() => this.auth.me()?.canApprove ?? false);

  /** Pestaña activa: la del query param si es válida; si no, "approve" para quien puede aprobar. */
  protected readonly activeTab = linkedSignal<string>(() => {
    const requested = this.tab();
    if (requested === 'mine' || (requested === 'approve' && this.canApprove())) return requested;
    return this.canApprove() ? 'approve' : 'mine';
  });

  protected readonly hasData = computed(() => this.inbox.approveRows().length + this.inbox.mineRows().length > 0);

  protected readonly tabs = computed<UiTab[]>(() => [
    ...(this.canApprove() ? [{ key: 'approve' satisfies DashboardTab, label: this.i18n.t('dash.tab.approve'), count: this.inbox.approveRows().length }] : []),
    { key: 'mine' satisfies DashboardTab, label: this.i18n.t('dash.tab.mine'), count: this.inbox.mineRows().length },
  ]);

  ngOnInit(): void {
    this.inbox.refresh();
    this.integrity.load();
  }

  protected async confirmCancel(row: InboxRow): Promise<void> {
    if (!row.id) return;
    const confirmed = await this.modal.confirm({
      title: this.i18n.t('dash.cancel.title', { id: row.id }),
      message: this.i18n.t('dash.cancel.body', { element: row.element }),
      confirmLabel: this.i18n.t('dash.cancel.confirm'),
      cancelLabel: this.i18n.t('common.back'),
      tone: 'danger',
    });
    if (!confirmed) return;
    this.requests.cancel(row.id).subscribe({
      next: () => this.toast.success(this.i18n.t('dash.cancel.done', { id: row.id! })),
      error: () => this.toast.error(this.i18n.t('login.error')),
    });
  }
}
