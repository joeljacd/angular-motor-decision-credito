import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CatalogHeader } from '@core/api/masters.api';
import { UiAlert, UiButton, UiCard, UiPageHeader, UiTableSkeleton } from '@shared/ui';
import { GridAction, GridColumn, GridRow, MasterGrid } from './master-grid';
import { MasterSection } from './master-section';

const COLUMNS: GridColumn[] = [
  { key: 'code', label: 'Código', kind: 'mono' },
  { key: 'name', label: 'Nombre' },
  { key: 'source', label: 'Fuente' },
  { key: 'items', label: 'Elementos (vigente)' },
];

/** Catálogos: solo las cabeceras. Sus elementos se versionan dentro de cada borrador de flujo. */
@Component({
  selector: 'app-catalogs-section',
  imports: [UiPageHeader, UiButton, UiCard, UiAlert, UiTableSkeleton, MasterGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }`,
  template: `
    <ui-page-header kicker="Maestros" title="Catálogos" description="Cabeceras de catálogos. Los elementos se versionan dentro de cada borrador de flujo.">
      <button ui-button variant="primary" [disabled]="!requests.canEdit()" (click)="form(null)">+ Catálogo</button>
    </ui-page-header>
    @if (masters.error()) {
      <ui-alert tone="error">No fue posible cargar los maestros.</ui-alert>
    } @else if (!masters.loaded()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="4" /></ui-card>
    } @else {
      <app-master-grid [columns]="columns" [rows]="rows()" [editable]="requests.canEdit()" [actionsOf]="actionsOf" [pendingOf]="pendingOf" />
    }
  `,
})
export class CatalogsSection extends MasterSection {
  protected readonly columns = COLUMNS;
  protected readonly rows = computed(() => (this.masters.snapshot()?.catalogs ?? []) as unknown as GridRow[]);

  protected readonly pendingOf = (row: GridRow) => this.requests.pendingFor((row as unknown as CatalogHeader).code)?.id;
  protected readonly actionsOf = (row: GridRow): GridAction[] => [{ label: 'Editar', run: () => this.form(row as unknown as CatalogHeader) }];

  protected form(catalog: CatalogHeader | null): void {
    const isNew = catalog === null;
    const all = this.masters.snapshot()?.catalogs ?? [];
    this.openForm({
      kicker: 'Catálogo',
      title: isNew ? 'Nuevo catálogo' : catalog.code,
      type: 'Catálogo',
      existingElement: isNew ? null : catalog.code,
      elementOf: (v) => String(v['code']),
      initial: isNew ? { code: '', name: '', source: 'Manual' } : { code: catalog.code, name: catalog.name, source: catalog.source },
      fields: [
        { key: 'code', label: 'Código', kind: 'text', disabled: !isNew, mono: true },
        { key: 'name', label: 'Nombre', kind: 'text' },
        { key: 'source', label: 'Fuente', kind: 'select', options: ['Manual', 'Archivo', 'Servicio'] },
      ],
      validate: (v) => {
        const errors: Record<string, string> = {};
        const code = String(v['code'] ?? '');
        if (!/^[A-Z][A-Z0-9_]{2,}$/.test(code)) errors['code'] = 'Mayúsculas, dígitos y _';
        else if (isNew && all.some((c) => c.code === code)) errors['code'] = 'Ese código ya existe';
        if (!String(v['name'] ?? '').trim()) errors['name'] = 'Obligatorio';
        return errors;
      },
    });
  }
}
