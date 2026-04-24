import { HttpParams } from '@angular/common/http';

export interface PageResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Resposta de listagem com paginação opaca (keyset) alinhada ao JSON da API. */
export interface KeysetListResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function keysetListToPage<T>(r: KeysetListResponse<T>): PageResponse<T> {
  return { data: r.data, total: r.data.length, page: 0, pageSize: r.data.length };
}

export function toParams(obj?: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  if (!obj) return params;
  Object.entries(obj).forEach(([k, v]) => {
    if (v != null && v !== '') params = params.set(k, String(v));
  });
  return params;
}
