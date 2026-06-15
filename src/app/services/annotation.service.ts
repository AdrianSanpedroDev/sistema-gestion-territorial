import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { environment } from '../../environments/environments';
import { PagedResponse } from '../models/paged-response';
import {
  Annotation,
  AnnotationCategory,
  AnnotationRequestDto,
  Evidence,
  InterestedParty,
} from '../models/annotation';

@Injectable({ providedIn: 'root' })
export class AnnotationService extends CrudService<Annotation> {
  protected override resource = 'annotations';

  private httpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  createAnnotation(dto: AnnotationRequestDto): Observable<Annotation> {
    return this.httpClient.post<Annotation>(`${this.apiUrl}/${this.resource}`, dto);
  }

  updateAnnotation(id: number, dto: AnnotationRequestDto): Observable<Annotation> {
    return this.httpClient.put<Annotation>(`${this.apiUrl}/${this.resource}/${id}`, dto);
  }

  searchByFilter(q: string, page: number, pageSize: number): Observable<PagedResponse<Annotation>> {
    const params = new HttpParams()
      .set('q', q)
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.httpClient.get<PagedResponse<Annotation>>(`${this.apiUrl}/${this.resource}/search`, { params });
  }

  // --- Evidencias ---

  uploadEvidences(annotationId: number, files: File[]): Observable<Evidence[]> {
    const formData = new FormData();
    formData.append('id_annotation', String(annotationId));
    files.forEach(file => formData.append('files[]', file, file.name));
    return this.httpClient.post<Evidence[]>(`${this.apiUrl}/evidences`, formData);
  }

  getEvidences(annotationId: number): Observable<Evidence[]> {
    const params = new HttpParams().set('id_annotation', String(annotationId));
    return this.httpClient.get<Evidence[]>(`${this.apiUrl}/evidences`, { params });
  }

  deleteEvidence(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/evidences/${id}`);
  }

  // --- Categorías ---

  addCategory(annotationId: number, categoryId: number): Observable<AnnotationCategory> {
    return this.httpClient.post<AnnotationCategory>(`${this.apiUrl}/annotation-categories`, {
      id_annotation: annotationId,
      id_category: categoryId,
    });
  }

  removeCategory(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/annotation-categories/${id}`);
  }

  getAnnotationCategories(annotationId: number): Observable<AnnotationCategory[]> {
    const params = new HttpParams().set('id_annotation', String(annotationId));
    return this.httpClient.get<AnnotationCategory[]>(`${this.apiUrl}/annotation-categories`, { params });
  }

  // --- Entidades interesadas ---

  addInterestedParty(annotationId: number, entityId: number): Observable<InterestedParty> {
    return this.httpClient.post<InterestedParty>(`${this.apiUrl}/interested-parties`, {
      id_annotation: annotationId,
      id_entity: entityId,
    });
  }

  removeInterestedParty(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/interested-parties/${id}`);
  }

  getInterestedParties(annotationId: number): Observable<InterestedParty[]> {
    const params = new HttpParams().set('id_annotation', String(annotationId));
    return this.httpClient.get<InterestedParty[]>(`${this.apiUrl}/interested-parties`, { params });
  }
}
