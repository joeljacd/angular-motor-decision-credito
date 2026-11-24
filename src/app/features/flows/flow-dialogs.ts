import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActionCode, Category, ConditionGroup, FLOW_ACTIONS, FlowResources, Policy, PolicyOutcome, StopRule } from '@core/api/flow.models';
import { UiButton, UiCheckbox, UiFormField, UiInput, UiModalFrame, UiOption, UiSelect } from '@shared/ui';
import { LogicEditor } from './logic-editor';
import { validateFlow } from './flow-validation';

/* ───────────── Categoría ───────────── */

export interface CategoryDialogData {
  category: Category;
  isNew: boolean;
  /** Códigos ya usados por otras categorías. */
  takenCodes: string[];
}

const STOP_RULES: UiOption<StopRule>[] = [
  { value: 'inherit', label: 'Heredar del flujo' },
  { value: 'yes', label: 'Detener siempre' },
  { value: 'no', label: 'No detener' },
];

/** Alta/edición de una categoría (el orden se cambia con los botones del árbol). */
@Component({
  selector: 'app-category-dialog',
  imports: [FormsModule, UiModalFrame, UiFormField, UiInput, UiSelect, UiCheckbox, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `.fields { display: flex; flex-direction: column; gap: 14px; } .err { margin: 4px 0 0; font-size: 12px; color: var(--color-error); }`,
  template: `
    <ui-modal-frame kicker="Categoría" [title]="data.isNew ? 'Nueva categoría' : data.category.code">
      <div class="fields">
        <ui-form-field label="Código (1 a 4 dígitos)">
          <ui-input [mono]="true" [disabled]="!data.isNew" [ngModel]="code()" (ngModelChange)="code.set($event)" />
          @if (shown().code) { <p class="err" role="alert">{{ shown().code }}</p> }
        </ui-form-field>
        <ui-form-field label="Nombre">
          <ui-input [ngModel]="name()" (ngModelChange)="name.set($event)" />
          @if (shown().name) { <p class="err" role="alert">{{ shown().name }}</p> }
        </ui-form-field>
        <ui-form-field label="Regla de detención"><ui-select [options]="stopRules" [ngModel]="stopRule()" (ngModelChange)="stopRule.set($event)" /></ui-form-field>
        <ui-checkbox [ngModel]="active()" (ngModelChange)="active.set($event)">Activa</ui-checkbox>
      </div>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" (click)="save()">Guardar</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class CategoryDialog {
  protected readonly data = inject<CategoryDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<Category>>(DialogRef);
  protected readonly stopRules = STOP_RULES;

  protected readonly code = signal(this.data.category.code);
  protected readonly name = signal(this.data.category.name);
  protected readonly stopRule = signal<StopRule>(this.data.category.stopRule);
  protected readonly active = signal(this.data.category.active);
  private readonly touched = signal(false);

  private readonly errors = computed(() => {
    const e: { code?: string; name?: string } = {};
    if (!/^\d{1,4}$/.test(this.code())) e.code = 'Código de 1 a 4 dígitos';
    else if (this.data.isNew && this.data.takenCodes.includes(this.code())) e.code = 'Ese código ya existe';
    if (!this.name().trim()) e.name = 'Obligatorio';
    return e;
  });
  protected readonly shown = computed(() => (this.touched() ? this.errors() : {}) as { code?: string; name?: string });

  protected save(): void {
    this.touched.set(true);
    if (Object.keys(this.errors()).length) return;
    this.ref.close({ ...this.data.category, code: this.code(), name: this.name().trim(), stopRule: this.stopRule(), active: this.active() });
  }
}

/* ───────────── Política ───────────── */

export interface PolicyDialogData {
  policy: Policy;
  isNew: boolean;
  resources: FlowResources;
  takenCodes: string[];
  readonly: boolean;
}

const ACTION_OPTIONS: UiOption<ActionCode>[] = Object.values(FLOW_ACTIONS).map((a) => ({ value: a.code, label: `${a.code} · ${a.name}` }));
const SCENARIOS: { key: 'pass' | 'fail' | 'missing'; label: string }[] = [
  { key: 'pass', label: 'Cumple' },
  { key: 'fail', label: 'No cumple' },
  { key: 'missing', label: 'Datos faltantes' },
];

/** Alta/edición de una política: datos, lógica Y/O y resultados por escenario. */
@Component({
  selector: 'app-policy-dialog',
  imports: [FormsModule, UiModalFrame, UiFormField, UiInput, UiSelect, UiCheckbox, UiButton, LogicEditor],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .fields { display: flex; flex-direction: column; gap: 14px; }
    .row { display: grid; grid-template-columns: 140px 1fr; gap: 12px; }
    h4 { margin: 8px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--color-neutral-700); }
    .outcome { display: grid; grid-template-columns: 110px 190px 90px 1fr; gap: 8px; align-items: start; }
    .err { margin: 4px 0 0; font-size: 12px; color: var(--color-error); }
    @media (max-width: 800px) { .outcome { grid-template-columns: 1fr 1fr; } }
  `,
  template: `
    <ui-modal-frame kicker="Política" [title]="data.isNew ? 'Nueva política' : data.policy.code" [closable]="true">
      <div class="fields">
        <div class="row">
          <ui-form-field label="Código (PA-NNN)">
            <ui-input [mono]="true" [disabled]="!data.isNew || data.readonly" [ngModel]="code()" (ngModelChange)="code.set($event)" />
            @if (shown()['code']) { <p class="err" role="alert">{{ shown()['code'] }}</p> }
          </ui-form-field>
          <ui-form-field label="Nombre">
            <ui-input [disabled]="data.readonly" [ngModel]="name()" (ngModelChange)="name.set($event)" />
            @if (shown()['name']) { <p class="err" role="alert">{{ shown()['name'] }}</p> }
          </ui-form-field>
        </div>
        <ui-checkbox [disabled]="data.readonly" [ngModel]="active()" (ngModelChange)="active.set($event)">Activa</ui-checkbox>

        <h4>Lógica (se cumple si…)</h4>
        <app-logic-editor [group]="root()" [resources]="data.resources" [readonly]="data.readonly" (groupChange)="root.set($event)" />
        @if (shown()['logic']) { <p class="err" role="alert">{{ shown()['logic'] }}</p> }

        <h4>Resultados</h4>
        @for (s of scenarios; track s.key) {
          <div class="outcome">
            <strong>{{ s.label }}</strong>
            <ui-select [options]="actions" [disabled]="data.readonly" [ngModel]="results()[s.key].action" (ngModelChange)="setOutcome(s.key, { action: $event })" />
            <ui-input [mono]="true" placeholder="Código" [disabled]="data.readonly" [ngModel]="results()[s.key].code" (ngModelChange)="setOutcome(s.key, { code: $event })" />
            <ui-input placeholder="Mensaje" [disabled]="data.readonly" [ngModel]="results()[s.key].message" (ngModelChange)="setOutcome(s.key, { message: $event })" />
          </div>
          @if (shown()[s.key]) { <p class="err" role="alert">{{ shown()[s.key] }}</p> }
        }
      </div>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">{{ data.readonly ? 'Cerrar' : 'Cancelar' }}</button>
        @if (!data.readonly) { <button ui-button variant="primary" (click)="save()">Guardar</button> }
      </ng-container>
    </ui-modal-frame>
  `,
})
export class PolicyDialog {
  protected readonly data = inject<PolicyDialogData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<Policy>>(DialogRef);
  protected readonly actions = ACTION_OPTIONS;
  protected readonly scenarios = SCENARIOS;

  protected readonly code = signal(this.data.policy.code);
  protected readonly name = signal(this.data.policy.name);
  protected readonly active = signal(this.data.policy.active);
  protected readonly root = signal<ConditionGroup>(this.data.policy.root);
  protected readonly results = signal(this.data.policy.results);
  private readonly touched = signal(false);

  /** Reutiliza las reglas de validación del flujo completo sobre esta política. */
  private readonly errors = computed<Record<string, string>>(() => {
    const e: Record<string, string> = {};
    if (!/^PA-\d{3}[A-Z]?$/.test(this.code())) e['code'] = 'Formato PA-NNN o PA-NNNA';
    else if (this.data.isNew && this.data.takenCodes.includes(this.code())) e['code'] = 'Ese código ya existe';
    if (!this.name().trim()) e['name'] = 'Obligatorio';
    const policy = this.current();
    const issues = validateFlow({ stopOnStop: true, from: '', to: '', categories: [{ code: '0', name: '', order: 1, active: true, stopRule: 'inherit', policies: [policy] }] }, this.data.resources);
    const logic = issues.filter((i) => i.level === 'error' && (i.message.includes('lógica') || /: /.test(i.message) && !i.message.startsWith('Resultado')));
    if (logic.length) e['logic'] = logic[0].message;
    for (const s of SCENARIOS) {
      const r = policy.results[s.key];
      if (!/^\d{3}$/.test(r.code)) e[s.key] = `${s.label}: el código debe tener 3 dígitos`;
      else if (!r.message.trim()) e[s.key] = `${s.label}: falta el mensaje`;
    }
    return e;
  });
  protected readonly shown = computed(() => (this.touched() ? this.errors() : {}) as Record<string, string | undefined>);

  private current(): Policy {
    return { ...this.data.policy, code: this.code(), name: this.name().trim(), active: this.active(), root: this.root(), results: this.results() };
  }

  protected setOutcome(key: 'pass' | 'fail' | 'missing', change: Partial<PolicyOutcome>): void {
    this.results.update((r) => ({ ...r, [key]: { ...r[key], ...change } }));
  }

  protected save(): void {
    this.touched.set(true);
    if (Object.keys(this.errors()).length) return;
    this.ref.close(this.current());
  }
}
