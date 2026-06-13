import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Category, CategoryRequestDto } from '../models/category';
import { PagedResponse } from '../models/paged-response';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends CrudService<Category> {
  protected override resource = 'categories';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  createCategory(categoryData: CategoryRequestDto): Observable<Category> {
    return this.httpClient.post<Category>(`${this.apiBaseUrl}/${this.resource}`, categoryData);
  }

  updateCategory(idCategory: number, categoryData: CategoryRequestDto): Observable<Category> {
    return this.httpClient.put<Category>(`${this.apiBaseUrl}/${this.resource}/${idCategory}`, categoryData);
  }

  searchByFilter(search: string, page: number, pageSize: number): Observable<PagedResponse<Category>> {
    const params = new HttpParams()
      .set('q', search)
      .set('page', String(page))
      .set('pageSize', String(pageSize));

    return this.httpClient.get<PagedResponse<Category>>(`${this.apiBaseUrl}/${this.resource}/search`, { params });
  }
}
