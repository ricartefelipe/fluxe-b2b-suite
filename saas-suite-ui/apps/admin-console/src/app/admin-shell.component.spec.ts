import { TestBed } from '@angular/core/testing';
import { AdminShellComponent } from './admin-shell.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('AdminShellComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
