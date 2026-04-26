import { describe, expect, it } from 'vitest';
import {
  buildCsv,
  buildDateRangeParams,
  buildLedgerCsvRows,
  buildOrderCsvRows,
  buildPaymentCsvRows,
  filterByDateRange,
  formatCurrencyTotals,
  summarizeAmountsByCurrency,
  summarizeAmounts,
} from './reports-export.util';

describe('reports-export.util', () => {
  it('builds a CSV with BOM, escaped headers and escaped values', () => {
    const csv = buildCsv(
      ['ID', 'Cliente', 'Observação'],
      [
        ['ord-1', 'Cliente A', 'valor simples'],
        ['ord-2', 'Cliente, "Especial"', 'linha\nquebrada'],
      ],
    );

    expect(csv).toBe(
      '\uFEFF"ID","Cliente","Observação"\n' +
        '"ord-1","Cliente A","valor simples"\n' +
        '"ord-2","Cliente, ""Especial""","linha\nquebrada"',
    );
  });

  it('neutralizes spreadsheet formulas in CSV cells', () => {
    const csv = buildCsv(['Cliente'], [['=IMPORTXML("https://example.com")'], ['+cmd'], ['  @risk'], ['\t-risk']]);

    expect(csv).toBe(
      '\uFEFF"Cliente"\n' +
        '"\'=IMPORTXML(""https://example.com"")"\n' +
        '"\'+cmd"\n' +
        '"\'  @risk"\n' +
        '"\'\t-risk"',
    );
  });

  it('summarizes numeric string and number amounts while ignoring invalid values', () => {
    const total = summarizeAmounts([
      { amount: '10.50' },
      { amount: 15 },
      { amount: 'x' },
      { amount: null },
    ]);

    expect(total).toBe(25.5);
  });

  it('summarizes and formats totals by currency', () => {
    const totals = summarizeAmountsByCurrency(
      [
        { amount: '10.50', currency: 'BRL' },
        { amount: 5, currency: 'BRL' },
        { amount: '7', currency: 'USD' },
      ],
      row => row.currency,
      row => row.amount,
    );

    expect(totals).toEqual([
      { currency: 'BRL', amount: 15.5 },
      { currency: 'USD', amount: 7 },
    ]);
    expect(formatCurrencyTotals(totals)).toBe('BRL 15.50 · USD 7.00');
  });

  it('converts date filters to inclusive UTC day params', () => {
    const params = buildDateRangeParams({
      from: new Date('2026-04-01T12:00:00Z'),
      to: new Date('2026-04-30T23:59:00Z'),
    });

    expect(params).toEqual({
      from: '2026-04-01T00:00:00.000+00:00',
      to: '2026-04-30T23:59:59.999+00:00',
    });
  });

  it('filters rows inclusively by date range', () => {
    const rows = [
      { id: 'old', createdAt: '2026-03-31T23:59:59Z' },
      { id: 'in-1', createdAt: '2026-04-01T00:00:00Z' },
      { id: 'in-2', createdAt: '2026-04-30T23:59:59Z' },
      { id: 'new', createdAt: '2026-05-01T00:00:00Z' },
    ];

    const filtered = filterByDateRange(rows, row => row.createdAt, {
      from: new Date('2026-04-01T12:00:00Z'),
      to: new Date('2026-04-30T12:00:00Z'),
    });

    expect(filtered.map(row => row.id)).toEqual(['in-1', 'in-2']);
  });

  it('maps orders to report CSV rows', () => {
    const rows = buildOrderCsvRows([
      {
        id: 'ord-1',
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        status: 'CONFIRMED',
        items: [{ sku: 'SKU-1', qty: 2, price: 10 }],
        totalAmount: 20,
        currency: 'BRL',
        createdAt: '2026-04-01T10:00:00Z',
        updatedAt: '2026-04-01T11:00:00Z',
      },
    ]);

    expect(rows).toEqual([
      ['ord-1', 'customer-1', 'CONFIRMED', 'BRL', 20, 1, '2026-04-01T10:00:00Z'],
    ]);
  });

  it('maps payments and ledger rows to report CSV rows', () => {
    expect(
      buildPaymentCsvRows([
        {
          id: 'pay-1',
          amount: '99.90',
          currency: 'BRL',
          status: 'CONFIRMED',
          customer_ref: 'customer-1',
          gateway_ref: 'gw-1',
          created_at: '2026-04-02T10:00:00Z',
          updated_at: '2026-04-02T11:00:00Z',
        },
      ]),
    ).toEqual([['pay-1', 'customer-1', 'CONFIRMED', 'BRL', '99.90', 'gw-1', '2026-04-02T10:00:00Z']]);

    expect(
      buildLedgerCsvRows([
        {
          id: 'journal-1',
          postedAt: '2026-04-03T10:00:00Z',
          side: 'CREDIT',
          account: 'cash',
          amount: 99.9,
          currency: 'BRL',
          paymentIntentId: 'pay-1',
        },
      ]),
    ).toEqual([['journal-1', '2026-04-03T10:00:00Z', 'CREDIT', 'cash', 'BRL', 99.9, 'pay-1']]);
  });
});
