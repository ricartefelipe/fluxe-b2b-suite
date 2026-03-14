import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LandingComponent } from './landing.component';
import { MESSAGES } from '@saas-suite/shared/i18n';
import { PT_BR_MESSAGES } from '@saas-suite/shared/i18n';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: MESSAGES, useValue: PT_BR_MESSAGES },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have 4 features', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    expect(fixture.componentInstance.features).toHaveLength(4);
  });

});
