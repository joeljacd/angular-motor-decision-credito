import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Botón del sistema (atributo sobre <button> o <a>):
 *   <button ui-button>Guardar</button>
 *   <button ui-button variant="secondary" size="sm">Cancelar</button>
 *   <button ui-button variant="primary" [loading]="saving()" [disabled]="saving()">Enviar</button>
 *   <button ui-button icon aria-label="Cerrar"><ui-icon name="x" /></button>
 *   <button ui-button uiBlueprint>CTA con marco blueprint</button>
 */
@Component({
  selector: 'button[ui-button], a[ui-button]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"v-" + variant() + " s-" + size()',
    '[class.block]': 'block()',
    '[class.icon]': 'icon()',
    '[class.loading]': 'loading()',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
  template: `
    @if (loading()) {
      <span class="spinner" aria-hidden="true"></span>
    }
    <ng-content />
  `,
  styles: `
    :host {
      position: relative;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      cursor: pointer; text-decoration: none; white-space: nowrap;
      font-family: var(--font-heading); font-weight: var(--font-heading-weight);
      font-size: 14px; line-height: 1.2; color: var(--color-text);
      background: transparent; border: 1px solid var(--color-divider);
      border-radius: var(--radius-md);
      padding: 0 16px; transition: background 0.12s, border-color 0.12s, color 0.12s;
    }
    :host(.s-sm) { height: 32px; padding: 0 12px; }
    :host(.s-md) { height: 38px; padding: 0 16px; }
    :host(.s-lg) { height: 44px; padding: 0 20px; font-size: 16px; letter-spacing: 0.04em; }
    :host(.block) { display: flex; width: 100%; }
    :host(.icon) { width: 36px; height: 36px; padding: 0; }
    :host(.icon.s-sm) { width: 32px; height: 32px; }

    :host(.v-primary) { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }
    :host(.v-primary:hover) { background: var(--color-accent-600); border-color: var(--color-accent-600); }
    :host(.v-primary:active) { background: var(--color-accent-700); }

    :host(.v-secondary:hover) { background: color-mix(in srgb, var(--color-text) 7%, transparent); }
    :host(.v-secondary:active) { background: color-mix(in srgb, var(--color-text) 14%, transparent); }

    :host(.v-ghost) { border-color: transparent; color: var(--color-accent-700); padding: 0 8px; }
    :host(.v-ghost:hover) { background: color-mix(in srgb, var(--color-accent) 10%, transparent); }
    :host(.v-ghost.icon) { color: inherit; }

    :host(.v-danger) { background: var(--color-error); border-color: var(--color-error); color: #fff; }
    :host(.v-danger:hover) { filter: brightness(0.92); }
    :host(.v-danger-ghost) { border-color: transparent; color: var(--color-error); padding: 0 8px; }
    :host(.v-danger-ghost:hover) { background: var(--color-error-bg); }

    :host(:disabled), :host([disabled]) { opacity: 0.45; cursor: not-allowed; pointer-events: none; }
    :host(.loading) { pointer-events: none; }

    .spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid currentColor; border-right-color: transparent;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class UiButton {
  readonly variant = input<ButtonVariant>('secondary');
  readonly size = input<ButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
  /** Botón cuadrado solo-ícono (recuerda poner aria-label). */
  readonly icon = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
}
