import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FlowVersion, SealStatus, VersionStatus, WorkflowApi } from '@core/api/workflow.api';
import { FlowWorkspaceStore } from '@core/state/flow-workspace.store';
import { MastersStore } from '@core/state/masters.store';
import { Tone } from '@core/util/tone';
import { ModalService, ToastService, UiAlert, UiButton, UiCard, UiEmptyState, UiFormField, UiOption, UiPageHeader, UiSelect, UiTableSkeleton, UiTag } from '@shared/ui';
import { MasterRequests } from '../masters/master-requests.service';
import { RequestConfirmDialog, RequestConfirmData } from '../masters/request-confirm-dialog';
import { OpenDraftData, OpenDraftDialog, OpenDraftResult } from './open-draft-dialog';

const STATUS: Record<VersionStatus, { label: string; tone: Tone }> = {
  current: { label: 'Publicada vigente', tone: 'success' },
  retired: { label: 'Retirada', tone: 'neutral' },
  edit: { label: 'Borrador · En edición', tone: 'warning' },
  review: { label: 'Borrador · En revisión', tone: 'info' },
};
const SEAL: Record<SealStatus, Tone> = { sealed: 'success', unsealed: 'warning', invalid: 'error' }
const SEAL_LABEL: Record<SealStatus, string> = { sealed: 'Sellada', unsealed: 'Sin sellar', invalid: 'Firma inválida' };;

/** Combinación con contenido de demostración completo (editor, revisión y vista de versión). */
const DEMO_COMBO = '1-1';

/**
 * Versiones del flujo por canal + producto y acceso al borrador.
 * Una versión publicada o retirada nunca se edita: para cambiarla se abre un borrador.
 */
@Component({
  selector: 'app-flows-page',
  imports: [FormsModule, RouterLink, UiPageHeader, UiCard, UiFormField, UiSelect, UiButton, UiTag, UiAlert, UiTableSkeleton, UiEmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; gap: 18px; animation: ui-in 0.3s ease both; }
    .pick { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; align-items: end; }
    .summary { display: flex; gap: 16px; font-size: 13px; color: var(--color-neutral-700); padding-bottom: 8px; }
    .summary strong { color: var(--color-text); font-weight: 500; }
    .notice { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .notice span.msg { flex: 1; min-width: 240px; font-size: 14px; }
    .ver { font-family: var(--font-heading); font-weight: 600; font-size: 18px; }
    .row-actions { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; }
    .bad { color: var(--color-error); }
  `,
  template: `
    <ui-page-header kicker="Flujos · Versiones por canal + producto" title="Flujos" description="Una versión publicada o retirada nunca se edita: para cambiarla se abre un borrador.">
      @if (showOpen()) {
        <button ui-button variant="primary" (click)="openDraft()">+ Abrir borrador</button>
      }
      @if (draft()) {
        <button ui-button variant="primary" (click)="goDraft()">Ir al borrador →</button>
      }
    </ui-page-header>

    <ui-card padding="md">
      <div class="pick">
        <ui-form-field label="Canal">
          <ui-select [options]="channelOptions()" [ngModel]="channel()" (ngModelChange)="onChannel($event)" />
        </ui-form-field>
        <ui-form-field label="Producto (solo combinaciones habilitadas)">
          <ui-select [options]="productOptions()" [ngModel]="product()" (ngModelChange)="product.set($event)" />
        </ui-form-field>
        <div class="summary">
          <span>{{ versions().length }} versiones</span>
          <span>Vigente: <strong>{{ currentLabel() }}</strong></span>
        </div>
      </div>
    </ui-card>

    @if (draft(); as d) {
      <ui-alert tone="warning">
        <div class="notice">
          <span class="msg">{{ draftNotice() }}</span>
          <button ui-button size="sm" (click)="goDraft()">Continuar</button>
          @if (canDiscard()) { <button ui-button size="sm" variant="danger-ghost" [disabled]="!requests.canEdit()" (click)="discard()">Descartar</button> }
        </div>
      </ui-alert>
    }

    @if (error()) {
      <ui-alert tone="error">No fue posible cargar las versiones.</ui-alert>
    } @else if (loading()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="4" /></ui-card>
    } @else if (!versions().length) {
      <ui-card padding="md">
        <ui-empty-state title="Este canal + producto aún no tiene versiones" description="El motor no evalúa solicitudes de esta combinación hasta que se publique una versión.">
          @if (showOpen()) { <button ui-button variant="primary" [disabled]="!requests.canEdit()" (click)="openDraft()">Abrir borrador vacío</button> }
        </ui-empty-state>
      </ui-card>
    } @else {
      <ui-card padding="md">
        <div class="ui-table-wrap">
          <table class="ui-table">
            <thead><tr><th>Versión</th><th>Estado</th><th>Sello</th><th>Publicada el</th><th>Aprobada por</th><th>Vigencia</th><th class="r">Acciones</th></tr></thead>
            <tbody>
              @for (v of versions(); track v.number) {
                <tr>
                  <td class="ver">v{{ v.number }}</td>
                  <td><ui-tag size="sm" [tone]="statusOf(v).tone">{{ statusOf(v).label }}</ui-tag></td>
                  <td><ui-tag size="sm" [tone]="sealTone(v)">{{ sealLabel(v) }}</ui-tag></td>
                  <td>{{ v.publishedAt }}</td>
                  <td>{{ v.approvedBy }}</td>
                  <td>{{ v.validity }}</td>
                  <td>
                    <div class="row-actions">
                      <button ui-button size="sm" variant="ghost" (click)="view(v)">{{ viewLabel(v) }}</button>
                      @if (v.status === 'current' && requests.canEdit()) {
                        <button ui-button size="sm" variant="ghost" (click)="requestCloseValidity(v)">Solicitar cierre de vigencia</button>
                      }
                      @if (canSeal(v)) {
                        <button ui-button size="sm" variant="ghost" (click)="requestSeal(v)">Solicitar sellado</button>
                      }
                      @if (v.seal === 'invalid') {
                        <a ui-button size="sm" variant="ghost" class="bad" routerLink="/integrity">Ver en Integridad</a>
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
  protected readonly requests = inject(MasterRequests);
  private readonly masters = inject(MastersStore);
  private readonly api = inject(WorkflowApi);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly channel = signal('1');
  protected readonly product = signal('1');
  protected readonly versions = signal<FlowVersion[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  private readonly combo = computed(() => `${this.channel()}-${this.product()}`);
  private readonly snapshot = computed(() => this.masters.snapshot());

  /** Canales que tienen al menos una combinación habilitada. */
  protected readonly channelOptions = computed<UiOption<string>[]>(() => {
    const s = this.snapshot();
    if (!s) return [];
    const withCombos = new Set(s.matrix.map((k) => k.split('-')[0]));
    return s.channels.filter((c) => withCombos.has(c.code)).map((c) => ({ value: c.code, label: `${c.code} ${c.name}` }));
  });
  /** Solo los productos habilitados para el canal elegido. */
  protected readonly productOptions = computed<UiOption<string>[]>(() => {
    const s = this.snapshot();
    if (!s) return [];
    const allowed = new Set(s.matrix.filter((k) => k.startsWith(`${this.channel()}-`)).map((k) => k.split('-')[1]));
    return s.products.filter((p) => allowed.has(p.code)).map((p) => ({ value: p.code, label: `${p.code} ${p.name}` }));
  });
  private readonly comboLabel = computed(() => {
    const s = this.snapshot();
    const c = s?.channels.find((x) => x.code === this.channel());
    const p = s?.products.find((x) => x.code === this.product());
    return `${this.channel()} ${c?.name ?? ''} / ${this.product()} ${p?.name ?? ''}`;
  });

  protected readonly current = computed(() => this.versions().find((v) => v.status === 'current'));
  protected readonly currentLabel = computed(() => (this.current() ? `v${this.current()!.number}` : 'ninguna'));
  /** Borrador de esta combinación (edición o revisión). */
  protected readonly draft = computed(() => this.versions().find((v) => v.status === 'edit' || v.status === 'review'));
  protected readonly showOpen = computed(() => !this.draft() && this.requests.canEdit());
  protected readonly canDiscard = computed(() => this.draft()?.status === 'edit' && this.requests.canEdit());

  protected readonly draftNotice = computed(() => {
    const st = this.ws.state();
    if (!this.draft() || !st) return '';
    // Para combinaciones de demostración distintas de 1-1 el borrador es local y es de quien lo abrió.
    return `Ya existe un borrador abierto por ${st.openedBy} el ${st.openedAt}. ${this.draft()!.status === 'review' ? 'Está en revisión.' : 'Continúa sobre él o descártalo.'}`;
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

  /** Al cambiar de canal, el producto pasa al primero habilitado para ese canal. */
  protected onChannel(code: string): void {
    this.channel.set(code);
    const first = this.productOptions()[0]?.value;
    if (first && !this.productOptions().some((p) => p.value === this.product())) this.product.set(first);
  }

  protected statusOf(v: FlowVersion) {
    return STATUS[v.status];
  }
  protected sealLabel(v: FlowVersion): string {
    return SEAL_LABEL[v.seal];
  }
  protected sealTone(v: FlowVersion): Tone {
    return SEAL[v.seal];
  }
  protected viewLabel(v: FlowVersion): string {
    return v.status === 'edit' && this.requests.canEdit() ? 'Editar' : 'Ver';
  }
  /** Se puede pedir sellado de cualquier versión sin sellar que no sea un borrador. */
  protected canSeal(v: FlowVersion): boolean {
    return v.seal === 'unsealed' && v.status !== 'edit' && v.status !== 'review' && this.requests.canEdit();
  }

  // ── Navegación ───────────────────────────────────────────────────────

  protected view(v: FlowVersion): void {
    if (v.status === 'edit' || v.status === 'review') return this.goDraft();
    void this.router.navigate(['/flows/editor'], { queryParams: { channel: this.channel(), product: this.product(), version: v.number } });
  }

  protected goDraft(): void {
    if (this.combo() === DEMO_COMBO) void this.router.navigate(['/flows/editor']);
    else this.toast.info('En esta demostración el editor detallado está disponible para 1 Solicitudes Web / 1 Auto Plan');
  }

  // ── Borrador ─────────────────────────────────────────────────────────

  protected async openDraft(): Promise<void> {
    const list = this.versions();
    const data: OpenDraftData = {
      comboLabel: this.comboLabel(),
      currentVersion: this.current()?.number,
      retired: list.filter((v) => v.status === 'retired').map((v) => v.number),
      hasVersions: list.length > 0,
    };
    const ref = this.modal.open<OpenDraftDialog, OpenDraftResult, OpenDraftData>(OpenDraftDialog, { width: 'min(520px, 100%)', data });
    const result = await firstValueFrom(ref.closed, { defaultValue: undefined });
    if (!result) return;
    const from = result.source === 'current' ? `la versión ${data.currentVersion}` : result.source === 'retired' ? `la versión ${result.version}` : 'cero';
    this.ws.open(result.source, result.version, this.combo()).subscribe({
      next: () => {
        this.toast.success(`Borrador abierto desde ${from}`);
        if (this.combo() === DEMO_COMBO) void this.router.navigate(['/flows/editor']);
        else this.fetch(this.combo());
      },
    });
  }

  protected async discard(): Promise<void> {
    const n = this.draft()?.number;
    const ok = await this.modal.confirm({
      title: '¿Descartar el borrador?',
      message: `Se elimina la versión ${n} y todos sus cambios. La versión vigente no se modifica. No se puede deshacer.`,
      confirmLabel: 'Descartar borrador',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!ok) return;
    this.ws.discard(this.combo()).subscribe({
      next: () => {
        this.toast.success('Borrador descartado');
        this.fetch(this.combo());
      },
    });
  }

  // ── Solicitudes sobre una versión ────────────────────────────────────

  private elementOf(v: FlowVersion): string {
    const s = this.snapshot();
    const c = s?.channels.find((x) => x.code === this.channel())?.name ?? '';
    const p = s?.products.find((x) => x.code === this.product())?.name ?? '';
    return `Versión ${v.number} · ${c} / ${p}`;
  }

  protected requestCloseValidity(v: FlowVersion): void {
    const element = `Cierre de vigencia · ${this.elementOf(v)}`;
    void this.confirmRequest(
      { element, title: `¿Solicitar cierre de vigencia de la versión ${v.number}?`, body: `Al aprobarse, ${this.comboLabel()} quedará sin configuración: el motor dejará de evaluar solicitudes de este canal + producto hasta que se publique otra versión.` },
      { type: 'Cierre de vigencia', action: 'Cerrar vigencia', element, current: { Estado: 'Publicada vigente' }, proposed: { Estado: 'Retirada (sin versión vigente)' } },
    );
  }

  protected requestSeal(v: FlowVersion): void {
    const element = `Sellado · ${this.elementOf(v)}`;
    void this.confirmRequest(
      { element, title: `¿Solicitar sellado de la versión ${v.number}?`, body: 'El motor no usa una versión sin sellar. Al aprobarse, se firma con la llave del servicio y queda registrada en la cadena de integridad.' },
      { type: 'Sellado', action: 'Sellar', element, current: { Sello: 'Sin sellar' }, proposed: { Sello: 'Sellada' } },
    );
  }

  /** Muestra el diálogo de confirmación (con aviso de duplicado) y, si se acepta, crea la solicitud. */
  private async confirmRequest(dialog: { element: string; title: string; body: string }, change: Parameters<MasterRequests['create']>[0]): Promise<void> {
    const ref = this.modal.open<RequestConfirmDialog, boolean, RequestConfirmData>(RequestConfirmDialog, {
      data: { title: dialog.title, body: dialog.body, duplicateId: this.requests.pendingFor(dialog.element)?.id },
    });
    if (await firstValueFrom(ref.closed, { defaultValue: false })) this.requests.create(change).subscribe();
  }
}
