import { Injectable, inject, signal, computed } from '@angular/core';
import { forkJoin, lastValueFrom } from 'rxjs';
import {
  CoreApiClient,
  Tenant,
  TenantPlan,
  CreateTenantRequest,
  CreateFlagRequest,
  CreatePolicyRequest,
} from '@saas-suite/data-access/core';

export interface OrgInfo {
  name: string;
  region: string;
}

export interface FlagConfig {
  name: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface OnboardingConfig {
  flags: FlagConfig[];
  adminEmail: string;
}

export type OnboardingStep = 'org' | 'plan' | 'config' | 'review' | 'success';

const DEFAULT_FLAGS: FlagConfig[] = [
  { name: 'darkMode', label: 'Dark Mode', description: 'Enable dark theme for all users', enabled: false },
  { name: 'betaFeatures', label: 'Beta Features', description: 'Access to preview features', enabled: false },
  { name: 'advancedReporting', label: 'Advanced Reporting', description: 'Extended analytics and dashboards', enabled: true },
  { name: 'multiCurrency', label: 'Multi-Currency', description: 'Support for multiple currencies', enabled: false },
];

@Injectable({ providedIn: 'root' })
export class TenantOnboardingStore {
  private api = inject(CoreApiClient);

  readonly orgInfo = signal<OrgInfo>({ name: '', region: 'us-east-1' });
  readonly plan = signal<TenantPlan>('pro');
  readonly config = signal<OnboardingConfig>({ flags: DEFAULT_FLAGS, adminEmail: '' });
  readonly createdTenant = signal<Tenant | null>(null);
  readonly submitting = signal(false);
  readonly progress = signal(0);
  readonly error = signal<string | null>(null);

  readonly summary = computed(() => ({
    org: this.orgInfo(),
    plan: this.plan(),
    config: this.config(),
  }));

  setOrgInfo(info: OrgInfo): void {
    this.orgInfo.set(info);
  }

  setPlan(plan: TenantPlan): void {
    this.plan.set(plan);
  }

  setConfig(cfg: OnboardingConfig): void {
    this.config.set(cfg);
  }

  updateFlag(name: string, enabled: boolean): void {
    const current = this.config();
    this.config.set({
      ...current,
      flags: current.flags.map(f => f.name === name ? { ...f, enabled } : f),
    });
  }

  async submitOnboarding(): Promise<void> {
    this.submitting.set(true);
    this.progress.set(0);
    this.error.set(null);

    try {
      const req: CreateTenantRequest = {
        name: this.orgInfo().name,
        plan: this.plan(),
        region: this.orgInfo().region,
      };

      this.progress.set(20);
      const tenant = await lastValueFrom(this.api.createTenant(req));
      this.progress.set(50);

      const enabledFlags = this.config().flags.filter(f => f.enabled);
      if (enabledFlags.length > 0) {
        const flagRequests = enabledFlags.map(f => {
          const flagReq: CreateFlagRequest = {
            name: f.name,
            enabled: f.enabled,
          };
          return this.api.createFlag(tenant.id, flagReq);
        });
        await lastValueFrom(forkJoin(flagRequests));
      }
      this.progress.set(75);

      const policyReq: CreatePolicyRequest = {
        permissionCode: 'admin:full-access',
        effect: 'ALLOW',
        tenantId: tenant.id,
        enabled: true,
        notes: `Default admin policy for ${tenant.name}`,
      };
      await lastValueFrom(this.api.createPolicy(policyReq));
      this.progress.set(100);

      this.createdTenant.set(tenant);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'An unexpected error occurred during tenant creation.');
    } finally {
      this.submitting.set(false);
    }
  }

  reset(): void {
    this.orgInfo.set({ name: '', region: 'us-east-1' });
    this.plan.set('pro');
    this.config.set({ flags: [...DEFAULT_FLAGS], adminEmail: '' });
    this.createdTenant.set(null);
    this.submitting.set(false);
    this.progress.set(0);
    this.error.set(null);
  }
}
