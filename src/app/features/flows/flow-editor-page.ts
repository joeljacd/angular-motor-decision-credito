import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Category, FLOW_ACTIONS, FlowDocument, FlowResources, groupPhrase, Policy } from '@core/api/flow.models';
import { WorkflowApi } from '@core/api/workflow.api';
import { FlowWorkspaceStore } from '@core/state/flow-workspace.store';
import { MasterRequests } from '../masters/master-requests.service';
import { ModalService, ToastService, UiAlert, UiButton, UiCard, UiCheckbox, UiFormField, UiInput, UiPageHeader, UiTab, UiTableSkeleton, UiTabs, UiTag } from '@shared/ui';
import { CategoryDialog, CategoryDialogData, PolicyDialog, PolicyDialogData } from './flow-dialogs';
import { emptyCategory, emptyPolicy, FlowIssue, validateFlow } from './flow-validation';

/**
 * Editor del borrador: árbol de categorías y políticas, configuración del flujo y recursos.
 * Es de solo lectura si el borrador está en revisión o la persona no puede solicitar cambios.
 * Alcance: se edita el orden con flechas (sin arrastrar) y los recursos se consultan, no se editan.
 */
@Component({
  selector: 'app-flow-editor-page',
  imports: [FormsModule, RouterLink, UiPageHeader, UiCard, UiButton, UiTag, UiAlert, UiTabs, UiTableSkeleton, UiCheckbox, UiInput, UiFormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './flow-editor-page.scss',
  template: `
    <ui-page-header kicker="Motor · Flujos" [title]="version() ? 'Versión ' + version() : 'Editor de borrador'" [description]="description()">
      <a ui-button routerLink="/flows">Volver a versiones</a>
      @if (version()) {
        <!-- Vista de una versión publicada: solo lectura -->
      } @else if (ws.state()?.status === 'editing') {
        <button ui-button (click)="validate()">Validar</button>
        <button ui-button variant="danger-ghost" [disabled]="!editable()" (click)="discard()">Descartar</button>
        <button ui-button variant="primary" [disabled]="!editable() || submitting()" [loading]="submitting()" (click)="submit()">Enviar a revisión</button>
      } @else if (ws.state()?.status === 'review') {
        <a ui-button variant="primary" routerLink="/flows/review">Ir a la revisión</a>
      }
    </ui-page-header>

    @if (viewError()) {
      <ui-alert tone="error">{{ viewError() }}</ui-alert>
    } @else if (ws.error()) {
      <ui-alert tone="error">No fue posible cargar el borrador.</ui-alert>
    } @else if (!doc()) {
      <ui-card padding="md"><ui-table-skeleton [rows]="6" /></ui-card>
    } @else if (!version() && ws.state()?.status === 'none') {
      <ui-alert tone="info">No hay un borrador abierto. <a routerLink="/flows">Abre uno desde Flujos</a>.</ui-alert>
    } @else {
      @if (version()) {
        <ui-alert tone="info">Versión {{ version() }} · solo lectura. Una versión publicada o retirada nunca se edita: abre un borrador desde Flujos.</ui-alert>
      }
      @if (!version() && ws.state()?.devolucion) {
        <ui-alert tone="warning">Un aprobador devolvió el borrador: {{ ws.state()?.devolucion }}</ui-alert>
      }
      @if (!version() && !editable() && ws.state()?.status === 'editing') {
        <ui-alert tone="info">Solo lectura: tu perfil no puede solicitar cambios o el sistema de firma no está disponible.</ui-alert>
      }

      <ui-card padding="md">
        <div class="config">
          <ui-checkbox [disabled]="!editable()" [ngModel]="doc()!.stopOnStop" (ngModelChange)="setStop($event)">Detener el flujo al encontrar una acción que detiene</ui-checkbox>
          <ui-form-field label="Vigencia desde (dd/MM/yyyy)"><ui-input [disabled]="!editable()" [ngModel]="doc()!.from" (ngModelChange)="setDate('from', $event)" /></ui-form-field>
          <ui-form-field label="Hasta"><ui-input [disabled]="!editable()" [ngModel]="doc()!.to" (ngModelChange)="setDate('to', $event)" /></ui-form-field>
          @if (ws.saving()) { <span class="saving">Guardando…</span> }
        </div>
      </ui-card>

      @if (issues(); as list) {
        @if (showIssues()) {
          <ui-alert [tone]="hasErrors() ? 'error' : list.length ? 'warning' : 'success'">
            @if (!list.length) { El borrador es válido. } @else {
              <strong>{{ errorCount() }} errores · {{ list.length - errorCount() }} avisos</strong>
              <ul class="issues">@for (i of list; track $index) { <li><strong>{{ i.where }}</strong> — {{ i.message }}</li> }</ul>
            }
          </ui-alert>
        }
      }

      <ui-tabs [tabs]="tabs" [(active)]="tab" />

      @switch (tab()) {
        @case ('tree') {
          <ui-card padding="md">
            <div class="tree-head">
              <span>{{ doc()!.categories.length }} categorías</span>
              <button ui-button size="sm" variant="primary" [disabled]="!editable()" (click)="editCategory(null)">+ Categoría</button>
            </div>
            @for (cat of doc()!.categories; track cat.code; let ci = $index; let first = $first; let last = $last) {
              <section class="cat" [class.off]="!cat.active">
                <header>
                  <strong class="mono">{{ cat.code }}</strong> {{ cat.name }}
                  @if (!cat.active) { <ui-tag size="sm">Inactiva</ui-tag> }
                  <ui-tag size="sm" tone="neutral">Detención: {{ stopLabel(cat) }}</ui-tag>
                  <span class="spacer"></span>
                  <button ui-button size="sm" variant="ghost" [disabled]="!editable() || first" aria-label="Subir categoría" (click)="moveCategory(ci, -1)">↑</button>
                  <button ui-button size="sm" variant="ghost" [disabled]="!editable() || last" aria-label="Bajar categoría" (click)="moveCategory(ci, 1)">↓</button>
                  <button ui-button size="sm" variant="ghost" [disabled]="!editable()" (click)="editCategory(cat)">Editar</button>
                  <button ui-button size="sm" variant="danger-ghost" [disabled]="!editable()" (click)="removeCategory(cat)">Eliminar</button>
                  <button ui-button size="sm" [disabled]="!editable()" (click)="editPolicy(cat, null)">+ Política</button>
                </header>
                @for (pol of cat.policies; track pol.code; let pi = $index; let pfirst = $first; let plast = $last) {
                  <div class="pol" [class.off]="!pol.active">
                    <div class="pol-main">
                      <strong class="mono">{{ pol.code }}</strong> {{ pol.name }}
                      @if (!pol.active) { <ui-tag size="sm">Inactiva</ui-tag> }
                      <div class="phrase">{{ phrase(pol) }}</div>
                      <div class="outcomes">
                        <ui-tag size="sm" [tone]="actionTone(pol.results.pass.action)">Cumple → {{ pol.results.pass.action }}</ui-tag>
                        <ui-tag size="sm" [tone]="actionTone(pol.results.fail.action)">No cumple → {{ pol.results.fail.action }}</ui-tag>
                        <ui-tag size="sm" [tone]="actionTone(pol.results.missing.action)">Faltan datos → {{ pol.results.missing.action }}</ui-tag>
                      </div>
                    </div>
                    <div class="pol-actions">
                      <button ui-button size="sm" variant="ghost" [disabled]="!editable() || pfirst" aria-label="Subir política" (click)="movePolicy(cat, pi, -1)">↑</button>
                      <button ui-button size="sm" variant="ghost" [disabled]="!editable() || plast" aria-label="Bajar política" (click)="movePolicy(cat, pi, 1)">↓</button>
                      <button ui-button size="sm" variant="ghost" (click)="editPolicy(cat, pol)">{{ editable() ? 'Editar' : 'Ver' }}</button>
                      <button ui-button size="sm" variant="danger-ghost" [disabled]="!editable()" (click)="removePolicy(cat, pol)">Eliminar</button>
                    </div>
                  </div>
                } @empty { <p class="empty">Sin políticas.</p> }
              </section>
            } @empty { <p class="empty">Sin categorías.</p> }
          </ui-card>
        }
        @case ('vars') {
          <ui-card padding="md">
            <div class="ui-table-wrap"><table class="ui-table">
              <thead><tr><th>Variable</th><th>Nombre</th><th>Tipo</th><th>Origen</th><th>Detalle</th><th>Sensible</th></tr></thead>
              <tbody>@for (v of res()!.variables; track v.code) {
                <tr><td class="mono">{{ v.code }}</td><td>{{ v.name }}</td><td>{{ v.type }}</td><td>{{ v.origin === 'request' ? 'Solicitud' : 'Calculada' }}</td><td class="mono">{{ v.origin === 'request' ? v.path : v.fn + '(' + (v.field ?? '') + ')' }}</td><td>{{ v.sensitive ? 'Sí' : 'No' }}</td></tr>
              }</tbody>
            </table></div>
          </ui-card>
        }
        @case ('cats') {
          <ui-card padding="md">
            @for (c of res()!.catalogs; track c.code) {
              <h4 class="cat-title"><span class="mono">{{ c.code }}</span> {{ c.name }} <small>({{ c.items.length }} elementos)</small></h4>
              <div class="chips">@for (i of c.items; track i.code) { <ui-tag size="sm" [tone]="i.active ? 'neutral' : 'warning'">{{ i.code }} · {{ i.label }}</ui-tag> }</div>
            }
          </ui-card>
        }
        @case ('fields') {
          <ui-card padding="md">
            <div class="ui-table-wrap"><table class="ui-table">
              <thead><tr><th>Grupo</th><th>Ruta</th><th>Tipo</th><th>Obligatorio</th><th>Formato</th><th>Ejemplo</th></tr></thead>
              <tbody>@for (f of res()!.fields; track f.path) {
                <tr><td>{{ f.group }}</td><td class="mono">{{ f.path }}</td><td>{{ f.type }}</td><td>{{ f.required ? 'Sí' : 'No' }}</td><td class="mono">{{ f.format || '—' }}</td><td class="mono">{{ f.example }}</td></tr>
              }</tbody>
            </table></div>
          </ui-card>
        }
      }
    }
  `,
})
export class FlowEditorPage implements OnInit {
  protected readonly ws = inject(FlowWorkspaceStore);
  private readonly requests = inject(MasterRequests);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Query params: si llega `version`, se muestra esa versión publicada en solo lectura. */
  readonly channel = input<string>();
  readonly product = input<string>();
  readonly version = input<number, string | number | undefined>(undefined, { transform: (v) => (v ? +v : 0) });

  private readonly api = inject(WorkflowApi);
  private readonly viewed = signal<{ document: FlowDocument; resources: FlowResources } | null>(null);
  protected readonly viewError = signal('');
  protected readonly doc = computed(() => (this.version() ? this.viewed()?.document : this.ws.draft()) ?? null);
  protected readonly res = computed(() => (this.version() ? this.viewed()?.resources : this.ws.resources()) ?? null);

  protected readonly tab = signal<string>('tree');
  protected readonly tabs: UiTab[] = [
    { key: 'tree', label: 'Categorías y políticas' },
    { key: 'vars', label: 'Variables' },
    { key: 'cats', label: 'Catálogos' },
    { key: 'fields', label: 'Campos de la solicitud' },
  ];
  protected readonly showIssues = signal(false);
  protected readonly submitting = signal(false);

  protected readonly editable = computed(() => !this.version() && this.ws.state()?.status === 'editing' && this.requests.canEdit());
  protected readonly issues = computed<FlowIssue[]>(() => {
    const d = this.doc();
    const r = this.res();
    return d && r ? validateFlow(d, r) : [];
  });
  protected readonly errorCount = computed(() => this.issues().filter((i) => i.level === 'error').length);
  protected readonly hasErrors = computed(() => this.errorCount() > 0);
  protected readonly description = computed(() => {
    const s = this.ws.state();
    if (this.version()) return 'Contenido de la versión publicada.';
    return s && s.status !== 'none' ? `Borrador ${s.openedId} · abierto por ${s.openedBy} · último cambio ${s.last}` : 'Edición de reglas, categorías y políticas del borrador.';
  });

  constructor() {
    // Carga la versión publicada pedida por query param (solo lectura).
    effect(() => {
      const version = this.version();
      if (!version) return;
      this.viewed.set(null);
      this.viewError.set('');
      this.api.versionDocument(this.channel() ?? '1', this.product() ?? '1', version).subscribe({
        next: (v) => this.viewed.set(v),
        error: (e) => this.viewError.set(e?.message || 'No fue posible cargar la versión.'),
      });
    });
  }

  ngOnInit(): void {
    this.ws.load();
    this.requests.load();
  }

  protected phrase(pol: Policy): string {
    return groupPhrase(pol.root);
  }
  protected actionTone(code: string) {
    return FLOW_ACTIONS[code as keyof typeof FLOW_ACTIONS]?.tone ?? 'neutral';
  }
  protected stopLabel(cat: Category): string {
    return cat.stopRule === 'inherit' ? 'hereda' : cat.stopRule === 'yes' ? 'siempre' : 'nunca';
  }

  protected validate(): void {
    this.showIssues.set(true);
  }

  // ── Edición: cada cambio se aplica en memoria y se guarda ─────────────

  private save(change: Parameters<FlowWorkspaceStore['edit']>[0]): void {
    this.ws.edit(change).subscribe({ error: () => this.toast.error('No se pudo guardar el borrador') });
  }

  protected setStop(value: boolean): void {
    this.save((d) => (d.stopOnStop = value));
  }
  protected setDate(key: 'from' | 'to', value: string): void {
    this.save((d) => (d[key] = value));
  }

  protected async editCategory(cat: Category | null): Promise<void> {
    const draft = this.doc()!;
    const isNew = cat === null;
    const ref = this.modal.open<CategoryDialog, Category, CategoryDialogData>(CategoryDialog, {
      width: 'min(480px, 100%)',
      data: { category: cat ?? emptyCategory('', draft.categories.length + 1), isNew, takenCodes: draft.categories.map((c) => c.code) },
    });
    const result = await firstValueFrom(ref.closed, { defaultValue: undefined });
    if (!result) return;
    this.save((d) => {
      if (isNew) d.categories.push(result);
      else d.categories = d.categories.map((c) => (c.code === result.code ? { ...result, policies: c.policies } : c));
    });
  }

  protected async removeCategory(cat: Category): Promise<void> {
    const ok = await this.modal.confirm({ title: `¿Eliminar la categoría ${cat.code}?`, message: `Se eliminarán también sus ${cat.policies.length} políticas.`, confirmLabel: 'Eliminar', cancelLabel: 'Cancelar', tone: 'danger' });
    if (ok) this.save((d) => (d.categories = this.renumber(d.categories.filter((c) => c.code !== cat.code))));
  }

  protected moveCategory(i: number, delta: number): void {
    this.save((d) => (d.categories = this.renumber(this.swap(d.categories, i, i + delta))));
  }

  protected async editPolicy(cat: Category, pol: Policy | null): Promise<void> {
    const draft = this.doc()!;
    const isNew = pol === null;
    const ref = this.modal.open<PolicyDialog, Policy, PolicyDialogData>(PolicyDialog, {
      width: 'min(960px, 100%)',
      top: '4vh',
      data: {
        policy: pol ?? emptyPolicy('', cat.policies.length + 1),
        isNew,
        resources: this.res()!,
        takenCodes: draft.categories.flatMap((c) => c.policies.map((p) => p.code)),
        readonly: !this.editable(),
      },
    });
    const result = await firstValueFrom(ref.closed, { defaultValue: undefined });
    if (!result) return;
    this.save((d) => {
      const target = d.categories.find((c) => c.code === cat.code)!;
      if (isNew) target.policies.push(result);
      else target.policies = target.policies.map((p) => (p.code === result.code ? result : p));
    });
  }

  protected async removePolicy(cat: Category, pol: Policy): Promise<void> {
    const ok = await this.modal.confirm({ title: `¿Eliminar la política ${pol.code}?`, message: pol.name, confirmLabel: 'Eliminar', cancelLabel: 'Cancelar', tone: 'danger' });
    if (!ok) return;
    this.save((d) => {
      const target = d.categories.find((c) => c.code === cat.code)!;
      target.policies = this.renumber(target.policies.filter((p) => p.code !== pol.code));
    });
  }

  protected movePolicy(cat: Category, i: number, delta: number): void {
    this.save((d) => {
      const target = d.categories.find((c) => c.code === cat.code)!;
      target.policies = this.renumber(this.swap(target.policies, i, i + delta));
    });
  }

  private swap<T>(list: T[], a: number, b: number): T[] {
    const copy = [...list];
    [copy[a], copy[b]] = [copy[b], copy[a]];
    return copy;
  }
  /** El orden es consecutivo (1..n) tras cada movimiento o eliminación. */
  private renumber<T extends { order: number }>(list: T[]): T[] {
    return list.map((x, i) => ({ ...x, order: i + 1 }));
  }

  // ── Flujo de trabajo ─────────────────────────────────────────────────

  protected submit(): void {
    this.showIssues.set(true);
    if (this.hasErrors()) {
      this.toast.error('Corrige los errores antes de enviar a revisión');
      return;
    }
    this.submitting.set(true);
    this.ws.submit().subscribe({
      next: () => {
        this.toast.success('Borrador enviado a revisión');
        void this.router.navigate(['/flows']);
      },
      error: () => this.submitting.set(false),
    });
  }

  protected async discard(): Promise<void> {
    const ok = await this.modal.confirm({ title: '¿Descartar el borrador?', message: 'Se perderán los cambios no publicados.', confirmLabel: 'Descartar', cancelLabel: 'Cancelar', tone: 'danger' });
    if (ok) this.ws.discard().subscribe({ next: () => { this.toast.success('Borrador descartado'); void this.router.navigate(['/flows']); } });
  }
}
