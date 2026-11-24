import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActiveState, Profile } from '@core/auth/auth.models';
import { OptionKey } from '@core/auth/permissions';
import { ProfilesStore } from '@core/state/profiles.store';
import { ToastService, UiButton, UiFormField, UiInput, UiModalFrame, UiOption, UiRadioGroup } from '@shared/ui';
import { ALL_PERMISSION_IDS, PERMISSION_GROUPS, PermissionGroup } from './permission-groups';

export interface ProfileFormData {
  /** null = alta de perfil nuevo. */
  profile: Profile | null;
  /** Usuarios activos que se verán afectados al editar. */
  activeUsers: number;
}

const STATE_OPTIONS: UiOption<ActiveState>[] = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Inactivo', label: 'Inactivo' },
];

/** Alta/edición de perfil con selector de dos listas: opciones disponibles ↔ asignadas. */
@Component({
  selector: 'app-profile-form-dialog',
  imports: [FormsModule, UiModalFrame, UiFormField, UiInput, UiRadioGroup, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .fields .wide { grid-column: 1 / -1; }
    .err { margin: 6px 0 0; font-size: 12px; color: var(--color-error); }
    .head { display: flex; justify-content: space-between; align-items: baseline; margin: 18px 0 6px; }
    .head h4 { margin: 0; font-family: var(--font-heading); font-size: 18px; }
    .muted { font-size: 12px; color: var(--color-neutral-700); }
    .affects { font-size: 12px; color: var(--color-warning-fg); background: var(--color-warning-bg); padding: 4px 8px; }
    .lists { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .list { border: 1px solid var(--color-divider); max-height: 320px; overflow: auto; }
    .list-head { position: sticky; top: 0; z-index: 1; display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; font-size: 12px; font-weight: 600; background: var(--color-neutral-200); }
    .group-head { display: flex; justify-content: space-between; align-items: center; padding: 6px 10px 2px; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-neutral-700); }
    .link { background: none; border: 0; padding: 0; font: inherit; font-size: 11px; color: var(--color-accent); cursor: pointer; text-transform: none; letter-spacing: 0; }
    .item { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 7px 10px; background: none; border: 0; border-top: 1px solid var(--color-divider); font: inherit; text-align: left; cursor: pointer; color: inherit; }
    .item:hover { background: var(--color-accent-100); }
    .item .text { display: flex; flex-direction: column; }
    .item small { font-size: 11px; color: var(--color-neutral-700); }
    .empty { padding: 14px 10px; font-size: 13px; color: var(--color-neutral-700); }
    @media (max-width: 700px) { .lists { grid-template-columns: 1fr; } }
  `,
  template: `
    <ui-modal-frame [kicker]="editing ? 'Editar registro' : 'Nuevo registro'" [title]="editing ? 'Editar perfil · ' + data.profile!.nombre : 'Agregar perfil'" [closable]="true">
      <div class="fields">
        <ui-form-field label="Nombre del perfil">
          <ui-input [ngModel]="name()" (ngModelChange)="name.set($event)" />
          @if (errors().name) { <p class="err" role="alert">{{ errors().name }}</p> }
        </ui-form-field>
        <ui-form-field label="Estado">
          <ui-radio-group [options]="stateOptions" [ngModel]="state()" (ngModelChange)="state.set($event)" />
          @if (errors().state) { <p class="err" role="alert">{{ errors().state }}</p> }
        </ui-form-field>
        <ui-form-field class="wide" label="Descripción">
          <ui-input [ngModel]="desc()" (ngModelChange)="desc.set($event)" />
        </ui-form-field>
      </div>

      <div class="head">
        <h4>Opciones del sistema</h4>
        <span class="muted">{{ assignedCount() }}/{{ total }} asignadas</span>
      </div>
      @if (editing && data.activeUsers) {
        <span class="affects">Se aplica al instante a {{ data.activeUsers }} usuario{{ data.activeUsers > 1 ? 's' : '' }} activo{{ data.activeUsers > 1 ? 's' : '' }}</span>
      }
      @if (errors().opts) { <p class="err" role="alert">{{ errors().opts }}</p> }

      <div class="lists">
        <div class="list">
          <div class="list-head"><span>Disponibles · {{ total - assignedCount() }}</span></div>
          @for (g of available(); track g.title) {
            <div class="group-head"><span>{{ g.title }}</span><button type="button" class="link" (click)="toggleGroup(g, true)">Añadir todo</button></div>
            @for (it of g.items; track it.id) {
              <button type="button" class="item" (click)="toggle(it.id)">
                <span class="text"><span>{{ it.label }}</span>@if (it.hint) { <small>{{ it.hint }}</small> }</span><span aria-hidden="true">+</span>
              </button>
            }
          } @empty { <div class="empty">Todas las opciones están asignadas.</div> }
        </div>
        <div class="list">
          <div class="list-head"><span>Asignadas · {{ assignedCount() }}</span><button type="button" class="link" (click)="opts.set([])">Quitar todo</button></div>
          @for (g of assigned(); track g.title) {
            <div class="group-head"><span>{{ g.title }}</span><button type="button" class="link" (click)="toggleGroup(g, false)">Quitar sección</button></div>
            @for (it of g.items; track it.id) {
              <button type="button" class="item" (click)="toggle(it.id)">
                <span class="text"><span>✓ {{ it.label }}</span>@if (it.hint) { <small>{{ it.hint }}</small> }</span><span aria-hidden="true">−</span>
              </button>
            }
          } @empty { <div class="empty">Elige opciones de la lista de disponibles.</div> }
        </div>
      </div>

      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" [loading]="saving()" [disabled]="saving()" (click)="save()">{{ editing ? 'Guardar y aplicar' : 'Crear perfil' }}</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class ProfileFormDialog {
  protected readonly ref = inject<DialogRef<Profile>>(DialogRef);
  protected readonly data = inject<ProfileFormData>(DIALOG_DATA);
  private readonly store = inject(ProfilesStore);
  private readonly toast = inject(ToastService);

  protected readonly editing = this.data.profile !== null;
  protected readonly stateOptions = STATE_OPTIONS;
  protected readonly total = ALL_PERMISSION_IDS.length;

  protected readonly name = signal(this.data.profile?.nombre ?? '');
  protected readonly desc = signal(this.data.profile?.desc ?? '');
  protected readonly state = signal<ActiveState>(this.data.profile?.estado ?? 'Activo');
  protected readonly opts = signal<OptionKey[]>(this.data.profile ? [...this.data.profile.opts] : ['inicio']);
  protected readonly errors = signal<{ name?: string; state?: string; opts?: string }>({});
  protected readonly saving = signal(false);

  protected readonly assignedCount = computed(() => this.opts().length);
  protected readonly available = computed(() => this.split(false));
  protected readonly assigned = computed(() => this.split(true));

  /** Grupos con solo los ítems asignados (o no asignados); omite grupos vacíos. */
  private split(assigned: boolean): PermissionGroup[] {
    const set = new Set(this.opts());
    return PERMISSION_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => set.has(i.id) === assigned) })).filter((g) => g.items.length);
  }

  protected toggle(id: OptionKey): void {
    this.opts.update((list) => (list.includes(id) ? list.filter((o) => o !== id) : [...list, id]));
  }

  protected toggleGroup(group: PermissionGroup, add: boolean): void {
    const ids = group.items.map((i) => i.id);
    this.opts.update((list) => (add ? [...list, ...ids.filter((id) => !list.includes(id))] : list.filter((o) => !ids.includes(o))));
  }

  protected save(): void {
    const errors: { name?: string; state?: string; opts?: string } = {};
    if (!this.name().trim()) errors.name = 'El nombre es obligatorio.';
    if (!this.opts().length) errors.opts = 'Asigna al menos una opción.';
    // El Administrador es la red de seguridad: no puede quedar inactivo ni sin opciones.
    if (this.data.profile?.id === 1 && this.state() === 'Inactivo') errors.state = 'El perfil Administrador no se puede inactivar.';
    this.errors.set(errors);
    if (Object.keys(errors).length) return;

    const draft = { nombre: this.name().trim(), desc: this.desc().trim(), estado: this.state(), opts: this.opts() };
    this.saving.set(true);
    const op = this.data.profile ? this.store.update(this.data.profile.id, draft) : this.store.create(draft);
    op.subscribe({
      next: (profile) => {
        this.toast.success(this.editing ? 'Perfil actualizado' : 'Perfil creado');
        this.ref.close(profile);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudo guardar el perfil.');
      },
    });
  }
}
