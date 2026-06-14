import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TrackingSidebarComponent } from './tracking-sidebar.component';

describe('TrackingSidebarComponent', () => {
  let component: TrackingSidebarComponent;
  let fixture: ComponentFixture<TrackingSidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrackingSidebarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
