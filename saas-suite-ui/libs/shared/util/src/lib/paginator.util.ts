export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  direction?: 'asc' | 'desc';
}

export function buildPaginationParams(params: PaginationParams): Record<string, string> {
  const result: Record<string, string> = {};
  if (params.page != null) result['page'] = String(params.page);
  if (params.pageSize != null) result['pageSize'] = String(params.pageSize);
  if (params.sort) result['sort'] = params.sort;
  if (params.direction) result['direction'] = params.direction;
  return result;
}
