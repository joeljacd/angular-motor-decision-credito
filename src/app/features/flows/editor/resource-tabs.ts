import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlowCatalog, FlowDocument, FlowResources, FlowVariable, RequestField, VariableType } from '@core/api/flow.models';
import { UiButton, UiCard, UiCheckbox, UiFormField, UiInput, UiOption, UiSegmented, UiSelect, UiTag, UiTextarea } from '@shared/ui';

export type ResourceKind = 'vars' | 'fields' | 'cats';
type Change = (r: FlowResources) => void;

const TYPES: UiOption<VariableType>[] = (['TEXT', 'NUMBER', 'MONEY', 'DATE'] as const).map((t) => ({ value: t, label: t }));
const ORIGINS: UiOption<'request' | 'calculated'>[] = [
  { value: 'request', label: 'Campo del request' },
  { value: 'calculated', label: 'Calculada' },
];
const FUNCTIONS: UiOption<string>[] = [
  { value: 'AGE', label: 'Edad' },
  { value: 'YEARS_SINCE', label: 'Años transcurridos' },
  { value: 'COUNT', label: 'Conteo' },
  { value: 'SUM', label: 'Suma' },
];

/** Contenido de las pestañas de recursos: variables, campos del request y catálogos (edición solo en borrador). */
@Component({
  selector: 'app-resource-tabs',
  imports: [FormsModule, UiCard, UiButton, UiTag, UiInput, UiSelect, UiSegmented, UiCheckbox, UiFormField, UiTextarea],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './resource-tabs.scss',
  template: `
    @switch (kind()) {
      @case ('vars') {
        <ui-card padding="md">
          <div class="bar">
            <div><h3>Variables del flujo</h3><p>Origen: campo del request o cálculo predefinido. No hay fórmulas libres.</p></div>
            @if (editable()) { <button ui-button variant="primary" (click)="newVariable()">+ Variable</button> }
          </div>
          <div class="ui-table-wrap"><table class="ui-table">
            <thead><tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Sensible</th><th>Origen</th><th>Ruta o cálculo</th><th>Usada en</th><th></th></tr></thead>
            <tbody>
              @for (v of resources().variables; track v.code) {
                <tr>
                  <td class="mono">{{ v.code }}</td><td>{{ v.name }}</td><td>{{ v.type }}</td>
                  <td>@if (v.sensitive) { <ui-tag size="sm" tone="warning">Sensible</ui-tag> } @else { — }</td>
                  <td>{{ v.origin === 'request' ? 'Campo del request' : 'Calculada' }}</td>
                  <td class="mono">{{ v.origin === 'request' ? v.path : fnLabel(v.fn) + '(' + (v.field ?? '') + ')' }}</td>
                  <td>@for (u of usage(v.code); track u) { <span class="use">{{ u }}</span> } @empty { <span class="none">Sin uso</span> }</td>
                  <td class="row-actions"><button ui-button size="sm" variant="ghost" (click)="editVariable(v)">{{ editable() ? 'Editar' : 'Ver' }}</button></td>
                </tr>
              }
            </tbody>
          </table></div>
        </ui-card>
        @if (varForm(); as f) {
          <ui-card padding="md">
            <div class="panel-head"><span class="kicker">{{ f.isNew ? 'Nueva variable' : 'Variable' }}</span><h3>{{ f.isNew ? 'Agregar al borrador' : f.code }}</h3></div>
            <div class="grid2">
              <ui-form-field label="Código"><ui-input [mono]="true" [disabled]="!editable() || !f.isNew" [ngModel]="f.code" (ngModelChange)="patchVar({ code: ($event + '').toUpperCase() })" />@if (varErrors().code) { <p class="err">{{ varErrors().code }}</p> }</ui-form-field>
              <ui-form-field label="Nombre"><ui-input [disabled]="!editable()" [ngModel]="f.name" (ngModelChange)="patchVar({ name: $event })" />@if (varErrors().name) { <p class="err">{{ varErrors().name }}</p> }</ui-form-field>
              <ui-form-field label="Tipo de dato">
                <ui-select [options]="types" [disabled]="!editable() || !f.isNew && usage(f.code).length > 0" [ngModel]="f.type" (ngModelChange)="patchVar({ type: $event })" />
                @if (!f.isNew && usage(f.code).length) { <p class="hint">No se puede cambiar el tipo ni eliminar: la usan {{ usage(f.code).join(', ') }}.</p> }
              </ui-form-field>
              <ui-form-field label="Sensibilidad"><ui-checkbox [disabled]="!editable()" [ngModel]="f.sensitive" (ngModelChange)="patchVar({ sensitive: $event })">Dato sensible (se enmascara en historial y logs)</ui-checkbox></ui-form-field>
              <ui-form-field label="Origen"><ui-segmented [options]="origins" [disabled]="!editable()" [ngModel]="f.origin" (ngModelChange)="patchVar({ origin: $event })" /></ui-form-field>
              @if (f.origin === 'request') {
                <ui-form-field label="Ruta del request"><ui-select [options]="pathOptions()" [disabled]="!editable()" [ngModel]="f.path ?? ''" (ngModelChange)="patchVar({ path: $event })" />@if (varErrors().path) { <p class="err">{{ varErrors().path }}</p> }</ui-form-field>
              } @else {
                <ui-form-field label="Cálculo"><ui-select [options]="functions" [disabled]="!editable()" [ngModel]="f.fn ?? 'AGE'" (ngModelChange)="patchVar({ fn: $event })" /></ui-form-field>
                <ui-form-field label="Campo de origen"><ui-select [options]="pathOptions()" [disabled]="!editable()" [ngModel]="f.field ?? ''" (ngModelChange)="patchVar({ field: $event })" />@if (varErrors().field) { <p class="err">{{ varErrors().field }}</p> }<p class="hint">Solo cálculos predefinidos: Edad, Años transcurridos, Conteo y Suma.</p></ui-form-field>
              }
            </div>
            <div class="actions">
              @if (editable() && !f.isNew) { <button ui-button variant="danger-ghost" [disabled]="usage(f.code).length > 0" (click)="removeVariable(f.code)">Eliminar</button> }
              <span class="spacer"></span>
              <button ui-button (click)="varForm.set(null)">{{ editable() ? 'Cancelar' : 'Cerrar' }}</button>
              @if (editable()) { <button ui-button variant="primary" (click)="saveVariable()">Guardar en el borrador</button> }
            </div>
          </ui-card>
        }
      }
      @case ('fields') {
        <ui-card padding="md">
          <div class="bar">
            <div><h3>Campos del request</h3><p>Contrato de entrada del motor, agrupado por categoría.</p></div>
            @if (editable()) { <button ui-button variant="primary" (click)="newField()">+ Campo</button> }
          </div>
          <div class="ui-table-wrap"><table class="ui-table">
            <thead><tr><th>Ruta</th><th>Tipo</th><th>Oblig.</th><th>Formato</th><th>Long. máx.</th><th>Catálogo de valores</th><th>Descripción</th><th>Ejemplo</th><th></th></tr></thead>
            <tbody>
              @for (g of fieldGroups(); track g.group) {
                <tr class="group-row"><td colspan="9"><strong>{{ g.group }}</strong> · {{ g.items.length }} campos</td></tr>
                @for (f of g.items; track f.path) {
                  <tr>
                    <td class="mono">{{ f.path }} @if (f.sensitive) { <ui-tag size="sm" tone="warning">Dato sensible</ui-tag> }</td>
                    <td>{{ f.type }}</td><td>{{ f.required ? 'Sí' : 'No' }}</td><td class="mono">{{ f.format || '—' }}</td><td>{{ f.maxLength || '—' }}</td>
                    <td class="mono">{{ f.catalog || '—' }}</td><td>{{ f.description }}</td><td class="mono">{{ f.example }}</td>
                    <td class="row-actions"><button ui-button size="sm" variant="ghost" (click)="editField(f)">{{ editable() ? 'Editar' : 'Ver' }}</button></td>
                  </tr>
                }
              }
            </tbody>
          </table></div>
        </ui-card>
        @if (fieldForm(); as f) {
          <ui-card padding="md">
            <div class="panel-head"><span class="kicker">{{ f.isNew ? 'Nuevo campo' : 'Campo' }}</span><h3>{{ f.isNew ? 'Agregar al contrato' : f.path }}</h3></div>
            <div class="grid2">
              <ui-form-field label="Categoría"><ui-input [disabled]="!editable()" [ngModel]="f.group" (ngModelChange)="patchField({ group: $event })" />@if (fieldErrors().group) { <p class="err">{{ fieldErrors().group }}</p> }</ui-form-field>
              <ui-form-field label="Tipo"><ui-select [options]="types" [disabled]="!editable()" [ngModel]="f.type" (ngModelChange)="patchField({ type: $event })" /></ui-form-field>
              <ui-form-field label="Ruta"><ui-input [mono]="true" [disabled]="!editable() || !f.isNew" [ngModel]="f.path" (ngModelChange)="patchField({ path: $event })" />@if (fieldErrors().path) { <p class="err">{{ fieldErrors().path }}</p> }</ui-form-field>
              <ui-form-field label="Formato"><ui-input [mono]="true" [disabled]="!editable()" [ngModel]="f.format ?? ''" (ngModelChange)="patchField({ format: $event })" /></ui-form-field>
              <ui-form-field label="Longitud máxima"><ui-input type="number" [disabled]="!editable()" [ngModel]="f.maxLength ?? ''" (ngModelChange)="patchField({ maxLength: $event ? +$event : undefined })" /></ui-form-field>
              <ui-form-field label="Catálogo de valores"><ui-select [options]="catalogChoices()" [disabled]="!editable()" [ngModel]="f.catalog ?? ''" (ngModelChange)="patchField({ catalog: $event || undefined })" /></ui-form-field>
              <ui-form-field label="Obligatorio"><ui-checkbox [disabled]="!editable()" [ngModel]="f.required" (ngModelChange)="patchField({ required: $event })">Obligatorio</ui-checkbox></ui-form-field>
              <ui-form-field label="Sensible"><ui-checkbox [disabled]="!editable()" [ngModel]="f.sensitive" (ngModelChange)="patchField({ sensitive: $event })">Dato sensible</ui-checkbox></ui-form-field>
              <ui-form-field label="Descripción"><ui-input [disabled]="!editable()" [ngModel]="f.description" (ngModelChange)="patchField({ description: $event })" /></ui-form-field>
              <ui-form-field label="Ejemplo"><ui-input [mono]="true" [disabled]="!editable()" [ngModel]="f.example" (ngModelChange)="patchField({ example: $event })" /></ui-form-field>
            </div>
            <div class="actions">
              @if (editable() && !f.isNew) { <button ui-button variant="danger-ghost" [disabled]="fieldInUse(f.path)" (click)="removeField(f.path)">Eliminar</button> }
              @if (!f.isNew && fieldInUse(f.path)) { <span class="hint">Una variable usa este campo.</span> }
              <span class="spacer"></span>
              <button ui-button (click)="fieldForm.set(null)">{{ editable() ? 'Cancelar' : 'Cerrar' }}</button>
              @if (editable()) { <button ui-button variant="primary" (click)="saveField()">Guardar en el borrador</button> }
            </div>
          </ui-card>
        }
      }
      @case ('cats') {
        <div class="cats">
          <ui-card padding="md">
            <h3>Catálogos del borrador</h3>
            <ul class="cat-list">
              @for (c of resources().catalogs; track c.code) {
                <li><button type="button" [class.on]="current()?.code === c.code" (click)="catalogCode.set(c.code)"><span class="mono">{{ c.code }}</span><span>{{ c.name }}</span><span class="n">{{ c.items.length }}</span></button></li>
              }
            </ul>
          </ui-card>
          <ui-card padding="md">
            @if (current(); as cur) {
              <div class="bar">
                <div><h3><span class="mono">{{ cur.code }}</span> · {{ cur.name }}</h3></div>
                @if (editable()) { <div class="bar-actions"><button ui-button (click)="openBulk()">Carga masiva</button><button ui-button variant="primary" (click)="addItem()">+ Elemento</button></div> }
              </div>
              @if (!cur.items.length) {
                <p class="empty"><strong>Este catálogo no tiene elementos</strong><br />Las condiciones que lo usen no encontrarán coincidencias. Agrega elementos uno a uno o con una carga masiva.</p>
              } @else {
                <div class="ui-table-wrap"><table class="ui-table">
                  <thead><tr><th>Código</th><th>Descripción</th><th>Activo</th><th></th></tr></thead>
                  <tbody>
                    @for (it of cur.items; track $index) {
                      <tr>
                        <td><ui-input [mono]="true" [disabled]="!editable()" [ngModel]="it.code" (ngModelChange)="editItem(cur.code, $index, { code: $event })" /></td>
                        <td><ui-input [disabled]="!editable()" [ngModel]="it.label" (ngModelChange)="editItem(cur.code, $index, { label: $event })" /></td>
                        <td><ui-checkbox [disabled]="!editable()" [ngModel]="it.active" (ngModelChange)="editItem(cur.code, $index, { active: $event })" /></td>
                        <td class="row-actions">@if (editable()) { <button ui-button size="sm" variant="danger-ghost" (click)="removeItem(cur.code, $index)">Eliminar</button> }</td>
                      </tr>
                    }
                  </tbody>
                </table></div>
              }
              @if (bulk(); as b) {
                <div class="bulk">
                  <div class="panel-head"><span class="kicker">Carga masiva · {{ cur.code }}</span></div>
                  <p class="hint">CSV con encabezado fijo <code>code,description,active</code> · UTF-8 · máximo 5 000 filas.</p>
                  <ui-segmented [options]="bulkModes" [ngModel]="b.mode" (ngModelChange)="patchBulk({ mode: $event })" />
                  <p class="hint">{{ b.mode === 'add' ? 'Agrega al final; si un código ya existe, se rechaza la carga.' : 'Reemplaza todos los elementos actuales por los del archivo.' }}</p>
                  <ui-textarea [rows]="7" placeholder="code,description,active&#10;0901,Guayaquil,true" [ngModel]="b.text" (ngModelChange)="patchBulk({ text: $event })" />
                  @if (bulkPreview(); as p) {
                    <p [class]="p.error ? 'err' : 'hint'">{{ p.error || p.rows.length + ' filas válidas · modo ' + (b.mode === 'add' ? 'Agregar' : 'Reemplazar') }}</p>
                  }
                  <div class="actions"><span class="spacer"></span><button ui-button (click)="bulk.set(null)">Cancelar</button><button ui-button variant="primary" [disabled]="!bulkPreview() || !!bulkPreview()!.error" (click)="applyBulk()">Procesar carga</button></div>
                </div>
              }
            }
          </ui-card>
        </div>
      }
    }
  `,
})
export class ResourceTabs {
  readonly kind = input.required<ResourceKind | string>();
  readonly resources = input.required<FlowResources>();
  readonly doc = input<FlowDocument | null>(null);
  readonly editable = input(false);
  /** Catálogo a mostrar al llegar desde la validación. */
  readonly focusCatalog = input<string | null>(null);
  readonly changed = output<Change>();

  protected readonly types = TYPES;
  protected readonly origins = ORIGINS;
  protected readonly functions = FUNCTIONS;
  protected readonly bulkModes: UiOption<'add' | 'replace'>[] = [{ value: 'add', label: 'Agregar' }, { value: 'replace', label: 'Reemplazar' }];

  protected fnLabel(fn?: string): string {
    return FUNCTIONS.find((f) => f.value === fn)?.label ?? fn ?? '';
  }

  /** Políticas que usan una variable. */
  protected usage(code: string): string[] {
    const out: string[] = [];
    const walk = (g: { children: ({ type: string; variable?: string; children?: unknown[] })[] }): boolean =>
      g.children.some((c) => (c.type === 'group' ? walk(c as never) : c.variable === code));
    for (const cat of this.doc()?.categories ?? []) for (const p of cat.policies) if (walk(p.root as never)) out.push(p.code);
    return out;
  }

  protected readonly pathOptions = computed<UiOption<string>[]>(() => [
    { value: '', label: 'Selecciona una ruta' },
    ...this.resources().fields.map((f) => ({ value: f.path, label: f.path })),
  ]);
  protected readonly catalogChoices = computed<UiOption<string>[]>(() => [{ value: '', label: 'Ninguno' }, ...this.resources().catalogs.map((c) => ({ value: c.code, label: c.code }))]);
  protected readonly fieldGroups = computed(() => {
    const map = new Map<string, RequestField[]>();
    for (const f of this.resources().fields) map.set(f.group, [...(map.get(f.group) ?? []), f]);
    return [...map].map(([group, items]) => ({ group, items }));
  });
  protected fieldInUse(path: string): boolean {
    return this.resources().variables.some((v) => v.path === path || v.field === path);
  }

  // ── Variables ────────────────────────────────────────────────────────
  protected readonly varForm = signal<(FlowVariable & { isNew: boolean }) | null>(null);
  protected readonly varTouched = signal(false);
  protected readonly varErrors = computed(() => {
    const f = this.varForm();
    if (!f || !this.varTouched()) return {} as { code?: string; name?: string; path?: string; field?: string };
    const e: { code?: string; name?: string; path?: string; field?: string } = {};
    if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(f.code)) e.code = 'Mayúsculas, números y guion bajo (ej. EDAD_SOLICITANTE)';
    else if (f.isNew && this.resources().variables.some((v) => v.code === f.code)) e.code = 'Ya existe una variable con ese código';
    if (!f.name.trim()) e.name = 'El nombre es obligatorio';
    if (f.origin === 'request' && !f.path) e.path = 'Selecciona una ruta';
    if (f.origin === 'calculated' && !f.field) e.field = 'Selecciona el campo de origen';
    return e;
  });
  protected newVariable(): void {
    this.varTouched.set(false);
    this.varForm.set({ isNew: true, code: '', name: '', type: 'TEXT', sensitive: false, origin: 'request', path: '' });
  }
  protected editVariable(v: FlowVariable): void {
    this.varTouched.set(false);
    this.varForm.set({ ...v, isNew: false });
  }
  protected patchVar(change: Partial<FlowVariable>): void {
    this.varTouched.set(true);
    const f = this.varForm();
    if (f) this.varForm.set({ ...f, ...change });
  }
  protected saveVariable(): void {
    this.varTouched.set(true);
    const f = this.varForm();
    if (!f || Object.keys(this.varErrors()).length) return;
    const { isNew, ...value } = f;
    const clean: FlowVariable = value.origin === 'request'
      ? { code: value.code, name: value.name.trim(), type: value.type, sensitive: value.sensitive, origin: 'request', path: value.path }
      : { code: value.code, name: value.name.trim(), type: value.type, sensitive: value.sensitive, origin: 'calculated', fn: value.fn ?? 'AGE', field: value.field };
    this.changed.emit((r) => {
      if (isNew) r.variables.push(clean);
      else r.variables = r.variables.map((v) => (v.code === clean.code ? clean : v));
    });
    this.varForm.set(null);
  }
  protected removeVariable(code: string): void {
    this.changed.emit((r) => (r.variables = r.variables.filter((v) => v.code !== code)));
    this.varForm.set(null);
  }

  // ── Campos del request ───────────────────────────────────────────────
  protected readonly fieldForm = signal<(RequestField & { isNew: boolean }) | null>(null);
  protected readonly fieldTouched = signal(false);
  protected readonly fieldErrors = computed(() => {
    const f = this.fieldForm();
    const e: { group?: string; path?: string } = {};
    if (!f || !this.fieldTouched()) return e;
    if (!f.group.trim()) e.group = 'La categoría es obligatoria';
    if (!/^[A-Za-z][\w.]*$/.test(f.path)) e.path = 'Ruta inválida (ej. solicitante.edad)';
    else if (f.isNew && this.resources().fields.some((x) => x.path === f.path)) e.path = 'Ya existe un campo con esa ruta';
    return e;
  });
  protected newField(): void {
    this.fieldTouched.set(false);
    this.fieldForm.set({ isNew: true, group: '', path: '', type: 'TEXT', required: false, sensitive: false, description: '', example: '', format: '', catalog: '' } as RequestField & { isNew: boolean });
  }
  protected editField(f: RequestField): void {
    this.fieldTouched.set(false);
    this.fieldForm.set({ ...f, isNew: false });
  }
  protected patchField(change: Partial<RequestField>): void {
    this.fieldTouched.set(true);
    const f = this.fieldForm();
    if (f) this.fieldForm.set({ ...f, ...change });
  }
  protected saveField(): void {
    this.fieldTouched.set(true);
    const f = this.fieldForm();
    if (!f || Object.keys(this.fieldErrors()).length) return;
    const { isNew, ...value } = f;
    this.changed.emit((r) => {
      if (isNew) r.fields.push(value);
      else r.fields = r.fields.map((x) => (x.path === value.path ? value : x));
    });
    this.fieldForm.set(null);
  }
  protected removeField(path: string): void {
    this.changed.emit((r) => (r.fields = r.fields.filter((x) => x.path !== path)));
    this.fieldForm.set(null);
  }

  // ── Catálogos ────────────────────────────────────────────────────────
  protected readonly catalogCode = signal<string | null>(null);
  protected readonly current = computed<FlowCatalog | null>(() => {
    const list = this.resources().catalogs;
    return list.find((c) => c.code === (this.catalogCode() ?? this.focusCatalog())) ?? list[0] ?? null;
  });
  constructor() {
    effect(() => {
      const f = this.focusCatalog();
      if (f) this.catalogCode.set(f);
    });
  }
  private changeCatalog(code: string, fn: (c: FlowCatalog) => void): void {
    this.changed.emit((r) => {
      const c = r.catalogs.find((x) => x.code === code);
      if (c) fn(c);
    });
  }
  protected addItem(): void {
    this.changeCatalog(this.current()!.code, (c) => c.items.push({ code: '', label: '', active: true }));
  }
  protected editItem(catalog: string, index: number, change: Partial<FlowCatalog['items'][number]>): void {
    this.changeCatalog(catalog, (c) => (c.items[index] = { ...c.items[index], ...change }));
  }
  protected removeItem(catalog: string, index: number): void {
    this.changeCatalog(catalog, (c) => c.items.splice(index, 1));
  }

  protected readonly bulk = signal<{ mode: 'add' | 'replace'; text: string } | null>(null);
  protected openBulk(): void {
    this.bulk.set({ mode: 'add', text: '' });
  }
  protected patchBulk(change: Partial<{ mode: 'add' | 'replace'; text: string }>): void {
    const b = this.bulk();
    if (b) this.bulk.set({ ...b, ...change });
  }
  /** Analiza el CSV pegado; si hay un error se rechaza la carga completa. */
  protected readonly bulkPreview = computed(() => {
    const b = this.bulk();
    if (!b || !b.text.trim()) return null;
    const lines = b.text.trim().split(/\r?\n/);
    if (lines[0].replace(/\s/g, '').toLowerCase() !== 'code,description,active') return { rows: [], error: 'El encabezado debe ser code,description,active' };
    if (lines.length - 1 > 5000) return { rows: [], error: 'Máximo 5 000 filas' };
    const rows: FlowCatalog['items'] = [];
    const seen = new Set(b.mode === 'add' ? (this.current()?.items ?? []).map((i) => i.code) : []);
    for (let i = 1; i < lines.length; i++) {
      const [code, label, active] = lines[i].split(',').map((s) => s.trim());
      if (!code || !label) return { rows, error: `Fila ${i + 1}: código y descripción son obligatorios` };
      if (seen.has(code)) return { rows, error: `Fila ${i + 1}: el código ${code} está duplicado` };
      if (active && !/^(true|false)$/i.test(active)) return { rows, error: `Fila ${i + 1}: «activo» debe ser true o false` };
      seen.add(code);
      rows.push({ code, label, active: (active ?? 'true').toLowerCase() !== 'false' });
    }
    return { rows, error: '' };
  });
  protected applyBulk(): void {
    const p = this.bulkPreview();
    const b = this.bulk();
    if (!p || p.error || !b) return;
    this.changeCatalog(this.current()!.code, (c) => (c.items = b.mode === 'add' ? [...c.items, ...p.rows] : p.rows));
    this.bulk.set(null);
  }
}
