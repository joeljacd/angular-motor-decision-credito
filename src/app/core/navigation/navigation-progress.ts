import { inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';
import { filter, map } from 'rxjs';

/** true mientras el router navega (incluye la descarga de chunks lazy). Alimenta la barra de progreso del header. */
@Injectable({ providedIn: 'root' })
export class NavigationProgress {
  readonly busy = toSignal(
    inject(Router).events.pipe(
      filter((e) => e instanceof NavigationStart || e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
      map((e) => e instanceof NavigationStart),
    ),
    { initialValue: false },
  );
}
