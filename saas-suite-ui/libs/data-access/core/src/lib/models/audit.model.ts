export interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  correlationId?: string;
  permissionCode?: string;
  outcome: 'SUCCESS' | 'DENIED' | 'ERROR';
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditListParams {
  tenantId?: string;
  action?: string;
  outcome?: string;
  from?: string;
  to?: string;
  correlationId?: string;
  page?: number;
  pageSize?: number;
}
