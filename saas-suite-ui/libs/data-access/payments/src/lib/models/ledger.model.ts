export type EntrySide = 'CREDIT' | 'DEBIT';

export interface LedgerLine {
  side: EntrySide;
  account: string;
  amount: string;
  currency: string;
}

export interface LedgerJournalEntry {
  id: string;
  payment_intent_id: string;
  posted_at: string;
  lines: LedgerLine[];
}

export interface LedgerEntryRow {
  id: string;
  postedAt: string;
  side: EntrySide;
  account: string;
  amount: number;
  currency: string;
  paymentIntentId: string;
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
