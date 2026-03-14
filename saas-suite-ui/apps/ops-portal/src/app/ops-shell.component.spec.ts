import { TestBed } from '@angular/core/testing';
import { OpsShellComponent } from './ops-shell.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('OpsShellComponent', () => {
  it('should create', async () => {
    await TestBed.configureTestingModule({
      imports: [OpsShellComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    const fixture = TestBed.createComponent(OpsShellComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
