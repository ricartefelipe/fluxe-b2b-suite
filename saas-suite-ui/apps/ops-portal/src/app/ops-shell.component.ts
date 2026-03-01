import { Component, inject, OnInit, computed } from '@angular/core';
import { ShellComponent, NavItem } from '@saas-suite/shared/ui';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { I18nService } from '@saas-suite/shared/i18n';

@Component({
  selector: 'app-ops-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<saas-shell [navItems]="navItems()" appTitle="Ops Portal" />`,
})
export class OpsShellComponent implements OnInit {
  private i18n = inject(I18nService);
  private tenantStore = inject(TenantContextStore);

  navItems = computed<NavItem[]>(() => {
    const n = this.i18n.messages().nav;
    return [
      { label: n.dashboard, route: '/dashboard', icon: 'dashboard', permission: 'orders:read' },
      { label: n.orders, route: '/orders', icon: 'receipt_long', permission: 'orders:read' },
      { label: n.newOrder, route: '/orders/new', icon: 'add_shopping_cart', permission: 'orders:write' },
      { label: n.inventory, route: '/inventory/adjustments', icon: 'inventory_2', permission: 'inventory:read' },
      { label: n.payments, route: '/payments', icon: 'payments', permission: 'payments:read' },
      { label: n.ledgerEntries, route: '/ledger/entries', icon: 'account_balance', permission: 'ledger:read' },
      { label: n.ledgerBalances, route: '/ledger/balances', icon: 'balance', permission: 'ledger:read' },
    ];
  });

  async ngOnInit(): Promise<void> {
    await this.tenantStore.loadTenants();
  }
}
