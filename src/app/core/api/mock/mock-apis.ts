import { inject, Injectable } from '@angular/core';
import { AuthService } from '../../auth/auth.service';
import { NOW } from '../../util/clock';
import { addDays, formatDmy } from '../../util/date';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs';
import { MeInfo, Session } from '../../auth/auth.models';
import { buildMeInfo } from '../../auth/me';
import { AuthApi } from '../auth.api';
import { ChangeRequest, ChangeRequestsApi, NewChangeRequest } from '../change-requests.api';
import { DEMO_USER_IDS } from './mock-data';
import { MOCK_LATENCY_MS } from './mock-latency';
import { MockDb } from './mock-db';

/** Error con forma de HttpErrorResponse mínima, para que los mocks se comporten como el backend real. */
export class MockApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export abstract class MockBase {
  protected readonly db = inject(MockDb);
  private readonly latency = inject(MOCK_LATENCY_MS);
  protected respond<T>(factory: () => T): Observable<T> {
    return of(null).pipe(
      delay(this.latency),
      map(() => structuredClone(factory())),
    );
  }
}

@Injectable()
export class MockAuthApi extends MockBase implements AuthApi {
  login(username: string, password: string): Observable<Session> {
    const user = this.db.users.find((u) => u.username === username.trim().toLowerCase());
    // Demo: cualquier contraseña no vacía es válida para los usuarios del directorio de prueba.
    if (!user || !password) {
      return this.respond(() => 0).pipe(
        map(() => {
          throw new MockApiError(401, 'Credenciales inválidas');
        }),
      );
    }
    return this.respond(() => this.sessionFor(user.username));
  }

  me(session: Session): Observable<MeInfo> {
    const user = this.db.users.find((u) => u.username === session.userId);
    if (!user) return throwError(() => new MockApiError(401, 'Sesión inválida'));
    return this.respond(() => buildMeInfo(user, this.db.profiles.find((p) => p.id === user.profile)));
  }

  demoUsers(): Observable<MeInfo[]> {
    return this.respond(() =>
      DEMO_USER_IDS.map((id) => {
        const u = this.db.users.find((x) => x.username === id)!;
        return buildMeInfo(u, this.db.profiles.find((p) => p.id === u.profile));
      }),
    );
  }

  impersonate(userId: string): Observable<Session> {
    return this.respond(() => this.sessionFor(userId));
  }

  private sessionFor(userId: string): Session {
    return { token: `mock.${userId}.${Date.now()}`, userId, startedAt: new Date().toISOString() };
  }
}

@Injectable()
export class MockChangeRequestsApi extends MockBase implements ChangeRequestsApi {
  private readonly auth = inject(AuthService);
  private readonly now = inject(NOW);

  list(): Observable<ChangeRequest[]> {
    return this.respond(() => this.db.requests);
  }

  create(request: NewChangeRequest): Observable<ChangeRequest> {
    return this.respond(() => {
      const next = Math.max(0, ...this.db.requests.map((r) => Number(r.id.slice(3)))) + 1;
      const created: ChangeRequest = {
        ...request,
        id: `SC-${String(next).padStart(4, '0')}`,
        requester: this.auth.me()?.id ?? '',
        date: formatDmy(this.now()),
        expiresAt: formatDmy(addDays(this.now(), 15)),
        status: 'pending',
      };
      this.db.requests.unshift(created);
      return created;
    });
  }

  cancel(id: string): Observable<ChangeRequest> {
    return this.respond(() => this.pending(id, (req) => (req.status = 'cancelled')));
  }

  approve(id: string): Observable<ChangeRequest> {
    return this.respond(() =>
      this.pending(id, (req) => {
        // Control de cuatro ojos: nadie aprueba lo que solicitó.
        if (req.requester === this.auth.me()?.id) throw new MockApiError(403, 'No puedes aprobar tu propia solicitud');
        if (req.stale) throw new MockApiError(409, 'El elemento cambió desde la solicitud');
        req.status = 'approved';
        req.approver = this.auth.me()?.name;
      }),
    );
  }

  reject(id: string, comment: string): Observable<ChangeRequest> {
    return this.respond(() =>
      this.pending(id, (req) => {
        if (req.requester === this.auth.me()?.id) throw new MockApiError(403, 'No puedes rechazar tu propia solicitud');
        req.status = 'rejected';
        req.approver = this.auth.me()?.name;
        req.rejectionReason = comment;
      }),
    );
  }

  /** Aplica `mutate` a una solicitud que sigue pendiente; si no, 404/409. */
  private pending(id: string, mutate: (req: ChangeRequest) => void): ChangeRequest {
    const req = this.db.requests.find((r) => r.id === id);
    if (!req) throw new MockApiError(404, 'Solicitud no encontrada');
    if (req.status !== 'pending') throw new MockApiError(409, 'La solicitud ya no está pendiente');
    mutate(req);
    return req;
  }
}
