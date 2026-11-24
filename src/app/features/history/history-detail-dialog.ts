import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HistoryEntry } from '@core/api/history.api';
import { UiButton, UiIcon, UiModalFrame, UiTag } from '@shared/ui';
import { CHANGE_TONE } from './change-tone';

interface DiffLine {
  text: string;
  /** "same" = idéntica en ambos lados; "removed"/"added" = solo en un lado. */
  kind: 'same' | 'removed' | 'added';
}

/** Serializa un lado del cambio y marca las líneas que no existen en el otro. */
function diffLines(side: Record<string, unknown> | null, other: Record<string, unknown> | null, kind: 'removed' | 'added'): DiffLine[] {
  if (side === null) return [{ text: 'null', kind: 'same' }];
  const otherLines = other ? JSON.stringify(other, null, 2).split('\n') : [];
  return JSON.stringify(side, null, 2)
    .split('\n')
    .map((text) => ({ text, kind: otherLines.includes(text) ? 'same' : kind }));
}

/** Detalle de un registro de historial: metadatos, diferencia JSON antes/después y datos de integridad. */
@Component({
  selector: 'app-history-detail-dialog',
  imports: [UiModalFrame, UiTag, UiButton, UiIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .head { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
    .summary { color: var(--color-neutral-700); font-size: 14px; }
    dl { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px 16px; margin: 0 0 16px; }
    dl div { display: flex; flex-direction: column; gap: 2px; }
    dt { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-neutral-700); }
    dd { margin: 0; font-size: 14px; }
    .cols { display: grid; grid-template-columns: 1fr 1fr; border: 1px solid var(--color-divider); margin-top: 6px; }
    .col h4 { margin: 0; padding: 6px 10px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; background: var(--color-neutral-200); }
    .col + .col { border-left: 1px solid var(--color-divider); }
    pre { margin: 0; padding: 8px 0; font-family: var(--font-mono); font-size: 12px; overflow: auto; max-height: 280px; }
    pre span { display: block; padding: 0 10px; white-space: pre; }
    .removed { background: var(--color-error-bg); color: var(--color-error); }
    .added { background: var(--color-success-bg); color: var(--color-success); }
    .sig-toggle { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 16px; padding: 8px 10px; background: none; border: 1px solid var(--color-divider); cursor: pointer; font: inherit; color: inherit; }
    .sig-toggle .grow { flex: 1; text-align: left; }
    .sig { border: 1px solid var(--color-divider); border-top: 0; padding: 10px; display: grid; gap: 8px; }
    .sig span.v { font-family: var(--font-mono); font-size: 12px; word-break: break-all; }
    .sig div { display: flex; flex-direction: column; gap: 2px; }
  `,
  template: `
    <ui-modal-frame [kicker]="'Registro #' + e.seq" [title]="e.element" [closable]="true">
      <div class="head">
        <div><ui-tag size="sm" [tone]="tone">{{ e.changeType }}</ui-tag></div>
        <span class="summary">{{ e.summary }}</span>
      </div>

      <dl>
        <div><dt>Fecha y hora</dt><dd>{{ e.timestamp }}</dd></div>
        <div><dt>Usuario</dt><dd>{{ e.user }}</dd></div>
        <div><dt>Canal / producto</dt><dd>{{ e.channel === '—' ? '— (maestro)' : e.channel + ' / ' + e.product }}</dd></div>
        <div><dt>Versión</dt><dd>{{ e.version }}</dd></div>
        <div><dt>Tipo de elemento</dt><dd>{{ e.elementType }}</dd></div>
        <div><dt>Tipo de cambio</dt><dd>{{ e.changeType }}</dd></div>
      </dl>

      <span class="kicker">Diferencia JSON</span>
      <div class="cols">
        <div class="col"><h4>Antes</h4><pre>@for (l of before(); track $index) {<span [class]="l.kind">{{ l.text }}</span>}</pre></div>
        <div class="col"><h4>Después</h4><pre>@for (l of after(); track $index) {<span [class]="l.kind">{{ l.text }}</span>}</pre></div>
      </div>

      <button type="button" class="sig-toggle" [attr.aria-expanded]="sigOpen()" (click)="sigOpen.set(!sigOpen())">
        <ui-icon [name]="sigOpen() ? 'chevron-down' : 'chevron-right'" [size]="14" />
        <span class="grow">Datos de integridad</span>
        <ui-tag size="sm" [tone]="e.chainOk ? 'success' : 'error'">{{ e.chainOk ? 'Firma válida' : 'Cadena rota aquí' }}</ui-tag>
      </button>
      @if (sigOpen()) {
        <div class="sig">
          <div><dt>Registro</dt><span class="v">#{{ e.seq }}</span></div>
          <div><dt>Firma (HMAC-SHA256)</dt><span class="v">{{ e.signature }}</span></div>
          <div><dt>Firma anterior</dt><span class="v">{{ e.previousSignature }}{{ e.chainOk ? '' : '  ≠ esperada' }}</span></div>
          <div><dt>Id de llave</dt><span class="v">{{ e.keyId }}</span></div>
        </div>
      }
      <ng-container uiModalActions><button ui-button (click)="ref.close()">Cerrar</button></ng-container>
    </ui-modal-frame>
  `,
})
export class HistoryDetailDialog {
  protected readonly ref = inject<DialogRef<void>>(DialogRef);
  protected readonly e = inject<HistoryEntry>(DIALOG_DATA);
  protected readonly tone = CHANGE_TONE[this.e.changeType];
  protected readonly sigOpen = signal(false);
  protected readonly before = computed(() => diffLines(this.e.before, this.e.after, 'removed'));
  protected readonly after = computed(() => diffLines(this.e.after, this.e.before, 'added'));
}
