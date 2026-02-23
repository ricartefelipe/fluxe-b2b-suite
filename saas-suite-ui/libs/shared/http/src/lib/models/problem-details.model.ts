export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  correlationId?: string;
  permissionCode?: string;
  [key: string]: unknown;
}

export function isProblemDetails(val: unknown): val is ProblemDetails {
  return typeof val === 'object' && val !== null && 'status' in val;
}
