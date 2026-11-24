import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('arranca en modo claro y aplica tokens al documento', () => {
    const theme = TestBed.inject(ThemeService);
    expect(theme.mode()).toBe('light');
    expect(document.documentElement.style.getPropertyValue('--color-bg')).not.toBe('');
  });

  it('toggleMode alterna claro/oscuro', () => {
    const theme = TestBed.inject(ThemeService);
    theme.toggleMode();
    expect(theme.isDark()).toBe(true);
    theme.toggleMode();
    expect(theme.isDark()).toBe(false);
  });

  it('setAccent ignora valores no hex y acepta hex', () => {
    const theme = TestBed.inject(ThemeService);
    theme.setAccent('rojo');
    expect(theme.accent()).toBeNull();
    theme.setAccent('#0a7d5a');
    expect(theme.accent()).toBe('#0a7d5a');
  });
});
