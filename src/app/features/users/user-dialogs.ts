import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DirectoryUser, UsersApi } from '@core/api/users.api';
import { ActiveState, Profile, User } from '@core/auth/auth.models';
import { initials } from '@core/auth/me';
import { APP_CONFIG } from '@core/config/app-config';
import { UsersStore } from '@core/state/users.store';
import { ToastService, UiAvatar, UiButton, UiFormField, UiInput, UiModalFrame, UiOption, UiRadioGroup, UiSelect, UiTag } from '@shared/ui';

const STATE_OPTIONS: UiOption<ActiveState>[] = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Inactivo', label: 'Inactivo' },
];

/** Alta de usuario: se valida contra el directorio activo (AD) y se asigna un perfil. */
@Component({
  selector: 'app-add-user-dialog',
  imports: [FormsModule, UiModalFrame, UiFormField, UiInput, UiSelect, UiRadioGroup, UiButton, UiAvatar, UiTag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .lead { margin: 0 0 14px; font-size: 14px; color: var(--color-neutral-700); }
    .row { display: flex; gap: 8px; align-items: flex-end; }
    .row ui-form-field { flex: 1; }
    .hint { margin: 6px 0 0; font-size: 12px; color: var(--color-neutral-700); }
    .err { margin: 6px 0 0; font-size: 12px; color: var(--color-error); }
    .found { display: flex; align-items: center; gap: 10px; padding: 10px; margin: 14px 0; border: 1px solid var(--color-success); background: var(--color-success-bg); }
    .found div { flex: 1; display: flex; flex-direction: column; line-height: 1.3; }
    .found small { color: var(--color-neutral-700); }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 14px; }
  `,
  template: `
    <ui-modal-frame kicker="Nuevo registro" title="Agregar usuario">
      <p class="lead">El usuario se autentica con Active Directory; no se genera contraseña. Valida el usuario de red para traer sus datos.</p>

      <div class="row">
        <ui-form-field label="Usuario de red (AD)">
          <ui-input placeholder="Ej. amolina" [mono]="true" [ngModel]="username()" (ngModelChange)="onUsername($event)" (keydown.enter)="validate()" />
        </ui-form-field>
        <button ui-button [disabled]="validating()" [loading]="validating()" (click)="validate()">{{ validating() ? 'Validando…' : found() ? 'Revalidar' : 'Validar en AD' }}</button>
      </div>
      @if (errors().username) { <p class="err" role="alert">{{ errors().username }}</p> }
      @if (config.useMocks) { <p class="hint">Directorio de prueba: amolina, ctapia, egarcia, rnaranjo, sloor</p> }

      @if (found(); as f) {
        <div class="found">
          <ui-avatar [initials]="ini(f.nombre)" [size]="36" />
          <div><strong>{{ f.nombre }}</strong><small>{{ f.correo }} · {{ f.area }}</small></div>
          <ui-tag tone="success" size="sm">Validado</ui-tag>
        </div>
      }

      <div class="grid">
        <ui-form-field label="Perfil">
          <ui-select [options]="profileOptions" placeholder="Selecciona un perfil" [ngModel]="profile()" (ngModelChange)="profile.set($event)" />
          @if (errors().profile) { <p class="err" role="alert">{{ errors().profile }}</p> }
        </ui-form-field>
        <ui-form-field label="Estado">
          <ui-radio-group [options]="stateOptions" [ngModel]="state()" (ngModelChange)="state.set($event)" />
        </ui-form-field>
      </div>

      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" [loading]="saving()" [disabled]="saving()" (click)="save()">Agregar usuario</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class AddUserDialog {
  protected readonly ref = inject<DialogRef<User>>(DialogRef);
  private readonly profiles = inject<Profile[]>(DIALOG_DATA);
  private readonly api = inject(UsersApi);
  private readonly store = inject(UsersStore);
  private readonly toast = inject(ToastService);
  protected readonly config = inject(APP_CONFIG);

  protected readonly stateOptions = STATE_OPTIONS;
  protected readonly profileOptions: UiOption<number | null>[] = this.profiles
    .filter((p) => p.estado === 'Activo')
    .map((p) => ({ value: p.id, label: p.nombre }));

  protected readonly username = signal('');
  protected readonly profile = signal<number | null>(null);
  protected readonly state = signal<ActiveState>('Activo');
  protected readonly found = signal<DirectoryUser | null>(null);
  protected readonly validating = signal(false);
  protected readonly saving = signal(false);
  protected readonly errors = signal<{ username?: string; profile?: string }>({});
  protected readonly ini = initials;

  protected onUsername(value: string): void {
    this.username.set(value);
    this.found.set(null); // cambiar el usuario invalida la validación previa
    this.errors.set({});
  }

  /** Consulta el directorio activo; el usuario ya registrado se rechaza antes de llamar al servicio. */
  protected validate(): void {
    const name = this.username().trim().toLowerCase();
    if (!name) return void this.errors.set({ username: 'Ingresa el usuario de red.' });
    if (this.store.items().some((u) => u.usuario === name)) return void this.errors.set({ username: 'Este usuario ya está registrado en el portal.' });
    this.validating.set(true);
    this.api.lookupDirectory(name).subscribe({
      next: (user) => {
        this.validating.set(false);
        this.username.set(user.usuario);
        this.found.set(user);
        this.errors.set({});
      },
      error: () => {
        this.validating.set(false);
        this.errors.set({ username: 'No se encontró el usuario en el directorio activo.' });
      },
    });
  }

  protected save(): void {
    const found = this.found();
    const profile = this.profile();
    const errors: { username?: string; profile?: string } = {};
    if (!found) errors.username = 'Valida el usuario en el directorio antes de agregarlo.';
    if (profile === null) errors.profile = 'Selecciona un perfil.';
    this.errors.set(errors);
    if (!found || profile === null) return;

    this.saving.set(true);
    this.store.create({ usuario: found.usuario, nombre: found.nombre, perfil: profile, estado: this.state() }).subscribe({
      next: (user) => {
        this.toast.success(`Usuario ${user.usuario} agregado`);
        this.ref.close(user);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudo agregar el usuario.');
      },
    });
  }
}

/** Edición de nombre y estado; usuario y perfil son de solo lectura. */
@Component({
  selector: 'app-edit-user-dialog',
  imports: [FormsModule, UiModalFrame, UiFormField, UiInput, UiRadioGroup, UiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .ro { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
    .ro div { padding: 8px 10px; background: var(--color-neutral-200); display: flex; flex-direction: column; }
    .ro small { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-neutral-700); }
    .err { margin: 6px 0 0; font-size: 12px; color: var(--color-error); }
    ui-form-field + ui-form-field { margin-top: 14px; display: block; }
  `,
  template: `
    <ui-modal-frame kicker="Editar registro" title="Editar usuario">
      <div class="ro">
        <div><small>Usuario AD</small><span class="mono">{{ data.user.usuario }}</span></div>
        <div><small>Perfil</small><span>{{ data.profileName }}</span></div>
      </div>
      <ui-form-field label="Nombre completo">
        <ui-input [ngModel]="name()" (ngModelChange)="name.set($event)" />
        @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
      </ui-form-field>
      <ui-form-field label="Estado">
        <ui-radio-group [options]="stateOptions" [ngModel]="state()" (ngModelChange)="state.set($event)" />
      </ui-form-field>
      <ng-container uiModalActions>
        <button ui-button (click)="ref.close()">Cancelar</button>
        <button ui-button variant="primary" [loading]="saving()" [disabled]="saving()" (click)="save()">Guardar cambios</button>
      </ng-container>
    </ui-modal-frame>
  `,
})
export class EditUserDialog {
  protected readonly ref = inject<DialogRef<User>>(DialogRef);
  protected readonly data = inject<{ user: User; profileName: string }>(DIALOG_DATA);
  private readonly store = inject(UsersStore);
  private readonly toast = inject(ToastService);

  protected readonly stateOptions = STATE_OPTIONS;
  protected readonly name = signal(this.data.user.nombre);
  protected readonly state = signal<ActiveState>(this.data.user.estado);
  protected readonly error = signal('');
  protected readonly saving = signal(false);
  protected readonly canSave = computed(() => this.name().trim().length > 0);

  protected save(): void {
    if (!this.canSave()) return void this.error.set('El nombre es obligatorio.');
    this.saving.set(true);
    this.store.update(this.data.user.usuario, { nombre: this.name().trim(), estado: this.state() }).subscribe({
      next: (user) => {
        this.toast.success('Cambios guardados');
        this.ref.close(user);
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('No se pudieron guardar los cambios.');
      },
    });
  }
}
