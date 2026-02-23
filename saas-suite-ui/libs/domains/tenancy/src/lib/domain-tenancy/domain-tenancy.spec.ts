import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainTenancy } from './domain-tenancy';

describe('DomainTenancy', () => {
  let component: DomainTenancy;
  let fixture: ComponentFixture<DomainTenancy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainTenancy],
    }).compileComponents();

    fixture = TestBed.createComponent(DomainTenancy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
