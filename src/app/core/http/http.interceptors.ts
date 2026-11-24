import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { APP_CONFIG } from '../config/app-config';
import { ErrorFeedbackService } from './error-feedback.service';

/** Adjunta el token Bearer a las llamadas al API propio (nunca a terceros). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const base = inject(APP_CONFIG).apiBaseUrl;
  return token && req.url.startsWith(base)
    ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))
    : next(req);
};

/** Reacciona a 401/403/409/503 de forma centralizada y relanza el error para que cada llamada decida el resto. */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const feedback = inject(ErrorFeedbackService);
  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && !req.url.endsWith('/auth/login')) {
        switch (err.status) {
          case 401: feedback.unauthorized(); break;
          case 403: void feedback.forbidden(); break;
          case 409: void feedback.conflict(); break;
          case 503: feedback.keyUnavailable(); break;
        }
      }
      return throwError(() => err);
    }),
  );
};
