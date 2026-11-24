import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DraftSource } from '@core/api/workflow.api';
import { UiButton, UiFormField, UiModalFrame, UiOption, UiSelect } from '@shared/ui';

export interface OpenDraftData {
  /** Etiqueta "1 Canal / 1 Producto" que se muestra como sobretítulo. */
  comboLabel: string;
  /** Número de la versión vigente, si existe. */
  currentVersion?: number;
  /** Números de las versiones retiradas. */
  retired: number[];
  /** Si no hay ninguna versión, solo se puede empezar vacío. */
  hasVersions: boolean;
}
export interface OpenDraftResult {
  source: DraftSource;
  version?: number;
}

interface SourceOption {
  key: DraftSource;
  label: string;
  hint: string;
  disabled: boolean;
}

/** Elige desde qué base se abre el borrador: versión vigente, una retirada, o vacío (solo sin versiones). */
@Component({
  selector: 'app-open-draft-dialog',
  imports: [FormsModule, UiModalFrame, UiButton, UiFormField, UiSelect],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .opts { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    label.opt { display: flex; gap: 12px; align-items: flex-start; padding: 12px; border: 1px solid var(--color-divider); cursor: pointer; }
    label.opt.on { border-color: var(--color-accent); background: var(--color-accent-100); }
    label.opt.off { opacity: 0.5; cursor: not-allowed; }
    label.opt input { margin-top: 3px; accent-color: var(--color-accent); }
    .text { display: flex; flex-direction: column; gap: 2px; }
    .text span:first-child { font-weight: 500; }
    .text span:last-child { font-size: 12px; color: var(--color-neutral-700); }
    .note { font-size: 12px; color: var(--color-neutral-700); }
  `,
  template: `
    <ui-modal-frame [kicker]="data.comboLabel" title="Abrir borrador">
      <div class="opts">
        @for (o of options; track o.key) {
          <label class="opt" [class.on]="source() === o.key && !o.disabled" [class.off]="o.disabled">
            <input type="radio" name="source" [disabled]="o.disabled" [checked]="source() === o.key && !o.disabled" (change)="source.set(o.key)" />
            <span class="text"><span>{{ o.label }}</span><span>{{ o.hint }}</span></span>
          </label>
        }
        @if (source() === 'retired' && data.retired.length) {
          <ui-form-field label="Versión retirada">
            <ui-select [options]="retiredOptions" [ngModel]="retiredSelected()" (ngModelChange)="retiredSelected.set($event)" />
          </ui-form-field>
        }
      </div>
      <div class="note">El borrador vence a los 15 días sin actividad. Solo un aprobador distinto de quien lo edite podrá publicarlo.</div>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" (click)="confirm()">Abrir borrador</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class OpenDraftDialog {
  protected readonly data = inject<OpenDraftData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<OpenDraftResult>>(DialogRef);

  protected readonly options: SourceOption[] = [
    { key: 'current', label: 'Desde la versión vigente', hint: this.data.currentVersion ? `Copia la versión ${this.data.currentVersion} publicada` : 'No hay versión vigente', disabled: !this.data.currentVersion },
    { key: 'retired', label: 'Desde una versión retirada', hint: this.data.retired.length ? 'Elige la versión a copiar' : 'No hay versiones retiradas', disabled: !this.data.retired.length },
    { key: 'empty', label: 'Vacío', hint: 'Solo disponible si no hay versiones', disabled: this.data.hasVersions },
  ];
  protected readonly retiredOptions: UiOption<string>[] = this.data.retired.map((n) => ({ value: String(n), label: `Versión ${n}` }));

  /** Por defecto la primera fuente disponible, igual que el prototipo. */
  protected readonly source = signal<DraftSource>(this.options.find((o) => !o.disabled)?.key ?? 'empty');
  protected readonly retiredSelected = signal(String(this.data.retired[0] ?? ''));

  protected confirm(): void {
    const source = this.source();
    this.ref.close({ source, version: source === 'retired' ? +this.retiredSelected() : undefined });
  }
}
