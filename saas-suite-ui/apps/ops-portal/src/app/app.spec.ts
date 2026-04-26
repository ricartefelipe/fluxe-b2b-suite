import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { appRoutes } from './app.routes';

describe('App (ops-portal)', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have router outlet', () => {
    const outlet = fixture.nativeElement.querySelector('router-outlet');
    expect(outlet).toBeTruthy();
  });

  it('requires all report permissions for direct reports route access', () => {
    const shellRoute = appRoutes.find(route => route.path === '');
    const reportsRoute = shellRoute?.children?.find(route => route.path === 'reports');

    expect(reportsRoute?.data).toEqual(
      expect.objectContaining({
        permissions: ['orders:read', 'payments:read', 'ledger:read'],
        permissionsMode: 'all',
        ordersAbacPermissions: ['orders:read'],
        paymentsAbacPermissions: ['payments:read', 'ledger:read'],
      }),
    );
  });
});
