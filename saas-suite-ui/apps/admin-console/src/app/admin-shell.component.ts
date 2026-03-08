import { Component, inject, OnInit } from '@angular/core';
import { ShellComponent, NavItem } from '@saas-suite/shared/ui';
import { TenantContextStore } from '@saas-suite/domains/tenancy';

const ADMIN_NAV: NavItem[] = [
  { label: 'Tenants', route: '/tenants', icon: 'business', permission: 'tenants:read' },
  { label: 'New Tenant', route: '/onboarding', icon: 'add_business', permission: 'tenants:write' },
  { label: 'Policies', route: '/policies', icon: 'policy', permission: 'policies:read' },
  { label: 'Feature Flags', route: '/flags', icon: 'flag', permission: 'flags:read' },
  { label: 'Audit Log', route: '/audit', icon: 'history', permission: 'audit:read' },
  { label: 'Assistente IA', route: '/ai', icon: 'smart_toy', permission: 'analytics:read' },
];

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<saas-shell [navItems]="navItems" appTitle="Admin Console" />`,
})
export class AdminShellComponent implements OnInit {
  navItems = ADMIN_NAV;
  private tenantStore = inject(TenantContextStore);

  async ngOnInit(): Promise<void> {
    await this.tenantStore.loadTenants();
  }
}
