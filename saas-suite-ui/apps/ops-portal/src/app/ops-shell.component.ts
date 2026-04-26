import { Component, inject, computed, OnInit } from '@angular/core';
import { ShellComponent, NavItem } from '@saas-suite/shared/ui';
import { I18nService } from '@saas-suite/shared/i18n';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { AuthStore } from '@saas-suite/shared/auth';
import { Tenant } from '@saas-suite/data-access/core';

@Component({
  selector: 'app-ops-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<saas-shell [navItems]="navItems()" [appTitle]="appTitle()" />`,
})
export class OpsShellComponent implements OnInit {
  private i18n = inject(I18nService);
  private tenantStore = inject(TenantContextStore);
  private authStore = inject(AuthStore);

  readonly appTitle = computed(() => this.i18n.messages().opsNav.appTitle);

  readonly navItems = computed<NavItem[]>(() => {
    const m = this.i18n.messages().opsNav;
    return [
      {
        label: m.dashboard,
        route: '/dashboard',
        icon: 'dashboard',
        requiredPermissions: ['orders:read', 'payments:read', 'inventory:read'],
        paymentsAbacPermissions: ['payments:read'],
      },
      { label: m.orders, route: '/orders', icon: 'receipt_long', permission: 'orders:read' },
      {
        label: m.newOrder,
        route: '/orders/new',
        icon: 'add_shopping_cart',
        permission: 'orders:write',
        ordersAbacPermissions: ['orders:write'],
      },
      { label: m.inventory, route: '/inventory/adjustments', icon: 'inventory_2', permission: 'inventory:read' },
      {
        label: m.payments,
        route: '/payments',
        icon: 'payments',
        permission: 'payments:read',
        paymentsAbacPermissions: ['payments:read'],
      },
      {
        label: m.ledger,
        route: '/ledger/entries',
        icon: 'account_balance',
        permission: 'ledger:read',
        paymentsAbacPermissions: ['ledger:read'],
      },
      {
        label: m.balances,
        route: '/ledger/balances',
        icon: 'balance',
        permission: 'ledger:read',
        paymentsAbacPermissions: ['ledger:read'],
      },
      {
        label: m.reports,
        route: '/reports',
        icon: 'assessment',
        requiredPermissions: ['orders:read', 'payments:read', 'ledger:read'],
        ordersAbacPermissions: ['orders:read'],
        paymentsAbacPermissions: ['payments:read', 'ledger:read'],
      },
    ];
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
        // Lista de tenants falhou (ex.: Core API inacessível); usa tenant da sessão para não quebrar dashboard/APIs
        const fallback: Tenant = { id: tid, name: '', plan: 'starter', region: '', status: 'ACTIVE', createdAt: '', updatedAt: '' };
        this.tenantStore.selectTenant(fallback);
      }
    }
  }
}
