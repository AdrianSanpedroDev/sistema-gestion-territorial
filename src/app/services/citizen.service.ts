import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Citizen, CitizenRequestDto } from '../models/citizen';
import { PagedResponse } from '../models/paged-response';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class CitizenService extends CrudService<Citizen> {
  protected override resource = 'citizens';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  createCitizen(citizenData: CitizenRequestDto): Observable<Citizen> {
    return this.httpClient.post<Citizen>(`${this.apiBaseUrl}/${this.resource}`, citizenData);
  }

  updateCitizen(idCitizen: number, citizenData: CitizenRequestDto): Observable<Citizen> {
    return this.httpClient.put<Citizen>(`${this.apiBaseUrl}/${this.resource}/${idCitizen}`, citizenData);
  }

  searchByFilter(search: string, page: number, pageSize: number): Observable<PagedResponse<Citizen>> {
    const params = new HttpParams()
      .set('q', search)
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.httpClient.get<PagedResponse<Citizen>>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }
}
