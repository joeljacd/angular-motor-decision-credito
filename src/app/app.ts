import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { UiToastHost } from '@shared/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, UiToastHost],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <ui-toast-host />
  `,
})
export class App {}
