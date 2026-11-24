import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICONS, IconName } from './icons';

/** <ui-icon name="home" [size]="18" />  — hereda el color (currentColor). Decorativo por defecto (aria-hidden). */
@Component({
  selector: 'ui-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.width.px]': 'size()', '[style.height.px]': 'size()', '[attr.aria-hidden]': 'label() ? null : "true"', '[attr.role]': 'label() ? "img" : null', '[attr.aria-label]': 'label() || null' },
  template: `<svg
    viewBox="0 0 24 24"
    [attr.width]="size()"
    [attr.height]="size()"
    fill="none"
    stroke="currentColor"
    [attr.stroke-width]="stroke()"
    stroke-linecap="round"
    stroke-linejoin="round"
    [innerHTML]="markup()"
  ></svg>`,
  styles: `
    :host { display: inline-flex; flex: none; line-height: 0; }
    svg { display: block; }
  `,
})
export class UiIcon {
  readonly name = input.required<IconName>();
  readonly size = input(18);
  readonly stroke = input(1.5);
  /** Si se define, el ícono es informativo (role=img) en lugar de decorativo. */
  readonly label = input('');

  private readonly sanitizer = inject(DomSanitizer);
  protected readonly markup = computed<SafeHtml>(() =>
    // Contenido estático del repositorio (ICONS), no proviene de entrada de usuario.
    this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()]),
  );
}
