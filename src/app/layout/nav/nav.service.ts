import { computed, inject, Injectable } from '@angular/core';
import { AuthService } from '@core/auth';
import { I18nKey } from '@core/i18n';
import { InboxService } from '@core/state/inbox.service';
import { IntegrityStore } from '@core/state/integrity.store';
import { NAV_GROUPS, NAV_ITEMS, NavGroupId, NavItem } from './nav.config';

export interface NavBadge {
  text: string | number;
  tone: 'accent' | 'neutral' | 'error';
}
export interface NavEntry {
  item: NavItem;
  labelKey: I18nKey;
  badge: NavBadge | null;
}
export interface NavSection {
  id: NavGroupId | null;
  labelKey?: I18nKey;
  entries: NavEntry[];
}

/** Menú efectivo del usuario: solo las entradas permitidas, con sus badges. */
@Injectable({ providedIn: 'root' })
export class NavService {
  private readonly auth = inject(AuthService);
  private readonly inbox = inject(InboxService);
  private readonly integrity = inject(IntegrityStore);

  readonly sections = computed<NavSection[]>(() => {
    const me = this.auth.me();
    return NAV_GROUPS.map((group) => ({
      id: group.id,
      labelKey: group.labelKey,
      entries: NAV_ITEMS.filter((i) => i.group === group.id && this.auth.can(i.key)).map((item) => ({
        item,
        labelKey: `nav.${item.key}` as I18nKey,
        badge: this.badgeFor(item, !!me?.puedeAprobar),
      })),
    })).filter((s) => s.entries.length > 0);
  });

  private badgeFor(item: NavItem, canApprove: boolean): NavBadge | null {
    switch (item.key) {
      case 'home':
        return canApprove && this.inbox.pendingCount() > 0 ? { text: this.inbox.pendingCount(), tone: 'accent' } : null;
      case 'requests':
        return this.inbox.openRequestsCount() > 0 ? { text: this.inbox.openRequestsCount(), tone: 'neutral' } : null;
      case 'integrity':
        return this.integrity.hasAlerts() ? { text: '!', tone: 'error' } : null;
      default:
        return null;
    }
  }
}
