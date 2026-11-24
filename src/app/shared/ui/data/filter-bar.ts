import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UiBlueprint } from '../card/blueprint.directive';

/**
 * Barra de filtros: los campos se proyectan en una grilla responsive y los botones (Limpiar/Buscar)
 * en el slot `[uiFilterActions]`.
 *
 *   <ui-filter-bar>
 *     <ui-form-field label="Estado"><ui-select … /></ui-form-field>
 *     <ng-container uiFilterActions><button ui-button size="sm">Limpiar</button></ng-container>
 *   </ui-filter-bar>
 */
@Component({
  selector: 'ui-filter-bar',
  hostDirectives: [UiBlueprint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px; padding: 16px; background: var(--color-surface); border: 1px solid var(--color-divider); }
    .fields { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; align-items: end; }
    .actions { display: flex; gap: 8px; }
    .actions:empty { display: none; }
  `,
  template: `
    <div class="fields"><ng-content /></div>
    <div class="actions"><ng-content select="[uiFilterActions]" /></div>
  `,
})
export class UiFilterBar {}
