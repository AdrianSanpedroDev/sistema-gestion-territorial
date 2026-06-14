import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Official, OfficialRequestDto } from '../models/official';
import { PagedResponse } from '../models/paged-response';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class OfficialService extends CrudService<Official> {
  protected override resource = 'officials';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  createOfficial(data: OfficialRequestDto): Observable<Official> {
    return this.httpClient.post<Official>(`${this.apiBaseUrl}/${this.resource}`, data);
  }

  updateOfficial(id: number, data: OfficialRequestDto): Observable<Official> {
    return this.httpClient.put<Official>(`${this.apiBaseUrl}/${this.resource}/${id}`, data);
  }

  searchByFilter(query: string, page: number, pageSize: number): Observable<PagedResponse<Official>> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.httpClient.get<PagedResponse<Official>>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }

  searchOfficials(query: string): Observable<Official[]> {
    const params = new HttpParams().set('q', query);
    return this.httpClient.get<Official[]>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }
}
