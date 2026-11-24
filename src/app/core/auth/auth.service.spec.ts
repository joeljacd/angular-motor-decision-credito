import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { provideTestApp } from '../../testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let auth: AuthService;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: provideTestApp() });
    auth = TestBed.inject(AuthService);
  });

  it('login válido establece sesión y permisos', async () => {
    const me = await firstValueFrom(auth.login('mfcevallos', 'x'));
    expect(auth.isAuthenticated()).toBe(true);
    expect(me.opts.length).toBeGreaterThan(0);
    expect(auth.firstAllowedScreen()).not.toBeNull();
  });

  it('login con usuario inexistente falla con 401', async () => {
    await expect(firstValueFrom(auth.login('nadie', 'x'))).rejects.toMatchObject({ status: 401 });
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('logout limpia la sesión', async () => {
    await firstValueFrom(auth.login('mfcevallos', 'x'));
    auth.logout();
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.can('home')).toBe(false);
  });

  it('restore rehidrata una sesión guardada', async () => {
    await firstValueFrom(auth.login('mfcevallos', 'x'));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: provideTestApp() });
    const again = TestBed.inject(AuthService);
    expect(await firstValueFrom(again.restore())).toBe(true);
    expect(again.isAuthenticated()).toBe(true);
  });
});
