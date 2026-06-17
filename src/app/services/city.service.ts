import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { City, CityRequestDto } from '../models/city';
import { PagedResponse } from '../models/paged-response';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class CityService extends CrudService<City> {
  // Define el recurso para construir la URL base: {{baseUrl}}/api/cities
  protected override resource = 'cities';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  /**
   * Crear Ciudad utilizando el DTO
   */
  createCity(cityData: CityRequestDto): Observable<City> {
    return this.httpClient.post<City>(`${this.apiBaseUrl}/${this.resource}`, cityData);
  }

  /**
   * Actualizar Ciudad mediante su id_city y el cuerpo del DTO.
   */
  updateCity(idCity: number, cityData: CityRequestDto): Observable<City> {
    return this.httpClient.put<City>(`${this.apiBaseUrl}/${this.resource}/${idCity}`, cityData);
  }

  /**
   * ENDPOINT ESPECÍFICO: Buscar ciudades filtradas por Departamento de forma paginada.
   * Mapea el flujo de Postman: {{baseUrl}}/api/cities/search?id_department=1&page=1&pageSize=5
   */
  searchByFilter(idDepartment: number, page: number, pageSize: number): Observable<PagedResponse<City>> {
    const params = new HttpParams()
      .set('id_department', String(idDepartment))
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.httpClient.get<PagedResponse<City>>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }
}