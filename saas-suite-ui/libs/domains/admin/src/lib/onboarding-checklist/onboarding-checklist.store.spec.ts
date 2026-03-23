import { TestBed } from '@angular/core/testing';
import { OnboardingChecklistStore } from './onboarding-checklist.store';

describe('OnboardingChecklistStore', () => {
  let store: OnboardingChecklistStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(OnboardingChecklistStore);
    store.setDismissed(false);
    store.setTenantsCount(0);
    store.setUsersCount(0);
    store.setHasSubscription(false);
  });

  it('returns incomplete steps when no tenant, no users, no subscription', () => {
    const steps = store.completedSteps();
    expect(steps.createTenant).toBe(false);
    expect(steps.inviteUser).toBe(false);
    expect(steps.configureBilling).toBe(false);
    expect(store.allComplete()).toBe(false);
    expect(store.showChecklist()).toBe(true);
  });

  it('returns complete when tenant, at least one user, and subscription exist', () => {
    store.setTenantsCount(1);
    store.setUsersCount(1);
    store.setHasSubscription(true);
    const steps = store.completedSteps();
    expect(steps.createTenant).toBe(true);
    expect(steps.inviteUser).toBe(true);
    expect(steps.configureBilling).toBe(true);
    expect(store.allComplete()).toBe(true);
    expect(store.showChecklist()).toBe(false);
  });

  it('hides checklist when dismissed even if not complete', () => {
    store.setDismissed(true);
    expect(store.showChecklist()).toBe(false);
  });

  it('inviteUser step is complete when usersCount >= 1', () => {
    store.setTenantsCount(1);
    store.setUsersCount(1);
    store.setHasSubscription(false);
    expect(store.completedSteps().inviteUser).toBe(true);
  });
});
