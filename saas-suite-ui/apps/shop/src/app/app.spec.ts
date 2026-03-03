import { TestBed, ComponentFixture } from '@angular/core/testing';
import { App } from './app';
import { appRoutes } from './app.routes';
import { provideRouter } from '@angular/router';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(appRoutes)],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app component', () => {
    expect(component).toBeTruthy();
  });

  it('should render brand name in header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.logo-name')?.textContent).toContain('Fluxe');
  });

  it('should render navigation links', () => {
    const navLinks = fixture.nativeElement.querySelectorAll('.nav-link');
    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should render footer with correct copyright', () => {
    const footer = fixture.nativeElement.querySelector('.app-footer');
    expect(footer).toBeTruthy();
    expect(footer?.textContent).toContain('2026 Fluxe B2B Suite');
    expect(footer?.textContent).toContain('Multi-tenant B2B Platform');
  });

  it('should have router outlet for dynamic content', () => {
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(routerOutlet).toBeTruthy();
  });

  it('should apply change detection strategy OnPush', () => {
    const metadata = (App as unknown as { ɵcmp: { onPush: boolean } })['ɵcmp'];
    expect(metadata.onPush).toBeTruthy();
  });
});
