import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { UiIcon } from '../icon/icon';

/** Paginación. <ui-pagination [(page)]="page" [pageSize]="10" [total]="total()" /> (page empieza en 1) */
@Component({
  selector: 'ui-pagination',
  imports: [UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Paginación">
      <button type="button" aria-label="Anterior" [disabled]="page() <= 1" (click)="go(page() - 1)"><ui-icon name="chevron-left" [size]="16" /></button>
      @for (p of pages(); track $index) {
        @if (p === 0) {
          <span class="gap">…</span>
        } @else {
          <button type="button" [class.active]="p === page()" [attr.aria-current]="p === page() ? 'page' : null" (click)="go(p)">{{ p }}</button>
        }
      }
      <button type="button" aria-label="Siguiente" [disabled]="page() >= totalPages()" (click)="go(page() + 1)"><ui-icon name="chevron-right" [size]="16" /></button>
    </nav>
  `,
  styles: `
    nav { display: inline-flex; gap: 4px; align-items: center; }
    button { min-width: 30px; height: 30px; padding: 0 8px; display: grid; place-items: center; cursor: pointer; font: 500 13px var(--font-body); color: var(--color-text); background: transparent; border: 1px solid var(--color-divider); border-radius: var(--radius-md); }
    button:hover:not(:disabled) { background: color-mix(in srgb, var(--color-text) 7%, transparent); }
    button.active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
    button:disabled { opacity: 0.4; cursor: not-allowed; }
    .gap { padding: 0 4px; color: var(--color-neutral-600); }
  `,
})
export class UiPagination {
  readonly page = model(1);
  readonly pageSize = input(10);
  readonly total = input(0);

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  /** Páginas visibles; 0 = elipsis. */
  protected readonly pages = computed(() => {
    const last = this.totalPages();
    const cur = this.page();
    const set = new Set([1, last, cur - 1, cur, cur + 1].filter((p) => p >= 1 && p <= last));
    const sorted = [...set].sort((a, b) => a - b);
    return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [0, p] : [p]));
  });

  protected go(p: number): void {
    this.page.set(Math.min(Math.max(1, p), this.totalPages()));
  }
}
