import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { environment } from '../../environments/environments';
import { Vote, VoteRequestDto, VoteUpdateDto } from '../models/vote';

// CU-13 — Calificar anotación.
// Extiende CrudService<Vote> para heredar el patrón base; las llamadas específicas
// usan HttpClient (la única capa autorizada para HTTP) contra /api/votes.
@Injectable({ providedIn: 'root' })
export class VoteService extends CrudService<Vote> {
  protected override resource = 'votes';

  private httpClient = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // El backend de /search puede devolver un array plano o un objeto paginado { items }.
  // Normalizamos a Vote[] para que el componente no dependa del formato.
  private toArray(response: Vote[] | { items: Vote[] }): Vote[] {
    return Array.isArray(response) ? response : response?.items ?? [];
  }

  // ¿Este ciudadano ya votó esta anotación? → para precargar/editar (flujo 4a).
  getByAnnotationAndCitizen(idAnnotation: number, idCitizen: number): Observable<Vote[]> {
    const params = new HttpParams()
      .set('id_annotation', String(idAnnotation))
      .set('id_citizen', String(idCitizen));
    return this.httpClient
      .get<Vote[] | { items: Vote[] }>(`${this.apiUrl}/${this.resource}/search`, { params })
      .pipe(map((res) => this.toArray(res)));
  }

  // Todos los votos de una anotación → para calcular el promedio y la distribución
  // (el backend no devuelve el promedio calculado).
  getByAnnotation(idAnnotation: number): Observable<Vote[]> {
    const params = new HttpParams().set('id_annotation', String(idAnnotation));
    return this.httpClient
      .get<Vote[] | { items: Vote[] }>(`${this.apiUrl}/${this.resource}/search`, { params })
      .pipe(map((res) => this.toArray(res)));
  }

  createVote(dto: VoteRequestDto): Observable<Vote> {
    return this.httpClient.post<Vote>(`${this.apiUrl}/${this.resource}`, dto);
  }

  updateVote(idVote: number, dto: VoteUpdateDto): Observable<Vote> {
    return this.httpClient.put<Vote>(`${this.apiUrl}/${this.resource}/${idVote}`, dto);
  }
}
