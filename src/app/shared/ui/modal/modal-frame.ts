import { DialogRef } from '@angular/cdk/dialog';
import { afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { Tone } from '@core/util/tone';
import { UiBlueprint } from '../card/blueprint.directive';
import { UiIcon } from '../icon/icon';

let seq = 0;

/**
 * Contenedor visual estándar de un modal (marco blueprint, encabezado, cuerpo y acciones).
 *
 *   <ui-modal-frame kicker="Nuevo registro" title="Agregar usuario">
 *     …contenido…
 *     <ng-container uiModalActions>
 *       <button ui-button (click)="ref.close()">Cancelar</button>
 *       <button ui-button variant="primary">Guardar</button>
 *     </ng-container>
 *   </ui-modal-frame>
 */
@Component({
  selector: 'ui-modal-frame',
  imports: [UiIcon],
  hostDirectives: [UiBlueprint],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.padding.px]': 'flush() ? 0 : 24' },
  template: `
    @if (title() || kicker() || code() || closable()) {
    <header class="head" [id]="titleId">
      @if (code() || kicker()) {
        <div class="meta">
          @if (code()) {
            <span class="code" [class]="'tone-' + codeTone()">{{ code() }}</span>
          }
          @if (kicker()) {
            <span class="kicker">{{ kicker() }}</span>
          }
        </div>
      }
      @if (title()) {
        <h2 class="title">{{ title() }}</h2>
      }
      @if (closable()) {
        <button type="button" class="close" aria-label="Cerrar" (click)="close()">
          <ui-icon name="x" [size]="18" />
        </button>
      }
    </header>
    }
    <div class="body"><ng-content /></div>
    <footer class="actions"><ng-content select="[uiModalActions]" /></footer>
  `,
  styleUrl: './modal-frame.scss',
})
export class UiModalFrame {
  readonly title = input('');
  readonly kicker = input('');
  /** Código HTTP/estado mostrado como etiqueta (p. ej. '403'). */
  readonly code = input('');
  readonly codeTone = input<Tone>('error');
  readonly closable = input(false);
  /** Sin padding (para encabezados a sangre, como la ficha de usuario). */
  readonly flush = input(false);

  protected readonly titleId = `ui-modal-title-${seq++}`;
  private readonly ref = inject(DialogRef, { optional: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    // Conecta el título con el contenedor role="dialog" del CDK (accesibilidad).
    afterNextRender(() => this.host.closest('[role="dialog"]')?.setAttribute('aria-labelledby', this.titleId));
  }

  protected close(): void {
    this.ref?.close();
  }
}
