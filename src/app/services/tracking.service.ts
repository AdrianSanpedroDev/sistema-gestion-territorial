import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import {
  TrackingStartRequestDto, 
  TrackingStartResponseDto, 
  TrackingStopRequestDto, 
  TrackingStopResponseDto 
} from '../models/tracking'; // Asegúrate de ajustar la ruta correcta a tu archivo models

@Injectable({
  providedIn: 'root'
})
export class TrackingService {
  private readonly apiUrl = `${environment.trackingUrl}/api/officials/tracking`;

  constructor(private http: HttpClient) {}

  /**
   * Inicia el rastreo para los IDs de funcionarios especificados
   */
  startTracking(data: TrackingStartRequestDto): Observable<TrackingStartResponseDto> {
    return this.http.post<TrackingStartResponseDto>(`${this.apiUrl}/start`, data);
  }

  /**
   * Detiene el rastreo. Si no se envían IDs, detiene todos.
   */
  stopTracking(data: TrackingStopRequestDto = {}): Observable<TrackingStopResponseDto> {
    return this.http.post<TrackingStopResponseDto>(`${this.apiUrl}/stop`, data);
  }
}