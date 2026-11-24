import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeType, HistoryApi, HistoryEntry, HistoryFilter, HistoryFilterOptions } from '@core/api/history.api';
import { Tone } from '@core/util/tone';
import { ModalService, UiAlert, UiButton, UiCard, UiEmptyState, UiFilterBar, UiFormField, UiInput, UiOption, UiPageHeader, UiPagination, UiSelect, UiTableSkeleton, UiTag } from '@shared/ui';
import { CHANGE_TONE } from './change-tone';
import { HistoryDetailDialog } from './history-detail-dialog';

const PAGE_SIZE = 10;

const EMPTY: Required<HistoryFilter> = { channel: '', product: '', version: '', user: '', elementType: '', element: '', from: '', to: '' };

const toOptions = (all: string, values: string[] = []): UiOption<string>[] => [{ value: '', label: all }, ...values.map((v) => ({ value: v, label: v }))];

/** Historial de auditoría: consulta paginada de solo lectura con detalle de cada registro. */
@Component({
  selector: 'app-history-page',
  imports: [FormsModule, UiPageHeader, UiCard, UiFilterBar, UiFormField, UiSelect, UiInput, UiButton, UiTag, UiAlert, UiEmptyState, UiTableSkeleton, UiPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }
    tr.clickable { cursor: pointer; }
    .mono { font-family: var(--font-mono); font-size: 13px; }
    .element { display: flex; flex-direction: column; line-height: 1.3; }
    .sub { font-size: 12px; color: var(--color-neutral-700); }
    .nowrap { white-space: nowrap; }
  `,
  template: `
    <ui-page-header
      kicker="Auditoría · solo lectura"
      title="Historial"
      description="Cada cambio queda firmado y encadenado al anterior. Los datos sensibles se muestran enmascarados."
    />

    <ui-filter-bar>
      <ui-form-field label="Canal"><ui-select [options]="opt('channels', 'Todos')" [ngModel]="draft().channel" (ngModelChange)="patch({ channel: $event })" /></ui-form-field>
      <ui-form-field label="Producto"><ui-select [options]="opt('products', 'Todos')" [ngModel]="draft().product" (ngModelChange)="patch({ product: $event })" /></ui-form-field>
      <ui-form-field label="Versión"><ui-select [options]="opt('versions', 'Todas')" [ngModel]="draft().version" (ngModelChange)="patch({ version: $event })" /></ui-form-field>
      <ui-form-field label="Usuario"><ui-select [options]="opt('users', 'Todos')" [ngModel]="draft().user" (ngModelChange)="patch({ user: $event })" /></ui-form-field>
      <ui-form-field label="Tipo de elemento"><ui-select [options]="opt('elementTypes', 'Todos')" [ngModel]="draft().elementType" (ngModelChange)="patch({ elementType: $event })" /></ui-form-field>
      <ui-form-field label="Elemento">
        <ui-input placeholder="ej. PA-006" [ngModel]="draft().element" (ngModelChange)="patch({ element: $event })" (keydown.enter)="search()" />
      </ui-form-field>
      <ui-form-field label="Desde"><ui-input type="date" [ngModel]="draft().from" (ngModelChange)="patch({ from: $event })" /></ui-form-field>
      <ui-form-field label="Hasta"><ui-input type="date" [ngModel]="draft().to" (ngModelChange)="patch({ to: $event })" /></ui-form-field>
      <ng-container uiFilterActions>
        <button ui-button (click)="clear()">Limpiar</button>
        <button ui-button variant="primary" (click)="search()">Buscar</button>
      </ng-container>
    </ui-filter-bar>

    <ui-card padding="md">
      @if (loading()) {
        <ui-table-skeleton [rows]="8" />
      } @else if (error()) {
        <ui-alert tone="error">{{ error() }}</ui-alert>
      } @else if (!items().length) {
        <ui-empty-state title="No hay registros con estos filtros." />
      } @else {
        <div class="ui-table-wrap">
          <table class="ui-table">
            <thead><tr><th>Registro</th><th>Fecha y hora</th><th>Usuario</th><th>Tipo de cambio</th><th>Elemento</th><th>Resumen</th></tr></thead>
            <tbody>
              @for (r of items(); track r.seq) {
                <tr class="clickable" tabindex="0" (click)="open(r)" (keydown.enter)="open(r)">
                  <td class="mono">#{{ r.seq }}</td>
                  <td class="nowrap">{{ r.timestamp }}</td>
                  <td>{{ r.user }}</td>
                  <td><ui-tag size="sm" [tone]="tone(r.changeType)">{{ r.changeType }}</ui-tag></td>
                  <td>
                    <div class="element">
                      <span>{{ r.element }}</span>
                      <span class="sub">{{ r.elementType }} · {{ context(r) }}</span>
                    </div>
                  </td>
                  <td>{{ r.summary }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <ui-pagination [(page)]="page" [pageSize]="size" [total]="total()" (pageChange)="load()" />
      }
    </ui-card>
  `,
})
export class HistoryPage implements OnInit {
  private readonly api = inject(HistoryApi);
  private readonly modal = inject(ModalService);

  protected readonly size = PAGE_SIZE;
  /** Lo que el usuario está escribiendo (se aplica al pulsar Buscar). */
  protected readonly draft = signal<Required<HistoryFilter>>({ ...EMPTY });
  private applied: Required<HistoryFilter> = { ...EMPTY };
  protected readonly page = signal(1);
  protected readonly items = signal<HistoryEntry[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  private readonly options = signal<HistoryFilterOptions | null>(null);

  protected readonly opt = (key: keyof HistoryFilterOptions, all: string) => toOptions(all, this.options()?.[key]);

  ngOnInit(): void {
    this.api.filterOptions().subscribe((o) => this.options.set(o));
    this.load();
  }

  protected patch(change: Partial<HistoryFilter>): void {
    this.draft.update((d) => ({ ...d, ...change }));
  }

  protected search(): void {
    this.applied = { ...this.draft() };
    this.page.set(1);
    this.load();
  }

  protected clear(): void {
    this.draft.set({ ...EMPTY });
    this.search();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.query(this.applied, this.page(), PAGE_SIZE).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No fue posible cargar el historial.');
        this.loading.set(false);
      },
    });
  }

  protected tone(type: ChangeType): Tone {
    return CHANGE_TONE[type];
  }

  protected context(r: HistoryEntry): string {
    return r.channel === '—' ? 'Maestros' : `${r.channel} / ${r.product} · ${r.version}`;
  }

  protected open(entry: HistoryEntry): void {
    this.modal.open(HistoryDetailDialog, { data: entry, width: 'min(820px, 100%)', top: '5vh' });
  }
}
