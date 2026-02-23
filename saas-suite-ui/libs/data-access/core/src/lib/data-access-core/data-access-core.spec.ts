import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataAccessCore } from './data-access-core';

describe('DataAccessCore', () => {
  let component: DataAccessCore;
  let fixture: ComponentFixture<DataAccessCore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataAccessCore],
    }).compileComponents();

    fixture = TestBed.createComponent(DataAccessCore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
