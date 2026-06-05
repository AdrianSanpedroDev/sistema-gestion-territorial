import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environments';
import { ReportRequest, ReportResponse } from '../models/report';

@Injectable({ providedIn: 'root' })
export class ReportsService {

  private readonly apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  generateReport(query: string): Observable<ReportResponse> {
    const body: ReportRequest = { query };
    return this.http.post<ReportResponse>(this.apiUrl, body);
  }
}
