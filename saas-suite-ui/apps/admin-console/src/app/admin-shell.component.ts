import { Component, inject, computed, OnInit } from '@angular/core';
import { ShellComponent, NavItem } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { AuthStore } from '@saas-suite/shared/auth';
import { Tenant } from '@saas-suite/data-access/core';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<saas-shell [navItems]="navItems()" [appTitle]="appTitle()" />`,
})
export class AdminShellComponent implements OnInit {
  private i18n = inject(I18nService);
  private tenantStore = inject(TenantContextStore);
  private authStore = inject(AuthStore);

  readonly appTitle = computed(() => this.i18n.messages()?.adminNav?.appTitle ?? 'Admin');

  readonly navItems = computed<NavItem[]>(() => {
    try {
      const m = this.i18n.messages()?.adminNav;
      if (!m) return [];
      return [
      { label: m.tenants, route: '/tenants', icon: 'business', permission: 'tenants:read' },
      { label: m.newTenant, route: '/onboarding', icon: 'add_business', permission: 'tenants:write' },
      { label: m.policies, route: '/policies', icon: 'policy', permission: 'policies:read' },
      { label: m.featureFlags, route: '/flags', icon: 'flag', permission: 'flags:read' },
      { label: m.users, route: '/users', icon: 'people', permission: 'admin:write' },
      { label: m.billing, route: '/billing', icon: 'credit_card', permission: 'tenants:read' },
      { label: m.auditLog, route: '/audit', icon: 'history', permission: 'audit:read' },
      { label: m.aiAssistant, route: '/ai', icon: 'smart_toy', permission: 'analytics:read' },
    ];
    } catch {
      return [];
    }
  });

  async ngOnInit(): Promise<void> {
    await this.tenantStore.loadTenants();
    if (!this.tenantStore.activeTenantId()) {
      const tid = this.authStore.session()?.tenantId;
      const tenants = this.tenantStore.tenants();
      const match = tenants.find(t => t.id === tid);
      if (match) {
        this.tenantStore.selectTenant(match);
      } else if (tenants.length > 0) {
        this.tenantStore.selectTenant(tenants[0]);
      } else if (tid) {
        const fallback: Tenant = { id: tid, name: '', plan: 'starter', region: '', status: 'ACTIVE', createdAt: '', updatedAt: '' };
        this.tenantStore.selectTenant(fallback);
      }
    }
  }
}
