export type SearchEntityType = 'order' | 'product' | 'tenant' | 'payment' | 'inventory' | 'audit';

export interface SearchResult {
  id: string;
  entityType: SearchEntityType;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
  metadata?: Record<string, string>;
  score: number;
}

export interface SearchConfig {
  enabledEntities: SearchEntityType[];
  maxResultsPerEntity: number;
  debounceMs: number;
}

export const ENTITY_LABELS: Record<SearchEntityType, string> = {
  order: 'Orders',
  product: 'Products',
  tenant: 'Tenants',
  payment: 'Payments',
  inventory: 'Inventory',
  audit: 'Audit Logs',
};
