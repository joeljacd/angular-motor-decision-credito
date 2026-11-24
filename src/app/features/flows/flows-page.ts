import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { WorkflowApi, FlowVersion, VersionStatus, SealStatus } from '@core/api/workflow.api';
import { MastersStore } from '@core/state/masters.store';
import { FlowWorkspaceStore } from '@core/state/flow-workspace.store';
import { MasterRequests } from '../masters/master-requests.service';
import { UiAlert, UiButton, UiCard, UiFormField, UiOption, UiPageHeader, UiSelect, UiTableSkeleton, UiTag, ModalService, ToastService, UiEmptyState } from '@shared/ui';
import { OpenDraftDialog, OpenDraftResult } from './open-draft-dialog';
import { Tone } from '@core/util/tone';

const STATUS: Record<VersionStatus, { label: string; tone: Tone }> = {
  current: { label: 'Vigente', tone: 'success' },
  retired: { label: 'Retirada', tone: 'neutral' },
  edit: { label: 'Borrador · en edición', tone: 'warning' },
  review: { label: 'Borrador · en revisión', tone: 'info' },
};
const SEAL: Record<SealStatus, Tone> = { Sellada: 'success', 'Sin sellar': 'warning', 'Firma inválida': 'error' };

/** Versiones del flujo por canal + producto, y acceso al borrador (único) de todo el motor. */
@Component({
  selector: 'app-flows-page',
  imports: [FormsModule, RouterLink, UiPageHeader, UiCard, UiFormField, UiSelect, UiButton, UiTag, UiAlert, UiTableSkeleton, UiEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }
    .pick { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-end; }
    .pick ui-form-field { min-width: 280px; }
    .draft { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; justify-content: space-between; }
    .mono { font-family: var(--font-mono); font-size: 13px; }
    .row-actions { display: flex; gap: 4px; justify-content: flex-end; }
  `,
  template: `
    <ui-page-header kicker="Motor · Políticas" title="Flujos" description="Versiones del flujo de decisión por canal y producto. Hay un único borrador a la vez para todo el motor.">
      @if (!ws.loaded()) {} @else if (ws.state()?.status === 'none') {
        <button ui-button variant="primary" [disabled]="!canEdit()" (click)="openDraft()">Abrir borrador</button>
      }
    </ui-page-header>

    @if (ws.state(); as st) {
      @if (st.status !== 'none') {
        <ui-card padding="md">
          <div class="draft">
            <div>
              <ui-tag [tone]="st.status === 'revision' ? 'info' : 'warning'">{{ st.status === 'revision' ? 'En revisión' : 'En edición' }}</ui-tag>
              Borrador {{ st.openedId }} · abierto por {{ st.openedBy }} el {{ st.openedAt }}
            </div>
            <div class="row-actions">
              @if (st.status === 'edicion') {
                <a ui-button variant="primary" routerLink="editor">Ir al borrador</a>
                <button ui-button variant="danger-ghost" [disabled]="!canEdit()" (click)="discard()">Descartar</button>
              } @else {
                <a ui-button variant="primary" routerLink="revision">Ver revisión</a>
              }
            </div>
          </div>
        </ui-card>
      }
    }

    <ui-card padding="md">
      <div class="pick">
        <ui-form-field label="Canal + producto">
          <ui-select [options]="comboOptions()" [ngModel]="combo()" (ngModelChange)="combo.set($event)" />
        </ui-form-field>
      </div>
    </ui-card>

    @if (error()) {
      <ui-alert tone="error">No fue posible cargar las versiones.</ui-alert>
    } @else if (loading()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="4" /></ui-card>
    } @else if (!versions().length) {
      <ui-empty-state title="Sin versiones para esta combinación" />
    } @else {
      <ui-card padding="md">
        <div class="ui-table-wrap">
          <table class="ui-table">
            <thead><tr><th>Versión</th><th>Estado</th><th>Sello</th><th>Publicada</th><th>Aprobó</th><th>Vigencia</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (v of versions(); track v.number) {
                <tr>
                  <td class="mono">v{{ v.number }}</td>
                  <td><ui-tag size="sm" [tone]="statusOf(v).tone">{{ statusOf(v).label }}</ui-tag></td>
                  <td><ui-tag size="sm" [tone]="sealTone(v)">{{ v.seal }}</ui-tag></td>
                  <td>{{ v.publishedAt }}</td>
                  <td>{{ v.approvedBy }}</td>
                  <td>{{ v.validity }}</td>
                  <td>
                    <div class="row-actions">
                      @if (v.status === 'current') {
                        <button ui-button size="sm" variant="ghost" [disabled]="!canEdit() || v.seal !== 'Sin sellar'" (click)="requestSeal(v)">Solicitar sello</button>
                        <button ui-button size="sm" variant="danger-ghost" [disabled]="!canEdit()" (click)="requestCloseValidity(v)">Cerrar vigencia</button>
                      } @else if (v.status === 'edit') {
                        <a ui-button size="sm" variant="ghost" routerLink="editor">Ir al borrador</a>
                      } @else if (v.status === 'review') {
                        <a ui-button size="sm" variant="ghost" routerLink="revision">Revisar</a>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </ui-card>
    }
  `,
})
export class FlowsPage implements OnInit {
  protected readonly ws = inject(FlowWorkspaceStore);
  private readonly masters = inject(MastersStore);
  private readonly requests = inject(MasterRequests);
  private readonly api = inject(WorkflowApi);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);

  protected readonly canEdit = this.requests.canEdit;
  protected readonly combo = signal('1-1');
  protected readonly versions = signal<FlowVersion[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  /** Solo las combinaciones habilitadas en la matriz canal–producto. */
  protected readonly comboOptions = computed<UiOption<string>[]>(() => {
    const s = this.masters.snapshot();
    if (!s) return [];
    return s.matrix.map((key) => {
      const [c, p] = key.split('-');
      const channel = s.channels.find((x) => x.code === c);
      const product = s.products.find((x) => x.code === p);
      return { value: key, label: `${c} ${channel?.name ?? ''} / ${p} ${product?.name ?? ''}` };
    });
  });

  constructor() {
    // Recarga las versiones al cambiar la combinación o el estado del borrador.
    effect(() => {
      const key = this.combo();
      this.ws.state();
      this.fetch(key);
    });
  }

  ngOnInit(): void {
    this.masters.load();
    this.ws.load();
    this.requests.load();
  }

  private fetch(key: string): void {
    const [channel, product] = key.split('-');
    this.loading.set(true);
    this.error.set(false);
    this.api.versions(channel, product).subscribe({
      next: (list) => { this.versions.set(list); this.loading.set(false); },
      error: () => { this.error.set(true); this.loading.set(false); },
    });
  }

  protected statusOf(v: FlowVersion) {
    return STATUS[v.status];
  }
  protected sealTone(v: FlowVersion): Tone {
    return SEAL[v.seal];
  }

  protected async openDraft(): Promise<void> {
    const ref = this.modal.open<OpenDraftDialog, OpenDraftResult, unknown>(OpenDraftDialog, { data: { versions: this.versions() } });
    const result = await firstValueFrom(ref.closed, { defaultValue: undefined });
    if (!result) return;
    this.ws.open(result.source, result.version).subscribe({ next: () => this.toast.success('Borrador abierto') });
  }

  protected async discard(): Promise<void> {
    const ok = await this.modal.confirm({ title: '¿Descartar el borrador?', message: 'Se perderán los cambios no publicados.', confirmLabel: 'Descartar', cancelLabel: 'Cancelar', tone: 'danger' });
    if (ok) this.ws.discard().subscribe({ next: () => this.toast.success('Borrador descartado') });
  }

  protected requestSeal(v: FlowVersion): void {
    this.createRequest(v, 'Solicitar sello', 'Sello', 'Sin sellar', 'Sellada');
  }
  protected requestCloseValidity(v: FlowVersion): void {
    this.createRequest(v, 'Cerrar vigencia', 'Vigencia', v.validity, 'Cerrada hoy');
  }

  private async createRequest(v: FlowVersion, action: string, field: string, from: string, to: string): Promise<void> {
    const element = `Flujo ${this.combo()} v${v.number}`;
    const ok = await this.modal.confirm({
      title: `¿${action} de la v${v.number}?`,
      message: this.requests.pendingFor(element) ? 'Ya hay una solicitud pendiente sobre esta versión.' : 'Se creará una solicitud que otro aprobador debe aprobar.',
      confirmLabel: 'Crear solicitud',
      cancelLabel: 'Cancelar',
      tone: 'primary',
    });
    if (ok && !this.requests.pendingFor(element)) {
      this.requests.create({ type: 'Flujo', action, element, current: { [field]: from }, proposed: { [field]: to } }).subscribe();
    }
  }
}
