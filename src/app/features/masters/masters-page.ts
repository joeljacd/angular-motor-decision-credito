import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActionsSection } from './actions-section';
import { CatalogsSection } from './catalogs-section';
import { ChannelsProductsSection } from './channels-products-section';
import { ParametersSection } from './parameters-section';
import { RolesSection } from './roles-section';

/**
 * Un solo componente de ruta para las 5 secciones de Maestros; la sección llega por `data.section`
 * (ver app.routes.ts) y cambia sin recargar el menú.
 */
@Component({
  selector: 'app-masters-page',
  imports: [ChannelsProductsSection, ActionsSection, ParametersSection, CatalogsSection, RolesSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (section()) {
      @case ('actions') { <app-actions-section /> }
      @case ('parameters') { <app-parameters-section /> }
      @case ('catalogs') { <app-catalogs-section /> }
      @case ('roles') { <app-roles-section /> }
      @default { <app-channels-products-section /> }
    }
  `,
})
export class MastersPage {
  /** canales | acciones | parametros | catalogos | roles */
  readonly section = input('channels');
}
