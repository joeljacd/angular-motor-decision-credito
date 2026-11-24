import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';
import { NOW } from '../../util/clock';
import { addDays, formatDmy, formatDmyHm } from '../../util/date';
import { FlowDocument, FlowResources } from '../flow.models';
import { DraftSource, FlowState, FlowVersion, FlowWorkspace, PublishScenario, WorkflowApi } from '../workflow.api';
import { MockApiError, MockBase } from './mock-apis';

const version = (number: number, status: FlowVersion['status'], seal: FlowVersion['seal'], publishedAt: string, approvedBy: string, validity: string): FlowVersion => ({
  number, status, seal, publishedAt, approvedBy, validity,
});

/** Versiones de las demás combinaciones (el flujo editable de demostración es solo 1-1). */
const STATIC_VERSIONS: Record<string, FlowVersion[]> = {
  '1-2': [
    version(3, 'current', 'Sellada', '02/09/2026', 'Luis Mora', '02/09/2026 → —'),
    version(2, 'retired', 'Sellada', '10/05/2026', 'Ana Pérez', '10/05/2026 → 02/09/2026'),
    version(1, 'retired', 'Sellada', '12/01/2026', 'Luis Mora', '12/01/2026 → 10/05/2026'),
  ],
  '2-1': [version(1, 'current', 'Sin sellar', '18/11/2026', 'Luis Mora', '18/11/2026 → —')],
  '2-2': [
    version(3, 'current', 'Firma inválida', '30/10/2026', 'Ana Pérez', '30/10/2026 → —'),
    version(2, 'retired', 'Sellada', '03/04/2026', 'Luis Mora', '03/04/2026 → 30/10/2026'),
  ],
  '3-2': [],
};

const EMPTY_FLOW: FlowDocument = { stopOnStop: true, from: '', to: '', categories: [] };

/** Workflow del borrador (un solo borrador a la vez, sobre 1 Solicitudes Web / 1 Auto Plan). */
@Injectable()
export class MockWorkflowApi extends MockBase implements WorkflowApi {
  private readonly auth = inject(AuthService);
  private readonly now = inject(NOW);

  currentDraft(): Observable<FlowState> {
    return this.respond(() => this.db.flow);
  }

  workspace(): Observable<FlowWorkspace> {
    return this.respond(() => ({
      state: this.db.flow,
      draft: this.db.flowDraft,
      baseline: this.db.flowBaseline,
      resources: this.db.flowResources,
      baselineResources: this.db.baselineResources,
    }));
  }

  versions(channel: string, product: string): Observable<FlowVersion[]> {
    return this.respond(() => {
      const key = `${channel}-${product}`;
      if (key !== '1-1') return STATIC_VERSIONS[key] ?? [];
      const flow = this.db.flow;
      const list: FlowVersion[] = [];
      if (flow.status === 'edicion' || flow.status === 'revision') {
        list.push(version(2, flow.status === 'edicion' ? 'edit' : 'review', 'Sin sellar', '—', '—', '—'));
      }
      if (flow.status === 'publicado') {
        const day = flow.publishedAt ?? '';
        list.push(version(2, 'current', 'Sellada', day, flow.approvedBy ?? '', `${day} → —`));
        list.push(version(1, 'retired', 'Sellada', '15/10/2026', 'Luis Mora', `15/10/2026 → ${day}`));
      } else {
        list.push(version(1, 'current', 'Sellada', '15/10/2026', 'Luis Mora', '15/10/2026 → —'));
      }
      return list;
    });
  }

  saveDraft(document: FlowDocument, resources: FlowResources): Observable<FlowState> {
    return this.respond(() => {
      this.requireStatus('edicion');
      this.db.flowDraft = document;
      this.db.flowResources = resources;
      this.touch();
      return this.db.flow;
    });
  }

  openDraft(source: DraftSource): Observable<FlowState> {
    return this.respond(() => {
      if (this.db.flow.status === 'edicion' || this.db.flow.status === 'revision') throw new MockApiError(409, 'Ya existe un borrador abierto');
      const me = this.me();
      this.db.flowDraft = source === 'empty' ? structuredClone(EMPTY_FLOW) : structuredClone(this.db.flowBaseline);
      this.db.flowResources = structuredClone(this.db.baselineResources);
      this.db.flow = {
        status: 'edicion', devolucion: '', openedBy: me.nombre, openedId: me.id, openedAt: formatDmy(this.now()),
        editors: [me.id], editorNames: me.nombre, last: formatDmyHm(this.now()), vence: formatDmy(addDays(this.now(), 15)), sentAt: '',
      };
      return this.db.flow;
    });
  }

  discardDraft(): Observable<FlowState> {
    return this.respond(() => {
      this.requireStatus('edicion');
      this.db.flow = { ...this.db.flow, status: 'none' };
      return this.db.flow;
    });
  }

  submit(): Observable<FlowState> {
    return this.respond(() => {
      this.requireStatus('edicion');
      this.db.flow = { ...this.db.flow, status: 'revision', devolucion: '', sentAt: formatDmy(this.now()) };
      return this.db.flow;
    });
  }

  returnDraft(comment: string): Observable<FlowState> {
    return this.respond(() => {
      this.requireStatus('revision');
      this.requireNotEditor();
      this.db.flow = { ...this.db.flow, status: 'edicion', devolucion: `${comment} — ${this.me().nombre}, ${formatDmy(this.now())}` };
      return this.db.flow;
    });
  }

  approveAndPublish(scenario: PublishScenario = 'ok'): Observable<FlowState> {
    return this.respond(() => {
      this.requireStatus('revision');
      this.requireNotEditor();
      if (scenario === 'conflict') throw new MockApiError(409, 'La versión vigente cambió desde que se abrió el borrador');
      if (scenario === 'error') throw new MockApiError(500, 'El motor no pudo cargar la versión');
      this.db.flowBaseline = structuredClone(this.db.flowDraft);
      this.db.baselineResources = structuredClone(this.db.flowResources);
      this.db.flow = { ...this.db.flow, status: 'publicado', approvedBy: this.me().nombre, publishedAt: formatDmy(this.now()) };
      return this.db.flow;
    });
  }

  private me() {
    const me = this.auth.me();
    if (!me) throw new MockApiError(401, 'Sesión inválida');
    return me;
  }

  private requireStatus(status: FlowState['status']): void {
    if (this.db.flow.status !== status) throw new MockApiError(409, `El borrador no está en estado ${status}`);
  }

  /** Cuatro ojos: quien editó el borrador no lo aprueba ni lo devuelve. */
  private requireNotEditor(): void {
    const me = this.me();
    if (this.db.flow.editors.includes(me.id) || this.db.flow.openedId === me.id) throw new MockApiError(403, 'No puedes aprobar un cambio que editaste');
  }

  /** Registra la actividad del usuario actual como editor. */
  private touch(): void {
    const me = this.me();
    const flow = this.db.flow;
    const editors = flow.editors.includes(me.id) ? flow.editors : [...flow.editors, me.id];
    const names = flow.editors.includes(me.id) ? flow.editorNames : `${flow.editorNames}, ${me.nombre}`;
    this.db.flow = { ...flow, editors, editorNames: names, last: formatDmyHm(this.now()) };
  }
}
