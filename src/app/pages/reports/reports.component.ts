import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService } from '../../services/reports.service';
import { ReportResponse } from '../../models/report';
import { ChartRendererComponent } from '../../components/ui/chart-renderer/chart-renderer.component';
import { ReportChatComponent } from '../../components/ui/report-chat/report-chat.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    ChartRendererComponent,
    ReportChatComponent,
  ],
  templateUrl: './reports.component.html',
})
export class ReportsComponent {

  loading = false;
  reportData: ReportResponse | null = null;

  constructor(private reportsService: ReportsService) {}

  generateReport(query: string): void {
    this.loading = true;
    this.reportData = null;

    this.reportsService.generateReport(query).subscribe({
      next: (data) => {
        this.reportData = data;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al generar el reporte',
          text: err?.error?.message ?? 'Ocurrió un error inesperado. Intenta de nuevo.',
          confirmButtonText: 'Aceptar',
        });
      },
    });
  }
}

