import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { CartService } from '@union.solutions/shop/data';
import { Order, OrdersFacade } from '@saas-suite/data-access/orders';
import { TenantContextService } from '@saas-suite/shared/http';
import { AuthStore } from '@saas-suite/shared/auth';
import { RuntimeConfigService } from '@saas-suite/shared/config';
import { MESSAGES, PT_BR_MESSAGES } from '@saas-suite/shared/i18n';
import { CheckoutComponent } from './checkout.component';

const order = (status: Order['status']): Order =>
  ({ id: 'o1', tenantId: 't1', customerId: 'c', status, items: [], totalAmount: 129.9 }) as Order;

describe('CheckoutComponent.placeOrder', () => {
  const selected = signal<Order | null>(null);
  let facade: {
    createOrder: ReturnType<typeof vi.fn>;
    confirmOrder: ReturnType<typeof vi.fn>;
    loadOrder: ReturnType<typeof vi.fn>;
    selectedOrder: typeof selected;
  };
  let cart: { toOrderItems: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>; items: ReturnType<typeof signal> };

  const create = () => {
    const component = TestBed.createComponent(CheckoutComponent).componentInstance as CheckoutComponent & {
      delay: (ms: number) => Promise<void>;
    };
    component.termsAccepted.setValue(true);
    vi.spyOn(component, 'delay').mockResolvedValue(undefined);
    return component;
  };

  beforeEach(async () => {
    selected.set(null);
    facade = {
      createOrder: vi.fn().mockResolvedValue(order('CREATED')),
      confirmOrder: vi.fn().mockResolvedValue(order('CONFIRMED')),
      loadOrder: vi.fn().mockImplementation(async () => selected.set(order('PAID'))),
      selectedOrder: selected,
    };
    cart = { toOrderItems: vi.fn().mockReturnValue([{ sku: 'S', qty: 1, price: 129.9 }]), clear: vi.fn(), items: signal([]) };

    TestBed.resetTestingModule();
    TestBed.overrideComponent(CheckoutComponent, { set: { template: '' } });
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        { provide: MESSAGES, useValue: PT_BR_MESSAGES },
        { provide: OrdersFacade, useValue: facade },
        { provide: CartService, useValue: cart },
        { provide: TenantContextService, useValue: { getActiveTenantId: () => 't1', setActiveTenantId: vi.fn() } },
        { provide: AuthStore, useValue: { session: () => ({ email: 'c@example.test' }) } },
        { provide: RuntimeConfigService, useValue: { get: () => '' } },
      ],
    }).compileComponents();
  });

  it('confirma o pedido sem criar pagamento próprio e mostra o status liquidado', async () => {
    const component = create();

    await component.placeOrder();

    expect(facade.createOrder).toHaveBeenCalledOnce();
    expect(facade.confirmOrder).toHaveBeenCalledOnce();
    expect(component.checkoutError()).toBeNull();
    expect(component.confirmedOrder()?.status).toBe('PAID');
    expect(cart.clear).toHaveBeenCalledOnce();
  });

  it('mostra o último status conhecido quando a liquidação demora', async () => {
    facade.loadOrder.mockImplementation(async () => selected.set(order('CONFIRMED')));
    const component = create();

    await component.placeOrder();

    expect(component.confirmedOrder()?.status).toBe('CONFIRMED');
    expect(facade.loadOrder).toHaveBeenCalledTimes(5);
  });

  it('não confirma quando a criação do pedido é recusada', async () => {
    facade.createOrder.mockResolvedValue(null);
    const component = create();

    await component.placeOrder();

    expect(facade.confirmOrder).not.toHaveBeenCalled();
    expect(component.checkoutError()).toBeTruthy();
    expect(cart.clear).not.toHaveBeenCalled();
  });
});
