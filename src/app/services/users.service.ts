import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environments';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private readonly apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los usuarios
   * GET /users
   */
  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  /**
   * Obtener usuarios paginados
   * GET /users?page=&pageSize=
   */
  getPaged(page: number, pageSize: number): Observable<{
    data: User[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<{
      data: User[];
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
    }>(this.apiUrl, { params });
  }

  /**
   * Obtener usuario por ID
   * GET /users/:id
   */
  getById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear usuario
   * POST /users
   */
  create(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  /**
   * Actualizar usuario completo
   * PUT /users/:id
   */
  update(id: number, user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, user);
  }

  /**
   * Eliminar usuario
   * DELETE /users/:id
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
