import { describe, it, expect, vi } from 'vitest';
import { toISODateString, formatDate, formatDateTime, startOfDay, endOfDay } from '../date.util';
import { generateUUID, generateIdempotencyKey } from '../uuid.util';
import { buildPaginationParams, type PaginationParams } from '../paginator.util';
import { isProblemDetails } from '@saas-suite/shared/http';

// ---------- date.util ----------

describe('date.util', () => {
  describe('toISODateString', () => {
    it('extracts yyyy-mm-dd from a Date', () => {
      const d = new Date('2025-03-15T14:30:00Z');
      expect(toISODateString(d)).toBe('2025-03-15');
    });

    it('works for start of epoch', () => {
      expect(toISODateString(new Date('1970-01-01T00:00:00Z'))).toBe('1970-01-01');
    });
  });

  describe('startOfDay', () => {
    it('sets hours, minutes, seconds and ms to zero', () => {
      const d = startOfDay(new Date(2025, 5, 10, 14, 30, 45, 123));
      expect(d.getHours()).toBe(0);
      expect(d.getMinutes()).toBe(0);
      expect(d.getSeconds()).toBe(0);
      expect(d.getMilliseconds()).toBe(0);
    });

    it('does not mutate the original date', () => {
      const original = new Date(2025, 5, 10, 14, 30);
      startOfDay(original);
      expect(original.getHours()).toBe(14);
    });
  });

  describe('endOfDay', () => {
    it('sets time to 23:59:59.999', () => {
      const d = endOfDay(new Date(2025, 5, 10, 6, 0, 0));
      expect(d.getHours()).toBe(23);
      expect(d.getMinutes()).toBe(59);
      expect(d.getSeconds()).toBe(59);
      expect(d.getMilliseconds()).toBe(999);
    });

    it('does not mutate the original date', () => {
      const original = new Date(2025, 5, 10, 6, 0, 0);
      endOfDay(original);
      expect(original.getHours()).toBe(6);
    });
  });

  describe('formatDateTime', () => {
    it('returns a pt-BR formatted date and time', () => {
      const result = formatDateTime('2025-06-15T10:30:00Z', 'pt-BR');
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(5);
    });
  });

  describe('formatDate', () => {
    it('returns a pt-BR formatted date (no time)', () => {
      const result = formatDate('2025-06-15T10:30:00Z', 'pt-BR');
      expect(result).toBeTruthy();
      expect(result).not.toContain(':');
    });
  });
});

// ---------- uuid.util ----------

describe('uuid.util', () => {
  describe('generateUUID', () => {
    it('returns a string matching UUID v4 format', () => {
      const id = generateUUID();
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('generates unique IDs on consecutive calls', () => {
      const a = generateUUID();
      const b = generateUUID();
      expect(a).not.toBe(b);
    });
  });

  describe('generateIdempotencyKey', () => {
    it('returns a UUID-based key without prefix by default', () => {
      const key = generateIdempotencyKey();
      expect(key).toMatch(/^[0-9a-f]{8}-/i);
    });

    it('prepends a prefix when provided', () => {
      const key = generateIdempotencyKey('order');
      expect(key).toMatch(/^order-[0-9a-f]{8}-/);
    });

    it('generates unique keys on consecutive calls', () => {
      const a = generateIdempotencyKey('x');
      const b = generateIdempotencyKey('x');
      expect(a).not.toBe(b);
    });
  });
});

// ---------- paginator.util ----------

describe('paginator.util — buildPaginationParams', () => {
  it('returns empty object for empty params', () => {
    expect(buildPaginationParams({})).toEqual({});
  });

  it('converts numeric page and pageSize to strings', () => {
    const result = buildPaginationParams({ page: 2, pageSize: 25 });
    expect(result).toEqual({ page: '2', pageSize: '25' });
  });

  it('includes sort and direction', () => {
    const result = buildPaginationParams({
      sort: 'name',
      direction: 'asc',
    });
    expect(result).toEqual({ sort: 'name', direction: 'asc' });
  });

  it('omits undefined fields', () => {
    const result = buildPaginationParams({ page: 0 });
    expect(result).toEqual({ page: '0' });
    expect(result['pageSize']).toBeUndefined();
  });

  it('includes page 0 (falsy but not null)', () => {
    const result = buildPaginationParams({ page: 0 });
    expect(result['page']).toBe('0');
  });
});

// ---------- ProblemDetails (from shared/http, tested here for pure-fn convenience) ----------

describe('isProblemDetails', () => {
  it('returns true for object with status field', () => {
    expect(isProblemDetails({ status: 404, title: 'Not Found' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isProblemDetails(null)).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isProblemDetails('error')).toBe(false);
  });

  it('returns false for object without status', () => {
    expect(isProblemDetails({ error: 'oops' })).toBe(false);
  });
});
