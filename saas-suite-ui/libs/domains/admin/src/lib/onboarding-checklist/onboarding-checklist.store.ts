import { Injectable, signal, computed } from '@angular/core';

const STORAGE_KEY = 'fluxe_onboarding_checklist_dismissed';

export interface OnboardingStepsCompleted {
  createTenant: boolean;
  inviteUser: boolean;
  configureBilling: boolean;
}

@Injectable({ providedIn: 'root' })
export class OnboardingChecklistStore {
  private readonly tenantsCount = signal(0);
  private readonly usersCount = signal(0);
  private readonly hasSubscription = signal(false);
  private readonly dismissed = signal(this.readDismissed());

  readonly completedSteps = computed<OnboardingStepsCompleted>(() => ({
    createTenant: this.tenantsCount() >= 1,
    inviteUser: this.usersCount() >= 1,
    configureBilling: this.hasSubscription(),
  }));

  readonly allComplete = computed(
    () =>
      this.completedSteps().createTenant &&
      this.completedSteps().inviteUser &&
      this.completedSteps().configureBilling
  );

  readonly showChecklist = computed(
    () => !this.allComplete() && !this.dismissed()
  );

  setTenantsCount(n: number): void {
    this.tenantsCount.set(n);
  }

  setUsersCount(n: number): void {
    this.usersCount.set(n);
  }

  setHasSubscription(value: boolean): void {
    this.hasSubscription.set(value);
  }

  setDismissed(value: boolean): void {
    this.dismissed.set(value);
    if (typeof localStorage !== 'undefined') {
      if (value) localStorage.setItem(STORAGE_KEY, '1');
      else localStorage.removeItem(STORAGE_KEY);
    }
  }

  dismiss(): void {
    this.setDismissed(true);
  }

  private readDismissed(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  }
}
