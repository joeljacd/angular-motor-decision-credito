import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Tone } from '@core/util/tone';
import { UiButton, UiCard, UiEmptyState, UiInput, UiOption, UiPagination, UiSelect, UiTag } from '@shared/ui';

export type CellKind = 'text' | 'mono' | 'yesno' | 'stop' | 'check' | 'color' | 'chip' | 'scope';

export interface GridColumn {
  key: string;
  label: string;
  kind?: CellKind;
  /** kind = chip: clave de la fila con el texto secundario */
  subKey?: string;
}

export interface GridAction {
  label: string;
  danger?: boolean;
  run: () => void;
}

export type GridRow = Record<string, string | number | boolean>;

export interface GridStateFilter {
  /** Clave booleana de la fila */
  key: string;
  onLabel: string;
  offLabel: string;
}

const COLOR_STYLE: Record<string, { bg: string; fg: string }> = {
  VERDE: { bg: 'var(--color-act-c)', fg: 'var(--color-act-c-fg)' },
  AMARILLO: { bg: 'var(--color-act-e)', fg: 'var(--color-act-e-fg)' },
  ROJO: { bg: 'var(--color-act-r)', fg: 'var(--color-act-r-fg)' },
  GRIS: { bg: 'var(--color-act-g)', fg: 'var(--color-act-g-fg)' },
};

/**
 * Tabla genérica de maestros: filtro de texto, filtro de estado, orden por columna y paginación.
 * Cada fila puede declarar acciones y mostrar un enlace a su solicitud pendiente.
 */
@Component({
  selector: 'app-master-grid',
  imports: [FormsModule, RouterLink, UiCard, UiInput, UiSelect, UiTag, UiButton, UiEmptyState, UiPagination],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 10px; }
    .toolbar ui-input { width: 240px; }
    .toolbar ui-select { width: 200px; }
    .spacer { flex: 1; }
    .count { font-size: 12px; color: var(--color-neutral-700); }
    th.sortable { cursor: pointer; user-select: none; }
    .arrow { font-size: 10px; opacity: 0.35; }
    .arrow.on { opacity: 1; }
    .mono { font-family: var(--font-mono); font-size: 13px; }
    .chip { display: inline-flex; align-items: center; gap: 8px; }
    .chip .code { display: inline-grid; place-items: center; width: 24px; height: 24px; font-weight: 700; font-size: 13px; }
    .check { display: inline-grid; place-items: center; width: 18px; height: 18px; border: 1.5px solid var(--color-neutral-400); color: #fff; font-size: 12px; &.on { background: var(--color-accent); border-color: var(--color-accent); } }
    .tag-color { display: inline-block; padding: 1px 8px; font-size: 12px; font-weight: 600; }
    .row-actions { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; justify-content: flex-end; }
    .pending { font-size: 12px; margin-right: 6px; white-space: nowrap; }
    tr.off td { opacity: 0.65; }
    tr.off td:last-child { opacity: 1; }
    .foot { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
  `,
  template: `
    <ui-card padding="md">
      <div class="toolbar">
        <ui-input type="search" placeholder="Filtrar" [ngModel]="query()" (ngModelChange)="onQuery($event)" />
        @if (stateFilter(); as sf) {
          <ui-select [options]="stateOptions()" [ngModel]="state()" (ngModelChange)="onState($event)" />
        }
        <span class="spacer"></span>
        <span class="count">{{ filtered().length }} registros vigentes</span>
      </div>

      @if (!filtered().length) {
        <ui-empty-state title="Sin resultados"><button ui-button (click)="clear()">Limpiar filtros</button></ui-empty-state>
      } @else {
        <div class="ui-table-wrap">
          <table class="ui-table">
            <thead>
              <tr>
                @for (c of columns(); track c.key) {
                  <th class="sortable" (click)="sort(c.key)" [attr.aria-sort]="sortKey() === c.key ? (sortDir() > 0 ? 'ascending' : 'descending') : null">
                    {{ c.label }} <span class="arrow" [class.on]="sortKey() === c.key">{{ sortKey() === c.key ? (sortDir() > 0 ? '▲' : '▼') : '↕' }}</span>
                  </th>
                }
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (row of pageRows(); track $index) {
                <tr [class.off]="isOff(row)">
                  @for (c of columns(); track c.key) {
                    <td>
                      @switch (c.kind ?? 'text') {
                        @case ('mono') { <span class="mono">{{ row[c.key] }}</span> }
                        @case ('yesno') { <ui-tag size="sm" [tone]="row[c.key] ? 'success' : 'neutral'">{{ row[c.key] ? 'Sí' : 'No' }}</ui-tag> }
                        @case ('stop') { <ui-tag size="sm" [tone]="row[c.key] ? 'error' : 'neutral'">{{ row[c.key] ? 'Sí' : 'No' }}</ui-tag> }
                        @case ('check') { <span class="check" [class.on]="row[c.key]" aria-hidden="true">{{ row[c.key] ? '✓' : '' }}</span><span class="sr-only">{{ row[c.key] ? 'Sí' : 'No' }}</span> }
                        @case ('color') { <span class="tag-color" [style.background]="colorOf(row[c.key]).bg" [style.color]="colorOf(row[c.key]).fg">{{ row[c.key] }}</span> }
                        @case ('scope') { <ui-tag size="sm" [tone]="row[c.key] === 'Global' ? 'neutral' : 'accent'">{{ row[c.key] }}</ui-tag> }
                        @case ('chip') {
                          <span class="chip">
                            <span class="code" [style.background]="colorOf(row['color']).bg" [style.color]="colorOf(row['color']).fg">{{ row[c.key] }}</span>
                            <span>{{ row[c.subKey ?? ''] }}</span>
                          </span>
                        }
                        @default { {{ row[c.key] }} }
                      }
                    </td>
                  }
                  <td>
                    <div class="row-actions">
                      @if (pendingOf()(row); as pid) {
                        <a class="pending" [routerLink]="['/requests']" [queryParams]="{ id: pid }" title="Ver la solicitud pendiente">Cambio pendiente · {{ pid }}</a>
                      }
                      @for (a of actionsOf()(row); track a.label) {
                        <button ui-button size="sm" [variant]="a.danger ? 'danger-ghost' : 'ghost'" [disabled]="!editable()" (click)="a.run()">{{ a.label }}</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="foot"><ui-pagination [(page)]="page" [pageSize]="pageSize()" [total]="filtered().length" /></div>
      }
    </ui-card>
  `,
})
export class MasterGrid {
  readonly columns = input.required<GridColumn[]>();
  readonly rows = input.required<GridRow[]>();
  readonly stateFilter = input<GridStateFilter | null>(null);
  readonly pageSize = input(5);
  readonly editable = input(true);
  /** Acciones por fila (se evalúa al renderizar; debe ser barata). */
  readonly actionsOf = input<(row: GridRow) => GridAction[]>(() => []);
  /** Id de la solicitud pendiente sobre la fila, si existe. */
  readonly pendingOf = input<(row: GridRow) => string | undefined>(() => undefined);

  protected readonly query = signal('');
  protected readonly state = signal('');
  protected readonly sortKey = signal<string | null>(null);
  protected readonly sortDir = signal(1);
  protected readonly page = signal(1);

  protected readonly stateOptions = computed<UiOption<string>[]>(() => {
    const sf = this.stateFilter();
    return sf ? [{ value: '', label: 'Todos los estados' }, { value: 'si', label: sf.onLabel }, { value: 'no', label: sf.offLabel }] : [];
  });

  protected readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    const sf = this.stateFilter();
    const state = this.state();
    let list = this.rows().filter(
      (r) => (!q || Object.values(r).some((v) => String(v).toLowerCase().includes(q))) && (!state || !sf || (state === 'si') === !!r[sf.key]),
    );
    const key = this.sortKey();
    if (key) {
      const dir = this.sortDir();
      list = [...list].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0) * dir);
    }
    return list;
  });
  protected readonly pageRows = computed(() => this.filtered().slice((this.page() - 1) * this.pageSize(), this.page() * this.pageSize()));

  protected colorOf(value: string | number | boolean) {
    return COLOR_STYLE[String(value)] ?? COLOR_STYLE['GRIS'];
  }

  /** Filas deshabilitadas/inactivas se atenúan. */
  protected isOff(row: GridRow): boolean {
    const sf = this.stateFilter();
    return !!sf && !row[sf.key];
  }

  protected onQuery(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }
  protected onState(value: string): void {
    this.state.set(value);
    this.page.set(1);
  }
  protected clear(): void {
    this.query.set('');
    this.state.set('');
  }
  protected sort(key: string): void {
    this.sortDir.update((d) => (this.sortKey() === key ? -d : 1));
    this.sortKey.set(key);
  }
}
