import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChangeRequest, RequestStatus } from '@core/api/change-requests.api';
import { AuthService } from '@core/auth';
import { ChangeRequestsStore } from '@core/state/change-requests.store';
import { STATUS_TONE } from '@core/state/inbox.service';
import { SystemStatusStore } from '@core/state/system-status.store';
import { UsersStore } from '@core/state/users.store';
import { NOW } from '@core/util/clock';
import { daysUntil } from '@core/util/date';
import {
  ModalService, ToastService, UiAlert, UiButton, UiCard, UiCheckbox, UiEmptyState, UiFilterBar, UiFormField, UiOption,
  UiPageHeader, UiSelect, UiTableSkeleton, UiTag,
} from '@shared/ui';
import { RejectDialog } from './reject-dialog';

const ALL_STATUSES: RequestStatus[] = ['Pendiente', 'Aprobada', 'Rechazada', 'Cancelada', 'Vencida'];

interface Filters {
  estado: string;
  tipo: string;
  solicitante: string;
  mine: boolean;
}

/** Fila de comparación "actual vs propuesto" del detalle. */
interface DiffRow {
  key: string;
  current: string;
  proposed: string;
  changed: boolean;
}

/**
 * Solicitudes de cambio (control de cuatro ojos): lista con filtros + detalle con acciones.
 * Una solicitud solo la aprueba/rechaza una persona distinta de quien la creó.
 */
@Component({
  selector: 'app-requests-page',
  imports: [FormsModule, UiPageHeader, UiCard, UiFilterBar, UiFormField, UiSelect, UiCheckbox, UiTag, UiButton, UiAlert, UiEmptyState, UiTableSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './requests-page.scss',
  template: `
    <ui-page-header
      kicker="Control de cuatro ojos"
      title="Solicitudes de cambio"
      description="Canales, productos, acciones, parámetros, catálogos, roles y sellados se cambian solo con una solicitud aprobada por otra persona."
    />

    <ui-filter-bar>
      <ui-form-field label="Estado">
        <ui-select [options]="statusOptions" [ngModel]="filters().estado" (ngModelChange)="patch({ estado: $event })" />
      </ui-form-field>
      <ui-form-field label="Tipo de elemento">
        <ui-select [options]="typeOptions()" [ngModel]="filters().tipo" (ngModelChange)="patch({ tipo: $event })" />
      </ui-form-field>
      <ui-form-field label="Solicitante">
        <ui-select [options]="requesterOptions()" [ngModel]="filters().solicitante" (ngModelChange)="patch({ solicitante: $event })" />
      </ui-form-field>
      <ui-checkbox [ngModel]="filters().mine" (ngModelChange)="patch({ mine: $event })">Solo mías</ui-checkbox>
    </ui-filter-bar>

    <div class="layout" [class.with-detail]="selected()">
      <ui-card padding="md" class="list">
        <div class="count">{{ filtered().length }} solicitudes</div>

        @if (store.loading() && !store.loaded()) {
          <ui-table-skeleton [rows]="6" />
        } @else if (store.error()) {
          <ui-alert tone="error">{{ store.error() }}</ui-alert>
        } @else if (!filtered().length) {
          <ui-empty-state title="No hay solicitudes con estos filtros." />
        } @else {
          <div class="ui-table-wrap">
            <table class="ui-table">
              <thead>
                <tr><th>Id</th><th>Tipo</th><th>Elemento</th><th>Solicitante</th><th>Estado</th><th>Vence</th></tr>
              </thead>
              <tbody>
                @for (r of filtered(); track r.id) {
                  <tr class="clickable" [class.active]="r.id === selectedId()" tabindex="0" (click)="select(r.id)" (keydown.enter)="select(r.id)">
                    <td class="mono">{{ r.id }}</td>
                    <td>{{ r.tipo }}</td>
                    <td>{{ r.elemento }}</td>
                    <td>{{ users.nameOf(r.solicitante) }}</td>
                    <td><ui-tag size="sm" [tone]="tone(r.estado)" [dot]="true">{{ r.estado }}</ui-tag></td>
                    <td>
                      @if (r.estado === 'Pendiente') {
                        <ui-tag size="sm" [tone]="dueDays(r) < 3 ? 'orange' : 'neutral'">{{ dueLabel(r) }}</ui-tag>
                      } @else { — }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </ui-card>

      @if (selected(); as r) {
        <ui-card padding="lg" class="detail">
          <div class="detail-head">
            <span class="mono">{{ r.id }}</span>
            <span class="muted">{{ r.tipo }} · {{ r.accion }}</span>
            <span class="spacer"></span>
            <ui-tag [tone]="tone(r.estado)" [dot]="true">{{ r.estado }}</ui-tag>
          </div>
          <h3>{{ r.elemento }}</h3>

          <dl class="meta">
            <div><dt>Solicitante</dt><dd>{{ users.nameOf(r.solicitante) }}</dd></div>
            <div><dt>Fecha</dt><dd>{{ r.fecha }}</dd></div>
            <div><dt>Vence</dt><dd>{{ r.vence }}@if (r.estado === 'Pendiente') { ({{ dueLabel(r) }}) }</dd></div>
            <div><dt>Aprobador</dt><dd>{{ r.aprobador || '—' }}</dd></div>
          </dl>

          @if (r.comentario) {
            <div class="block"><span class="kicker">Comentario del solicitante</span><p>{{ r.comentario }}</p></div>
          }
          @if (r.rechazo) {
            <ui-alert tone="error"><strong>Rechazada por {{ r.aprobador }}:</strong> {{ r.rechazo }}</ui-alert>
          }

          <span class="kicker">Valor actual vs. propuesto</span>
          <div class="diff" role="table">
            <div class="diff-row head" role="row"><span>Campo</span><span>Actual</span><span>Propuesto</span></div>
            @for (row of diff(); track row.key) {
              <div class="diff-row" [class.changed]="row.changed" role="row">
                <span>{{ row.key }}</span>
                <span [class.old]="row.changed">{{ row.current }}</span>
                <span [class.new]="row.changed">{{ row.proposed }}</span>
              </div>
            }
          </div>

          @if (conflictId() === r.id) {
            <ui-alert tone="error"><strong>Conflicto:</strong> el elemento cambió desde la solicitud; debe rehacerse.</ui-alert>
          }

          @if (r.estado === 'Pendiente') {
            <div class="actions">
              @if (isOwn(r)) {
                <button ui-button variant="secondary" [disabled]="locked() || busy()" (click)="cancel(r)">Cancelar solicitud</button>
              }
              <span class="spacer"></span>
              @if (auth.me()?.puedeAprobar) {
                <button ui-button variant="secondary" [disabled]="isOwn(r) || busy()" (click)="reject(r)">Rechazar</button>
                <span class="approve-wrap" (mouseenter)="tip.set(true)" (mouseleave)="tip.set(false)">
                  <button ui-button variant="primary" [disabled]="isOwn(r) || conflictId() === r.id || locked() || busy()" [loading]="busy()" (click)="approve(r)">Aprobar</button>
                  @if (tip() && isOwn(r)) {
                    <span class="tip" role="tooltip">No puedes aprobar un cambio que solicitaste o editaste</span>
                  }
                </span>
              }
            </div>
          }
        </ui-card>
      }
    </div>
  `,
})
export class RequestsPage implements OnInit {
  /** ?id=SC-0141 → solicitud preseleccionada (enlazado por withComponentInputBinding). */
  readonly id = input<string | undefined>();

  protected readonly store = inject(ChangeRequestsStore);
  protected readonly users = inject(UsersStore);
  protected readonly auth = inject(AuthService);
  private readonly status = inject(SystemStatusStore);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly now = inject(NOW);

  protected readonly filters = signal<Filters>({ estado: '', tipo: '', solicitante: '', mine: false });
  /** Seleccionada: sigue al query param, pero el usuario puede cambiarla haciendo clic. */
  protected readonly selectedId = linkedSignal<string | null>(() => this.id() ?? null);
  protected readonly busy = signal(false);
  protected readonly tip = signal(false);
  /** Id de la solicitud donde el backend respondió 409 (el elemento cambió). */
  protected readonly conflictId = signal<string | null>(null);

  protected readonly locked = this.status.keyUnavailable;
  protected readonly statusOptions: UiOption<string>[] = [{ value: '', label: 'Todos' }, ...ALL_STATUSES.map((s) => ({ value: s, label: s }))];

  protected readonly typeOptions = computed<UiOption<string>[]>(() => [
    { value: '', label: 'Todos' },
    ...[...new Set(this.store.items().map((r) => r.tipo))].map((t) => ({ value: t, label: t })),
  ]);
  protected readonly requesterOptions = computed<UiOption<string>[]>(() => [
    { value: '', label: 'Todos' },
    ...[...new Set(this.store.items().map((r) => r.solicitante))].map((u) => ({ value: u, label: this.users.nameOf(u) })),
  ]);

  protected readonly filtered = computed(() => {
    const f = this.filters();
    const me = this.auth.me()?.id;
    return this.store
      .items()
      .filter((r) => (!f.estado || r.estado === f.estado) && (!f.tipo || r.tipo === f.tipo) && (!f.solicitante || r.solicitante === f.solicitante) && (!f.mine || r.solicitante === me));
  });

  protected readonly selected = computed(() => this.store.items().find((r) => r.id === this.selectedId()) ?? null);

  /** Une las claves de actual y propuesto para compararlas campo a campo. */
  protected readonly diff = computed<DiffRow[]>(() => {
    const r = this.selected();
    if (!r) return [];
    const keys = [...new Set([...Object.keys(r.actual), ...Object.keys(r.propuesto)])];
    return keys.map((key) => ({ key, current: r.actual[key] ?? '—', proposed: r.propuesto[key] ?? '—', changed: r.actual[key] !== r.propuesto[key] }));
  });

  ngOnInit(): void {
    this.store.load();
    this.users.load();
  }

  protected patch(change: Partial<Filters>): void {
    this.filters.update((f) => ({ ...f, ...change }));
  }

  protected select(id: string): void {
    this.selectedId.set(id);
    this.conflictId.set(null);
  }

  protected tone(status: RequestStatus) {
    return STATUS_TONE[status];
  }

  protected isOwn(r: ChangeRequest): boolean {
    return r.solicitante === this.auth.me()?.id;
  }

  protected dueDays(r: ChangeRequest): number {
    return daysUntil(r.vence, this.now());
  }

  protected dueLabel(r: ChangeRequest): string {
    const n = this.dueDays(r);
    return n < 0 ? 'Vencida' : `${n} días`;
  }

  protected approve(r: ChangeRequest): void {
    this.run(this.store.approve(r.id), `Solicitud ${r.id} aprobada · el cambio ya rige`, r.id);
  }

  protected cancel(r: ChangeRequest): void {
    this.run(this.store.cancel(r.id), `Solicitud ${r.id} cancelada`, r.id);
  }

  protected async reject(r: ChangeRequest): Promise<void> {
    const ref = this.modal.open<RejectDialog, string, { id: string }>(RejectDialog, { data: { id: r.id } });
    const comment = await new Promise<string | undefined>((resolve) => ref.closed.subscribe((v) => resolve(v)));
    if (comment) this.run(this.store.reject(r.id, comment), `Solicitud ${r.id} rechazada`, r.id);
  }

  /** Ejecuta una mutación mostrando estado ocupado y toast; el 409 se muestra como conflicto en el detalle. */
  private run(op: ReturnType<ChangeRequestsStore['approve']>, message: string, id: string): void {
    this.busy.set(true);
    op.subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success(message);
      },
      error: (err: { status?: number }) => {
        this.busy.set(false);
        if (err.status === 409) this.conflictId.set(id);
        else this.toast.error('No se pudo completar la operación.');
      },
    });
  }
}
