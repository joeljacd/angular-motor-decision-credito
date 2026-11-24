import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ActiveState, Profile, User } from '../../auth/auth.models';
import { APP_CONFIG } from '../../config/app-config';
import { FlowDocument, FlowResources } from '../flow.models';
import { HistoryApi, HistoryFilter, HistoryFilterOptions, HistoryPage } from '../history.api';
import { IntegrityApi, IntegrityReport } from '../integrity.api';
import { MastersApi, MastersSnapshot } from '../masters.api';
import { ProfileDraft, ProfilesApi } from '../profiles.api';
import { DraftSource, FlowState, FlowVersion, FlowWorkspace, WorkflowApi } from '../workflow.api';
import { DirectoryUser, NewUser, UsersApi } from '../users.api';

/**
 * Implementaciones HTTP de auditoría (historial, integridad) y seguridad (usuarios, perfiles).
 * ⚠ Rutas y payloads son una PROPUESTA de contrato: confirmar con backend.
 */
abstract class HttpBase {
  protected readonly http = inject(HttpClient);
  protected readonly base = inject(APP_CONFIG).apiBaseUrl;
}

@Injectable()
export class HttpHistoryApi extends HttpBase implements HistoryApi {
  query(filter: HistoryFilter, page: number, size: number): Observable<HistoryPage> {
    let params = new HttpParams().set('page', page).set('size', size);
    for (const [key, value] of Object.entries(filter)) if (value) params = params.set(key, value);
    return this.http.get<HistoryPage>(`${this.base}/history`, { params });
  }
  filterOptions(): Observable<HistoryFilterOptions> {
    return this.http.get<HistoryFilterOptions>(`${this.base}/history/filter-options`);
  }
}

@Injectable()
export class HttpIntegrityApi extends HttpBase implements IntegrityApi {
  alerts(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/integrity/alerts`);
  }
  lastReport(): Observable<IntegrityReport> {
    return this.http.get<IntegrityReport>(`${this.base}/integrity/last`);
  }
  verify(): Observable<IntegrityReport> {
    return this.http.post<IntegrityReport>(`${this.base}/integrity/verify`, {});
  }
}

@Injectable()
export class HttpUsersApi extends HttpBase implements UsersApi {
  list(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }
  lookupDirectory(username: string): Observable<DirectoryUser> {
    return this.http.get<DirectoryUser>(`${this.base}/directory/${encodeURIComponent(username)}`);
  }
  create(user: NewUser): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, user);
  }
  update(username: string, changes: Partial<Pick<User, 'nombre' | 'estado'>>): Observable<User> {
    return this.http.patch<User>(`${this.base}/users/${encodeURIComponent(username)}`, changes);
  }
}

@Injectable()
export class HttpProfilesApi extends HttpBase implements ProfilesApi {
  list(): Observable<Profile[]> {
    return this.http.get<Profile[]>(`${this.base}/profiles`);
  }
  create(profile: ProfileDraft): Observable<Profile> {
    return this.http.post<Profile>(`${this.base}/profiles`, profile);
  }
  update(id: number, profile: ProfileDraft): Observable<Profile> {
    return this.http.put<Profile>(`${this.base}/profiles/${id}`, profile);
  }
  setStatus(id: number, estado: ActiveState): Observable<Profile> {
    return this.http.patch<Profile>(`${this.base}/profiles/${id}`, { estado });
  }
}

// ── Maestros y flujos ─────────────────────────────────────────────────────

@Injectable()
export class HttpMastersApi extends HttpBase implements MastersApi {
  snapshot(): Observable<MastersSnapshot> {
    return this.http.get<MastersSnapshot>(`${this.base}/masters`);
  }
}

@Injectable()
export class HttpWorkflowApi extends HttpBase implements WorkflowApi {
  currentDraft(): Observable<FlowState> {
    return this.http.get<FlowState>(`${this.base}/flow/draft`);
  }
  workspace(): Observable<FlowWorkspace> {
    return this.http.get<FlowWorkspace>(`${this.base}/flow/workspace`);
  }
  versions(channel: string, product: string): Observable<FlowVersion[]> {
    return this.http.get<FlowVersion[]>(`${this.base}/flows/${encodeURIComponent(channel)}/${encodeURIComponent(product)}/versions`);
  }
  saveDraft(document: FlowDocument, resources: FlowResources): Observable<FlowState> {
    return this.http.put<FlowState>(`${this.base}/flow/draft`, { document, resources });
  }
  openDraft(source: DraftSource, version?: number): Observable<FlowState> {
    return this.http.post<FlowState>(`${this.base}/flow/draft`, { source, version });
  }
  discardDraft(): Observable<FlowState> {
    return this.http.delete<FlowState>(`${this.base}/flow/draft`);
  }
  submit(): Observable<FlowState> {
    return this.http.post<FlowState>(`${this.base}/flow/draft/submit`, {});
  }
  returnDraft(comment: string): Observable<FlowState> {
    return this.http.post<FlowState>(`${this.base}/flow/draft/return`, { comment });
  }
  approveAndPublish(): Observable<FlowState> {
    return this.http.post<FlowState>(`${this.base}/flow/draft/approve`, {});
  }
}
