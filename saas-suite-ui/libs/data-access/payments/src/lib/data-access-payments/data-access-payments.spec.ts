import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataAccessPayments } from './data-access-payments';

describe('DataAccessPayments', () => {
  let component: DataAccessPayments;
  let fixture: ComponentFixture<DataAccessPayments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataAccessPayments],
    }).compileComponents();

    fixture = TestBed.createComponent(DataAccessPayments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
