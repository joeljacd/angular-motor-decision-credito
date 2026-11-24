import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UiAlert, UiCard, UiFormField, UiPageHeader, UiRadioGroup, UiSelect, UiTableSkeleton, UiOption } from '@shared/ui';
import { GridAction, GridColumn, GridRow, MasterGrid } from './master-grid';
import { MasterSection } from './master-section';

const GLOBAL_COLUMNS: GridColumn[] = [
  { key: 'code', label: 'Parámetro', kind: 'mono' },
  { key: 'value', label: 'Valor', kind: 'mono' },
  { key: 'description', label: 'Descripción' },
];
const COMBO_COLUMNS: GridColumn[] = [
  { key: 'code', label: 'Parámetro', kind: 'mono' },
  { key: 'global', label: 'Valor global', kind: 'mono' },
  { key: 'override', label: 'Sobrescrito', kind: 'mono' },
  { key: 'scope', label: 'Rige', kind: 'scope' },
];

const MODE_OPTIONS: UiOption<'global' | 'combo'>[] = [
  { value: 'global', label: 'Global' },
  { value: 'combo', label: 'Por canal + producto' },
];

/** Parámetros del motor: valores globales y sobrescrituras por combinación canal + producto. */
@Component({
  selector: 'app-parameters-section',
  imports: [FormsModule, UiPageHeader, UiCard, UiAlert, UiTableSkeleton, UiRadioGroup, UiSelect, UiFormField, MasterGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }
    .scope { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-end; }
    .scope ui-form-field { min-width: 280px; }
  `,
  template: `
    <ui-page-header
      kicker="Maestros"
      title="Parámetros"
      description="Valores globales del motor y sobrescrituras por canal + producto. La vista por combinación indica qué valor rige."
    />
    <ui-card padding="md">
      <div class="scope">
        <ui-radio-group [options]="modes" [ngModel]="mode()" (ngModelChange)="mode.set($event)" />
        @if (mode() === 'combo') {
          <ui-form-field label="Canal + producto">
            <ui-select [options]="comboOptions()" [ngModel]="combo()" (ngModelChange)="combo.set($event)" />
          </ui-form-field>
        }
      </div>
    </ui-card>
    @if (masters.error()) {
      <ui-alert tone="error">No fue posible cargar los maestros.</ui-alert>
    } @else if (!masters.loaded()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="4" /></ui-card>
    } @else {
      <app-master-grid [columns]="columns()" [rows]="rows()" [editable]="requests.canEdit()" [actionsOf]="actionsOf" [pendingOf]="pendingOf" />
    }
  `,
})
export class ParametersSection extends MasterSection {
  protected readonly modes = MODE_OPTIONS;
  protected readonly mode = signal<'global' | 'combo'>('global');
  protected readonly combo = signal('1-1');

  protected readonly comboOptions = computed<UiOption<string>[]>(() =>
    (this.masters.snapshot()?.parameters.combos ?? []).map((c) => ({ value: c.key, label: c.label })),
  );
  private readonly comboLabel = computed(() => this.comboOptions().find((o) => o.value === this.combo())?.label ?? '');

  protected readonly columns = computed(() => (this.mode() === 'global' ? GLOBAL_COLUMNS : COMBO_COLUMNS));

  protected readonly rows = computed<GridRow[]>(() => {
    const p = this.masters.snapshot()?.parameters;
    if (!p) return [];
    if (this.mode() === 'global') return p.globals.map((g) => ({ ...g }));
    const overrides = p.overrides[this.combo()] ?? {};
    return p.globals.map((g) => ({
      code: g.code, global: g.value, override: overrides[g.code] ?? '—', scope: overrides[g.code] ? 'Sobrescrito' : 'Global', description: g.description,
    }));
  });

  /** El elemento de la solicitud incluye la combinación cuando se trabaja por canal + producto. */
  private elementOf(code: string): string {
    return this.mode() === 'combo' ? `${code} · ${this.comboLabel()}` : code;
  }
  protected readonly pendingOf = (row: GridRow) => this.requests.pendingFor(this.elementOf(String(row['code'])))?.id;

  protected readonly actionsOf = (row: GridRow): GridAction[] => {
    const code = String(row['code']);
    if (this.mode() === 'global') return [{ label: 'Editar', run: () => this.edit(code, String(row['value']), false) }];
    const overridden = row['scope'] === 'Sobrescrito';
    const actions: GridAction[] = [
      { label: overridden ? 'Editar sobrescritura' : 'Sobrescribir', run: () => this.edit(code, String(overridden ? row['override'] : row['global']), true) },
    ];
    if (overridden) {
      const el = this.elementOf(code);
      actions.push({
        label: 'Usar global',
        run: () => this.requestWithConfirm(
          { element: el, title: `¿Quitar la sobrescritura de ${code}?`, body: `Regirá el valor global ${row['global']} para esta combinación.` },
          { type: 'Parámetro', action: 'Quitar sobrescritura', element: el, current: { Valor: String(row['override']) }, proposed: { Valor: `${row['global']} (global)` } },
        ),
      });
    }
    return actions;
  };

  private edit(code: string, value: string, isOverride: boolean): void {
    const el = this.elementOf(code);
    this.openForm({
      kicker: isOverride ? 'Sobrescritura por canal + producto' : 'Parámetro',
      title: isOverride ? code : el,
      type: 'Parámetro',
      existingElement: el,
      elementOf: () => el,
      action: isOverride ? 'Sobrescribir' : 'Cambio',
      initial: { code, value },
      currentOverride: { [isOverride ? `Valor para ${this.comboLabel()}` : 'Valor global']: value },
      fields: [
        { key: 'code', label: 'Parámetro', kind: 'text', disabled: true, mono: true },
        { key: 'value', label: isOverride ? `Valor para ${this.comboLabel()}` : 'Valor global', kind: 'text', mono: true },
      ],
      validate: (v): Record<string, string> => {
        const text = String(v['value'] ?? '');
        if (!text.trim()) return { value: 'Obligatorio' };
        if (code === 'DIAS_VENCIMIENTO' && !(/^\d+$/.test(text) && +text >= 1 && +text <= 90)) return { value: 'Entero entre 1 y 90' };
        if (code === 'FORMATO_FECHA' && !['MM/dd/yyyy', 'dd/MM/yyyy', 'yyyy-MM-dd'].includes(text)) return { value: 'Formatos admitidos: MM/dd/yyyy, dd/MM/yyyy, yyyy-MM-dd' };
        return {};
      },
    });
  }
}
