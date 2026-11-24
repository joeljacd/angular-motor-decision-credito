import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IntegrityFinding, IntegrityReport } from '@core/api/integrity.api';
import { AuthService } from '@core/auth';
import { APP_CONFIG } from '@core/config/app-config';
import { ChangeRequestsStore } from '@core/state/change-requests.store';
import { IntegrityStore } from '@core/state/integrity.store';
import { SystemStatusStore } from '@core/state/system-status.store';
import { IntegrityApi } from '@core/api/integrity.api';
import { ToastService, UiAlert, UiButton, UiCard, UiFormField, UiIcon, UiPageHeader, UiProgressBar, UiSelect, UiTag, UiOption, UiStat, UiStatStrip } from '@shared/ui';

const STEPS: [number, string][] = [
  [0, 'Verificando cadena del historial…'],
  [45, 'Verificando sellos de versiones…'],
  [80, 'Verificando sello global y tabla de roles…'],
  [96, 'Generando informe…'],
];
/** Duración mínima de la barra de progreso (ms); la verificación real puede terminar antes. */
const MIN_DURATION_MS = 2300;

/** Integridad: verificación de la cadena de firmas del historial, sellos de versión y sello global. */
@Component({
  selector: 'app-integrity-page',
  imports: [FormsModule, RouterLink, UiPageHeader, UiCard, UiButton, UiIcon, UiProgressBar, UiTag, UiAlert, UiFormField, UiSelect, UiStatStrip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './integrity-page.scss',
  template: `
    <ui-page-header
      kicker="Auditoría"
      title="Integridad"
      description="Verifica la cadena de firmas del historial, los sellos de cada versión y el sello global. Si un sello no es válido, el motor no evalúa ese alcance."
    >
      @if (config.useMocks) {
        <ui-form-field label="Resultado simulado (prototipo)">
          <ui-select [options]="scenarioOptions" [ngModel]="scenario()" (ngModelChange)="scenario.set($event)" [disabled]="running()" />
        </ui-form-field>
      }
      <button ui-button variant="primary" [disabled]="running()" (click)="run()">
        <ui-icon name="shield-check" [size]="16" /> Verificar integridad
      </button>
    </ui-page-header>

    @if (running()) {
      <ui-card padding="md">
        <div class="progress-head"><span>{{ stepText() }}</span><span>{{ pct() }}%</span></div>
        <ui-progress-bar mode="determinate" [value]="pct()" [height]="6" />
      </ui-card>
    } @else if (error()) {
      <ui-alert tone="error">{{ error() }}</ui-alert>
    } @else if (report(); as r) {
      @if (r.clean) {
        <ui-card padding="lg" class="ok">
          <ui-icon name="check-circle" [size]="36" />
          <div>
            <strong>Integridad verificada</strong>
            <span>{{ r.recordsVerified }} registros encadenados · {{ r.sealedVersions }} versiones selladas · sello global válido · {{ r.verifiedAt }}</span>
          </div>
        </ui-card>
      } @else {
        <ui-stat-strip [stats]="stats()" />

        <ui-card padding="lg">
          <h4>Cadena del historial</h4>
          <span class="muted">Primer registro donde se rompe la cadena: #{{ firstBreak() }}</span>
          <ol class="chain">
            @for (c of r.chain; track c.seq) {
              <li [class]="c.status">
                <span class="node">#{{ c.seq }}</span>
                <span class="state">{{ chainLabel(c.status) }}</span>
              </li>
            }
          </ol>
          <span class="muted">Cada registro guarda la firma del anterior. Desde #{{ firstBreak() }} la firma anterior no coincide: los registros posteriores no se pueden garantizar hasta su reconciliación.</span>
        </ui-card>

        <ui-card padding="md">
          <div class="findings-head"><h4>Hallazgos</h4><span class="muted">{{ r.verifiedAt }}</span></div>
          <div class="ui-table-wrap">
            <table class="ui-table">
              <thead><tr><th>Tipo</th><th>Ubicación</th><th>Detalle</th><th></th></tr></thead>
              <tbody>
                @for (f of r.findings; track f.location) {
                  <tr>
                    <td><ui-tag size="sm" [tone]="f.severity === 'error' ? 'error' : 'warning'">{{ f.kind }}</ui-tag></td>
                    <td>{{ f.location }}</td>
                    <td>{{ f.detail }}</td>
                    <td class="actions">
                      @if (f.sealable && auth.me()?.puedeSolicitar) {
                        <button ui-button size="sm" [disabled]="locked()" (click)="requestSeal(f)">Solicitar sellado</button>
                      }
                      @if (f.pendingRequestId) {
                        <a [routerLink]="['/solicitudes']" [queryParams]="{ id: f.pendingRequestId }">Pendiente · {{ f.pendingRequestId }}</a>
                      }
                      @if (f.inHistory) {
                        <a ui-button size="sm" variant="ghost" routerLink="/historial">Ver en Historial</a>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </ui-card>
      }
    }
  `,
})
export class IntegrityPage implements OnInit, OnDestroy {
  protected readonly config = inject(APP_CONFIG);
  protected readonly auth = inject(AuthService);
  private readonly api = inject(IntegrityApi);
  private readonly requests = inject(ChangeRequestsStore);
  private readonly integrity = inject(IntegrityStore);
  private readonly toast = inject(ToastService);
  private readonly status = inject(SystemStatusStore);

  protected readonly locked = this.status.keyUnavailable;
  protected readonly report = signal<IntegrityReport | null>(null);
  protected readonly error = signal('');
  protected readonly running = signal(false);
  protected readonly pct = signal(0);
  protected readonly scenario = signal<'bad' | 'ok'>('bad');
  protected readonly scenarioOptions: UiOption<'bad' | 'ok'>[] = [
    { value: 'bad', label: 'Con hallazgos' },
    { value: 'ok', label: 'Sin hallazgos' },
  ];

  protected readonly stepText = computed(() => [...STEPS].reverse().find(([p]) => this.pct() >= p)?.[1] ?? '');
  protected readonly firstBreak = computed(() => this.report()?.chain.find((c) => c.status === 'breaks')?.seq ?? '');
  protected readonly stats = computed<UiStat[]>(() => {
    const r = this.report();
    if (!r) return [];
    return [
      { value: r.recordsVerified.toLocaleString('es-EC'), label: 'Registros verificados' },
      { value: r.historyFindings, label: 'Hallazgos en historial', color: 'var(--color-error)' },
      { value: r.versionFindings, label: 'Versiones con problema', color: 'var(--color-error)' },
      { value: r.globalSealValid ? 'Válido' : 'Inválido', label: 'Sello global', color: r.globalSealValid ? 'var(--color-success)' : 'var(--color-error)' },
    ];
  });

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.requests.load();
    this.api.lastReport().subscribe({ next: (r) => this.report.set(r), error: () => this.error.set('No fue posible cargar el último informe.') });
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  protected chainLabel(status: 'valid' | 'breaks' | 'unverified'): string {
    return status === 'valid' ? 'Válido' : status === 'breaks' ? 'Rompe la cadena' : 'No garantizado';
  }

  /** Lanza la verificación: la barra avanza de forma simulada y el resultado se muestra al terminar ambas cosas. */
  protected run(): void {
    clearInterval(this.timer);
    this.running.set(true);
    this.error.set('');
    this.pct.set(0);
    let response: IntegrityReport | null = null;
    let failed = false;
    const startedAt = Date.now();

    this.api.verify(this.scenario()).subscribe({
      next: (r) => (response = r),
      error: () => (failed = true),
    });

    this.timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      this.pct.set(Math.min(100, Math.round((elapsed / MIN_DURATION_MS) * 100)));
      if (elapsed < MIN_DURATION_MS || (!response && !failed)) return;
      clearInterval(this.timer);
      this.running.set(false);
      if (failed || !response) {
        this.error.set('La verificación falló. Intenta nuevamente.');
        return;
      }
      this.report.set(response);
      this.integrity.load(true);
      this.toast.success(response.clean ? 'Integridad verificada sin hallazgos' : 'Verificación terminada con hallazgos');
    }, 70);
  }

  /** Crea la solicitud de sellado y marca el hallazgo como pendiente. */
  protected requestSeal(finding: IntegrityFinding): void {
    this.requests
      .create({
        tipo: 'Sellado',
        elemento: 'Sellado · Versión 1 · Agencias / Auto Plan',
        accion: 'Sellar',
        actual: { Sello: 'Sin sellar' },
        propuesto: { Sello: 'Sellada' },
        comentario: 'Detectado en verificación de integridad.',
      })
      .subscribe({
        next: (created) => {
          this.report.update((r) =>
            r ? { ...r, findings: r.findings.map((f) => (f === finding ? { ...f, sealable: false, pendingRequestId: created.id } : f)) } : r,
          );
          this.toast.success(`Solicitud ${created.id} creada`);
        },
        error: () => this.toast.error('No se pudo crear la solicitud.'),
      });
  }
}
