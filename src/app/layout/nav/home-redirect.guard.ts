import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/auth';
import { navPathFor } from './nav.config';

/** "/" → primera pantalla a la que el usuario tiene acceso (o /403 si no tiene ninguna). */
export const homeRedirectGuard: CanActivateFn = () => {
  const first = inject(AuthService).firstAllowedScreen();
  return inject(Router).createUrlTree([first ? navPathFor(first) : '/403']);
};
