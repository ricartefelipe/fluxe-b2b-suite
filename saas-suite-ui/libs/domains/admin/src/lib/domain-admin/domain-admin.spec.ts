import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomainAdmin } from './domain-admin';

describe('DomainAdmin', () => {
  let component: DomainAdmin;
  let fixture: ComponentFixture<DomainAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomainAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(DomainAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
