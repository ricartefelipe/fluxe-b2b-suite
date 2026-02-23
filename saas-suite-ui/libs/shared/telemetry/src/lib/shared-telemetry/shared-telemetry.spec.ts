import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SharedTelemetry } from './shared-telemetry';

describe('SharedTelemetry', () => {
  let component: SharedTelemetry;
  let fixture: ComponentFixture<SharedTelemetry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedTelemetry],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedTelemetry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
