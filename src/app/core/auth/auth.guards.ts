import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { OptionKey } from './permissions';

/** Exige sesión; si no, redirige a /login conservando la URL de retorno. */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login'], { queryParams: state.url === '/' ? {} : { returnUrl: state.url } });
};

/** Solo invitados (p. ej. /login): si ya hay sesión, va al inicio. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/']) : true;
};

/**
 * Exige la opción de permiso declarada en la ruta: `data: { option: 'solicitudes' }`.
 * Sin permiso → /403 (dentro del shell).
 */
export const permissionGuard: CanActivateFn = (route) => {
  const option = route.data['option'] as OptionKey | undefined;
  const auth = inject(AuthService);
  return !option || auth.can(option) ? true : inject(Router).createUrlTree(['/403']);
};
