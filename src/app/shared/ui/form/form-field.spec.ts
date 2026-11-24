import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiFormField } from './form-field';
import { UiInput } from './input';

@Component({
  imports: [ReactiveFormsModule, UiFormField, UiInput],
  template: `<ui-form-field label="Usuario"><ui-input [formControl]="ctrl" /></ui-form-field>`,
})
class Host { ctrl = new FormControl('', { nonNullable: true, validators: [Validators.required] }); }

describe('ui-form-field + ui-input', () => {
  it('muestra el error requerido tras tocar el control', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role="alert"]')).toBeNull();
    f.componentInstance.ctrl.markAsTouched();
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('propaga el valor escrito al FormControl', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const input: HTMLInputElement = f.nativeElement.querySelector('input');
    input.value = 'jperez';
    input.dispatchEvent(new Event('input'));
    expect(f.componentInstance.ctrl.value).toBe('jperez');
  });
});
