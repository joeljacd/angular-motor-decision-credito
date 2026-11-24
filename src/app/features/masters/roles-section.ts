import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { RoleMapping } from '@core/api/masters.api';
import { UiAlert, UiButton, UiCard, UiIcon, UiPageHeader, UiTableSkeleton } from '@shared/ui';
import { GridAction, GridColumn, GridRow, MasterGrid } from './master-grid';
import { MasterSection } from './master-section';

const COLUMNS: GridColumn[] = [
  { key: 'code', label: 'Id de rol (IdP)', kind: 'mono' },
  { key: 'name', label: 'Nombre' },
  { key: 'canRequest', label: 'Solicitar', kind: 'check' },
  { key: 'canApprove', label: 'Aprobar', kind: 'check' },
  { key: 'canAudit', label: 'Auditar', kind: 'check' },
  { key: 'active', label: 'Activo', kind: 'yesno' },
];

/** Roles: mapeo de grupos del proveedor de identidad a capacidades. Siempre debe quedar un rol aprobador activo. */
@Component({
  selector: 'app-roles-section',
  imports: [UiPageHeader, UiButton, UiCard, UiAlert, UiIcon, UiTableSkeleton, MasterGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }
    .sealed { display: flex; align-items: center; gap: 10px; padding: 10px 14px; color: var(--color-success); background: var(--color-success-bg); border: 1px solid var(--color-success); font-size: 13px; }
    .sealed small { color: var(--color-neutral-700); }
  `,
  template: `
    <ui-page-header
      kicker="Maestros"
      title="Roles"
      description="Mapeo de grupos del proveedor de identidad a capacidades. Siempre debe existir al menos un rol aprobador activo."
    >
      <button ui-button variant="primary" [disabled]="!requests.canEdit()" (click)="form(null)">+ Rol</button>
    </ui-page-header>
    <div class="sealed"><ui-icon name="shield-check" [size]="20" /><strong>Tabla de roles sellada</strong><small>Última verificación 22/11/2026 08:00 · llave kms-ba-prod-03 · {{ count() }} registros</small></div>
    @if (masters.error()) {
      <ui-alert tone="error">No fue posible cargar los maestros.</ui-alert>
    } @else if (!masters.loaded()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="4" /></ui-card>
    } @else {
      <app-master-grid
        [columns]="columns"
        [rows]="rows()"
        [stateFilter]="{ key: 'active', onLabel: 'Activo', offLabel: 'Inactivo' }"
        [editable]="requests.canEdit()"
        [actionsOf]="actionsOf"
        [pendingOf]="pendingOf"
      />
    }
  `,
})
export class RolesSection extends MasterSection {
  protected readonly columns = COLUMNS;
  protected readonly rows = computed(() => (this.masters.snapshot()?.roles ?? []) as unknown as GridRow[]);
  protected readonly count = computed(() => this.masters.snapshot()?.roles.length ?? 0);

  /** Roles aprobadores activos: el último no se puede desactivar ni quitar su capacidad. */
  private readonly approvers = computed(() => (this.masters.snapshot()?.roles ?? []).filter((r) => r.active && r.canApprove));
  private isLastApprover(role: RoleMapping): boolean {
    const list = this.approvers();
    return role.canApprove && list.length === 1 && list[0].code === role.code;
  }

  protected readonly pendingOf = (row: GridRow) => this.requests.pendingFor((row as unknown as RoleMapping).code)?.id;

  protected readonly actionsOf = (row: GridRow): GridAction[] => {
    const role = row as unknown as RoleMapping;
    const actions: GridAction[] = [{ label: 'Editar', run: () => this.form(role) }];
    if (role.active) {
      actions.push({
        label: 'Desactivar', danger: true,
        run: () => {
          if (this.isLastApprover(role)) return this.block('No se puede desactivar este rol', 'Es el único rol aprobador activo. Sin él, ningún cambio podría aprobarse. Activa o crea otro rol aprobador primero.');
          void this.requestWithConfirm(
            { element: role.code, title: `¿Solicitar desactivar ${role.code}?`, body: 'Los usuarios de este grupo perderán sus capacidades al aprobarse.' },
            { type: 'Rol', action: 'Desactivar', element: role.code, current: { Activo: 'Sí' }, proposed: { Activo: 'No' } },
          );
        },
      });
    }
    return actions;
  };

  protected form(role: RoleMapping | null): void {
    const isNew = role === null;
    const all = this.masters.snapshot()?.roles ?? [];
    this.openForm({
      kicker: 'Rol',
      title: isNew ? 'Nuevo rol' : role.code,
      type: 'Rol',
      existingElement: isNew ? null : role.code,
      elementOf: (v) => String(v['code']),
      initial: isNew
        ? { code: '', name: '', canRequest: false, canApprove: false, canAudit: false, active: true }
        : { code: role.code, name: role.name, canRequest: role.canRequest, canApprove: role.canApprove, canAudit: role.canAudit, active: role.active },
      fields: [
        { key: 'code', label: 'Id de rol (proveedor de identidad)', kind: 'text', disabled: !isNew, mono: true },
        { key: 'name', label: 'Nombre', kind: 'text' },
        { key: 'canRequest', label: 'Puede solicitar / editar', kind: 'check' },
        { key: 'canApprove', label: 'Puede aprobar', kind: 'check' },
        { key: 'canAudit', label: 'Puede auditar', kind: 'check' },
        { key: 'active', label: 'Activo', kind: 'check' },
      ],
      validate: (v) => {
        const errors: Record<string, string> = {};
        const code = String(v['code'] ?? '');
        if (!/^GG-[A-Z0-9-]+$/.test(code)) errors['code'] = 'Formato GG-NOMBRE del proveedor de identidad';
        else if (isNew && all.some((r) => r.code === code)) errors['code'] = 'Ese rol ya existe';
        if (!String(v['name'] ?? '').trim()) errors['name'] = 'Obligatorio';
        if (role && this.isLastApprover(role) && (!v['canApprove'] || !v['active'])) {
          errors['active'] = 'Es el único rol aprobador activo: no puede perder «Aprobar» ni desactivarse';
        }
        return errors;
      },
    });
  }
}
