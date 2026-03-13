import { Component, inject, computed, OnInit } from '@angular/core';
import { ShellComponent, NavItem } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { TenantContextStore } from '@saas-suite/domains/tenancy';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<saas-shell [navItems]="navItems()" [appTitle]="appTitle()" />`,
})
export class AdminShellComponent implements OnInit {
  private i18n = inject(I18nService);
  private tenantStore = inject(TenantContextStore);

  readonly appTitle = computed(() => this.i18n.messages().adminNav.appTitle);

  readonly navItems = computed<NavItem[]>(() => {
    const m = this.i18n.messages().adminNav;
    return [
      { label: m.tenants, route: '/tenants', icon: 'business', permission: 'tenants:read' },
      { label: m.newTenant, route: '/onboarding', icon: 'add_business', permission: 'tenants:write' },
      { label: m.policies, route: '/policies', icon: 'policy', permission: 'policies:read' },
      { label: m.featureFlags, route: '/flags', icon: 'flag', permission: 'flags:read' },
      { label: m.users, route: '/users', icon: 'people', permission: 'admin:write' },
      { label: m.auditLog, route: '/audit', icon: 'history', permission: 'audit:read' },
      { label: m.aiAssistant, route: '/ai', icon: 'smart_toy', permission: 'analytics:read' },
    ];
  });

  async ngOnInit(): Promise<void> {
    await this.tenantStore.loadTenants();
  }
}
