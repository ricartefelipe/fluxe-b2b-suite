import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { appRoutes } from './app.routes';
import { CartService } from '@union.solutions/shop/data';
import { NotificationStore } from '@saas-suite/shared/notifications';
import { AuthStore, AuthService } from '@saas-suite/shared/auth';
import { I18nService } from '@saas-suite/shared/i18n';

const stubMessages = {
  shop: {
    greeting: '',
    searchPlaceholder: '',
    allProducts: '',
    myOrders: '',
    subtotal: '',
    viewCart: '',
    placeOrder: '',
    minicartEmpty: '',
    minicartEmptyHint: '',
    browseProducts: '',
    removeItem: '',
  },
  checkout: { cart: '' },
  accessibility: { mainNavigation: '' },
};

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(appRoutes),
        {
          provide: CartService,
          useValue: {
            totalItems: signal(0),
            totalAmount: signal(0),
            items: signal([]),
            updateQuantity: (_sku: string, _qty: number) => { /* stub */ },
            removeItem: (_sku: string) => { /* stub */ },
          },
        },
        { provide: NotificationStore, useValue: { unreadCount: signal(0) } },
        {
          provide: AuthStore,
          useValue: { session: signal(null), isAuthenticated: signal(false) },
        },
        { provide: AuthService, useValue: { logout: () => Promise.resolve() } },
        { provide: I18nService, useValue: { messages: signal(stubMessages) } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  it('should apply change detection strategy OnPush', () => {
    const metadata = (App as unknown as { ɵcmp: { onPush: boolean } })['ɵcmp'];
    expect(metadata.onPush).toBeTruthy();
  });
});
