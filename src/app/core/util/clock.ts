import { inject, InjectionToken } from '@angular/core';
import { APP_CONFIG } from '../config/app-config';

/** "Ahora" inyectable: permite fijar la fecha en demo/tests. */
export const NOW = new InjectionToken<() => Date>('NOW', {
  providedIn: 'root',
  factory: () => {
    const fixed = inject(APP_CONFIG).demoToday;
    return fixed ? () => new Date(`${fixed}T12:00:00`) : () => new Date();
  },
});
