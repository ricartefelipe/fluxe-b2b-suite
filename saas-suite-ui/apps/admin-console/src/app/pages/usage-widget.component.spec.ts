import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UsageWidgetComponent } from './usage-widget.component';
import { I18nService } from '@saas-suite/shared/i18n';

describe('UsageWidgetComponent', () => {
  let fixture: ComponentFixture<UsageWidgetComponent>;
  let component: UsageWidgetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsageWidgetComponent],
      providers: [I18nService],
    }).compileComponents();

    fixture = TestBed.createComponent(UsageWidgetComponent);
    component = fixture.componentInstance;
  });

  it('displays users used and limit when usage is set', () => {
    component.usage = {
      usersUsed: 3,
      usersLimit: 10,
      planSlug: 'pro',
      planDisplayName: 'Pro',
    };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toMatch(/3/);
    expect(el.textContent).toMatch(/10/);
  });

  it('does not show usage card when usage is null', () => {
    component.usage = null;
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('mat-card');
    expect(card).toBeFalsy();
  });

  it('shows a warning when user usage is near the plan limit', () => {
    component.usage = {
      usersUsed: 9,
      usersLimit: 10,
      planSlug: 'starter',
      planDisplayName: 'Starter',
    };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(component.usageSeverity(component.usage)).toBe('warn');
    expect(el.textContent).toContain('Perto do limite');
  });

  it('shows a blocking message when user usage reaches the plan limit', () => {
    component.usage = {
      usersUsed: 10,
      usersLimit: 10,
      planSlug: 'starter',
      planDisplayName: 'Starter',
    };
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(component.usageSeverity(component.usage)).toBe('block');
    expect(el.textContent).toContain('Limite atingido');
    expect(el.querySelector('[role="alert"]')).toBeTruthy();
  });
});
