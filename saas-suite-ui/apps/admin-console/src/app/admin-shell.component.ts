import { Component, inject, OnInit, computed } from '@angular/core';
import { ShellComponent, NavItem } from '@saas-suite/shared/ui';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<saas-shell [navItems]="navItems()" appTitle="Admin Console" />`,
})
export class AdminShellComponent implements OnInit {
  private i18n = inject(I18nService);
  private tenantStore = inject(TenantContextStore);

  navItems = computed<NavItem[]>(() => {
    const n = this.i18n.messages().nav;
    return [
      { label: n.dashboard, route: '/dashboard', icon: 'dashboard', permission: 'tenants:read' },
      { label: n.tenants, route: '/tenants', icon: 'business', permission: 'tenants:read' },
      { label: n.newTenant, route: '/onboarding', icon: 'add_business', permission: 'tenants:write' },
      { label: n.policies, route: '/policies', icon: 'policy', permission: 'policies:read' },
      { label: n.featureFlags, route: '/flags', icon: 'flag', permission: 'flags:read' },
      { label: n.auditLog, route: '/audit', icon: 'history', permission: 'audit:read' },
    ];
  });

  async ngOnInit(): Promise<void> {
    await this.tenantStore.loadTenants();
  }
}
