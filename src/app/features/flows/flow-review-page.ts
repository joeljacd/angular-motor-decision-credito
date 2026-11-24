import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '@core/auth';
import { environment } from '@env/environment';
import { FlowWorkspaceStore } from '@core/state/flow-workspace.store';
import { MockApiError } from '@core/api/mock/mock-apis';
import { ModalService, ToastService, UiAlert, UiButton, UiCard, UiPageHeader, UiTableSkeleton, UiTag } from '@shared/ui';
import { ApproveDialog, ReturnDialog } from './review-dialogs';
import { diffFlows, DiffKind } from './flow-diff';
import { PublishScenario } from '@core/api/workflow.api';

const KIND: Record<DiffKind, { label: string; tone: 'success' | 'error' | 'warning'; sign: string }> = {
  add: { label: 'Agregado', tone: 'success', sign: '+' },
  del: { label: 'Eliminado', tone: 'error', sign: '−' },
  chg: { label: 'Modificado', tone: 'warning', sign: '~' },
};

/**
 * Revisión del borrador: diferencias frente a la versión vigente y decisión del aprobador.
 * Control de cuatro ojos: quien editó no puede aprobar su propio borrador.
 */
@Component({
  selector: 'app-flow-review-page',
  imports: [RouterLink, UiPageHeader, UiCard, UiButton, UiTag, UiAlert, UiTableSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host { display: flex; flex-direction: column; gap: 20px; animation: ui-in 0.3s ease both; }
    .summary { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; justify-content: space-between; }
    .counts { display: flex; gap: 8px; flex-wrap: wrap; }
    .entry { display: grid; grid-template-columns: 110px 1fr; gap: 12px; padding: 10px 0; border-top: 1px solid var(--color-neutral-300); }
    .where { font-family: var(--font-mono); font-size: 13px; font-weight: 600; }
    .entry ul { margin: 4px 0 0; padding-left: 18px; font-size: 13px; color: var(--color-neutral-700); }
    .empty { margin: 0; font-size: 14px; color: var(--color-neutral-700); }
  `,
  template: `
    <ui-page-header kicker="Motor · Flujos" title="Revisión del borrador" [description]="description()">
      <a ui-button routerLink="/flujos">Volver a versiones</a>
      @if (status() === 'revision') {
        <button ui-button variant="danger-ghost" [disabled]="!canDecide()" (click)="returnDraft()">Devolver</button>
        <button ui-button variant="primary" [disabled]="!canDecide() || busy()" [loading]="busy()" (click)="approve()">Aprobar y publicar</button>
      }
    </ui-page-header>

    @if (ws.error()) {
      <ui-alert tone="error">No fue posible cargar la revisión.</ui-alert>
    } @else if (!ws.loaded()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="5" /></ui-card>
    } @else if (status() === 'none') {
      <ui-alert tone="info">No hay un borrador abierto. <a routerLink="/flujos">Volver a Flujos</a>.</ui-alert>
    } @else if (status() === 'publicado') {
      <ui-alert tone="success">Borrador publicado por {{ ws.state()?.approvedBy }} el {{ ws.state()?.publishedAt }}. Ya es la versión vigente.</ui-alert>
    } @else {
      @if (status() === 'edicion') {
        <ui-alert tone="info">El borrador aún está en edición. <a routerLink="/flujos/editor">Ir al editor</a>.</ui-alert>
      } @else if (isOwnEdit()) {
        <ui-alert tone="warning">Participaste en la edición de este borrador: otra persona debe aprobarlo (control de cuatro ojos).</ui-alert>
      } @else if (!canApprove()) {
        <ui-alert tone="info">Tu perfil no puede aprobar. Puedes revisar las diferencias.</ui-alert>
      }
      @if (conflict()) {
        <ui-alert tone="error">Conflicto: la versión vigente cambió mientras se revisaba. Devuelve el borrador para rehacerlo sobre la versión actual.</ui-alert>
      }
      @if (failure()) {
        <ui-alert tone="error">El motor no pudo cargar la versión. No se publicó nada; puedes reintentar.</ui-alert>
      }

      <ui-card padding="md">
        <div class="summary">
          <div class="counts">
            <ui-tag tone="success">{{ count('add') }} agregados</ui-tag>
            <ui-tag tone="warning">{{ count('chg') }} modificados</ui-tag>
            <ui-tag tone="error">{{ count('del') }} eliminados</ui-tag>
          </div>
        </div>
      </ui-card>

      <ui-card padding="md">
        @for (e of entries(); track $index) {
          <div class="entry">
            <div><ui-tag size="sm" [tone]="kind(e.kind).tone">{{ kind(e.kind).sign }} {{ kind(e.kind).label }}</ui-tag></div>
            <div>
              <div class="where">{{ e.where }}</div>
              <ul>@for (l of e.lines; track $index) { <li>{{ l }}</li> }</ul>
            </div>
          </div>
        } @empty {
          <p class="empty">Sin diferencias frente a la versión vigente.</p>
        }
      </ui-card>
    }
  `,
})
export class FlowReviewPage implements OnInit {
  protected readonly ws = inject(FlowWorkspaceStore);
  private readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly busy = signal(false);
  protected readonly conflict = signal(false);
  protected readonly failure = signal(false);

  protected readonly status = computed(() => this.ws.state()?.status ?? 'none');
  protected readonly canApprove = computed(() => this.auth.me()?.puedeAprobar ?? false);
  /** Quien abrió o editó el borrador no puede aprobarlo. */
  protected readonly isOwnEdit = computed(() => {
    const me = this.auth.me()?.id;
    const s = this.ws.state();
    return !!me && !!s && (s.openedId === me || s.editors.includes(me));
  });
  protected readonly canDecide = computed(() => this.canApprove() && !this.isOwnEdit());

  protected readonly allEntries = computed(() => {
    const base = this.ws.baseline();
    const draft = this.ws.draft();
    return base && draft ? diffFlows(base, draft) : [];
  });
  protected readonly entries = computed(() => this.allEntries());

  protected readonly description = computed(() => {
    const s = this.ws.state();
    return s && s.status !== 'none' ? `Borrador ${s.openedId} · enviado ${s.sentAt || '—'} por ${s.editorNames || s.openedBy}` : 'Diferencias entre el borrador y la versión vigente.';
  });

  ngOnInit(): void {
    this.ws.load();
  }

  protected kind(k: DiffKind) {
    return KIND[k];
  }
  protected count(k: DiffKind): number {
    return this.allEntries().filter((e) => e.kind === k).length;
  }

  protected async approve(): Promise<void> {
    const ref = this.modal.open<ApproveDialog, PublishScenario, unknown>(ApproveDialog, { data: { simulate: environment.useMocks } });
    const scenario = await firstValueFrom(ref.closed, { defaultValue: undefined });
    if (!scenario) return;
    this.conflict.set(false);
    this.failure.set(false);
    this.busy.set(true);
    this.ws.approve(scenario).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Flujo publicado: ya es la versión vigente');
        void this.router.navigate(['/flujos']);
      },
      error: (err) => {
        this.busy.set(false);
        const status = err instanceof MockApiError ? err.status : err?.status;
        if (status === 409) this.conflict.set(true);
        else this.failure.set(true);
      },
    });
  }

  protected async returnDraft(): Promise<void> {
    const ref = this.modal.open<ReturnDialog, string, unknown>(ReturnDialog, {});
    const comment = await firstValueFrom(ref.closed, { defaultValue: undefined });
    if (!comment) return;
    this.ws.returnDraft(comment).subscribe({
      next: () => {
        this.toast.success('Borrador devuelto al editor');
        void this.router.navigate(['/flujos']);
      },
    });
  }
}
