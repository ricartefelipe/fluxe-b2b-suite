import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { BillingPage } from './billing.page';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { I18nService, MESSAGES } from '@saas-suite/shared/i18n';
import { PT_BR_MESSAGES } from '@saas-suite/shared/i18n';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TenantContextStore } from '@saas-suite/domains/tenancy';
import { BillingInvoice, PlanDefinition, Subscription } from '@saas-suite/data-access/core';
import { vi } from 'vitest';

const plan: PlanDefinition = {
  id: 'plan-pro',
  slug: 'pro',
  displayName: 'Pro',
  monthlyPriceCents: 1000,
  yearlyPriceCents: 10000,
  maxUsers: 10,
  maxProjects: 5,
  storageGb: 50,
};

const subscription: Subscription = {
  id: 'sub-1',
  tenantId: 'tenant-1',
  planSlug: 'pro',
  status: 'ACTIVE',
  currentPeriodStart: '2026-04-01T00:00:00Z',
  currentPeriodEnd: '2026-05-01T00:00:00Z',
  createdAt: '2026-04-01T00:00:00Z',
};

const invoice: BillingInvoice = {
  id: 'in-1',
  status: 'paid',
  currency: 'BRL',
  amountDueCents: 12345,
  createdAt: '2026-04-02T00:00:00Z',
  periodStart: '2026-04-01T00:00:00Z',
  periodEnd: '2026-05-01T00:00:00Z',
  hostedInvoiceUrl: 'https://billing.example/in-1',
  invoicePdfUrl: 'https://billing.example/in-1.pdf',
};

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
        {
          provide: TenantContextStore,
          useValue: { activeTenantId: () => null },
        },
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of(true) }) },
        },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BillingPage);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows an actionable error when billing data cannot be loaded', async () => {
    const fixture = TestBed.createComponent(BillingPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne('https://api.test/v1/billing/plans').flush({ message: 'down' }, { status: 503, statusText: 'Service Unavailable' });
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os dados de faturamento.');
    expect(fixture.nativeElement.textContent).not.toContain(PT_BR_MESSAGES.billing.noSubscription);
    http.verify();
  });

  it('does not treat subscription load failures as no subscription', async () => {
    const fixture = TestBed.createComponent(BillingPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne('https://api.test/v1/billing/plans').flush([plan]);
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('https://api.test/v1/subscriptions/current').flush(
      { message: 'upstream unavailable' },
      { status: 500, statusText: 'Internal Server Error' },
    );
    http.expectOne('https://api.test/v1/users').flush([]);
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os dados de faturamento.');
    expect(fixture.nativeElement.textContent).not.toContain(PT_BR_MESSAGES.billing.noSubscription);

    await fixture.componentInstance.selectPlan({ ...plan, slug: 'enterprise' });
    http.expectNone('https://api.test/v1/subscriptions/trial');
    http.verify();
  });

  it('does not show zero usage when users cannot be loaded', async () => {
    const fixture = TestBed.createComponent(BillingPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne('https://api.test/v1/billing/plans').flush([plan]);
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('https://api.test/v1/subscriptions/current').flush(subscription);
    http.expectOne('https://api.test/v1/users').flush(
      { message: 'users unavailable' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('https://api.test/v1/billing/invoices').flush([]);
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(fixture.componentInstance.usage()).toBeNull();
    http.verify();
  });

  it('shows read-only invoices for the current subscription', async () => {
    const fixture = TestBed.createComponent(BillingPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne('https://api.test/v1/billing/plans').flush([plan]);
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('https://api.test/v1/subscriptions/current').flush(subscription);
    http.expectOne('https://api.test/v1/users').flush([]);
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('https://api.test/v1/billing/invoices').flush([invoice]);
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Faturas');
    expect(fixture.nativeElement.textContent).toContain('Paga');
    expect(fixture.nativeElement.textContent).toContain('R$ 123,45');
    expect(fixture.nativeElement.querySelector('a[href="https://billing.example/in-1.pdf"]')).toBeTruthy();
    http.verify();
  });

  it('keeps billing data visible when invoices cannot be loaded', async () => {
    const fixture = TestBed.createComponent(BillingPage);
    const http = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    http.expectOne('https://api.test/v1/billing/plans').flush([plan]);
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('https://api.test/v1/subscriptions/current').flush(subscription);
    http.expectOne('https://api.test/v1/users').flush([]);
    await new Promise(resolve => setTimeout(resolve, 0));
    http.expectOne('https://api.test/v1/billing/invoices').flush(
      { message: 'stripe unavailable' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Plano Atual');
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar as faturas agora.');
    expect(fixture.nativeElement.textContent).not.toContain('Não foi possível carregar os dados de faturamento.');
    http.verify();
  });

  it('formats plan prices using the active locale', () => {
    const fixture = TestBed.createComponent(BillingPage);
    const i18n = TestBed.inject(I18nService);
    i18n.setLocale('en-US');

    expect(fixture.componentInstance.formatPrice(1000)).toBe('R$10.00');
  });

  it('opens the billing portal instead of starting a new trial when changing an existing subscription', async () => {
    let dialogMessage = '';
    TestBed.inject(I18nService).setLocale('pt-BR');
    const fixture = TestBed.createComponent(BillingPage);
    const http = TestBed.inject(HttpTestingController);
    (fixture.componentInstance as unknown as { dialog: { open: () => { afterClosed: () => ReturnType<typeof of<boolean>> } } }).dialog = {
      open: (_component: unknown, config: { data?: { message?: string } }) => {
        dialogMessage = config.data?.message ?? '';
        return { afterClosed: () => of(true) };
      },
    };
    fixture.componentInstance.subscription.set(subscription);

    await fixture.componentInstance.selectPlan({ ...plan, slug: 'enterprise' });

    expect(dialogMessage).toBe('Abriremos o portal de faturamento para gerenciar a alteração do plano com segurança.');
    http.expectOne('https://api.test/v1/billing/portal-session').flush({ url: '#billing-portal' });
    http.expectNone('https://api.test/v1/subscriptions/trial');
    http.verify();
  });
});
