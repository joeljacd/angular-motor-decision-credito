import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { APP_CONFIG } from '../../config/app-config';
import { MeInfo, Session } from '../../auth/auth.models';
import { AuthApi } from '../auth.api';
import { ChangeRequest, ChangeRequestsApi, NewChangeRequest } from '../change-requests.api';

/**
 * Implementaciones contra el backend real.
 * ⚠ Las rutas y payloads son una PROPUESTA de contrato: confirmarlas con el equipo de backend.
 */
abstract class HttpBase {
  protected readonly http = inject(HttpClient);
  protected readonly base = inject(APP_CONFIG).apiBaseUrl;
}

@Injectable()
export class HttpAuthApi extends HttpBase implements AuthApi {
  login(username: string, password: string): Observable<Session> {
    return this.http.post<Session>(`${this.base}/auth/login`, { username, password });
  }
  me(): Observable<MeInfo> {
    return this.http.get<MeInfo>(`${this.base}/me`);
  }
  demoUsers(): Observable<MeInfo[]> {
    return EMPTY; // solo existe con mocks
  }
  impersonate(): Observable<Session> {
    return EMPTY; // solo existe con mocks
  }
}

@Injectable()
export class HttpChangeRequestsApi extends HttpBase implements ChangeRequestsApi {
  list(): Observable<ChangeRequest[]> {
    return this.http.get<ChangeRequest[]>(`${this.base}/change-requests`);
  }
  create(request: NewChangeRequest): Observable<ChangeRequest> {
    return this.http.post<ChangeRequest>(`${this.base}/change-requests`, request);
  }
  cancel(id: string): Observable<ChangeRequest> {
    return this.http.post<ChangeRequest>(`${this.url(id)}/cancel`, {});
  }
  approve(id: string): Observable<ChangeRequest> {
    return this.http.post<ChangeRequest>(`${this.url(id)}/approve`, {});
  }
  reject(id: string, comment: string): Observable<ChangeRequest> {
    return this.http.post<ChangeRequest>(`${this.url(id)}/reject`, { comment });
  }
  private url(id: string): string {
    return `${this.base}/change-requests/${encodeURIComponent(id)}`;
  }
}
