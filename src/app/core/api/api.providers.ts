import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { environment } from '@env/environment';
import { AuthApi } from './auth.api';
import { ChangeRequestsApi } from './change-requests.api';
import { HistoryApi } from './history.api';
import { HttpAuthApi, HttpChangeRequestsApi } from './http/http-apis';
import { HttpHistoryApi, HttpIntegrityApi, HttpMastersApi, HttpProfilesApi, HttpUsersApi, HttpWorkflowApi } from './http/http-audit-security';
import { MastersApi } from './masters.api';
import { IntegrityApi } from './integrity.api';
import { MockAuthApi, MockChangeRequestsApi } from './mock/mock-apis';
import { MockWorkflowApi } from './mock/mock-flows';
import { MockMastersApi } from './mock/mock-masters';
import { MockHistoryApi, MockIntegrityApi } from './mock/mock-audit';
import { MockProfilesApi, MockUsersApi } from './mock/mock-security';
import { ProfilesApi } from './profiles.api';
import { UsersApi } from './users.api';
import { WorkflowApi } from './workflow.api';

/**
 * Único punto donde se decide Mock vs HTTP. Al ser una constante de build (`environment.useMocks`),
 * el bundler elimina la implementación que no se usa.
 *
 * Para agregar un API nuevo: 1) clase abstracta en `core/api/*.api.ts`, 2) mock en `mock/`,
 * 3) http en `http/`, 4) registrarlos aquí.
 */
export function provideApis(): EnvironmentProviders {
  const useMocks = environment.useMocks;
  return makeEnvironmentProviders([
    { provide: AuthApi, useClass: useMocks ? MockAuthApi : HttpAuthApi },
    { provide: ChangeRequestsApi, useClass: useMocks ? MockChangeRequestsApi : HttpChangeRequestsApi },
    { provide: WorkflowApi, useClass: useMocks ? MockWorkflowApi : HttpWorkflowApi },
    { provide: IntegrityApi, useClass: useMocks ? MockIntegrityApi : HttpIntegrityApi },
    { provide: HistoryApi, useClass: useMocks ? MockHistoryApi : HttpHistoryApi },
    { provide: UsersApi, useClass: useMocks ? MockUsersApi : HttpUsersApi },
    { provide: MastersApi, useClass: useMocks ? MockMastersApi : HttpMastersApi },
    { provide: ProfilesApi, useClass: useMocks ? MockProfilesApi : HttpProfilesApi },
  ]);
}
