import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DraftSource, FlowVersion } from '@core/api/workflow.api';
import { UiButton, UiModalFrame, UiOption, UiRadioGroup } from '@shared/ui';

export interface OpenDraftData {
  versions: FlowVersion[];
}
export interface OpenDraftResult {
  source: DraftSource;
  version?: number;
}

/** Elige desde qué base se abre el borrador: versión vigente, una retirada o vacío. */
@Component({
  selector: 'app-open-draft-dialog',
  imports: [FormsModule, UiModalFrame, UiRadioGroup, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `p { margin: 0 0 12px; font-size: 14px; }`,
  template: `
    <ui-modal-frame title="Abrir borrador" kicker="Flujos">
      <p>Solo puede haber un borrador a la vez. ¿Desde qué base quieres partir?</p>
      <ui-radio-group [options]="options" [ngModel]="source()" (ngModelChange)="source.set($event)" />
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" (click)="confirm()">Abrir borrador</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class OpenDraftDialog {
  private readonly data = inject<OpenDraftData>(DIALOG_DATA);
  protected readonly ref = inject<DialogRef<OpenDraftResult>>(DialogRef);
  protected readonly source = signal<string>('current');

  protected readonly options: UiOption<string>[] = (() => {
    const list: UiOption<string>[] = [{ value: 'current', label: 'Copiar la versión vigente' }];
    for (const v of this.data.versions.filter((x) => x.status === 'retired')) list.push({ value: `retired:${v.number}`, label: `Copiar la versión retirada v${v.number}` });
    list.push({ value: 'empty', label: 'Empezar vacío' });
    return list;
  })();

  protected confirm(): void {
    const [source, version] = this.source().split(':');
    this.ref.close({ source: source as DraftSource, version: version ? +version : undefined });
  }
}
