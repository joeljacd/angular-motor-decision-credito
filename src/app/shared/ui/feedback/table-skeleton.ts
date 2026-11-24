import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiSkeleton } from './skeleton';

/** Esqueleto de tabla/lista mientras cargan datos. */
@Component({
  selector: 'ui-table-skeleton',
  imports: [UiSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="rows" role="status" aria-label="Cargando">
      @for (row of rowList(); track $index) {
        <div class="row">
          <ui-skeleton [width]="row[0]" />
          <span class="grow"></span>
          <ui-skeleton [width]="row[1]" />
        </div>
      }
    </div>
  `,
  styles: `
    .rows { display: flex; flex-direction: column; gap: 14px; padding: 16px 20px; }
    .row { display: flex; gap: 16px; align-items: center; }
    .grow { flex: 1; }
  `,
})
export class UiTableSkeleton {
  readonly rows = input(6);
  private readonly widths: [string, string][] = [['30%', '12%'], ['42%', '10%'], ['26%', '14%'], ['38%', '9%'], ['33%', '12%'], ['45%', '11%']];
  protected rowList() {
    return Array.from({ length: this.rows() }, (_, i) => this.widths[i % this.widths.length]);
  }
}
