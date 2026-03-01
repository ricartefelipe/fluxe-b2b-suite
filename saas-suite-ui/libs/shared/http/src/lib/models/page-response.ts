import { HttpParams } from '@angular/common/http';

/**
 * Contrato único de resposta paginada para listagens das APIs (core, orders, payments).
 */
export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Converte um objeto de parâmetros de listagem em HttpParams, omitindo null/undefined e string vazia.
 */
export function toParams(obj?: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  if (!obj) return params;
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null && v !== '') params = params.set(k, String(v));
  });
  return params;
}
