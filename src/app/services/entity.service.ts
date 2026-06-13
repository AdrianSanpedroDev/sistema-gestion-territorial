import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Entity } from '../models/entity';
import { PagedResponse } from '../models/paged-response';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class EntityService extends CrudService<Entity> {
  protected override resource = 'entities';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  createEntity(formData: FormData): Observable<Entity> {
    return this.httpClient.post<Entity>(`${this.apiBaseUrl}/${this.resource}`, formData);
  }

  updateEntity(id: number, formData: FormData): Observable<Entity> {
    return this.httpClient.put<Entity>(`${this.apiBaseUrl}/${this.resource}/${id}`, formData);
  }

  searchByFilter(query: string, page: number, pageSize: number): Observable<PagedResponse<Entity>> {
    const params = new HttpParams()
      .set('q', query)
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.httpClient.get<PagedResponse<Entity>>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }
}
