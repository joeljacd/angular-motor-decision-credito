import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category, FlowDocument, StopRule } from '@core/api/flow.models';
import { UiButton, UiCard, UiCheckbox, UiFormField, UiInput, UiOption, UiSegmented } from '@shared/ui';

export interface CategoryForm {
  code: string;
  name: string;
  order: string;
  active: boolean;
  stopRule: StopRule;
}

const STOP_OPTIONS: UiOption<StopRule>[] = [
  { value: 'inherit', label: 'Heredada del flujo' },
  { value: 'yes', label: 'Propia: sí' },
  { value: 'no', label: 'Propia: no' },
];

/** Formulario en línea de una categoría (alta o edición), con "Deshacer" y aviso de cambios sin guardar. */
@Component({
  selector: 'app-category-panel',
  imports: [FormsModule, UiCard, UiFormField, UiInput, UiCheckbox, UiSegmented, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './panel.scss',
  template: `
    <ui-card padding="md">
      <div class="panel-head">
        <span class="kicker">Categoría</span>
        <h3>{{ title() }}</h3>
        @if (dirty()) { <span class="unsaved">Sin guardar</span> }
      </div>
      <div class="grid3">
        <ui-form-field label="Código (1 a 4 dígitos)">
          <ui-input [mono]="true" [disabled]="!editable() || !isNew()" [ngModel]="form().code" (ngModelChange)="patch({ code: $event })" />
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
      </div>
      <div class="grid2">
        <ui-form-field label="Estado">
          <ui-checkbox [disabled]="!editable()" [ngModel]="form().active" (ngModelChange)="patch({ active: $event })">Activa</ui-checkbox>
        </ui-form-field>
        <ui-form-field label="Regla de detención">
          <ui-segmented [options]="stopOptions" [disabled]="!editable()" [ngModel]="form().stopRule" (ngModelChange)="patch({ stopRule: $event })" />
          <p class="hint">{{ stopHint() }}</p>
        </ui-form-field>
      </div>
      @if (editable()) {
        <div class="actions">
          <button ui-button [disabled]="isNew() || policyCount() > 0" (click)="remove.emit()">Eliminar</button>
          @if (!isNew() && policyCount() > 0) { <span class="hint">Tiene {{ policyCount() }} {{ policyCount() === 1 ? 'política' : 'políticas' }}; muévelas o elimínalas primero</span> }
          <span class="spacer"></span>
          <button ui-button [disabled]="!dirty()" (click)="reset()">Deshacer</button>
          <button ui-button variant="primary" (click)="save()">{{ isNew() ? 'Crear en el borrador' : 'Guardar cambios' }}</button>
        </div>
      }
    </ui-card>
  `,
})
export class CategoryPanel {
  readonly doc = input.required<FlowDocument>();
  /** Categoría existente; null cuando se está creando una. */
  readonly category = input<Category | null>(null);
  readonly isNew = input(false);
  readonly editable = input(false);
  readonly saved = output<CategoryForm>();
  readonly remove = output<void>();

  protected readonly stopOptions = STOP_OPTIONS;
  protected readonly policyCount = computed(() => this.category()?.policies.length ?? 0);
  protected readonly title = computed(() => (this.isNew() ? 'Nueva categoría' : `${this.category()?.code} · ${this.category()?.name}`));

  private readonly base = computed<CategoryForm>(() => {
    const c = this.category();
    if (this.isNew() || !c) return { code: '', name: '', order: String(this.doc().categories.length + 1), active: true, stopRule: 'inherit' };
    return { code: c.code, name: c.name, order: String(c.order), active: c.active, stopRule: c.stopRule };
  });

  /** Valores en edición; se reinician al cambiar de categoría o al guardar. */
  private readonly draft = linkedSignal<unknown, CategoryForm | null>({ source: () => [this.category()?.code, this.isNew(), this.category()], computation: () => null });
  private readonly touched = linkedSignal<unknown, boolean>({ source: () => [this.category()?.code, this.isNew()], computation: () => false });

  protected readonly form = computed(() => this.draft() ?? this.base());
  protected readonly dirty = computed(() => !!this.draft() && JSON.stringify(this.draft()) !== JSON.stringify(this.base()));

  private readonly allErrors = computed(() => {
    const f = this.form();
    const e: { code?: string; name?: string; order?: string } = {};
    if (!/^\d{1,4}$/.test(f.code)) e.code = 'Usa de 1 a 4 dígitos';
    else if (this.isNew() && this.doc().categories.some((c) => c.code === f.code)) e.code = `El código ${f.code} ya existe en este flujo`;
    if (!f.name.trim()) e.name = 'El nombre es obligatorio';
    if (!/^[1-9]\d*$/.test(String(f.order))) e.order = 'Entero mayor a 0';
    return e;
  });
  /** Los errores se muestran tras el primer cambio o intento de guardado; en altas, desde el inicio. */
  protected readonly errors = computed(() => (this.touched() || this.isNew() ? this.allErrors() : {}));

  protected readonly stopHint = computed(() => {
    switch (this.form().stopRule) {
      case 'inherit': return `Usa la regla del flujo (actualmente: ${this.doc().stopOnStop ? 'detener' : 'no detener'}).`;
      case 'yes': return 'Esta categoría detiene la evaluación al encontrar una acción que detiene.';
      default: return 'Esta categoría nunca detiene la evaluación.';
    }
  });

  protected patch(change: Partial<CategoryForm>): void {
    this.draft.set({ ...this.form(), ...change });
    this.touched.set(true);
  }
  protected reset(): void {
    this.draft.set(null);
    this.touched.set(false);
  }
  protected save(): void {
    this.touched.set(true);
    if (Object.keys(this.allErrors()).length) return;
    this.saved.emit(this.form());
  }
}
