import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DemarcationToolsComponent } from './demarcation-tools.component';

describe('DemarcationToolsComponent', () => {
  let component: DemarcationToolsComponent;
  let fixture: ComponentFixture<DemarcationToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemarcationToolsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DemarcationToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
