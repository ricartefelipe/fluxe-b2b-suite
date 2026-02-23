import { Component, inject, OnInit } from '@angular/core';
import { ShellComponent, NavItem } from '@saas-suite/shared/ui';
import { TenantContextStore } from '@saas-suite/domains/tenancy';

const OPS_NAV: NavItem[] = [
  { label: 'Pedidos', route: '/orders', icon: 'receipt_long', permission: 'orders:read' },
  { label: 'Novo Pedido', route: '/orders/new', icon: 'add_shopping_cart', permission: 'orders:write' },
  { label: 'Inventário', route: '/inventory/adjustments', icon: 'inventory_2', permission: 'inventory:read' },
  { label: 'Pagamentos', route: '/payments', icon: 'payments', permission: 'payments:read' },
  { label: 'Ledger', route: '/ledger/entries', icon: 'account_balance', permission: 'ledger:read' },
  { label: 'Balanços', route: '/ledger/balances', icon: 'balance', permission: 'ledger:read' },
];

@Component({
  selector: 'app-ops-shell',
  standalone: true,
  imports: [ShellComponent],
  template: `<saas-shell [navItems]="navItems" appTitle="Ops Portal" />`,
})
export class OpsShellComponent implements OnInit {
  navItems = OPS_NAV;
  private tenantStore = inject(TenantContextStore);

  async ngOnInit(): Promise<void> {
    await this.tenantStore.loadTenants();
  }
}
