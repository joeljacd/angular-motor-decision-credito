import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface UiTab {
  key: string;
  label: string;
  /** Contador opcional (badge). */
  count?: number;
}

/**
 * Pestañas. El contenido lo decide quien las usa (@switch sobre `active`).
 *   <ui-tabs [tabs]="tabs()" [(active)]="tab" />
 */
@Component({
  selector: 'ui-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list" role="tablist">
      @for (t of tabs(); track t.key) {
        <button type="button" role="tab" [attr.aria-selected]="t.key === active()" [class.active]="t.key === active()" (click)="active.set(t.key)">
          {{ t.label }}
          @if (t.count !== undefined) {
            <span class="count">{{ t.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .list { display: flex; border-bottom: 1px solid var(--color-divider); padding: 0 8px; overflow-x: auto; overflow-y: hidden; }
    button {
      display: flex; align-items: center; gap: 8px; height: 46px; padding: 0 14px; margin-bottom: -1px;
      border: 0; border-bottom: 2px solid transparent; background: transparent; cursor: pointer;
      font: 500 14px var(--font-body); color: var(--color-neutral-700); white-space: nowrap;
    }
    button:hover { color: var(--color-accent-700); }
    button.active { border-bottom-color: var(--color-accent); color: var(--color-accent-700); }
    .count { min-width: 20px; height: 20px; padding: 0 5px; display: grid; place-items: center; font-size: 11px; font-weight: 600; background: var(--color-neutral-200); color: var(--color-neutral-700); }
    .active .count { background: var(--color-accent); color: #fff; }
  `,
})
export class UiTabs {
  readonly tabs = input.required<UiTab[]>();
  readonly active = model<string>('');
}
