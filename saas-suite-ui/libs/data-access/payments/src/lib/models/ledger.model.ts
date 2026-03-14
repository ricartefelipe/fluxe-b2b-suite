export type EntryType = 'CREDIT' | 'DEBIT';

export interface LedgerEntry {
  id: string;
  tenantId: string;
  type: EntryType;
  amount: number;
  currency: string;
  description?: string;
  referenceId?: string;
  createdAt: string;
}

export interface LedgerBalance {
  account: string;
  currency: string;
  debits_total: string;
  credits_total: string;
  balance: string;
}

export interface LedgerParams {
  from?: string;
  to?: string;
  currency?: string;
  page?: number;
  pageSize?: number;
}
