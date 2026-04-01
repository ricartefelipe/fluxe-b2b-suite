import { Injectable, signal, computed } from '@angular/core';
import { AuthSession, isExpired } from './models/auth-session.model';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _session = signal<AuthSession | null>(null);

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => {
    const s = this._session();
    return s != null && !isExpired(s);
  });
  readonly accessToken = computed(() => this._session()?.accessToken ?? null);
  readonly permissions = computed(() => this._session()?.permissions ?? []);
  readonly roles = computed(() => this._session()?.roles ?? []);

  setSession(session: AuthSession): void {
    this._session.set(session);
  }

  clearSession(): void {
    this._session.set(null);
  }

  hasPermission(perm: string): boolean {
    return this.permissions().includes(perm);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasAnyPermission(perms: string[]): boolean {
    return perms.some(p => this.hasPermission(p));
  }

  hasAllPermissions(perms: string[]): boolean {
    return perms.length > 0 && perms.every(p => this.hasPermission(p));
  }
}
