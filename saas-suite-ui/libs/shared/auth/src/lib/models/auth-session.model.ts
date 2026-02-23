export interface AuthSession {
  accessToken: string;
  userId: string;
  email: string;
  tenantId: string | null;
  roles: string[];
  permissions: string[];
  plan: string;
  region: string;
  expiresAt: number;
}

export function isExpired(session: AuthSession): boolean {
  return Date.now() > session.expiresAt - 30_000;
}

export function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

export function sessionFromJwt(token: string): AuthSession {
  const payload = parseJwtPayload(token);
  const exp = (payload['exp'] as number) ?? 0;
  return {
    accessToken: token,
    userId: (payload['sub'] as string) ?? '',
    email: (payload['email'] as string) ?? (payload['sub'] as string) ?? '',
    tenantId: (payload['tid'] as string) ?? null,
    roles: (payload['roles'] as string[]) ?? [],
    permissions: (payload['perms'] as string[]) ?? [],
    plan: (payload['plan'] as string) ?? '',
    region: (payload['region'] as string) ?? '',
    expiresAt: exp * 1000,
  };
}
