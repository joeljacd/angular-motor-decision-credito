import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiBlueprint } from '../card/blueprint.directive';

export interface UiStat {
  label: string;
  value: string | number;
  /** Color del valor (CSS), p. ej. 'var(--color-success)'. */
  color?: string;
}

/** Franja de indicadores. <ui-stat-strip [stats]="[{label:'Activos', value: 12}]" /> */
@Component({
  selector: 'ui-stat-strip',
  hostDirectives: [UiBlueprint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (s of stats(); track s.label) {
      <div class="stat">
        <span class="label">{{ s.label }}</span>
        <span class="value" [style.color]="s.color">{{ s.value }}</span>
      </div>
    }
  `,
  styles: `
    :host { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); background: var(--color-surface); }
    .stat { padding: 14px 20px; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; border-right: 1px solid var(--color-divider); }
    .stat:last-child { border-right: 0; }
    .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--color-neutral-700); }
    .value { font-family: var(--font-heading); font-weight: var(--font-heading-weight); font-size: 32px; line-height: 1; }
  `,
})
export class UiStatStrip {
  readonly stats = input.required<UiStat[]>();
}
