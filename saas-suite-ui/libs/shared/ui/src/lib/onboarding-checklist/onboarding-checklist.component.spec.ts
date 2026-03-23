import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnboardingChecklistComponent } from './onboarding-checklist.component';
import { OnboardingChecklistStore } from '@saas-suite/domains/admin';
import { I18nService } from '@saas-suite/shared/i18n';

describe('OnboardingChecklistComponent', () => {
  let fixture: ComponentFixture<OnboardingChecklistComponent>;
  let store: OnboardingChecklistStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingChecklistComponent],
      providers: [OnboardingChecklistStore],
    }).compileComponents();

    store = TestBed.inject(OnboardingChecklistStore);
    store.setDismissed(false);
    store.setTenantsCount(0);
    store.setUsersCount(0);
    store.setHasSubscription(false);

    fixture = TestBed.createComponent(OnboardingChecklistComponent);
    fixture.detectChanges();
  });

  it('shows checklist title when not all steps complete', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Conclua sua configuração');
  });

  it('calls store.dismiss when dismiss button is clicked', () => {
    const dismissSpy = spyOn(store, 'dismiss');
    const btn = fixture.nativeElement.querySelector('[data-testid="dismiss-btn"]') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    btn?.click();
    expect(dismissSpy).toHaveBeenCalled();
  });
});
