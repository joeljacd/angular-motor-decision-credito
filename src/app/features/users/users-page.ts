import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '@core/auth/auth.models';
import { AuthService } from '@core/auth';
import { initials } from '@core/auth/me';
import { ProfilesStore } from '@core/state/profiles.store';
import { SystemStatusStore } from '@core/state/system-status.store';
import { UsersStore } from '@core/state/users.store';
import {
  ModalService, ToastService, UiAvatar, UiButton, UiCard, UiEmptyState, UiFilterBar, UiFormField, UiInput, UiOption, UiPageHeader,
  UiPagination, UiSelect, UiStat, UiStatStrip, UiTableSkeleton, UiTag,
} from '@shared/ui';
import { AddUserDialog, EditUserDialog } from './user-dialogs';

interface Filters {
  q: string;
  profile: string;
  status: string;
}
const EMPTY: Filters = { q: '', profile: '', status: '' };

/** Quita tildes y pasa a minúsculas para comparar texto. */
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Usuarios del portal (Active Directory): búsqueda, paginación, alta, edición y (des)activación. */
@Component({
  selector: 'app-users-page',
  imports: [FormsModule, UiPageHeader, UiButton, UiStatStrip, UiFilterBar, UiFormField, UiInput, UiSelect, UiCard, UiTag, UiAvatar, UiEmptyState, UiPagination, UiTableSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './users-page.scss',
  template: `
    <ui-page-header
      kicker="Seguridad · Gestión de accesos"
      title="Usuarios"
      description="Usuarios de Active Directory habilitados en el portal. El perfil asignado define su menú y sus acciones."
    >
      <button ui-button variant="primary" [disabled]="locked()" (click)="add()">+ Agregar usuario</button>
    </ui-page-header>

    <ui-stat-strip [stats]="stats()" />

    <ui-filter-bar>
      <ui-form-field label="Usuario o nombre">
        <ui-input placeholder="Ej. aperez o Ana" [ngModel]="draft().q" (ngModelChange)="patch({ q: $event })" (keydown.enter)="apply()" />
      </ui-form-field>
      <ui-form-field label="Perfil">
        <ui-select [options]="profileOptions()" [ngModel]="draft().profile" (ngModelChange)="patch({ profile: $event })" />
      </ui-form-field>
      <ui-form-field label="Estado">
        <ui-select [options]="stateOptions" [ngModel]="draft().status" (ngModelChange)="patch({ status: $event })" />
      </ui-form-field>
      <ng-container uiFilterActions>
        <button ui-button (click)="clear()">Limpiar</button>
        <button ui-button variant="primary" (click)="apply()">Buscar</button>
      </ng-container>
    </ui-filter-bar>

    <ui-card padding="md">
      <div class="toolbar">
        <span class="count">{{ filtered().length }} registros</span>
        <label class="size">Filas
          <ui-select [compact]="true" [options]="sizeOptions" [ngModel]="size()" (ngModelChange)="setSize($event)" />
        </label>
      </div>

      @if (users.loading() && !users.loaded()) {
        <ui-table-skeleton [rows]="6" />
      } @else if (!filtered().length) {
        <ui-empty-state title="Sin resultados">
          <button ui-button (click)="clear()">Limpiar filtros</button>
        </ui-empty-state>
      } @else {
        <div class="ui-table-wrap">
          <table class="ui-table">
            <thead><tr><th>Usuario AD</th><th>Nombre</th><th>Perfil</th><th>Estado</th><th>Último acceso</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (u of pageItems(); track u.username) {
                <tr [class.inactive]="u.status === 'inactive'">
                  <td class="mono">{{ u.username }}</td>
                  <td>
                    <div class="person">
                      <ui-avatar [initials]="initials(u.name)" [size]="30" />
                      <div class="names"><span>{{ u.name }}</span><span class="sub">{{ u.email }}</span></div>
                      @if (u.username === auth.me()?.id) { <ui-tag size="sm" tone="accent">Tú</ui-tag> }
                    </div>
                  </td>
                  <td><ui-tag size="sm" [tone]="profileActive(u.profile) ? 'accent' : 'neutral'">{{ profileName(u.profile) }}</ui-tag></td>
                  <td><ui-tag size="sm" [tone]="u.status === 'active' ? 'success' : 'neutral'" [dot]="true">{{ stateLabel(u.status) }}</ui-tag></td>
                  <td class="nowrap">{{ u.lastAccess }}</td>
                  <td>
                    <div class="row-actions">
                      <button ui-button size="sm" variant="ghost" [disabled]="locked()" (click)="edit(u)">Editar</button>
                      <button ui-button size="sm" [variant]="u.status === 'active' ? 'danger-ghost' : 'ghost'" [disabled]="locked()" (click)="toggle(u)">
                        {{ u.status === 'active' ? 'Inactivar' : 'Activar' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <ui-pagination [(page)]="page" [pageSize]="size()" [total]="filtered().length" />
      }
    </ui-card>
  `,
})
export class UsersPage implements OnInit {
  protected readonly users = inject(UsersStore);
  protected readonly profiles = inject(ProfilesStore);
  protected readonly auth = inject(AuthService);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  protected readonly locked = inject(SystemStatusStore).keyUnavailable;

  protected readonly initials = initials;
  /** Texto visible del estado. */
  protected readonly stateLabel = (state: 'active' | 'inactive') => (state === 'active' ? 'Activo' : 'Inactivo');
  protected readonly stateOptions: UiOption<string>[] = [{ value: '', label: 'Todos' }, { value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }];
  protected readonly sizeOptions: UiOption<number>[] = [5, 10, 20].map((n) => ({ value: n, label: String(n) }));

  protected readonly draft = signal<Filters>({ ...EMPTY });
  private readonly applied = signal<Filters>({ ...EMPTY });
  protected readonly page = signal(1);
  protected readonly size = signal(10);

  protected readonly profileOptions = computed<UiOption<string>[]>(() => [
    { value: '', label: 'Todos los perfiles' },
    ...this.profiles.items().map((p) => ({ value: String(p.id), label: p.name })),
  ]);

  protected readonly filtered = computed(() => {
    const f = this.applied();
    const q = normalize(f.q.trim());
    return this.users
      .items()
      .filter((u) => (!q || normalize(u.username).includes(q) || normalize(u.name).includes(q)) && (!f.profile || u.profile === +f.profile) && (!f.status || u.status === f.status));
  });
  protected readonly pageItems = computed(() => this.filtered().slice((this.page() - 1) * this.size(), this.page() * this.size()));

  protected readonly stats = computed<UiStat[]>(() => {
    const all = this.users.items();
    const active = all.filter((u) => u.status === 'active').length;
    return [
      { label: 'Total', value: all.length },
      { label: 'Activos', value: active, color: 'var(--color-success)' },
      { label: 'Inactivos', value: all.length - active, color: 'var(--color-neutral-700)' },
    ];
  });

  ngOnInit(): void {
    this.users.load();
    this.profiles.load();
  }

  protected patch(change: Partial<Filters>): void {
    this.draft.update((d) => ({ ...d, ...change }));
  }
  protected apply(): void {
    this.applied.set({ ...this.draft() });
    this.page.set(1);
  }
  protected clear(): void {
    this.draft.set({ ...EMPTY });
    this.apply();
  }
  protected setSize(size: number): void {
    this.size.set(size);
    this.page.set(1);
  }

  protected profileName(id: number): string {
    return this.profiles.items().find((p) => p.id === id)?.name ?? '—';
  }
  protected profileActive(id: number): boolean {
    return this.profiles.items().find((p) => p.id === id)?.status === 'active';
  }

  protected add(): void {
    this.modal.open(AddUserDialog, { data: this.profiles.items(), width: 'min(560px, 100%)' });
  }

  protected edit(user: User): void {
    this.modal.open(EditUserDialog, { data: { user, profileName: this.profileName(user.profile) } });
  }

  /** Activa/inactiva con confirmación; nadie puede inactivarse a sí mismo. */
  protected async toggle(user: User): Promise<void> {
    const deactivating = user.status === 'active';
    if (deactivating && user.username === this.auth.me()?.id) return void this.toast.info('No puedes inactivar tu propio usuario');
    const ok = await this.modal.confirm({
      title: deactivating ? `Inactivar a ${user.name}` : `Activar a ${user.name}`,
      message: deactivating
        ? 'Perderá el acceso al portal de inmediato. Su historial de cambios se conserva.'
        : 'Recuperará el acceso según su perfil.',
      confirmLabel: deactivating ? 'Inactivar' : 'Activar',
      cancelLabel: 'Cancelar',
      tone: deactivating ? 'danger' : 'primary',
    });
    if (!ok) return;
    this.users.update(user.username, { status: deactivating ? 'inactive' : 'active' }).subscribe({
      next: () => this.toast.success(deactivating ? 'Usuario inactivado' : 'Usuario activado'),
      error: () => this.toast.error('No se pudo cambiar el estado.'),
    });
  }
}
