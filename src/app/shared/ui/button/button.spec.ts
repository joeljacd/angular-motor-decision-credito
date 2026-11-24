import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { UiButton } from './button';

@Component({ imports: [UiButton], template: `<button ui-button icon variant="danger" [loading]="loading">Ok</button>` })
class Host { loading = true; }

describe('UiButton', () => {
  it('aplica variante, icon (atributo sin valor) y estado loading', async () => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const el: HTMLElement = f.nativeElement.querySelector('button');
    expect(el.classList).toContain('v-danger');
    expect(el.classList).toContain('icon');
    expect(el.classList).toContain('loading');
    expect(el.getAttribute('aria-busy')).toBe('true');
  });
});
