import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TPipe } from '@core/i18n';
import { UiCard, UiPageHeader } from '@shared/ui';

/**
 * Marcador de pantallas aún no migradas. La ruta, el permiso y el menú ya funcionan;
 * al portar la pantalla se reemplaza este componente por el real (ver docs/MIGRATION.md).
 */
@Component({
  selector: 'app-feature-placeholder',
  imports: [UiPageHeader, UiCard, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }
    p { margin: 0 0 8px; font-size: 14px; color: var(--color-neutral-700); }
    code { font-family: var(--font-mono); font-size: 13px; background: var(--color-code-bg); padding: 2px 6px; border: 1px solid var(--color-divider); }
  `,
  template: `
    <ui-page-header [kicker]="kicker()" [title]="title()" [description]="description()" />
    <ui-card padding="lg">
      <span class="kicker">{{ 'feature.wip.kicker' | t }}</span>
      <h3>{{ 'feature.wip.title' | t }}</h3>
      <p>{{ 'feature.wip.body' | t }}</p>
      @if (prototype()) {
        <p>{{ 'feature.wip.ref' | t }}: <code>docs/prototype/screens/{{ prototype() }}</code></p>
      }
    </ui-card>
  `,
})
export class FeaturePlaceholder {
  readonly title = input.required<string>();
  readonly kicker = input('');
  readonly description = input('');
  /** Archivo de referencia en docs/prototype/screens. */
  readonly prototype = input('');
}
