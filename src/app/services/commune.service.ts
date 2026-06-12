import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Commune, CommuneRequestDto } from '../models/commune';
import { PagedResponse } from '../models/paged-response';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class CommuneService extends CrudService<Commune> {
  // Define el recurso para construir la URL base: {{baseUrl}}/api/communes
  protected override resource = '/communes';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  /**
   * ADAPTACIÓN: Crear Comuna utilizando el DTO exacto requerido por el backend.
   * Evita enviar campos autogenerados como id_commune, created_at o updated_at.
   */
  createCommune(communeData: CommuneRequestDto): Observable<Commune> {
    return this.httpClient.post<Commune>(`${this.apiBaseUrl}/${this.resource}`, communeData);
  }

  /**
   * ADAPTACIÓN: Actualizar Comuna mediante su id_commune y el cuerpo del DTO.
   */
  updateCommune(idCommune: number, communeData: CommuneRequestDto): Observable<Commune> {
    return this.httpClient.put<Commune>(`${this.apiBaseUrl}/${this.resource}/${idCommune}`, communeData);
  }

  /**
   * ENDPOINT ESPECÍFICO: Buscar comunas filtradas por Ciudad de forma paginada.
   * Mapea el flujo de Postman: {{baseUrl}}/api/communes/search?id_city=1&page=1&pageSize=5
   */
  searchByFilter(idCity: number, page: number, pageSize: number): Observable<PagedResponse<Commune>> {
    const params = new HttpParams()
      .set('id_city', String(idCity))
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.httpClient.get<PagedResponse<Commune>>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }
}