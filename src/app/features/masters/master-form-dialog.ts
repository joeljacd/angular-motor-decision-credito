import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UiButton, UiCheckbox, UiFormField, UiInput, UiModalFrame, UiSelect, UiTextarea } from '@shared/ui';
import { MasterChange, MasterRequests } from './master-requests.service';

export interface FormFieldDef {
  key: string;
  label: string;
  kind: 'text' | 'select' | 'check';
  disabled?: boolean;
  mono?: boolean;
  hint?: string;
  /** kind = select */
  options?: string[];
}

export type FormValues = Record<string, string | boolean>;

export interface MasterFormData {
  kicker: string;
  title: string;
  fields: FormFieldDef[];
  values: FormValues;
  /** Texto del elemento ya existente (para detectar duplicados); null en altas. */
  element: string | null;
  /** Devuelve un mensaje de error por campo inválido. */
  validate: (values: FormValues) => Record<string, string>;
  /** Arma la solicitud a partir de los valores validados y el comentario. */
  build: (values: FormValues, comment: string) => MasterChange;
}

/** Formulario genérico de maestros: valida, y al enviar crea la solicitud de cambio. */
@Component({
  selector: 'app-master-form-dialog',
  imports: [FormsModule, RouterLink, UiModalFrame, UiFormField, UiInput, UiSelect, UiCheckbox, UiTextarea, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .info { display: flex; gap: 8px; margin-bottom: 14px; padding: 8px 10px; font-size: 12px; background: var(--color-info-bg); color: var(--color-info); }
    .fields { display: flex; flex-direction: column; gap: 14px; }
    .err { margin: 4px 0 0; font-size: 12px; color: var(--color-error); }
    .dup { font-size: 13px; padding: 8px 10px; background: var(--color-warning-bg); color: var(--color-warning-fg); }
  `,
  template: `
    <ui-modal-frame [kicker]="data.kicker" [title]="data.title" [closable]="true">
      <div class="info">Este cambio no rige hasta que otro aprobador lo apruebe.</div>
      <div class="fields">
        @for (f of data.fields; track f.key) {
          @switch (f.kind) {
            @case ('check') {
              <div>
                <ui-checkbox [disabled]="!!f.disabled || !canEdit()" [ngModel]="values()[f.key]" (ngModelChange)="set(f.key, $event)">{{ f.label }}</ui-checkbox>
                @if (shown()[f.key]) { <p class="err" role="alert">{{ shown()[f.key] }}</p> }
              </div>
            }
            @case ('select') {
              <ui-form-field [label]="f.label">
                <ui-select [options]="optionsOf(f)" [disabled]="!!f.disabled || !canEdit()" [ngModel]="values()[f.key]" (ngModelChange)="set(f.key, $event)" />
                @if (shown()[f.key]) { <p class="err" role="alert">{{ shown()[f.key] }}</p> }
              </ui-form-field>
            }
            @default {
              <ui-form-field [label]="f.label" [hint]="f.hint ?? ''">
                <ui-input [mono]="!!f.mono" [disabled]="!!f.disabled || !canEdit()" [ngModel]="values()[f.key]" (ngModelChange)="set(f.key, $event)" />
                @if (shown()[f.key]) { <p class="err" role="alert">{{ shown()[f.key] }}</p> }
              </ui-form-field>
            }
          }
        }
        <ui-form-field label="Comentario para el aprobador">
          <ui-textarea [rows]="3" placeholder="Motivo del cambio" [ngModel]="comment()" (ngModelChange)="comment.set($event)" />
        </ui-form-field>
        @if (duplicate(); as dup) {
          <div class="dup">Ya hay una solicitud pendiente sobre este elemento: <a [routerLink]="['/requests']" [queryParams]="{ id: dup }" (click)="ref.close()">{{ dup }}</a></div>
        }
      </div>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" [disabled]="!!duplicate() || !canEdit() || saving()" [loading]="saving()" (click)="submit()">Crear solicitud de cambio</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class MasterFormDialog {
  protected readonly data = inject<MasterFormData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<boolean>>(DialogRef);
  private readonly requests = inject(MasterRequests);

  protected readonly canEdit = this.requests.canEdit;
  protected readonly values = signal<FormValues>({ ...this.data.values });
  protected readonly comment = signal('');
  protected readonly touched = signal(false);
  protected readonly saving = signal(false);

  private readonly errors = computed(() => this.data.validate(this.values()));
  /** Los errores se muestran solo tras el primer intento de envío. */
  protected readonly shown = computed(() => (this.touched() ? this.errors() : {}));
  protected readonly duplicate = computed(() => (this.data.element ? this.requests.pendingFor(this.data.element)?.id : undefined));

  protected optionsOf(field: FormFieldDef) {
    return (field.options ?? []).map((o) => ({ value: o, label: o }));
  }

  protected set(key: string, value: string | boolean): void {
    this.values.update((v) => ({ ...v, [key]: value }));
  }

  protected submit(): void {
    this.touched.set(true);
    if (Object.keys(this.errors()).length) return;
    this.saving.set(true);
    this.requests.create(this.data.build(this.values(), this.comment().trim())).subscribe({
      next: () => this.ref.close(true),
      error: () => this.saving.set(false),
    });
  }
}
