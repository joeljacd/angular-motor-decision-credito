import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Encabezado estándar de pantalla. <ui-page-header kicker="Seguridad" title="Usuarios" description="…"><button ui-button>Acción</button></ui-page-header> */
@Component({
  selector: 'ui-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="text">
      @if (kicker()) {
        <span class="kicker">{{ kicker() }}</span>
      }
      <h1>{{ title() }}</h1>
      @if (description()) {
        <p>{{ description() }}</p>
      }
    </div>
    <div class="actions"><ng-content /></div>
  `,
  styles: `
    :host { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 16px; }
    .text { flex: 1; min-width: 260px; }
    h1 { margin: 2px 0 4px; font-size: 40px; }
    p { margin: 0; font-size: 14px; color: var(--color-neutral-700); max-width: 640px; text-wrap: pretty; }
    .actions:empty { display: none; }
  `,
})
export class UiPageHeader {
  readonly title = input.required<string>();
  readonly kicker = input('');
  readonly description = input('');
}
