import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActionCode, Category, FLOW_ACTIONS, FlowDocument, Policy, PolicyOutcome } from '@core/api/flow.models';
import { UiButton, UiCard, UiCheckbox, UiFormField, UiInput } from '@shared/ui';
import { RESULT_KEYS, RESULT_LABEL } from '../flow-validation';
import { ACTION_COLOR } from './editor.models';

type ResultKey = (typeof RESULT_KEYS)[number];

export interface PolicyForm {
  code: string;
  name: string;
  order: string;
  active: boolean;
  results: Record<ResultKey, PolicyOutcome>;
}

/** Formulario en línea de una política: datos básicos y resultado por escenario (cumple / no cumple / falta dato). */
@Component({
  selector: 'app-policy-panel',
  imports: [FormsModule, UiCard, UiFormField, UiInput, UiCheckbox, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panel.scss',
  template: `
    <ui-card padding="md">
      <div class="panel-head">
        <span class="kicker">Política</span>
        <h3>{{ title() }}</h3>
        @if (dirty()) { <span class="unsaved">Sin guardar</span> }
        <span class="spacer"></span>
        @if (editable() && !isNew()) {
          <button ui-button size="sm" variant="ghost" (click)="move.emit()">Mover a categoría…</button>
          <button ui-button size="sm" variant="ghost" (click)="remove.emit()">Eliminar</button>
        }
      </div>
      <div class="grid4">
        <ui-form-field label="Código">
          <ui-input [mono]="true" placeholder="PA-NNN" [disabled]="!editable() || !isNew()" [ngModel]="form().code" (ngModelChange)="patch({ code: $event.toUpperCase() })" />
          @if (errors().code) { <p class="err" role="alert">{{ errors().code }}</p> }
        </ui-form-field>
        <ui-form-field label="Nombre">
          <ui-input [disabled]="!editable()" [ngModel]="form().name" (ngModelChange)="patch({ name: $event })" />
          @if (errors().name) { <p class="err" role="alert">{{ errors().name }}</p> }
        </ui-form-field>
        <ui-form-field label="Orden">
          <ui-input type="number" [disabled]="!editable()" [ngModel]="form().order" (ngModelChange)="patch({ order: $event })" />
          @if (errors().order) { <p class="err" role="alert">{{ errors().order }}</p> }
        </ui-form-field>
        <ui-form-field label="Estado">
          <ui-checkbox [disabled]="!editable()" [ngModel]="form().active" (ngModelChange)="patch({ active: $event })">Activa</ui-checkbox>
        </ui-form-field>
      </div>

      <div class="results">
        <div class="results-head"><span>Resultado</span><span>Acción</span><span>Código</span><span>Mensaje de retorno</span></div>
        @for (key of resultKeys; track key) {
          <div class="result-row">
            <span class="result-label">{{ labels[key] }}</span>
            <div class="action-chips">
              @for (a of actions; track a.code) {
                <button
                  type="button"
                  class="action-chip"
                  [class.on]="form().results[key].action === a.code"
                  [class.dim]="!editable() && form().results[key].action !== a.code"
                  [style.background]="form().results[key].action === a.code ? color(a.code).bg : 'transparent'"
                  [style.color]="form().results[key].action === a.code ? color(a.code).fg : 'var(--color-neutral-700)'"
                  [title]="a.code + ' · ' + a.name + ' · severidad ' + a.severity + (a.stops ? ' · detiene' : '')"
                  [disabled]="!editable()"
                  (click)="setResult(key, { action: a.code })"
                >{{ a.code }}</button>
              }
            </div>
            <div>
              <ui-input [mono]="true" [disabled]="!editable()" [ngModel]="form().results[key].code" (ngModelChange)="setResult(key, { code: $event })" />
              @if (resultErrors()[key]?.code) { <p class="err" role="alert">{{ resultErrors()[key]!.code }}</p> }
            </div>
            <div>
              <ui-input [disabled]="!editable()" [ngModel]="form().results[key].message" (ngModelChange)="setResult(key, { message: $event })" />
              @if (resultErrors()[key]?.message) { <p class="err" role="alert">{{ resultErrors()[key]!.message }}</p> }
            </div>
          </div>
        }
      </div>

      @if (editable()) {
        <div class="actions">
          <span class="hint">C COBIS · E ECA · B Solicitud bloqueada (detiene) · R Rechazo total (detiene)</span>
          <span class="spacer"></span>
          <button ui-button [disabled]="!dirty()" (click)="reset()">Deshacer</button>
          <button ui-button variant="primary" (click)="save()">{{ isNew() ? 'Crear en el borrador' : 'Guardar cambios' }}</button>
        </div>
      }
    </ui-card>
  `,
})
export class PolicyPanel {
  readonly doc = input.required<FlowDocument>();
  readonly policy = input<Policy | null>(null);
  /** Categoría que contiene la política (o donde se creará). */
  readonly category = input<Category | null>(null);
  readonly isNew = input(false);
  readonly editable = input(false);
  readonly saved = output<PolicyForm>();
  readonly move = output<void>();
  readonly remove = output<void>();

  protected readonly resultKeys = RESULT_KEYS;
  protected readonly labels = RESULT_LABEL;
  protected readonly actions = Object.values(FLOW_ACTIONS);

  protected readonly title = computed(() =>
    this.isNew() ? `Nueva política en categoría ${this.category()?.code}` : `${this.policy()?.code} · ${this.policy()?.name}`,
  );

  private readonly base = computed<PolicyForm>(() => {
    const p = this.policy();
    if (this.isNew() || !p) {
      const total = this.doc().categories.reduce((n, c) => n + c.policies.length, 0) + 1;
      const blank = (action: ActionCode, code: string): PolicyOutcome => ({ action, code, message: '' });
      return {
        code: 'PA-0' + String(total).padStart(2, '0'),
        name: '',
        order: String((this.category()?.policies.length ?? 0) + 1),
        active: true,
        results: { pass: blank('C', '000'), fail: blank('E', ''), missing: blank('E', '') },
      };
    }
    return { code: p.code, name: p.name, order: String(p.order), active: p.active, results: structuredClone(p.results) };
  });

  private readonly draft = linkedSignal<unknown, PolicyForm | null>({ source: () => [this.policy(), this.isNew(), this.category()?.code], computation: () => null });
  private readonly touched = linkedSignal<unknown, boolean>({ source: () => [this.policy()?.code, this.isNew(), this.category()?.code], computation: () => false });

  protected readonly form = computed(() => this.draft() ?? this.base());
  protected readonly dirty = computed(() => !!this.draft() && JSON.stringify(this.draft()) !== JSON.stringify(this.base()));

  private readonly allErrors = computed(() => {
    const f = this.form();
    const e: { code?: string; name?: string; order?: string } = {};
    if (!/^PA-\d{3}[A-Z]?$/.test(f.code)) e.code = 'Formato PA-NNN (ej. PA-009)';
    else if (this.isNew() && this.doc().categories.some((c) => c.policies.some((p) => p.code === f.code))) e.code = `La política ${f.code} ya existe`;
    if (!f.name.trim()) e.name = 'El nombre es obligatorio';
    if (!/^[1-9]\d*$/.test(String(f.order))) e.order = 'Entero mayor a 0';
    return e;
  });
  protected readonly errors = computed(() => (this.touched() || this.isNew() ? this.allErrors() : {}));

  /** Errores de los resultados: solo tras el primer cambio o intento de guardado. */
  private readonly allResultErrors = computed(() => {
    const out: Partial<Record<ResultKey, { code?: string; message?: string }>> = {};
    for (const key of RESULT_KEYS) {
      const r = this.form().results[key];
      const e: { code?: string; message?: string } = {};
      if (!/^\d{3}$/.test(r.code)) e.code = '3 dígitos';
      if (!r.message.trim()) e.message = 'Obligatorio';
      if (e.code || e.message) out[key] = e;
    }
    return out;
  });
  protected readonly resultErrors = computed(() => (this.touched() ? this.allResultErrors() : {}));

  protected color(code: string) {
    return ACTION_COLOR[code] ?? ACTION_COLOR['E'];
  }

  protected patch(change: Partial<PolicyForm>): void {
    this.draft.set({ ...this.form(), ...change });
    this.touched.set(true);
  }
  protected setResult(key: ResultKey, change: Partial<PolicyOutcome>): void {
    const f = this.form();
    this.patch({ results: { ...f.results, [key]: { ...f.results[key], ...change } } });
  }
  protected reset(): void {
    this.draft.set(null);
    this.touched.set(false);
  }
  protected save(): void {
    this.touched.set(true);
    if (Object.keys(this.allErrors()).length || Object.keys(this.allResultErrors()).length) return;
    this.saved.emit(this.form());
  }
}
