export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  /** APIs Python (RFC 7807) */
  correlation_id?: string;
  permissionCode?: string;
  [key: string]: unknown;
}

export function isProblemDetails(val: unknown): val is ProblemDetails {
  return typeof val === 'object' && val !== null && 'status' in val;
}
