import { Directive, ElementRef, inject, input, OnInit, Renderer2 } from '@angular/core';

/**
 * Marco "blueprint": agrega la clase `.blueprint` y las 4 marcas de registro en las esquinas.
 * Estilos globales en styles/_blueprint.scss. Los temas pueden ocultarlas con `--blueprint-corners-display: none`.
 *
 *   <section uiBlueprint>…</section>
 *   <button ui-button uiBlueprint>…</button>
 *   <div uiBlueprint corners="diagonal">…</div>   // solo tl + br
 */
@Directive({ selector: '[uiBlueprint]' })
export class UiBlueprint implements OnInit {
  readonly corners = input<'all' | 'diagonal'>('all');

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  ngOnInit(): void {
    this.renderer.addClass(this.el, 'blueprint');
    const positions = this.corners() === 'diagonal' ? ['tl', 'br'] : ['tl', 'tr', 'bl', 'br'];
    for (const pos of positions) {
      const corner = this.renderer.createElement('i');
      this.renderer.addClass(corner, 'corner');
      this.renderer.addClass(corner, pos);
      this.renderer.setAttribute(corner, 'aria-hidden', 'true');
      this.renderer.appendChild(this.el, corner);
    }
  }
}
