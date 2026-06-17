import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrudService } from './crud.service';
import { Department, DepartmentRequestDto } from '../models/department';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService extends CrudService<Department> {
  // Define el recurso para construir la URL base: {{baseUrl}}/api/departments
  protected override resource = 'departments';

  private httpClient = inject(HttpClient);
  private apiBaseUrl = environment.apiUrl;

  /**
   * Crear Departamento utilizando el DTO
   */
  createDepartment(departmentData: DepartmentRequestDto): Observable<Department> {
    return this.httpClient.post<Department>(`${this.apiBaseUrl}/${this.resource}`, departmentData);
  }

  /**
   * Actualizar Departamento mediante su id_department y el cuerpo del DTO.
   */
  updateDepartment(idDepartment: number, departmentData: DepartmentRequestDto): Observable<Department> {
    return this.httpClient.put<Department>(`${this.apiBaseUrl}/${this.resource}/${idDepartment}`, departmentData);
  }
  
  // Nota: Los departamentos usualmente no tienen un método "searchByFilter" 
  // dependiente de un padre (a menos que haya Países), con el getAll() o getPaged() del CrudService suele bastar.
}