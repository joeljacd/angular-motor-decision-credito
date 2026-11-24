import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '@core/auth';
import { APP_CONFIG } from '@core/config/app-config';
import { I18nService, TPipe } from '@core/i18n';
import { ThemeService } from '@core/theme';
import { ToastService, UiAlert, UiBlueprint, UiButton, UiFormField, UiIcon, UiInput } from '@shared/ui';
import { BootOverlay } from './boot-overlay';

const BOOT_STEPS = ['boot.step1', 'boot.step2', 'boot.step3'] as const;
const FLOW_STEPS = ['1', '2', '3', '4'] as const;

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, UiButton, UiInput, UiFormField, UiAlert, UiIcon, UiBlueprint, BootOverlay, TPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './login-page.scss',
  template: `
    <div class="page">
      <aside class="hero" aria-hidden="false">
        <div class="brand">
          <span class="logo" uiBlueprint>BA</span>
          <div class="titles">
            <span class="bank">{{ 'app.bank' | t }}</span>
            <span class="app">{{ 'app.name' | t }}</span>
          </div>
        </div>

        <div class="pitch">
          <span class="eyebrow">{{ 'login.hero.kicker' | t }}</span>
          <h1>{{ 'login.hero.title' | t }}</h1>
          <ol class="steps">
            @for (n of flowSteps; track n) {
              <li>
                <span class="num">0{{ n }}</span>
                <span class="step-title">{{ 'login.step' + n | t }}</span>
                <span class="step-desc">{{ 'login.step' + n + '.d' | t }}</span>
              </li>
            }
          </ol>
        </div>

        <span class="legal">{{ 'login.hero.footer' | t }}</span>
      </aside>

      <section class="panel">
        <button ui-button size="sm" class="theme-btn" (click)="theme.toggleMode()">
          <ui-icon [name]="theme.isDark() ? 'sun' : 'moon'" [size]="16" />
          {{ (theme.isDark() ? 'shell.theme.light' : 'shell.theme.dark') | t }}
        </button>

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div>
            <span class="kicker">{{ 'login.kicker' | t }}</span>
            <h2>{{ 'login.title' | t }}</h2>
            <p class="text-muted lead">{{ 'login.subtitle' | t }}</p>
          </div>

          <ui-form-field [label]="'login.user' | t" [hint]="demoHint()">
            <ui-input formControlName="usuario" [prefix]="domainPrefix" [placeholder]="'login.userPlaceholder' | t" autocomplete="username" [mono]="true" />
          </ui-form-field>

          <ui-form-field [label]="'login.password' | t">
            <ui-input type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password" />
          </ui-form-field>

          @if (error()) {
            <ui-alert tone="error">{{ error() }}</ui-alert>
          }

          <button ui-button variant="primary" size="lg" type="submit" uiBlueprint [block]="true" [loading]="loading()" [disabled]="loading()">
            {{ (loading() ? 'login.submitting' : 'login.submit') | t }}
          </button>

          <div class="secure"><ui-icon name="lock" [size]="14" />{{ 'login.secure' | t }}</div>
        </form>
      </section>
    </div>

    @if (booting()) {
      <app-boot-overlay [step]="bootStep()" />
    }
  `,
})
export class LoginPage implements OnDestroy {
  protected readonly config = inject(APP_CONFIG);
  protected readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  private readonly toast = inject(ToastService);

  protected readonly flowSteps = FLOW_STEPS;
  protected readonly domainPrefix = `${this.config.adDomain}\\`;
  protected readonly form = inject(FormBuilder).nonNullable.group({
    usuario: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly booting = signal(false);
  private readonly bootIndex = signal(0);
  protected readonly bootStep = computed(() => this.i18n.t(BOOT_STEPS[Math.min(this.bootIndex(), BOOT_STEPS.length - 1)]));
  protected readonly demoHint = computed(() =>
    this.config.useMocks && this.config.demoUsers.length ? this.i18n.t('login.demo', { users: this.config.demoUsers.join(' · ') }) : '',
  );

  private timers: ReturnType<typeof setTimeout>[] = [];
  private ticker?: ReturnType<typeof setInterval>;

  protected submit(): void {
    if (this.loading()) return;
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set(this.i18n.t('login.required'));
      return;
    }
    const { usuario, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth.login(usuario.trim().toLowerCase(), password).subscribe({
      next: (me) => {
        this.form.controls.password.reset('');
        this.loading.set(false);
        this.startBoot(me.nombre);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        this.error.set(this.i18n.t(err?.status === 401 ? 'login.invalid' : 'login.error'));
      },
    });
  }

  /** Transición breve mientras se "prepara el espacio de trabajo"; luego navega al destino. */
  private startBoot(name: string): void {
    this.booting.set(true);
    this.bootIndex.set(0);
    this.ticker = setInterval(() => this.bootIndex.update((i) => i + 1), 550);
    this.timers.push(
      setTimeout(() => {
        clearInterval(this.ticker);
        void this.router.navigateByUrl(this.safeReturnUrl()).then(() => {
          this.booting.set(false);
          this.toast.success(this.i18n.t('shell.welcome', { name }));
        });
      }, 1700),
    );
  }

  /** Solo rutas internas (evita open-redirect vía ?returnUrl=https://…). */
  private safeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/login') ? url : '/';
  }

  ngOnDestroy(): void {
    clearInterval(this.ticker);
    this.timers.forEach(clearTimeout);
  }
}
