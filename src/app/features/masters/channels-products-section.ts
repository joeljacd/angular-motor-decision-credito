import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CodedEntity } from '@core/api/masters.api';
import { UiButton, UiCard, UiPageHeader, UiTab, UiTabs, UiTableSkeleton, UiAlert } from '@shared/ui';
import { RouterLink } from '@angular/router';
import { GridAction, GridColumn, GridRow, MasterGrid } from './master-grid';
import { MasterSection } from './master-section';

type SubTab = 'canales' | 'productos' | 'canalproducto';

const COLUMNS: GridColumn[] = [
  { key: 'code', label: 'Código', kind: 'mono' },
  { key: 'name', label: 'Nombre' },
  { key: 'enabled', label: 'Habilitado', kind: 'yesno' },
  { key: 'versions', label: 'Versiones' },
];

/** Canales, productos y la matriz canal–producto (combinaciones habilitadas para configurar flujos). */
@Component({
  selector: 'app-channels-products-section',
  imports: [RouterLink, UiPageHeader, UiTabs, UiButton, UiCard, UiAlert, UiTableSkeleton, MasterGrid],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './channels-products-section.scss',
  template: `
    <ui-page-header
      kicker="Maestros"
      title="Canales y productos"
      description="Códigos de 1 a 4 dígitos y las combinaciones habilitadas entre ellos. Un canal o producto con versiones no se elimina: solo se solicita deshabilitarlo."
    >
      @if (tab() !== 'canalproducto') {
        <button ui-button variant="primary" [disabled]="!requests.canEdit()" (click)="openNew()">+ {{ tab() === 'canales' ? 'Canal' : 'Producto' }}</button>
      }
    </ui-page-header>

    <ui-tabs [tabs]="tabs()" [(active)]="tab" />

    @if (masters.error()) {
      <ui-alert tone="error">No fue posible cargar los maestros.</ui-alert>
    } @else if (!masters.loaded()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="5" /></ui-card>
    } @else if (tab() === 'canalproducto') {
      <ui-card padding="md">
        <div class="ui-table-wrap">
          <table class="ui-table matrix">
            <thead>
              <tr>
                <th>Canal \ Producto</th>
                @for (p of snapshot().products; track p.code) { <th>{{ p.code }} {{ p.name }}</th> }
              </tr>
            </thead>
            <tbody>
              @for (c of snapshot().channels; track c.code) {
                <tr>
                  <td>{{ c.code }} {{ c.name }}</td>
                  @for (p of snapshot().products; track p.code) {
                    <td>
                      <div class="cell" [class.dim]="!c.enabled || !p.enabled">
                        <button type="button" class="switch" role="switch" [class.on]="isOn(c, p)" [attr.aria-checked]="isOn(c, p)"
                          [attr.aria-label]="c.name + ' / ' + p.name" [title]="switchTitle(c, p)" [disabled]="switchDisabled(c, p)" (click)="toggleCombo(c, p)"><span></span></button>
                        @if (pendingCombo(c, p); as pid) {
                          <a [routerLink]="['/solicitudes']" [queryParams]="{ id: pid }">Cambio pendiente</a>
                        }
                      </div>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </div>
        <p class="hint">Cada interruptor crea una solicitud de cambio; la matriz refleja lo vigente.</p>
      </ui-card>
    } @else {
      <app-master-grid
        [columns]="columns"
        [rows]="rows()"
        [stateFilter]="{ key: 'enabled', onLabel: 'Habilitado', offLabel: 'Deshabilitado' }"
        [editable]="requests.canEdit()"
        [actionsOf]="actionsOf"
        [pendingOf]="pendingOf"
      />
    }
  `,
})
export class ChannelsProductsSection extends MasterSection {
  protected readonly columns = COLUMNS;
  protected readonly tab = signal<string>('canales');
  protected readonly snapshot = computed(() => this.masters.snapshot()!);

  protected readonly tabs = computed<UiTab[]>(() => {
    const s = this.masters.snapshot();
    return [
      { key: 'canales', label: 'Canales', count: s?.channels.length },
      { key: 'productos', label: 'Productos', count: s?.products.length },
      { key: 'canalproducto', label: 'Canal–producto', count: s?.matrix.length },
    ];
  });

  protected readonly rows = computed<GridRow[]>(() => {
    const s = this.masters.snapshot();
    return ((this.tab() === 'productos' ? s?.products : s?.channels) ?? []) as unknown as GridRow[];
  });

  private get kind(): 'Canal' | 'Producto' {
    return this.tab() === 'productos' ? 'Producto' : 'Canal';
  }
  private elementOf = (e: { code: string; name: string }) => `${e.code} ${e.name}`;

  protected readonly pendingOf = (row: GridRow) => this.requests.pendingFor(this.elementOf(row as unknown as CodedEntity))?.id;

  protected readonly actionsOf = (row: GridRow): GridAction[] => {
    const e = row as unknown as CodedEntity;
    const el = this.elementOf(e);
    const type = this.kind;
    const actions: GridAction[] = [{ label: 'Editar', run: () => this.openEdit(e) }];
    if (e.enabled && e.versions > 0) {
      actions.push({
        label: 'Solicitar deshabilitar', danger: true,
        run: () => this.requestWithConfirm(
          { element: el, title: `¿Solicitar deshabilitar ${el}?`, body: `Tiene ${e.versions} versiones, por eso no se puede eliminar. Al aprobarse, el motor dejará de evaluar sus combinaciones.` },
          { type, action: 'Deshabilitar', element: el, current: { Habilitado: 'Sí' }, proposed: { Habilitado: 'No' } },
        ),
      });
    } else if (e.versions === 0) {
      actions.push({
        label: 'Solicitar eliminar', danger: true,
        run: () => this.requestWithConfirm(
          { element: el, title: `¿Solicitar eliminar ${el}?`, body: 'No tiene versiones asociadas.' },
          { type, action: 'Baja', element: el, current: { Nombre: e.name }, proposed: {} },
        ),
      });
    }
    if (!e.enabled) {
      actions.push({
        label: 'Solicitar habilitar',
        run: () => this.requestWithConfirm(
          { element: el, title: `¿Solicitar habilitar ${el}?`, body: 'Quedará disponible para configurar flujos.' },
          { type, action: 'Habilitar', element: el, current: { Habilitado: 'No' }, proposed: { Habilitado: 'Sí' } },
        ),
      });
    }
    return actions;
  };

  protected openNew(): void {
    this.form(null);
  }
  private openEdit(e: CodedEntity): void {
    this.form(e);
  }

  /** Alta (entity = null) o edición de canal/producto. */
  private form(entity: CodedEntity | null): void {
    const type = this.kind;
    const list = (this.tab() === 'productos' ? this.masters.snapshot()?.products : this.masters.snapshot()?.channels) ?? [];
    const isNew = entity === null;
    this.openForm({
      kicker: type,
      title: isNew ? `Nuevo ${type.toLowerCase()}` : this.elementOf(entity),
      type,
      existingElement: isNew ? null : this.elementOf(entity),
      elementOf: (v) => this.elementOf({ code: String(v['code']), name: String(v['name']) }),
      initial: isNew ? { code: '', name: '', enabled: true } : { code: entity.code, name: entity.name, enabled: entity.enabled },
      fields: [
        { key: 'code', label: 'Código', kind: 'text', disabled: !isNew, mono: true, hint: '1 a 4 dígitos' },
        { key: 'name', label: 'Nombre', kind: 'text' },
        { key: 'enabled', label: 'Habilitado', kind: 'check' },
      ],
      validate: (v) => {
        const errors: Record<string, string> = {};
        const code = String(v['code'] ?? '');
        if (!/^\d{1,4}$/.test(code)) errors['code'] = 'Código de 1 a 4 dígitos';
        else if (isNew && list.some((x) => x.code === code)) errors['code'] = 'Ese código ya existe';
        if (!String(v['name'] ?? '').trim()) errors['name'] = 'Obligatorio';
        return errors;
      },
    });
  }

  // ── Matriz canal–producto ─────────────────────────────────────────────

  protected isOn(c: CodedEntity, p: CodedEntity): boolean {
    return this.snapshot().matrix.includes(`${c.code}-${p.code}`);
  }
  private comboElement(c: CodedEntity, p: CodedEntity): string {
    return `${c.code} ${c.name} / ${p.code} ${p.name}`;
  }
  protected pendingCombo(c: CodedEntity, p: CodedEntity): string | undefined {
    return this.requests.pendingFor(this.comboElement(c, p))?.id;
  }
  protected switchDisabled(c: CodedEntity, p: CodedEntity): boolean {
    return !this.requests.canEdit() || !c.enabled || !p.enabled || !!this.pendingCombo(c, p);
  }
  protected switchTitle(c: CodedEntity, p: CodedEntity): string {
    if (!c.enabled || !p.enabled) return 'Canal o producto deshabilitado';
    if (this.pendingCombo(c, p)) return 'Hay una solicitud pendiente';
    return this.isOn(c, p) ? 'Solicitar deshabilitar' : 'Solicitar habilitar';
  }

  protected toggleCombo(c: CodedEntity, p: CodedEntity): void {
    const on = this.isOn(c, p);
    const el = this.comboElement(c, p);
    const labels = { Canal: `${c.code} ${c.name}`, Producto: `${p.code} ${p.name}` };
    void this.requestWithConfirm(
      {
        element: el,
        title: `¿Solicitar ${on ? 'deshabilitar' : 'habilitar'} ${el}?`,
        body: on ? 'Si la combinación tiene una versión vigente, el motor dejará de evaluarla al aprobarse.' : 'La combinación quedará disponible para abrir borradores en Flujos.',
      },
      { type: 'Canal–producto', action: on ? 'Deshabilitar' : 'Habilitar', element: el, current: { ...labels, Habilitado: on ? 'Sí' : 'No' }, proposed: { ...labels, Habilitado: on ? 'No' : 'Sí' } },
    );
  }
}
