import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainOps } from './domain-ops';

describe('DomainOps', () => {
  let component: DomainOps;
  let fixture: ComponentFixture<DomainOps>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainOps],
    }).compileComponents();

    fixture = TestBed.createComponent(DomainOps);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
