export interface NavItem {
  label: string;
  route: string;
  icon: string;
  /** Mostrar o item se o utilizador tiver esta permissão (exclusivo com requiredPermissions). */
  permission?: string;
  /** Mostrar o item só se o utilizador tiver todas estas permissões (ex.: dashboard agrega APIs). */
  requiredPermissions?: string[];
  /**
   * ABAC py-payments-ledger (plano/região no JWT). Ver `sessionPaymentsAbacAllows`.
   */
  paymentsAbacPermissions?: string[];
  /** Um único código (atalho para o guard e sidebar). */
  paymentsAbacPermission?: string;
  /** ABAC node-b2b-orders. Ver `sessionOrdersAbacAllows`. */
  ordersAbacPermissions?: string[];
  ordersAbacPermission?: string;
}
