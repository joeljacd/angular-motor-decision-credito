import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { UiBlueprint } from '../card/blueprint.directive';

export type PopoverPlacement = 'bottom-end' | 'bottom-start' | 'top-start' | 'right-end';

/**
 * Panel flotante anclado a su contenedor (que debe tener position: relative). Cierra con clic fuera o Esc.
 *
 *   <div class="anchor">
 *     <button (click)="open.set(!open())">Abrir</button>
 *     <ui-popover [(open)]="open" placement="bottom-end" width="320px">…</ui-popover>
 *   </div>
 */
@Component({
  selector: 'ui-popover',
  imports: [UiBlueprint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'open.set(false)' },
  template: `
    @if (open()) {
      <div class="scrim" (click)="open.set(false)"></div>
      <div class="panel" uiBlueprint [class]="placement()" [style.width]="width()">
        <ng-content />
      </div>
    }
  `,
  styles: `
    .scrim { position: fixed; inset: 0; z-index: 60; }
    .panel {
      position: absolute; z-index: 61; max-width: calc(100vw - 24px);
      background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-lg);
      display: flex; flex-direction: column; animation: ui-in 0.16s ease both;
    }
    .bottom-end { right: 0; top: calc(100% + 10px); }
    .bottom-start { left: 0; top: calc(100% + 10px); }
    .top-start { left: 10px; bottom: calc(100% + 8px); }
    .right-end { left: calc(100% + 8px); bottom: 10px; }
  `,
})
export class UiPopover {
  readonly open = model(false);
  readonly placement = input<PopoverPlacement>('bottom-end');
  readonly width = input('280px');
}
