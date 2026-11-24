import { Injectable } from '@angular/core';
import { Profile, User } from '../../auth/auth.models';
import { ChangeRequest } from '../change-requests.api';
import { HistoryEntry } from '../history.api';
import { FlowState } from '../workflow.api';
import { FlowDocument, FlowResources } from '../flow.models';
import { MOCK_BASELINE_FLOW, MOCK_CATALOGS, MOCK_DRAFT_FLOW, MOCK_FIELDS, MOCK_VARIABLES } from './mock-flow.data';
import { MOCK_HISTORY } from './mock-history.data';
import { MOCK_FLOW, MOCK_INTEGRITY_ALERTS, MOCK_PROFILES, MOCK_REQUESTS, MOCK_USERS } from './mock-data';

/** "Base de datos" en memoria para los mocks: las mutaciones persisten mientras viva la pestaña. */
@Injectable({ providedIn: 'root' })
export class MockDb {
  users: User[] = structuredClone(MOCK_USERS);
  profiles: Profile[] = structuredClone(MOCK_PROFILES);
  requests: ChangeRequest[] = structuredClone(MOCK_REQUESTS);
  flow: FlowState = structuredClone(MOCK_FLOW);
  integrityAlerts: string[] = [...MOCK_INTEGRITY_ALERTS];
  history: HistoryEntry[] = structuredClone(MOCK_HISTORY);

  // Flujo 1 Solicitudes Web / 1 Auto Plan: versión vigente (v1) y borrador (v2).
  flowDraft: FlowDocument = structuredClone(MOCK_DRAFT_FLOW);
  flowBaseline: FlowDocument = structuredClone(MOCK_BASELINE_FLOW);
  flowResources: FlowResources = structuredClone({ variables: MOCK_VARIABLES, catalogs: MOCK_CATALOGS, fields: MOCK_FIELDS });
  baselineResources: FlowResources = structuredClone({ variables: MOCK_VARIABLES, catalogs: MOCK_CATALOGS, fields: MOCK_FIELDS });
}
