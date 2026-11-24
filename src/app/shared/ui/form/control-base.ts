import { afterNextRender, DestroyRef, Directive, inject, InjectionToken, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ControlValueAccessor, NgControl, ValidationErrors, Validators } from '@angular/forms';

/** Contrato que <ui-form-field> usa para leer el estado del control proyectado dentro de él. */
export interface UiControlRef {
  readonly id: () => string;
  readonly errors: () => ValidationErrors | null;
  readonly showError: () => boolean;
  readonly isRequired: () => boolean;
}
export const UI_CONTROL = new InjectionToken<UiControlRef>('UI_CONTROL');

let nextId = 0;

/**
 * Base de los controles (ControlValueAccessor + estado de error por signals, compatible con zoneless).
 * Funciona con formularios reactivos y template-driven:
 *   <ui-input formControlName="user" />   <ui-select [(ngModel)]="x" />
 *
 * Nota: se enlaza `ngControl.valueAccessor = this` (en vez de NG_VALUE_ACCESSOR) para poder
 * inyectar NgControl sin dependencia circular.
 */
@Directive()
export abstract class UiControlBase<T> implements ControlValueAccessor, UiControlRef {
  readonly ngControl = inject(NgControl, { self: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Id del elemento nativo (para <label for>). Se autogenera si no se pasa. */
  readonly inputId = input<string>(`ui-ctl-${nextId++}`, { alias: 'id' });
  readonly id = () => this.inputId();

  protected readonly value = signal<T | null>(null);
  readonly disabled = signal(false);
  readonly errors = signal<ValidationErrors | null>(null);
  readonly showError = signal(false);
  readonly isRequired = signal(false);

  private onChange: (value: T | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    if (this.ngControl) this.ngControl.valueAccessor = this;
    afterNextRender(() => {
      this.sync();
      this.ngControl?.control?.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.sync());
    });
  }

  writeValue(value: T | null): void {
    this.value.set(value);
  }
  registerOnChange(fn: (value: T | null) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /** El usuario cambió el valor. */
  protected commit(value: T | null): void {
    this.value.set(value);
    this.onChange(value);
  }
  /** El usuario salió del control. */
  protected touch(): void {
    this.onTouched();
    this.sync();
  }

  private sync(): void {
    const control = this.ngControl?.control;
    if (!control) return;
    this.errors.set(control.errors);
    this.showError.set(control.invalid && (control.touched || control.dirty));
    this.isRequired.set(control.hasValidator(Validators.required));
    this.disabled.set(control.disabled);
  }
}
