import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Condition, ConditionGroup, FlowResources, LogicNode, Operator, RuleKind } from '@core/api/flow.models';
import { UiButton, UiInput, UiOption, UiSelect, UiSegmented } from '@shared/ui';
import { emptyCondition, emptyGroup, validateCondition } from './flow-validation';

const RULES: UiOption<RuleKind>[] = [
  { value: 'FIXED', label: 'Valor fijo' },
  { value: 'RANGE', label: 'Rango' },
  { value: 'CATALOG', label: 'Catálogo' },
];
const OPERATORS: UiOption<Operator>[] = ['=', '<>', '>', '>=', '<', '<='].map((o) => ({ value: o as Operator, label: o }));
const MODES: UiOption<'belongs' | 'not-belongs'>[] = [
  { value: 'belongs', label: 'Pertenece' },
  { value: 'not-belongs', label: 'No pertenece' },
];
const JOIN: UiOption<'AND' | 'OR'>[] = [
  { value: 'AND', label: 'Y (todas)' },
  { value: 'OR', label: 'O (alguna)' },
];

/**
 * Editor recursivo del árbol Y/O. Es inmutable: cada cambio emite una copia nueva del grupo
 * y el padre la sustituye, de modo que el borrador se guarda con una sola llamada.
 */
@Component({
  selector: 'app-logic-editor',
  imports: [FormsModule, UiSelect, UiInput, UiButton, UiSegmented, LogicEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: block; }
    .group { border-left: 3px solid var(--color-accent); padding: 8px 0 8px 12px; margin: 6px 0; }
    .group .group { border-left-color: var(--color-neutral-400); }
    .head { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
    .cond { display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; padding: 8px; background: var(--color-neutral-200); margin-bottom: 6px; }
    .cond ui-select, .cond ui-input { width: 150px; }
    .cond .wide { width: 200px; }
    .err { flex-basis: 100%; margin: 0; font-size: 12px; color: var(--color-error); }
    .empty { font-size: 13px; color: var(--color-neutral-700); margin: 0 0 8px; }
    .add { display: flex; gap: 8px; }
  `,
  template: `
    <div class="group">
      <div class="head">
        <ui-segmented [options]="join" [disabled]="readonly()" [ngModel]="group().op" (ngModelChange)="setOp($event)" />
        @if (removable()) { <button ui-button size="sm" variant="danger-ghost" [disabled]="readonly()" (click)="removed.emit()">Quitar grupo</button> }
      </div>
      @if (!group().children.length) { <p class="empty">Sin condiciones.</p> }
      @for (child of group().children; track child.id; let i = $index) {
        @if (child.type === 'group') {
          <app-logic-editor [group]="child" [resources]="resources()" [readonly]="readonly()" [removable]="true" (groupChange)="replace(i, $event)" (removed)="remove(i)" />
        } @else {
          <div class="cond">
            <ui-select class="wide" [options]="variableOptions()" [disabled]="readonly()" [ngModel]="child.variable" (ngModelChange)="patch(i, { variable: $event })" />
            <ui-select [options]="rules" [disabled]="readonly()" [ngModel]="child.rule" (ngModelChange)="patch(i, { rule: $event })" />
            @switch (child.rule) {
              @case ('FIXED') {
                <ui-select [options]="operators" [disabled]="readonly()" [ngModel]="child.operator" (ngModelChange)="patch(i, { operator: $event })" />
                <ui-input [disabled]="readonly()" placeholder="Valor" [ngModel]="child.value" (ngModelChange)="patch(i, { value: $event })" />
              }
              @case ('RANGE') {
                <ui-input [disabled]="readonly()" placeholder="Desde" [ngModel]="child.from" (ngModelChange)="patch(i, { from: $event })" />
                <ui-input [disabled]="readonly()" placeholder="Hasta" [ngModel]="child.to" (ngModelChange)="patch(i, { to: $event })" />
              }
              @default {
                <ui-select [options]="modes" [disabled]="readonly()" [ngModel]="child.mode ?? 'belongs'" (ngModelChange)="patch(i, { mode: $event })" />
                <ui-select [options]="catalogOptions()" [disabled]="readonly()" [ngModel]="child.catalog" (ngModelChange)="patch(i, { catalog: $event })" />
              }
            }
            <button ui-button size="sm" variant="danger-ghost" [disabled]="readonly()" (click)="remove(i)">Quitar</button>
            @if (errorOf(child); as e) { <p class="err" role="alert">{{ e }}</p> }
          </div>
        }
      }
      @if (!readonly()) {
        <div class="add">
          <button ui-button size="sm" (click)="addCondition()">+ Condición</button>
          <button ui-button size="sm" (click)="addGroup()">+ Grupo</button>
        </div>
      }
    </div>
  `,
})
export class LogicEditor {
  readonly group = input.required<ConditionGroup>();
  readonly resources = input.required<FlowResources>();
  readonly readonly = input(false);
  /** Los grupos anidados se pueden quitar; el raíz no. */
  readonly removable = input(false);
  readonly groupChange = output<ConditionGroup>();
  readonly removed = output<void>();

  protected readonly rules = RULES;
  protected readonly operators = OPERATORS;
  protected readonly modes = MODES;
  protected readonly join = JOIN;

  protected readonly variableOptions = computed<UiOption<string>[]>(() => [
    { value: '', label: 'Variable…' },
    ...this.resources().variables.map((v) => ({ value: v.code, label: `${v.code} (${v.type})` })),
  ]);
  protected readonly catalogOptions = computed<UiOption<string>[]>(() => [
    { value: '', label: 'Catálogo…' },
    ...this.resources().catalogs.map((c) => ({ value: c.code, label: c.code })),
  ]);

  protected errorOf(node: LogicNode): string | null {
    return node.type === 'condition' ? validateCondition(node, this.resources()) : null;
  }

  private emit(children: LogicNode[], op = this.group().op): void {
    this.groupChange.emit({ ...this.group(), op, children });
  }
  protected setOp(op: 'AND' | 'OR'): void {
    this.emit(this.group().children, op);
  }
  protected patch(i: number, change: Partial<Condition>): void {
    this.emit(this.group().children.map((c, idx) => (idx === i ? ({ ...c, ...change } as Condition) : c)));
  }
  protected replace(i: number, group: ConditionGroup): void {
    this.emit(this.group().children.map((c, idx) => (idx === i ? group : c)));
  }
  protected remove(i: number): void {
    this.emit(this.group().children.filter((_, idx) => idx !== i));
  }
  protected addCondition(): void {
    this.emit([...this.group().children, emptyCondition('')]);
  }
  protected addGroup(): void {
    this.emit([...this.group().children, emptyGroup()]);
  }
}
