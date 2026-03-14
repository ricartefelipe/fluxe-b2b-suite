import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { BillingPage } from './billing.page';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MESSAGES } from '@saas-suite/shared/i18n';
import { PT_BR_MESSAGES } from '@saas-suite/shared/i18n';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RuntimeConfigService } from '@saas-suite/shared/config';

describe('BillingPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingPage],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
        { provide: MESSAGES, useValue: PT_BR_MESSAGES },
        {
          provide: RuntimeConfigService,
          useValue: { get: (k: string) => (k === 'coreApiBaseUrl' ? 'https://api.test' : '') },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BillingPage);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
