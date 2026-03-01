import { describe, it, expect } from 'vitest';
import { toParams, type PageResponse } from './page-response';
import { HttpParams } from '@angular/common/http';

describe('PageResponse and toParams', () => {
  describe('PageResponse', () => {
    it('should type-check a valid page response', () => {
      const res: PageResponse<{ id: string }> = {
        data: [{ id: '1' }],
        total: 1,
        page: 0,
        pageSize: 20,
      };
      expect(res.data).toHaveLength(1);
      expect(res.total).toBe(1);
    });
  });

  describe('toParams', () => {
    it('should return empty HttpParams when obj is undefined', () => {
      const params = toParams(undefined);
      expect(params).toBeInstanceOf(HttpParams);
      expect(params.keys().length).toBe(0);
    });

    it('should return empty HttpParams when obj is empty', () => {
      const params = toParams({});
      expect(params.keys().length).toBe(0);
    });

    it('should set non-empty values', () => {
      const params = toParams({ page: 1, pageSize: 10, status: 'active' });
      expect(params.get('page')).toBe('1');
      expect(params.get('pageSize')).toBe('10');
      expect(params.get('status')).toBe('active');
    });

    it('should omit null and empty string', () => {
      const params = toParams({
        a: 1,
        b: null,
        c: '',
        d: 'keep',
      } as Record<string, unknown>);
      expect(params.get('a')).toBe('1');
      expect(params.get('d')).toBe('keep');
      expect(params.keys().length).toBe(2);
    });

    it('should include zero and false', () => {
      const params = toParams({ n: 0, ok: false } as Record<string, unknown>);
      expect(params.get('n')).toBe('0');
      expect(params.get('ok')).toBe('false');
    });
  });
});
