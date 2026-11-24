import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService, TPipe } from '@core/i18n';
import { DueInfo, InboxRow, STATUS_TONE } from '@core/state/inbox.service';
import { UiButton, UiTag } from '@shared/ui';

/** Tabla de la bandeja. `mode="approve"` = pendientes que puedo aprobar · `mode="mine"` = mis solicitudes/borradores. */
@Component({
  selector: 'app-inbox-table',
  imports: [RouterLink, UiButton, UiTag, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .element { display: flex; flex-direction: column; line-height: 1.3; gap: 2px; }
    .name { font-weight: 500; }
    .sub { font-size: 12px; color: var(--color-neutral-700); }
    .muted { font-size: 13px; color: var(--color-neutral-700); }
    .reject { font-size: 12px; padding: 6px 8px; margin-top: 4px; background: var(--color-error-bg); color: var(--color-text); }
    .urgent { font-weight: 600; }
    .nowrap { white-space: nowrap; }
  `,
  template: `
    <div class="ui-table-wrap">
      <table class="ui-table" style="min-width: 820px">
        <thead>
          <tr>
            <th>{{ 'dash.col.type' | t }}</th>
            <th>{{ 'dash.col.element' | t }}</th>
            @if (mode() === 'approve') { <th>{{ 'dash.col.requester' | t }}</th> }
            <th>{{ 'dash.col.date' | t }}</th>
            <th>{{ (mode() === 'approve' ? 'dash.col.dueIn' : 'dash.col.due') | t }}</th>
            @if (mode() === 'mine') { <th>{{ 'dash.col.status' | t }}</th> }
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows(); track row.id ?? row.element) {
            <tr>
              <td>
                <ui-tag size="sm" [tone]="row.kind === 'draft' ? 'accent' : 'neutral'">
                  {{ (row.kind === 'draft' ? 'dash.type.draft' : 'dash.type.request') | t }}
                </ui-tag>
              </td>
              <td>
                <div class="element">
                  <span class="name">{{ row.element }}</span>
                  <span class="sub">{{ row.sub }}</span>
                  @if (row.rejectComment) {
                    <span class="reject">{{ 'dash.rejectComment' | t: { name: row.approver ?? '', text: row.rejectComment } }}</span>
                  }
                </div>
              </td>
              @if (mode() === 'approve') { <td class="nowrap">{{ row.requester }}</td> }
              <td class="muted">{{ row.date }}</td>
              <td [class.nowrap]="true">
                @if (mode() === 'approve') {
                  @if (row.due) {
                    <ui-tag [tone]="row.due.urgent ? 'orange' : 'neutral'" [class.urgent]="row.due.urgent">{{ dueLabel(row.due) }}</ui-tag>
                  }
                } @else if (row.due) {
                  {{ row.dueDate }} ({{ dueLabel(row.due) }})
                } @else { — }
              </td>
              @if (mode() === 'mine') {
                <td><ui-tag [tone]="tone(row)" [dot]="true">{{ 'status.' + row.status | t }}</ui-tag></td>
              }
              <td class="actions">
                @if (mode() === 'approve') {
                  <a ui-button variant="primary" size="sm" [routerLink]="row.link.path" [queryParams]="row.link.query">{{ 'dash.review' | t }}</a>
                } @else {
                  <a ui-button variant="ghost" size="sm" [routerLink]="row.link.path" [queryParams]="row.link.query">{{ 'common.view' | t }}</a>
                  @if (row.canCancel) {
                    <button ui-button variant="danger-ghost" size="sm" [disabled]="locked()" (click)="cancel.emit(row)">{{ 'common.cancel' | t }}</button>
                  }
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class InboxTable {
  readonly rows = input.required<InboxRow[]>();
  readonly mode = input.required<'approve' | 'mine'>();
  /** Deshabilita acciones que modifican (p. ej. 503 llave no disponible). */
  readonly locked = input(false);
  readonly cancel = output<InboxRow>();

  private readonly i18n = inject(I18nService);

  protected tone(row: InboxRow) {
    return STATUS_TONE[row.status];
  }

  protected dueLabel(due: DueInfo): string {
    if (due.days < 0) return this.i18n.t('due.overdue');
    if (due.days === 0) return this.i18n.t('due.today');
    return this.i18n.t(due.days === 1 ? 'due.day' : 'due.days', { n: due.days });
  }
}
