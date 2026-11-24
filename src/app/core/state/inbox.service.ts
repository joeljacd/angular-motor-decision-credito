import { computed, inject, Injectable } from '@angular/core';
import { ChangeRequest } from '../api/change-requests.api';
import { AuthService } from '../auth/auth.service';
import { I18nService } from '../i18n/i18n.service';
import { daysUntil } from '../util/date';
import { NOW } from '../util/clock';
import { Tone } from '../util/tone';
import { ChangeRequestsStore } from './change-requests.store';
import { WorkflowStore } from './workflow.store';

export type InboxStatus =
  | 'Pendiente' | 'Aprobada' | 'Rechazada' | 'Cancelada' | 'Vencida'
  | 'En edición' | 'En revisión' | 'Publicada';

export const STATUS_TONE: Record<InboxStatus, Tone> = {
  Pendiente: 'warning',
  Aprobada: 'success',
  Rechazada: 'error',
  Cancelada: 'neutral',
  Vencida: 'orange',
  'En edición': 'warning',
  'En revisión': 'info',
  Publicada: 'success',
};

export interface DueInfo {
  days: number;
  /** Menos de 3 días (o vencida): se resalta. */
  urgent: boolean;
}

export interface InboxLink {
  path: string;
  query?: Record<string, string>;
}

export interface InboxRow {
  kind: 'draft' | 'request';
  /** id de la solicitud (solo kind='request'). */
  id?: string;
  /** Etiqueta del tipo en la tabla (p. ej. 'Sellado', 'Canal'). */
  typeLabel?: string;
  element: string;
  sub: string;
  requester: string;
  date: string;
  /** Fecha de vencimiento "dd/MM/yyyy" ('' si no aplica). */
  dueDate: string;
  due: DueInfo | null;
  status: InboxStatus;
  rejectComment?: string;
  approver?: string;
  canCancel: boolean;
  link: InboxLink;
}

/** Nombres para mostrar de los usuarios de demostración (el backend real debería devolver el nombre en cada solicitud). */
const DISPLAY_NAMES: Record<string, string> = {
  mfcevallos: 'María Fernanda Cevallos',
  lmora: 'Luis Mora',
  aperez: 'Ana Pérez',
  cruiz: 'Carla Ruiz',
};

/** Bandeja del usuario: qué puede aprobar y qué solicitó. Alimenta el Inicio y los badges del menú. */
@Injectable({ providedIn: 'root' })
export class InboxService {
  private readonly auth = inject(AuthService);
  private readonly requests = inject(ChangeRequestsStore);
  private readonly workflow = inject(WorkflowStore);
  private readonly i18n = inject(I18nService);
  private readonly now = inject(NOW);

  readonly loading = computed(() => this.requests.loading() || this.workflow.loading());

  readonly approveRows = computed<InboxRow[]>(() => {
    const me = this.auth.me();
    if (!me) return [];
    const flow = this.workflow.flow();
    const rows: InboxRow[] = [];
    const myEdit = !!flow && (flow.editors.includes(me.id) || flow.openedId === me.id);

    if (flow && flow.status === 'review' && !myEdit) {
      rows.push({
        kind: 'draft',
        element: this.i18n.t('dash.draft.name'),
        sub: this.i18n.t('dash.draft.inReview'),
        requester: flow.openedBy,
        date: flow.sentAt || '22/11/2026',
        dueDate: flow.vence,
        due: this.due(flow.vence),
        status: 'En revisión',
        canCancel: false,
        link: { path: '/flows/review' },
      });
    }
    for (const r of this.requests.items()) {
      if (r.estado === 'Pendiente' && r.solicitante !== me.id) rows.push(this.requestRow(r, false));
    }
    return rows;
  });

  readonly mineRows = computed<InboxRow[]>(() => {
    const me = this.auth.me();
    if (!me) return [];
    const flow = this.workflow.flow();
    const rows: InboxRow[] = [];

    if (flow && flow.openedId === me.id && (flow.status === 'editing' || flow.status === 'review')) {
      const editing = flow.status === 'editing';
      rows.push({
        kind: 'draft',
        element: this.i18n.t('dash.draft.name'),
        sub: this.i18n.t(editing && flow.devolucion ? 'dash.draft.returned' : 'dash.draft.rules'),
        requester: me.nombre,
        date: flow.openedAt,
        dueDate: flow.vence,
        due: this.due(flow.vence),
        status: editing ? 'En edición' : 'En revisión',
        canCancel: false,
        link: { path: '/flows/editor' },
      });
    }
    for (const r of this.requests.items()) {
      if (r.solicitante === me.id) rows.push(this.requestRow(r, true));
    }
    return rows;
  });

  /** Badge del menú "Inicio". */
  readonly pendingCount = computed(() => this.approveRows().length);
  /** Badge del menú "Solicitudes de cambio". */
  readonly openRequestsCount = computed(() => this.requests.items().filter((r) => r.estado === 'Pendiente').length);

  refresh(force = false): void {
    this.requests.load(force);
    this.workflow.load(force);
  }

  due(dmy: string): DueInfo | null {
    const days = daysUntil(dmy, this.now());
    return Number.isNaN(days) ? null : { days, urgent: days < 3 };
  }

  private requestRow(r: ChangeRequest, mine: boolean): InboxRow {
    const approvedBy = r.aprobador && r.estado === 'Aprobada' ? ` · ${this.i18n.t('dash.approvedBy', { name: r.aprobador })}` : '';
    return {
      kind: 'request',
      id: r.id,
      typeLabel: r.tipo,
      element: r.elemento,
      sub: `${r.id} · ${r.tipo} · ${r.accion}${mine ? approvedBy : ''}`,
      requester: DISPLAY_NAMES[r.solicitante] ?? r.solicitante,
      date: r.fecha,
      dueDate: r.vence,
      due: r.estado === 'Pendiente' ? this.due(r.vence) : null,
      status: r.estado,
      rejectComment: r.rechazo,
      approver: r.aprobador,
      canCancel: mine && r.estado === 'Pendiente',
      link: { path: '/requests', query: { id: r.id } },
    };
  }
}
