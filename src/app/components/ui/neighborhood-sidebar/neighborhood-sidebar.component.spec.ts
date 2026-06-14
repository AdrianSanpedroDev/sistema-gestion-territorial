import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NeighborhoodSidebarComponent } from './neighborhood-sidebar.component';

describe('NeighborhoodSidebarComponent', () => {
  let component: NeighborhoodSidebarComponent;
  let fixture: ComponentFixture<NeighborhoodSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeighborhoodSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NeighborhoodSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
