import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { ActionMaster } from '@core/api/masters.api';
import { UiAlert, UiButton, UiCard, UiPageHeader, UiTableSkeleton } from '@shared/ui';
import { GridAction, GridColumn, GridRow, MasterGrid } from './master-grid';
import { MasterSection } from './master-section';

const COLUMNS: GridColumn[] = [
  { key: 'code', label: 'Acción', kind: 'chip', subKey: 'name' },
  { key: 'severity', label: 'Severidad' },
  { key: 'color', label: 'Color', kind: 'color' },
  { key: 'stops', label: 'Detiene', kind: 'stop' },
  { key: 'active', label: 'Activa', kind: 'yesno' },
];

/** Acciones: resultado que devuelve una política. La severidad es única y las que "detienen" cortan la evaluación. */
@Component({
  selector: 'app-actions-section',
  imports: [UiPageHeader, UiButton, UiCard, UiAlert, UiTableSkeleton, MasterGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }`,
  template: `
    <ui-page-header
      kicker="Maestros"
      title="Acciones"
      description="Resultado que devuelve una política. La severidad es única; las acciones que detienen cortan la evaluación según la regla de detención."
    >
      <button ui-button variant="primary" [disabled]="!requests.canEdit()" (click)="openNew()">+ Acción</button>
    </ui-page-header>
    @if (masters.error()) {
      <ui-alert tone="error">No fue posible cargar los maestros.</ui-alert>
    } @else if (!masters.loaded()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="5" /></ui-card>
    } @else {
      <app-master-grid
        [columns]="columns"
        [rows]="rows()"
        [stateFilter]="{ key: 'active', onLabel: 'Activa', offLabel: 'Inactiva' }"
        [editable]="requests.canEdit()"
        [actionsOf]="actionsOf"
        [pendingOf]="pendingOf"
      />
    }
  `,
})
export class ActionsSection extends MasterSection {
  protected readonly columns = COLUMNS;
  protected readonly rows = computed(() => (this.masters.snapshot()?.actions ?? []) as unknown as GridRow[]);

  private elementOf = (a: { code: string; name: string }) => `${a.code} · ${a.name}`;
  protected readonly pendingOf = (row: GridRow) => this.requests.pendingFor(this.elementOf(row as unknown as ActionMaster))?.id;

  protected readonly actionsOf = (row: GridRow): GridAction[] => {
    const a = row as unknown as ActionMaster;
    const actions: GridAction[] = [{ label: 'Editar', run: () => this.form(a) }];
    if (a.active) {
      actions.push({
        label: 'Desactivar', danger: true,
        run: () => {
          const usage = this.masters.snapshot()?.actionUsage[a.code] ?? [];
          // Una acción en uso no se desactiva: se lista dónde se usa.
          if (usage.length) return this.block(`No se puede desactivar ${a.code}`, `La acción ${a.code} · ${a.name} está en uso en ${usage.length} resultados de políticas:`, usage);
          const el = this.elementOf(a);
          void this.requestWithConfirm(
            { element: el, title: `¿Solicitar desactivar ${a.code}?`, body: 'No está en uso en ninguna versión.' },
            { type: 'Acción', action: 'Desactivar', element: el, current: { Activa: 'Sí' }, proposed: { Activa: 'No' } },
          );
        },
      });
    }
    return actions;
  };

  protected openNew(): void {
    this.form(null);
  }

  private form(action: ActionMaster | null): void {
    const isNew = action === null;
    const all = this.masters.snapshot()?.actions ?? [];
    const usage = action ? (this.masters.snapshot()?.actionUsage[action.code] ?? []) : [];
    this.openForm({
      kicker: 'Acción',
      title: isNew ? 'Nueva acción' : this.elementOf(action),
      type: 'Acción',
      existingElement: isNew ? null : this.elementOf(action),
      elementOf: (v) => `${v['code']} · ${v['name']}`,
      initial: isNew
        ? { code: '', name: '', severity: '', color: 'gray', stops: false, active: true }
        : { code: action.code, name: action.name, severity: String(action.severity), color: action.color, stops: action.stops, active: action.active },
      fields: [
        { key: 'code', label: 'Código (letra)', kind: 'text', disabled: !isNew, mono: true },
        { key: 'name', label: 'Nombre', kind: 'text' },
        { key: 'severity', label: 'Severidad (única)', kind: 'text', hint: 'Mayor severidad prevalece al combinar resultados.' },
        { key: 'color', label: 'Color', kind: 'select', options: [{ value: 'green', label: 'Verde' }, { value: 'yellow', label: 'Amarillo' }, { value: 'red', label: 'Rojo' }, { value: 'gray', label: 'Gris' }] },
        { key: 'stops', label: 'Detiene la evaluación', kind: 'check' },
        { key: 'active', label: 'Activa', kind: 'check' },
      ],
      validate: (v) => {
        const errors: Record<string, string> = {};
        const code = String(v['code'] ?? '');
        if (!/^[A-Z]$/.test(code)) errors['code'] = 'Una letra mayúscula';
        else if (isNew && all.some((a) => a.code === code)) errors['code'] = 'Esa letra ya está en uso';
        if (!String(v['name'] ?? '').trim()) errors['name'] = 'Obligatorio';
        const sev = String(v['severity'] ?? '');
        const clash = all.find((a) => String(a.severity) === sev && a.code !== action?.code);
        if (!/^\d{1,3}$/.test(sev)) errors['severity'] = 'Entero de 1 a 999';
        else if (clash) errors['severity'] = `La severidad ${sev} ya está asignada a ${clash.code}`;
        if (action?.active && !v['active'] && usage.length) errors['active'] = `En uso en ${usage.length} resultados: no se puede desactivar`;
        return errors;
      },
    });
  }
}
