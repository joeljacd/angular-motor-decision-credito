import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile } from '@core/auth/auth.models';
import { ProfilesStore } from '@core/state/profiles.store';
import { SystemStatusStore } from '@core/state/system-status.store';
import { UsersStore } from '@core/state/users.store';
import { ModalService, ToastService, UiButton, UiCard, UiEmptyState, UiFilterBar, UiFormField, UiInput, UiOption, UiPageHeader, UiSelect, UiTableSkeleton, UiTag } from '@shared/ui';
import { capabilitiesOf, PERMISSION_GROUPS, SCREEN_PERMISSION_IDS } from './permission-groups';
import { ProfileFormDialog } from './profile-dialogs';

interface Filters {
  q: string;
  group: string;
  estado: string;
}
const EMPTY: Filters = { q: '', group: '', estado: '' };
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Perfiles: definen el menú y las capacidades. Los cambios aplican al instante a los usuarios con ese perfil. */
@Component({
  selector: 'app-profiles-page',
  imports: [FormsModule, UiPageHeader, UiButton, UiFilterBar, UiFormField, UiInput, UiSelect, UiCard, UiTag, UiEmptyState, UiTableSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './profiles-page.scss',
  template: `
    <ui-page-header
      kicker="Seguridad · Gestión de accesos"
      title="Perfiles"
      description="Las opciones de cada perfil son las del menú real y sus capacidades. Los cambios aplican al instante a los usuarios con ese perfil."
    >
      <button ui-button variant="primary" [disabled]="locked()" (click)="openForm(null)">+ Agregar perfil</button>
    </ui-page-header>

    <ui-filter-bar>
      <ui-form-field label="Código o nombre">
        <ui-input placeholder="Ej. PRF-002 o Aprobador" [ngModel]="draft().q" (ngModelChange)="patch({ q: $event })" (keydown.enter)="apply()" />
      </ui-form-field>
      <ui-form-field label="Incluye sección">
        <ui-select [options]="groupOptions" [ngModel]="draft().group" (ngModelChange)="patch({ group: $event })" />
      </ui-form-field>
      <ui-form-field label="Estado">
        <ui-select [options]="stateOptions" [ngModel]="draft().estado" (ngModelChange)="patch({ estado: $event })" />
      </ui-form-field>
      <ng-container uiFilterActions>
        <button ui-button (click)="clear()">Limpiar</button>
        <button ui-button variant="primary" (click)="apply()">Buscar</button>
      </ng-container>
    </ui-filter-bar>

    <ui-card padding="md">
      @if (profiles.loading() && !profiles.loaded()) {
        <ui-table-skeleton [rows]="5" />
      } @else if (!filtered().length) {
        <ui-empty-state title="Sin resultados." />
      } @else {
        <div class="ui-table-wrap">
          <table class="ui-table">
            <thead><tr><th>Código</th><th>Perfil</th><th>Capacidades</th><th>Opciones del menú</th><th>Usuarios</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              @for (p of filtered(); track p.id) {
                <tr [class.inactive]="p.estado === 'Inactivo'">
                  <td class="mono">{{ p.codigo }}</td>
                  <td><div class="names"><strong>{{ p.nombre }}</strong><span class="sub">{{ p.desc }}</span></div></td>
                  <td>
                    <div class="caps">
                      @for (c of caps(p); track c) { <ui-tag size="sm" tone="accent">{{ c }}</ui-tag> }
                      @empty { <ui-tag size="sm">Solo lectura</ui-tag> }
                    </div>
                  </td>
                  <td>
                    <div class="ticks-wrap">
                      <div class="ticks" aria-hidden="true">
                        @for (id of screenIds; track id) { <span [class.on]="p.opts.includes(id)" [title]="id"></span> }
                      </div>
                      <span class="sub">{{ screenCount(p) }}/{{ screenIds.length }}</span>
                    </div>
                  </td>
                  <td>{{ userCount(p) }}</td>
                  <td><ui-tag size="sm" [tone]="p.estado === 'Activo' ? 'success' : 'neutral'" [dot]="true">{{ p.estado }}</ui-tag></td>
                  <td>
                    <div class="row-actions">
                      <button ui-button size="sm" variant="ghost" [disabled]="locked()" (click)="openForm(p)">Editar</button>
                      <button ui-button size="sm" [variant]="p.estado === 'Activo' ? 'danger-ghost' : 'ghost'" [disabled]="locked()" (click)="toggle(p)">
                        {{ p.estado === 'Activo' ? 'Inactivar' : 'Activar' }}
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="foot">Mostrando {{ filtered().length }} perfiles</div>
      }
    </ui-card>
  `,
})
export class ProfilesPage implements OnInit {
  protected readonly profiles = inject(ProfilesStore);
  private readonly users = inject(UsersStore);
  private readonly modal = inject(ModalService);
  private readonly toast = inject(ToastService);
  protected readonly locked = inject(SystemStatusStore).keyUnavailable;

  protected readonly screenIds = SCREEN_PERMISSION_IDS;
  protected readonly caps = (p: Profile) => capabilitiesOf(p.opts);
  protected readonly stateOptions: UiOption<string>[] = [{ value: '', label: 'Todos' }, { value: 'Activo', label: 'Activo' }, { value: 'Inactivo', label: 'Inactivo' }];
  protected readonly groupOptions: UiOption<string>[] = [{ value: '', label: 'Cualquiera' }, ...PERMISSION_GROUPS.map((g) => ({ value: g.title, label: g.title }))];

  protected readonly draft = signal<Filters>({ ...EMPTY });
  private readonly applied = signal<Filters>({ ...EMPTY });

  protected readonly filtered = computed(() => {
    const f = this.applied();
    const q = normalize(f.q.trim());
    const groupIds = f.group ? (PERMISSION_GROUPS.find((g) => g.title === f.group)?.items.map((i) => i.id) ?? []) : null;
    return this.profiles
      .items()
      .filter((p) => (!q || normalize(p.nombre).includes(q) || normalize(p.codigo).includes(q)) && (!f.estado || p.estado === f.estado) && (!groupIds || p.opts.some((o) => groupIds.includes(o))));
  });

  ngOnInit(): void {
    this.profiles.load();
    this.users.load();
  }

  protected patch(change: Partial<Filters>): void {
    this.draft.update((d) => ({ ...d, ...change }));
  }
  protected apply(): void {
    this.applied.set({ ...this.draft() });
  }
  protected clear(): void {
    this.draft.set({ ...EMPTY });
    this.apply();
  }

  protected screenCount(p: Profile): number {
    return p.opts.filter((o) => !o.startsWith('cap.')).length;
  }
  protected userCount(p: Profile): number {
    return this.users.items().filter((u) => u.perfil === p.id).length;
  }
  private activeUserCount(p: Profile): number {
    return this.users.items().filter((u) => u.perfil === p.id && u.estado === 'Activo').length;
  }

  protected openForm(profile: Profile | null): void {
    this.modal.open(ProfileFormDialog, {
      data: { profile, activeUsers: profile ? this.activeUserCount(profile) : 0 },
      width: 'min(860px, 100%)',
      top: '5vh',
    });
  }

  /** Activa/inactiva con confirmación; el Administrador no se puede inactivar. */
  protected async toggle(p: Profile): Promise<void> {
    const deactivating = p.estado === 'Activo';
    if (deactivating && p.id === 1) return void this.toast.info('El perfil Administrador no se puede inactivar');
    const n = this.activeUserCount(p);
    const ok = await this.modal.confirm({
      title: deactivating ? `Inactivar perfil ${p.nombre}` : `Activar perfil ${p.nombre}`,
      message: deactivating
        ? `${n ? `${n} usuario${n > 1 ? 's' : ''} activo${n > 1 ? 's' : ''} con este perfil perderá${n > 1 ? 'n' : ''} el acceso al portal. ` : ''}Podrás reactivarlo cuando quieras.`
        : 'Los usuarios con este perfil recuperarán sus opciones.',
      confirmLabel: deactivating ? 'Inactivar' : 'Activar',
      cancelLabel: 'Cancelar',
      tone: deactivating ? 'danger' : 'primary',
    });
    if (!ok) return;
    this.profiles.setStatus(p.id, deactivating ? 'Inactivo' : 'Activo').subscribe({
      next: () => this.toast.success(deactivating ? 'Perfil inactivado' : 'Perfil activado'),
      error: () => this.toast.error('No se pudo cambiar el estado.'),
    });
  }
}
