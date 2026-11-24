import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Category, FlowDocument, FlowResources, Policy } from '@core/api/flow.models';
import { WorkflowApi } from '@core/api/workflow.api';
import { FlowWorkspaceStore } from '@core/state/flow-workspace.store';
import { MasterRequests } from '../masters/master-requests.service';
import { ModalService, ToastService, UiAlert, UiButton, UiCheckbox, UiFormField, UiInput, UiTab, UiTableSkeleton, UiTabs, UiTag } from '@shared/ui';
import { CategoryForm, CategoryPanel } from './editor/category-panel';
import { DropEvent, EditorDnd, Selection } from './editor/editor.models';
import { EditorTree } from './editor/editor-tree';
import { GroupRemoval, LogicPanel, RootMutation } from './editor/logic-panel';
import { MovePolicyData, MovePolicyDialog } from './editor/move-policy-dialog';
import { PolicyForm, PolicyPanel } from './editor/policy-panel';
import { ResourceTabs } from './editor/resource-tabs';
import { ValidationPanel } from './editor/validation-panel';
import { findPolicy, renumber } from './flow-tree';
import { collectIssues, emptyCategory, emptyPolicy, ValidationItem } from './flow-validation';

type EditorTab = 'structure' | 'vars' | 'fields' | 'cats';

/**
 * Editor del borrador (o vista de solo lectura de una versión): estructura con arrastrar y soltar,
 * paneles de categoría, política y lógica, validación y recursos del flujo.
 */
@Component({
  selector: 'app-flow-editor-page',
  imports: [FormsModule, RouterLink, UiButton, UiTag, UiAlert, UiTabs, UiTableSkeleton, UiCheckbox, UiInput, UiFormField, EditorTree, CategoryPanel, PolicyPanel, LogicPanel, ValidationPanel, ResourceTabs],
  providers: [EditorDnd],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './flow-editor-page.scss',
  template: `
    <header class="head">
      <nav class="crumbs" aria-label="Ruta"><a routerLink="/flows">Flujos</a> <span>›</span> <span>{{ version() ? 'Versión ' + version() : 'Editor de borrador' }}</span></nav>
      <div class="title-row">
        <div>
          <h1>{{ version() ? 'Versión ' + version() + ' · solo lectura' : 'Editor del borrador' }}</h1>
          <div class="tags">
            @if (version()) { <ui-tag tone="neutral">Solo lectura</ui-tag> }
            @else if (ws.state(); as s) {
              <ui-tag [tone]="s.status === 'review' ? 'warning' : 'info'" [dot]="true">{{ s.status === 'review' ? 'En revisión' : 'Borrador en edición' }}</ui-tag>
            }
            @if (dirtyIssues().errors) { <ui-tag tone="error">{{ dirtyIssues().errors }} errores</ui-tag> }
            @if (dirtyIssues().warnings) { <ui-tag tone="warning">{{ dirtyIssues().warnings }} avisos</ui-tag> }
            @if (ws.saving()) { <span class="saving">Guardando…</span> }
          </div>
          <p class="meta">{{ description() }}</p>
        </div>
        <div class="buttons">
          <a ui-button routerLink="/flows">Volver a flujos</a>
          @if (!version() && ws.state()?.status === 'editing') {
            <button ui-button variant="danger-ghost" [disabled]="!editable()" (click)="discard()">Descartar</button>
            <button ui-button variant="primary" [disabled]="!editable() || submitting()" [loading]="submitting()" (click)="submit()">Enviar a revisión</button>
          } @else if (!version() && ws.state()?.status === 'review') {
            <a ui-button routerLink="/flows/review" [queryParams]="{ open: 'return', from: 'editor' }">Devolver</a>
            <a ui-button variant="primary" routerLink="/flows/review" [queryParams]="{ open: 'approve', from: 'editor' }">Aprobar</a>
          }
        </div>
      </div>
    </header>

    @if (viewError()) {
      <ui-alert tone="error">{{ viewError() }}</ui-alert>
    } @else if (ws.error() && !version()) {
      <ui-alert tone="error">No fue posible cargar el borrador.</ui-alert>
    } @else if (!doc()) {
      <ui-table-skeleton [rows]="6" />
    } @else if (!version() && ws.state()?.status === 'none') {
      <ui-alert tone="info">No hay un borrador abierto. <a routerLink="/flows">Abre uno desde Flujos</a>.</ui-alert>
    } @else {
      @if (version()) {
        <ui-alert tone="info">Versión {{ version() }} · solo lectura. Una versión publicada o retirada nunca se edita: abre un borrador desde Flujos.</ui-alert>
      }
      @if (!version() && ws.state()?.returnComment) {
        <ui-alert tone="warning">Un aprobador devolvió el borrador: {{ ws.state()?.returnComment }}</ui-alert>
      }
      @if (!version() && ws.state()?.status === 'review') {
        <ui-alert tone="info">El borrador está en revisión y no admite cambios. Un aprobador distinto a quien lo envió debe aprobarlo o devolverlo.</ui-alert>
      }
      @if (!version() && !editable() && ws.state()?.status === 'editing') {
        <ui-alert tone="info">Solo lectura: tu perfil no puede solicitar cambios o el sistema de firma no está disponible.</ui-alert>
      }

      <section class="config">
        <button type="button" class="config-toggle" [attr.aria-expanded]="configOpen()" (click)="configOpen.set(!configOpen())">
          <span>Configuración del flujo</span>
          <span class="summary">{{ doc()!.stopOnStop ? 'Detiene al encontrar acción que detiene' : 'No detiene' }} · {{ doc()!.from }} → {{ doc()!.to }}</span>
          <span aria-hidden="true">{{ configOpen() ? '▴' : '▾' }}</span>
        </button>
        @if (configOpen()) {
          <div class="config-body">
            <ui-checkbox [disabled]="!editable()" [ngModel]="doc()!.stopOnStop" (ngModelChange)="setStop($event)">Detener el flujo al encontrar una acción que detiene (B o R)</ui-checkbox>
            <ui-form-field label="Vigencia desde (MM/dd/yyyy)"><ui-input [disabled]="!editable()" [ngModel]="doc()!.from" (ngModelChange)="setDate('from', $event)" /></ui-form-field>
            <ui-form-field label="Hasta"><ui-input [disabled]="!editable()" [ngModel]="doc()!.to" (ngModelChange)="setDate('to', $event)" /></ui-form-field>
          </div>
        }
      </section>

      <ui-tabs [tabs]="tabs()" [(active)]="tab" />

      @if (tab() === 'structure') {
        <div class="grid">
          <app-editor-tree [doc]="doc()!" [selection]="sel()" [editable]="editable()" (picked)="select($event)" (newCategory)="select({ kind: 'cat', isNew: true })" (newPolicy)="newPolicyFromHeader()" (dropped)="onDropped($event)" />
          <div class="center">
            @if (sel().kind === 'cat') {
              <app-category-panel [doc]="doc()!" [category]="selectedCategory()" [isNew]="!!sel().isNew" [editable]="editable()" (saved)="saveCategory($event)" (remove)="removeCategory()" />
            } @else {
              <app-policy-panel [doc]="doc()!" [policy]="selectedPolicy()?.policy ?? null" [category]="policyCategory()" [isNew]="!!sel().isNew" [editable]="editable()" (saved)="savePolicy($event)" (move)="movePolicy()" (remove)="removePolicy()" />
              @if (selectedPolicy(); as sp) {
                <app-logic-panel [policy]="sp.policy" [resources]="res()!" [editable]="editable()" [highlight]="highlight()" (mutated)="mutateRoot($event)" (removeGroup)="removeGroup($event)" />
              }
            }
          </div>
          <app-validation-panel [items]="issues()" (picked)="goTo($event)" />
        </div>
      } @else {
        <app-resource-tabs [kind]="tab()" [doc]="doc()" [resources]="res()!" [editable]="editable()" [focusCatalog]="focusCatalog()" (changed)="editResources($event)" />
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
  private readonly api = inject(WorkflowApi);

  /** Query params: si llega `version`, se muestra esa versión publicada en solo lectura. */
  readonly channel = input<string>();
  readonly product = input<string>();
  readonly version = input<number, string | number | undefined>(undefined, { transform: (v) => (v ? +v : 0) });

  private readonly viewed = signal<{ document: FlowDocument; resources: FlowResources } | null>(null);
  protected readonly viewError = signal('');
  protected readonly doc = computed(() => (this.version() ? this.viewed()?.document : this.ws.draft()) ?? null);
  protected readonly res = computed(() => (this.version() ? this.viewed()?.resources : this.ws.resources()) ?? null);

  protected readonly tab = signal<EditorTab>('structure');
  protected readonly configOpen = signal(false);
  protected readonly submitting = signal(false);
  protected readonly sel = signal<Selection>({ kind: 'cat' });
  protected readonly highlight = signal<string | null>(null);
  protected readonly focusCatalog = signal<string | null>(null);

  protected readonly editable = computed(() => !this.version() && this.ws.state()?.status === 'editing' && this.requests.canEdit());
  protected readonly issues = computed(() => {
    const d = this.doc();
    const r = this.res();
    return d && r ? collectIssues(d, r) : [];
  });
  protected readonly dirtyIssues = computed(() => {
    const errors = this.issues().filter((i) => i.level === 'error').length;
    return { errors, warnings: this.issues().length - errors };
  });
  protected readonly tabs = computed<UiTab[]>(() => {
    const r = this.res();
    return [
      { key: 'structure', label: 'Estructura' },
      { key: 'vars', label: `Variables${r ? ' · ' + r.variables.length : ''}` },
      { key: 'fields', label: `Campos del request${r ? ' · ' + r.fields.length : ''}` },
      { key: 'cats', label: `Catálogos${r ? ' · ' + r.catalogs.length : ''}` },
    ];
  });
  protected readonly description = computed(() => {
    const s = this.ws.state();
    if (this.version()) return 'Contenido de la versión publicada.';
    return s && s.status !== 'none' ? `Borrador ${s.openedId} · abierto por ${s.openedBy} · último cambio ${s.last}` : 'Edición de reglas, categorías y políticas del borrador.';
  });

  protected readonly selectedCategory = computed(() => {
    const s = this.sel();
    return s.kind === 'cat' && !s.isNew ? (this.doc()?.categories.find((c) => c.code === s.code) ?? null) : null;
  });
  protected readonly selectedPolicy = computed(() => {
    const s = this.sel();
    if (s.kind !== 'pol' || s.isNew || !this.doc()) return null;
    return findPolicy(this.doc()!, s.code ?? '') ?? null;
  });
  protected readonly policyCategory = computed<Category | null>(() => {
    const s = this.sel();
    const d = this.doc();
    if (!d) return null;
    if (s.isNew) return d.categories.find((c) => c.code === s.category) ?? null;
    return this.selectedPolicy()?.category ?? null;
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
    // Si lo seleccionado ya no existe (p. ej. tras eliminar), vuelve a la primera categoría.
    effect(() => {
      const d = this.doc();
      const s = this.sel();
      if (!d || s.isNew) return;
      const exists = s.kind === 'cat' ? d.categories.some((c) => c.code === s.code) : !!findPolicy(d, s.code ?? '');
      if (!exists) this.sel.set(d.categories[0] ? { kind: 'cat', code: d.categories[0].code } : { kind: 'cat', isNew: true });
    });
  }

  ngOnInit(): void {
    this.ws.load();
    this.requests.load();
  }

  protected select(s: Selection): void {
    this.sel.set(s);
    this.highlight.set(null);
  }
  protected newPolicyFromHeader(): void {
    const s = this.sel();
    const code = s.kind === 'cat' ? s.code : this.policyCategory()?.code;
    const target = code ?? this.doc()?.categories[0]?.code;
    if (!target) return void this.toast.info('Crea primero una categoría');
    this.select({ kind: 'pol', category: target, isNew: true });
  }

  /** Clic en un ítem de validación: abre la política (y resalta el nodo) o la pestaña de recursos. */
  protected goTo(item: ValidationItem): void {
    const t = item.target;
    if (t.policy) {
      this.tab.set('structure');
      this.sel.set({ kind: 'pol', code: t.policy });
      this.highlight.set(t.node ?? null);
    } else if (t.tab) {
      this.focusCatalog.set(t.catalog ?? null);
      this.tab.set(t.tab);
    }
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
  protected editResources(change: (r: FlowResources) => void): void {
    this.save((_, r) => change(r));
  }

  protected saveCategory(f: CategoryForm): void {
    const isNew = !!this.sel().isNew;
    this.save((d) => {
      if (isNew) d.categories.push({ ...emptyCategory(f.code, +f.order), name: f.name.trim(), active: f.active, stopRule: f.stopRule });
      else {
        const c = d.categories.find((x) => x.code === f.code);
        if (c) Object.assign(c, { name: f.name.trim(), order: +f.order, active: f.active, stopRule: f.stopRule });
      }
      d.categories.sort((a, b) => a.order - b.order);
      d.categories = renumber(d.categories);
    });
    this.sel.set({ kind: 'cat', code: f.code });
    this.toast.success(isNew ? 'Categoría creada en el borrador' : 'Categoría actualizada');
  }

  protected async removeCategory(): Promise<void> {
    const cat = this.selectedCategory();
    if (!cat) return;
    const ok = await this.modal.confirm({ title: `¿Eliminar la categoría ${cat.code}?`, message: cat.name, confirmLabel: 'Eliminar', cancelLabel: 'Cancelar', tone: 'danger' });
    if (!ok) return;
    this.save((d) => (d.categories = renumber(d.categories.filter((c) => c.code !== cat.code))));
    this.toast.success('Categoría eliminada');
  }

  protected savePolicy(f: PolicyForm): void {
    const isNew = !!this.sel().isNew;
    const catCode = this.policyCategory()?.code;
    this.save((d) => {
      if (isNew) {
        const cat = d.categories.find((c) => c.code === catCode);
        if (!cat) return;
        cat.policies.push({ ...emptyPolicy(f.code, +f.order), name: f.name.trim(), active: f.active, results: f.results });
        cat.policies.sort((a, b) => a.order - b.order);
        cat.policies = renumber(cat.policies);
      } else {
        const hit = findPolicy(d, f.code);
        if (!hit) return;
        Object.assign(hit.policy, { name: f.name.trim(), order: +f.order, active: f.active, results: f.results });
        hit.category.policies.sort((a, b) => a.order - b.order);
        hit.category.policies = renumber(hit.category.policies);
      }
    });
    this.sel.set({ kind: 'pol', code: f.code });
    this.toast.success(isNew ? 'Política creada en el borrador' : 'Política actualizada');
  }

  protected async removePolicy(): Promise<void> {
    const hit = this.selectedPolicy();
    if (!hit) return;
    const ok = await this.modal.confirm({ title: `¿Eliminar la política ${hit.policy.code}?`, message: hit.policy.name, confirmLabel: 'Eliminar', cancelLabel: 'Cancelar', tone: 'danger' });
    if (!ok) return;
    const catCode = hit.category.code;
    this.save((d) => {
      const cat = d.categories.find((c) => c.code === catCode);
      if (cat) cat.policies = renumber(cat.policies.filter((p) => p.code !== hit.policy.code));
    });
    this.sel.set({ kind: 'cat', code: catCode });
    this.toast.success('Política eliminada');
  }

  protected async movePolicy(): Promise<void> {
    const hit = this.selectedPolicy();
    const d = this.doc();
    if (!hit || !d) return;
    const ref = this.modal.open<MovePolicyDialog, string, MovePolicyData>(MovePolicyDialog, {
      width: 'min(420px, 100%)',
      data: { policy: hit.policy.code, current: hit.category.code, categories: d.categories.map((c) => ({ value: c.code, label: `${c.code} · ${c.name}` })) },
    });
    const target = await firstValueFrom(ref.closed, { defaultValue: undefined });
    if (target && target !== hit.category.code) this.moveTo(hit.policy.code, target, null);
  }

  /** Mueve una política a otra categoría; `before` indica la política antes de la cual insertarla (o null = al final). */
  private moveTo(policyCode: string, categoryCode: string, before: string | null): void {
    this.save((d) => {
      const src = findPolicy(d, policyCode);
      const dest = d.categories.find((c) => c.code === categoryCode);
      if (!src || !dest) return;
      src.category.policies = renumber(src.category.policies.filter((p) => p.code !== policyCode));
      const list = [...dest.policies].sort((a, b) => a.order - b.order);
      const at = before ? list.findIndex((p) => p.code === before) : -1;
      list.splice(at < 0 ? list.length : at, 0, src.policy);
      dest.policies = renumber(list);
    });
    this.toast.success(`Política ${policyCode} movida a la categoría ${categoryCode}`);
  }

  /** Arrastrar y soltar en el árbol: reordena categorías y políticas, o mueve políticas entre categorías. */
  protected onDropped(e: DropEvent): void {
    if (e.from.kind === 'cat' && e.kind === 'cat') {
      this.save((d) => {
        const list = [...d.categories].sort((a, b) => a.order - b.order);
        const [moved] = list.splice(list.findIndex((c) => c.code === e.from.key), 1);
        list.splice(list.findIndex((c) => c.code === e.key), 0, moved);
        d.categories = renumber(list);
      });
    } else if (e.from.kind === 'pol' && e.kind === 'pol') {
      this.moveTo(e.from.key, e.category!, e.key);
    } else if (e.from.kind === 'pol' && e.kind === 'cat') {
      this.moveTo(e.from.key, e.key, null);
    }
  }

  // ── Lógica de la política ────────────────────────────────────────────

  protected mutateRoot(fn: RootMutation): void {
    const code = this.selectedPolicy()?.policy.code;
    if (!code) return;
    this.save((d) => {
      const hit = findPolicy(d, code);
      if (hit) fn(hit.policy.root);
    });
  }

  protected async removeGroup(r: GroupRemoval): Promise<void> {
    const ok = await this.modal.confirm({ title: r.isRoot ? '¿Vaciar el grupo raíz?' : '¿Eliminar el subgrupo?', message: r.message, confirmLabel: r.isRoot ? 'Vaciar' : 'Eliminar', cancelLabel: 'Cancelar', tone: 'danger' });
    if (!ok) return;
    this.mutateRoot((root) => {
      if (r.isRoot) return void (root.children = []);
      const strip = (g: typeof root): boolean => {
        const i = g.children.findIndex((c) => c.id === r.id);
        if (i >= 0) return !!g.children.splice(i, 1);
        return g.children.some((c) => c.type === 'group' && strip(c));
      };
      strip(root);
    });
  }

  // ── Flujo de trabajo ─────────────────────────────────────────────────

  protected async submit(): Promise<void> {
    const { errors } = this.dirtyIssues();
    if (errors) {
      this.toast.error(`Corrige los ${errors} errores antes de enviar a revisión`);
      const first = this.issues().find((i) => i.level === 'error');
      if (first) this.goTo(first);
      return;
    }
    const ok = await this.modal.confirm({ title: '¿Enviar el borrador a revisión?', message: 'Quedará bloqueado hasta que un aprobador lo apruebe o lo devuelva.', confirmLabel: 'Enviar', cancelLabel: 'Cancelar', tone: 'primary' });
    if (!ok) return;
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
