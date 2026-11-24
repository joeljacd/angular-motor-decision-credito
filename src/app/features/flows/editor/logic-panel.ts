import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Condition, ConditionGroup, FlowResources, groupPhrase, LogicNode, Operator, Policy, RuleKind } from '@core/api/flow.models';
import { ToastService, UiButton, UiCard, UiIcon, UiInput, UiOption, UiSegmented, UiSelect } from '@shared/ui';
import { countNodes, describeCount, findNode, isDescendant, newCondition, newGroup } from '../flow-tree';
import { ConditionErrors, PLACEHOLDER, validateCondition } from '../flow-validation';
import { DropEvent, EditorDnd } from './editor.models';

/** Cambio sobre el grupo raíz de la política; la página lo aplica y guarda el borrador. */
export type RootMutation = (root: ConditionGroup) => void;
/** Para confirmar la eliminación de un grupo (la página muestra el diálogo). */
export interface GroupRemoval {
  id: string;
  isRoot: boolean;
  message: string;
}

const RULE_OPTIONS: UiOption<RuleKind>[] = [
  { value: 'RANGE', label: 'Rango' },
  { value: 'CATALOG', label: 'Catálogo' },
  { value: 'FIXED', label: 'Fijo' },
];
const OPERATOR_OPTIONS: UiOption<Operator>[] = ['=', '<>', '>', '>=', '<', '<='].map((o) => ({ value: o as Operator, label: o }));
const MODE_OPTIONS: UiOption<'belongs' | 'not-belongs'>[] = [
  { value: 'belongs', label: 'Pertenece' },
  { value: 'not-belongs', label: 'No pertenece' },
];
const JOIN_OPTIONS: UiOption<'AND' | 'OR'>[] = [
  { value: 'AND', label: 'Y' },
  { value: 'OR', label: 'O' },
];
const KIND_LABEL: Record<RuleKind, string> = { RANGE: 'RANGO', CATALOG: 'CATÁLOGO', FIXED: 'FIJO' };

type Row =
  | { type: 'group'; key: string; group: ConditionGroup; isRoot: boolean; depth: number; connector: string; label: string; hint: string; counts: { conditions: number; groups: number } }
  | { type: 'empty'; key: string; depth: number }
  | { type: 'condition'; key: string; condition: Condition; depth: number; connector: string; number: number }
  | { type: 'form'; key: string; depth: number };

/** Estado de la condición que se está editando en línea. */
interface Editing {
  id: string;
  form: Condition;
  isNew: boolean;
  query: string;
  open: boolean;
  touched: boolean;
}

/** Editor de lógica de una política: frase legible, filas de grupos y condiciones, formulario en línea y arrastrar y soltar. */
@Component({
  selector: 'app-logic-panel',
  imports: [FormsModule, UiCard, UiButton, UiIcon, UiInput, UiSelect, UiSegmented],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './logic-panel.scss',
  template: `
    <ui-card padding="md">
      <div class="head"><h4>Editor de lógica</h4><span class="count">{{ summary() }}</span></div>
      <div class="phrase"><span class="phrase-label">Frase legible · se actualiza en vivo</span><span class="phrase-text">{{ phrase() }}</span></div>
      @if (isNew()) { <div class="note">Guarda la política para construir su lógica.</div> }

      <div class="rows">
        @for (row of rows(); track row.key) {
          @switch (row.type) {
            @case ('group') {
              <div
                class="row group"
                [class.flash]="highlight() === row.key"
                [class.drop]="dnd.dropId() === 'node' + row.key"
                [style.padding-left.px]="20 + row.depth * 24"
                [attr.draggable]="editable() && !row.isRoot"
                (dragstart)="!row.isRoot && editable() && dnd.start({ kind: 'node', key: row.key }, $event)"
                (dragover)="editable() && dnd.over('node', row.key, $event)"
                (drop)="onDrop($event, row.key)"
                (dragend)="dnd.end()"
              >
                @if (editable() && !row.isRoot) { <span class="grip" aria-hidden="true">⋮⋮</span> }
                @if (row.connector) { <span class="connector">{{ row.connector }}</span> }
                <span class="group-label">{{ row.label }}</span>
                <ui-segmented [options]="joinOptions" [disabled]="!editable()" [ngModel]="row.group.op" (ngModelChange)="setOp(row.key, $event)" />
                <span class="hint">{{ row.hint }}</span>
                <span class="spacer"></span>
                @if (editable()) {
                  <button ui-button size="sm" variant="ghost" (click)="addCondition(row.key)">+ Condición</button>
                  <button ui-button size="sm" variant="ghost" (click)="addGroup(row.key)">+ Subgrupo</button>
                  <button
                    ui-button size="sm" variant="ghost"
                    [title]="row.isRoot ? 'El grupo raíz no se puede borrar, solo vaciar' : 'Eliminar subgrupo'"
                    (click)="askRemoveGroup(row.group, row.isRoot)"
                  >{{ row.isRoot ? 'Vaciar' : 'Eliminar' }}</button>
                }
              </div>
            }
            @case ('empty') {
              <div class="row empty" [style.padding-left.px]="20 + row.depth * 24">Grupo vacío — agrega una condición o un subgrupo.</div>
            }
            @case ('condition') {
              <div
                class="row cond"
                [class.editing]="editing()?.id === row.key"
                [class.clickable]="editable()"
                [class.flash]="highlight() === row.key"
                [class.drop]="dnd.dropId() === 'node' + row.key"
                [style.padding-left.px]="20 + row.depth * 24"
                [attr.draggable]="editable()"
                (dragstart)="editable() && dnd.start({ kind: 'node', key: row.key }, $event)"
                (dragover)="editable() && dnd.over('node', row.key, $event)"
                (drop)="onDrop($event, row.key)"
                (dragend)="dnd.end()"
                (click)="startEdit(row.condition)"
              >
                @if (editable()) { <span class="grip" aria-hidden="true">⋮⋮</span> }
                @if (row.connector) { <span class="connector">{{ row.connector }}</span> }
                <span class="num">#{{ row.number }}</span>
                @if (isSensitive(row.condition)) { <ui-icon name="lock" [size]="13" title="Variable sensible" /> }
                <span class="cond-phrase" [class.bad]="badOf(row.condition)">{{ conditionText(row.condition) }}</span>
                @if (badOf(row.condition); as bad) { <span class="bad-tag">{{ bad }}</span> }
                <span class="kind">{{ kindLabel(row.condition) }}</span>
                @if (editable()) {
                  <button ui-button size="sm" variant="ghost" icon title="Eliminar condición" aria-label="Eliminar condición" (click)="removeCondition(row.key, $event)"><ui-icon name="x" [size]="14" /></button>
                }
              </div>
            }
            @case ('form') {
              @if (editing(); as ed) {
                <div class="row form" [style.padding-left.px]="20 + row.depth * 24">
                  <div class="cond-form">
                    <div class="form-grid">
                      <div class="field var-field">
                        <label>Variable</label>
                        <ui-input placeholder="Buscar variable" [mono]="true" [ngModel]="ed.query" (ngModelChange)="setQuery($event)" (focusin)="openVariables()" />
                        @if (ed.open) {
                          <div class="var-list" role="listbox">
                            @for (v of filteredVariables(); track v.code) {
                              <button type="button" role="option" (click)="pickVariable(v.code)">
                                <span class="var-code">{{ v.code }}</span>
                                @if (v.sensitive) { <ui-icon name="lock" [size]="12" /> }
                                <span class="var-type">{{ v.type }}</span>
                              </button>
                            } @empty { <div class="none">Sin coincidencias</div> }
                          </div>
                        }
                        @if (formErrors().variable) { <p class="err" role="alert">{{ formErrors().variable }}</p> }
                        @if (variableInfo()) { <p class="info">{{ variableInfo() }}</p> }
                      </div>
                      <div class="field">
                        <label>Tipo de regla</label>
                        <ui-segmented [options]="ruleOptions" [ngModel]="ed.form.rule" (ngModelChange)="patchForm({ rule: $event })" />
                      </div>
                    </div>
                    @switch (ed.form.rule) {
                      @case ('RANGE') {
                        <div class="form-grid">
                          <div class="field"><label>Desde</label><ui-input [placeholder]="placeholder()" [ngModel]="ed.form.from ?? ''" (ngModelChange)="patchForm({ from: ($event + '').trim() })" />@if (formErrors().from) { <p class="err" role="alert">{{ formErrors().from }}</p> }</div>
                          <div class="field"><label>Hasta</label><ui-input [placeholder]="placeholder()" [ngModel]="ed.form.to ?? ''" (ngModelChange)="patchForm({ to: ($event + '').trim() })" />@if (formErrors().to) { <p class="err" role="alert">{{ formErrors().to }}</p> }</div>
                        </div>
                      }
                      @case ('CATALOG') {
                        <div class="form-grid">
                          <div class="field"><label>Catálogo</label><ui-select [options]="catalogOptions()" [ngModel]="ed.form.catalog ?? ''" (ngModelChange)="patchForm({ catalog: $event })" />@if (formErrors().catalog) { <p class="err" role="alert">{{ formErrors().catalog }}</p> }</div>
                          <div class="field"><label>Modo</label><ui-segmented [options]="modeOptions" [ngModel]="ed.form.mode ?? 'belongs'" (ngModelChange)="patchForm({ mode: $event })" /></div>
                        </div>
                      }
                      @default {
                        <div class="form-grid">
                          <div class="field"><label>Operador</label><ui-select [options]="operatorOptions" [ngModel]="ed.form.operator ?? '='" (ngModelChange)="patchForm({ operator: $event })" /></div>
                          <div class="field"><label>Valor</label><ui-input [placeholder]="placeholder()" [ngModel]="ed.form.value ?? ''" (ngModelChange)="patchForm({ value: $event })" />@if (formErrors().value) { <p class="err" role="alert">{{ formErrors().value }}</p> }</div>
                        </div>
                      }
                    }
                    <div class="form-actions">
                      <span class="form-phrase">{{ formPhrase() }}</span>
                      <button ui-button (click)="cancelEdit()">Cancelar</button>
                      <button ui-button variant="primary" (click)="applyEdit()">Aplicar</button>
                    </div>
                  </div>
                </div>
              }
            }
          }
        }
      </div>
    </ui-card>
  `,
})
export class LogicPanel {
  protected readonly dnd = inject(EditorDnd);
  private readonly toast = inject(ToastService);

  readonly policy = input<Policy | null>(null);
  readonly isNew = input(false);
  readonly resources = input.required<FlowResources>();
  readonly editable = input(false);
  /** Id de un nodo a resaltar (viene de hacer clic en un ítem de la validación). */
  readonly highlight = input<string | null>(null);
  readonly mutated = output<RootMutation>();
  readonly removeGroup = output<GroupRemoval>();

  protected readonly ruleOptions = RULE_OPTIONS;
  protected readonly operatorOptions = OPERATOR_OPTIONS;
  protected readonly modeOptions = MODE_OPTIONS;
  protected readonly joinOptions = JOIN_OPTIONS;

  /** Condición en edición; se cierra al cambiar de política. */
  protected readonly editing = linkedSignal<unknown, Editing | null>({ source: () => this.policy()?.code, computation: () => null });

  private readonly variables = computed(() => this.resources().variables);
  protected readonly catalogOptions = computed<UiOption<string>[]>(() => [
    { value: '', label: 'Selecciona un catálogo' },
    ...this.resources().catalogs.map((c) => ({ value: c.code, label: c.code })),
  ]);

  protected readonly summary = computed(() => {
    const root = this.policy()?.root;
    if (!root) return '';
    const c = countNodes(root);
    return `${describeCount(c.conditions, c.groups)} · grupo raíz ${root.op === 'AND' ? 'Y' : 'O'}`;
  });

  /** Frase de la política; si hay una condición en edición, refleja en vivo lo que se escribe. */
  protected readonly phrase = computed(() => {
    const root = this.policy()?.root;
    if (!root) return '—';
    const ed = this.editing();
    if (!ed) return groupPhrase(root);
    const copy = structuredClone(root);
    const hit = findNode(copy, ed.id);
    if (hit?.parent) hit.parent.children[hit.index] = { ...ed.form, id: ed.id };
    return groupPhrase(copy);
  });

  protected readonly rows = computed<Row[]>(() => {
    const root = this.policy()?.root;
    if (!root) return [];
    const out: Row[] = [];
    const ed = this.editing();
    const walk = (group: ConditionGroup, depth: number, parent: ConditionGroup | null, index: number) => {
      const isRoot = !parent;
      out.push({
        type: 'group', key: group.id, group, isRoot, depth,
        connector: !isRoot && index > 0 ? (parent!.op === 'AND' ? 'Y' : 'O') : '',
        label: isRoot ? 'Grupo raíz' : 'Subgrupo',
        hint: group.op === 'AND' ? 'todas deben cumplirse' : 'basta con una',
        counts: countNodes(group),
      });
      if (!group.children.length) out.push({ type: 'empty', key: group.id + 'e', depth: depth + 1 });
      group.children.forEach((child, i) => {
        if (child.type === 'group') return walk(child, depth + 1, group, i);
        out.push({ type: 'condition', key: child.id, condition: child, depth: depth + 1, connector: i > 0 ? (group.op === 'AND' ? 'Y' : 'O') : '', number: i + 1 });
        if (ed?.id === child.id) out.push({ type: 'form', key: child.id + 'f', depth: depth + 1 });
      });
    };
    walk(root, 0, null, 0);
    return out;
  });

  // ── Condiciones: presentación ────────────────────────────────────────

  protected conditionText(c: Condition): string {
    const ed = this.editing();
    return groupPhrase(ed?.id === c.id ? { ...ed.form, id: c.id } : c);
  }
  protected kindLabel(c: Condition): string {
    return KIND_LABEL[c.rule];
  }
  protected isSensitive(c: Condition): boolean {
    return !!this.variables().find((v) => v.code === c.variable)?.sensitive;
  }
  protected badOf(c: Condition): string {
    const e = validateCondition(c, this.variables());
    return Object.keys(e).length ? (e.variable ? 'Variable inexistente' : 'Inválida') : '';
  }

  // ── Formulario en línea ──────────────────────────────────────────────

  protected readonly formErrors = computed<ConditionErrors>(() => {
    const ed = this.editing();
    return ed?.touched ? validateCondition(ed.form, this.variables()) : {};
  });
  protected readonly placeholder = computed(() => PLACEHOLDER[this.variables().find((v) => v.code === this.editing()?.form.variable)?.type ?? 'TEXT']);
  protected readonly formPhrase = computed(() => {
    const ed = this.editing();
    return ed ? groupPhrase({ ...ed.form, id: ed.id }) : '';
  });
  protected readonly variableInfo = computed(() => {
    const v = this.variables().find((x) => x.code === this.editing()?.form.variable);
    return v ? `${v.name} · ${v.type}${v.sensitive ? ' · sensible' : ''}` : '';
  });
  protected readonly filteredVariables = computed(() => {
    const q = (this.editing()?.query ?? '').toUpperCase();
    return this.variables().filter((v) => !q || v.code.includes(q) || v.name.toUpperCase().includes(q));
  });

  protected startEdit(condition: Condition): void {
    if (!this.editable() || this.editing()?.id === condition.id) return;
    this.editing.set({ id: condition.id, form: { ...condition }, isNew: false, query: condition.variable, open: false, touched: true });
  }
  private update(change: Partial<Editing>): void {
    const ed = this.editing();
    if (ed) this.editing.set({ ...ed, ...change });
  }
  protected patchForm(change: Partial<Condition>): void {
    const ed = this.editing();
    if (ed) this.update({ form: { ...ed.form, ...change }, touched: true });
  }
  protected setQuery(query: string): void {
    this.update({ query: String(query), open: true });
  }
  protected openVariables(): void {
    this.update({ open: true });
  }
  protected pickVariable(code: string): void {
    const ed = this.editing();
    if (ed) this.update({ form: { ...ed.form, variable: code }, query: code, open: false, touched: true });
  }

  protected cancelEdit(): void {
    const ed = this.editing();
    if (ed?.isNew) this.mutate((root) => this.removeNode(root, ed.id));
    this.editing.set(null);
  }

  protected applyEdit(): void {
    const ed = this.editing();
    if (!ed) return;
    if (Object.keys(validateCondition(ed.form, this.variables())).length) return this.update({ touched: true });
    // Conserva solo los campos de la regla elegida.
    const f = ed.form;
    const clean: Condition = { id: f.id, type: 'condition', variable: f.variable, rule: f.rule };
    if (f.rule === 'RANGE') Object.assign(clean, { from: f.from, to: f.to });
    if (f.rule === 'CATALOG') Object.assign(clean, { catalog: f.catalog, mode: f.mode ?? 'belongs' });
    if (f.rule === 'FIXED') Object.assign(clean, { operator: f.operator ?? '=', value: f.value });
    this.mutate((root) => {
      const hit = findNode(root, ed.id);
      if (hit?.parent) hit.parent.children[hit.index] = clean;
    });
    this.editing.set(null);
    this.toast.success('Condición aplicada en el borrador');
  }

  // ── Mutaciones del árbol ─────────────────────────────────────────────

  private mutate(fn: RootMutation): void {
    this.mutated.emit(fn);
  }
  private removeNode(root: ConditionGroup, id: string): void {
    const hit = findNode(root, id);
    hit?.parent?.children.splice(hit.index, 1);
  }

  protected setOp(id: string, op: 'AND' | 'OR'): void {
    this.mutate((root) => {
      const hit = findNode(root, id);
      if (hit?.node.type === 'group') hit.node.op = op;
    });
  }
  protected addCondition(groupId: string): void {
    const condition = newCondition();
    this.mutate((root) => {
      const hit = findNode(root, groupId);
      if (hit?.node.type === 'group') hit.node.children.push(condition);
    });
    this.editing.set({ id: condition.id, form: { ...condition }, isNew: true, query: '', open: true, touched: false });
  }
  protected addGroup(groupId: string): void {
    this.mutate((root) => {
      const hit = findNode(root, groupId);
      if (hit?.node.type === 'group') hit.node.children.push(newGroup(hit.node.op === 'AND' ? 'OR' : 'AND'));
    });
  }
  protected removeCondition(id: string, event: Event): void {
    event.stopPropagation();
    this.mutate((root) => this.removeNode(root, id));
    if (this.editing()?.id === id) this.editing.set(null);
  }
  protected askRemoveGroup(group: ConditionGroup, isRoot: boolean): void {
    if (isRoot && !group.children.length) return;
    const c = countNodes(group);
    this.removeGroup.emit({ id: group.id, isRoot, message: `Se eliminarán ${describeCount(c.conditions, c.groups)}.` });
  }

  // ── Arrastrar y soltar ───────────────────────────────────────────────

  protected onDrop(event: DragEvent, targetId: string): void {
    event.preventDefault();
    const from = this.dnd.take();
    if (!from || from.kind !== 'node' || from.key === targetId) return;
    let invalid = false;
    this.mutate((root) => {
      const source = findNode(root, from.key);
      if (!source?.parent) return;
      if (source.node.type === 'group' && isDescendant(source.node, targetId)) {
        invalid = true;
        return;
      }
      source.parent.children.splice(source.index, 1);
      const target = findNode(root, targetId);
      if (!target) return;
      // Soltar sobre un grupo lo agrega al final; sobre una condición, la inserta antes.
      if (target.node.type === 'group') target.node.children.push(source.node);
      else target.parent!.children.splice(target.index, 0, source.node);
    });
    if (invalid) this.toast.info('No puedes mover un grupo dentro de sí mismo');
  }
}

export type { LogicNode };
