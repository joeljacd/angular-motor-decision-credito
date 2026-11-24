import { Observable } from 'rxjs';
import { MeInfo, Session } from '../auth/auth.models';

/**
 * Contrato de autenticación. Implementaciones: `MockAuthApi` (datos simulados) y `HttpAuthApi` (backend real).
 * Se elige en `api.providers.ts` según `environment.useMocks`.
 */
export abstract class AuthApi {
  /** POST /auth/login — valida credenciales de red (AD) y devuelve la sesión. */
  abstract login(username: string, password: string): Observable<Session>;
  /** GET /me — identidad y capacidades efectivas. */
  abstract me(session: Session): Observable<MeInfo>;
  /** Solo demo: lista de usuarios de ejemplo con sus capacidades. */
  abstract demoUsers(): Observable<MeInfo[]>;
  /** Solo demo: "ver el portal como…". */
  abstract impersonate(userId: string): Observable<Session>;
}
