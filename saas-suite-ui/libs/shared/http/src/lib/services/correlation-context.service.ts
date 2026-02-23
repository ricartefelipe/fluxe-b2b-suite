import { Injectable } from '@angular/core';
import { generateUUID } from '@saas-suite/shared/util';

@Injectable({ providedIn: 'root' })
export class CorrelationContextService {
  private scopeId: string | null = null;

  openScope(): string {
    this.scopeId = generateUUID();
    return this.scopeId;
  }

  closeScope(): void {
    this.scopeId = null;
  }

  getCurrentScope(): string | null {
    return this.scopeId;
  }

  async withScope<T>(fn: () => Promise<T>): Promise<T> {
    this.openScope();
    try {
      return await fn();
    } finally {
      this.closeScope();
    }
  }
}
