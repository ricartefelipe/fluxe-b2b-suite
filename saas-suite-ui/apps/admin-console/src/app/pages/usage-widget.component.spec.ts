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
});
