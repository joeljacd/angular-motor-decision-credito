import { computed, inject, Injectable, signal } from '@angular/core';
import { StorageService } from '@core/storage/storage.service';

export const NARROW_BREAKPOINT = 900;

/** Estado del shell: viewport, barra lateral colapsada y cajón móvil. */
@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly storage = inject(StorageService);

  readonly viewportWidth = signal(typeof window === 'undefined' ? 1440 : window.innerWidth);
  readonly collapsed = signal(this.storage.local.get<boolean>('sidebarCollapsed') === true);
  readonly mobileOpen = signal(false);

  readonly narrow = computed(() => this.viewportWidth() < NARROW_BREAKPOINT);
  readonly wide = computed(() => !this.narrow());
  /** Barra lateral con etiquetas visibles. */
  readonly expanded = computed(() => this.narrow() || !this.collapsed());
  readonly siderWidth = computed(() => (this.narrow() ? 268 : this.collapsed() ? 68 : 248));

  setViewport(width: number): void {
    this.viewportWidth.set(width);
    if (width >= NARROW_BREAKPOINT) this.mobileOpen.set(false);
  }

  toggleCollapse(): void {
    if (this.narrow()) {
      this.mobileOpen.set(false);
    } else {
      this.collapsed.update((c) => !c);
      this.storage.local.set('sidebarCollapsed', this.collapsed());
    }
  }
  openDrawer(): void { this.mobileOpen.set(true); }
  closeDrawer(): void { this.mobileOpen.set(false); }
}
