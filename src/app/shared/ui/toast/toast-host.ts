import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UiBlueprint } from '../card/blueprint.directive';
import { UiIcon } from '../icon/icon';
import { ToastService } from './toast.service';

@Component({
  selector: 'ui-toast-host',
  imports: [UiIcon, UiBlueprint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" role="status" aria-live="polite">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" uiBlueprint corners="diagonal" [class]="'tone-' + t.tone" (click)="toasts.dismiss(t.id)">
          <ui-icon [name]="t.tone === 'error' ? 'alert-triangle' : t.tone === 'info' ? 'info' : 'check'" [size]="16" [stroke]="2" />
          {{ t.message }}
        </div>
      }
    </div>
  `,
  styles: `
    .stack { position: fixed; right: 24px; bottom: 24px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; align-items: flex-end; max-width: calc(100vw - 48px); }
    .toast {
      display: flex; align-items: center; gap: 10px; padding: 12px 16px; cursor: pointer;
      background: var(--color-text); color: var(--color-bg); border: 1px solid var(--color-text);
      box-shadow: var(--shadow-lg); font-size: 14px; line-height: 1.3; animation: ui-in 0.2s ease both;
    }
    .toast ui-icon { color: var(--color-success); }
    .toast.tone-error ui-icon { color: var(--color-error); }
    .toast.tone-info ui-icon { color: var(--color-info); }
  `,
})
export class UiToastHost {
  protected readonly toasts = inject(ToastService);
}
