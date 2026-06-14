import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments'; // Asegúrate de tener tu environment
import {
  Point,
  PointPaginatedResponseDto,
  PointRequestDto,
  PointResponseMessageDto,
  PointSearchRequestDto
} from '../models/point';

@Injectable({
  providedIn: 'root'
})
export class PointService {
  private url = `${environment.apiUrl}/points`;

  constructor(private http: HttpClient) { }

  // Obtener puntos filtrando (ej. por id_neighborhood para armar el polígono)
  getPoints(filters?: PointSearchRequestDto): Observable<Point[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.id_neighborhood) params = params.set('id_neighborhood', filters.id_neighborhood);
      if (filters.id_annotation) params = params.set('id_annotation', filters.id_annotation);
      if (filters.point_type) params = params.set('point_type', filters.point_type);
    }
    return this.http.get<Point[]>(this.url, { params });
  }

  // Obtener un punto por ID
  getPointById(id: number): Observable<Point> {
    return this.http.get<Point>(`${this.url}/${id}`);
  }

  // Crear un nuevo punto
  createPoint(point: PointRequestDto): Observable<Point> {
    return this.http.post<Point>(this.url, point);
  }

  // Actualizar un punto existente (HU-10 y arrastre de puntos)
  updatePoint(id: number, point: PointRequestDto): Observable<Point> {
    return this.http.put<Point>(`${this.url}/${id}`, point);
  }

  // Eliminar un punto
  deletePoint(id: number): Observable<PointResponseMessageDto> {
    return this.http.delete<PointResponseMessageDto>(`${this.url}/${id}`);
  }

  searchPoints(
    filters?: PointSearchRequestDto
  ): Observable<PointPaginatedResponseDto> {

    let params = new HttpParams();

    if (filters) {
      if (filters.id_neighborhood) {
        params = params.set(
          'id_neighborhood',
          filters.id_neighborhood
        );
      }

      if (filters.id_annotation) {
        params = params.set(
          'id_annotation',
          filters.id_annotation
        );
      }

      if (filters.point_type) {
        params = params.set(
          'point_type',
          filters.point_type
        );
      }

      params = params.set('page', 1);
      params = params.set('pageSize', 1000);
    }

    return this.http.get<PointPaginatedResponseDto>(
      `${this.url}/search`,
      { params }
    );
  }
}