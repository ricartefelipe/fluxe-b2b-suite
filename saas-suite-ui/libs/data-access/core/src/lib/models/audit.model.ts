export interface AuditLog {
  id: string;
  tenantId?: string;
  actorSub?: string;
  actorRoles?: string[];
  action: string;
  resourceType?: string;
  resourceId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  correlationId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditListParams {
  tenantId?: string;
  action?: string;
  actorSub?: string;
  from?: string;
  to?: string;
  correlationId?: string;
  cursor?: string;
  limit?: number;
}
