import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { CrudService } from './crud.service';
import { Neighborhood, NeighborhoodRequestDto } from '../models/neighborhood';
import { PagedResponse } from '../models/paged-response';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class NeighborhoodService extends CrudService<Neighborhood> {
  // Define el recurso para construir la URL base: {{baseUrl}}/api/neighborhoods
  protected override resource = 'neighborhoods';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  /**
   * ADAPTACIÓN: Crear Barrio utilizando el DTO exacto requerido por el backend.
   * Evita enviar campos autogenerados como id_neighborhood, created_at o updated_at.
   */
  createNeighborhood(neighborhoodData: NeighborhoodRequestDto): Observable<Neighborhood> {
    return this.httpClient.post<Neighborhood>(`${this.apiBaseUrl}/${this.resource}`, neighborhoodData);
  }

  /**
   * ADAPTACIÓN: Actualizar Barrio mediante su id_neighborhood y el cuerpo del DTO.
   */
  updateNeighborhood(idNeighborhood: number, neighborhoodData: NeighborhoodRequestDto): Observable<Neighborhood> {
    return this.httpClient.put<Neighborhood>(`${this.apiBaseUrl}/${this.resource}/${idNeighborhood}`, neighborhoodData);
  }

  /**
   * ENDPOINT ESPECÍFICO: Buscar barrios filtrados por Comuna de forma paginada.
   * Mapea el flujo de Postman: {{baseUrl}}/api/neighborhoods/search?id_commune=1&page=1&pageSize=5
   */
  searchByFilter(idCommune: number | null, searchTerm: string, page: number, pageSize: number): Observable<PagedResponse<Neighborhood>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    if (idCommune) params = params.set('id_commune', String(idCommune));
    if (searchTerm) params = params.set('name', searchTerm); // Agregamos el término de texto

    return this.httpClient.get<PagedResponse<Neighborhood>>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }
}