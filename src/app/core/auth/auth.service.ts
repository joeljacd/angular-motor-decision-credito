import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { AuthApi } from '../api/auth.api';
import { StorageService } from '../storage/storage.service';
import { MeInfo, Session } from './auth.models';
import { OptionKey, SCREEN_KEYS, ScreenKey } from './permissions';

const SESSION_KEY = 'session';

/**
 * Estado de autenticación y permisos (signals). La sesión vive en sessionStorage (se pierde al cerrar la pestaña).
 * Las capacidades salen de `/me` y se usan en guards (acceso a rutas) y plantillas (`auth.can('cap.aprobar')`).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(AuthApi);
  private readonly storage = inject(StorageService);

  private readonly _session = signal<Session | null>(null);
  private readonly _me = signal<MeInfo | null>(null);

  readonly session = this._session.asReadonly();
  /** Usuario autenticado (null si no hay sesión). */
  readonly me = this._me.asReadonly();
  readonly token = computed(() => this._session()?.token ?? null);
  readonly isAuthenticated = computed(() => this._session() !== null && this._me() !== null);
  /** Primera pantalla a la que el usuario tiene acceso (destino tras el login). */
  readonly firstAllowedScreen = computed<ScreenKey | null>(() => {
    const opts = this._me()?.opts ?? [];
    return SCREEN_KEYS.find((k) => opts.includes(k)) ?? null;
  });

  login(username: string, password: string): Observable<MeInfo> {
    return this.api.login(username, password).pipe(switchMap((session) => this.establish(session)));
  }

  /** Rehidrata la sesión guardada (se ejecuta al arrancar la app). Nunca falla: devuelve false si no hay sesión válida. */
  restore(): Observable<boolean> {
    const saved = this.storage.session.get<Session>(SESSION_KEY);
    if (!saved) return of(false);
    return this.establish(saved).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }

  /** Solo demo ("Ver el portal como…"). */
  switchUser(userId: string): Observable<MeInfo> {
    return this.api.impersonate(userId).pipe(switchMap((session) => this.establish(session)));
  }

  logout(): void {
    this._session.set(null);
    this._me.set(null);
    this.storage.session.remove(SESSION_KEY);
  }

  can(option: OptionKey): boolean {
    return this._me()?.opts.includes(option) ?? false;
  }

  private establish(session: Session): Observable<MeInfo> {
    this._session.set(session); // antes de /me para que el interceptor ya envíe el token
    return this.api.me(session).pipe(
      tap((me) => {
        this._me.set(me);
        this.storage.session.set(SESSION_KEY, session);
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      }),
    );
  }
}
