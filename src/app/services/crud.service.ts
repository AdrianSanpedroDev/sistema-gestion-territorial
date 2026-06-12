import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { PagedResponse } from '../models/paged-response';

// CAPA: Acceso a Datos (Servicio base abstracto)
// Los servicios concretos extienden esta clase y solo definen `resource` con el nombre del endpoint.
// Ejemplo: EntidadService extends CrudService<Entidad> { resource = 'entidades'; }
@Injectable()
export abstract class CrudService<T> {
  protected abstract resource: string;

  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  private get url(): string {
    return `${this.baseUrl}/${this.resource}`;
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  getById(id: number): Observable<T> {
    return this.http.get<T>(`${this.url}/${id}`);
  }

  // Omit<T, 'id'> excluye el campo id porque lo genera el backend al crear
  create(data: Omit<T, 'id'>): Observable<T> {
    return this.http.post<T>(this.url, data);
  }

  update(id: number, data: T): Observable<T> {
    return this.http.put<T>(`${this.url}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  getPaged(page: number, pageSize: number): Observable<PagedResponse<T>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PagedResponse<T>>(this.url, { params });
  }
}
