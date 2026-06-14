import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerritorialManagementComponent } from './territorial-management.component';

describe('TerritorialManagementComponent', () => {
  let component: TerritorialManagementComponent;
  let fixture: ComponentFixture<TerritorialManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerritorialManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerritorialManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
