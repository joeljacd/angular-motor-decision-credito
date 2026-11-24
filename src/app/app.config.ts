import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, TitleStrategy, withComponentInputBinding, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { provideApis } from '@core/api/api.providers';
import { AuthService } from '@core/auth';
import { provideAppConfig } from '@core/config/app-config';
import { authInterceptor, errorInterceptor } from '@core/http/http.interceptors';
import { AppTitleStrategy } from '@core/navigation/app-title.strategy';
import { ThemeService } from '@core/theme';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppConfig(),
    provideApis(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(
      routes,
      withComponentInputBinding(), // ?tab=… y route.data → inputs de los componentes
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      withRouterConfig({ onSameUrlNavigation: 'reload' }),
    ),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    // Antes del primer render: aplica el tema y rehidrata la sesión (si existe).
    provideAppInitializer(() => {
      inject(ThemeService);
      return firstValueFrom(inject(AuthService).restore());
    }),
  ],
};
