import { TestBed } from '@angular/core/testing';

import { TrackingSocketService } from './tracking-socket.service';

describe('TrackingSocketService', () => {
  let service: TrackingSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackingSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
